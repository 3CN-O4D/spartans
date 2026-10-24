import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const ROOT = process.env.SPARTANS_STORAGE_ROOT?.trim() || process.cwd();

const R2_ENDPOINT = process.env.R2_ENDPOINT?.trim();
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID?.trim();
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY?.trim();
const R2_BUCKET = process.env.R2_BUCKET?.trim();
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL?.trim();

const r2Configured = Boolean(
  R2_ENDPOINT && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BUCKET
);

const s3 = r2Configured
  ? new S3Client({
      endpoint: R2_ENDPOINT!,
      region: "auto",
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID!,
        secretAccessKey: R2_SECRET_ACCESS_KEY!,
      },
    })
  : null;

const PUBLIC_BASE = R2_PUBLIC_URL ? R2_PUBLIC_URL.replace(/\/$/, "") : "";

/**
 * Storage abstraction for the CMS.
 *
 * Local development uses `data/` and `public/`. On production with R2
 * configured, objects live in a Cloudflare R2 bucket. Public assets (gallery,
 * videos, uploads) are served through `R2_PUBLIC_URL`. Content, sync state,
 * locks and form submissions live in the same bucket but are not exposed
 * through the public URL.
 */

export type BlobAccess = "public" | "private";

export function publicStorageConfigured(): boolean {
  return r2Configured || !runningOnVercel();
}

export function privateStorageConfigured(): boolean {
  return r2Configured || !runningOnVercel();
}

export function blobConfigured(): boolean {
  return r2Configured || !runningOnVercel();
}

export function runningOnVercel(): boolean {
  return Boolean(process.env.VERCEL);
}

function localPath(pathname: string): string {
  if (!pathname || pathname.startsWith("/") || pathname.includes("..")) {
    throw new Error(`Invalid storage path: ${pathname}`);
  }
  return path.join(ROOT, pathname);
}

function publicPath(pathname: string): string {
  if (!pathname || pathname.startsWith("/") || pathname.includes("..")) {
    throw new Error(`Invalid public storage path: ${pathname}`);
  }
  return path.join(ROOT, "public", pathname);
}

function requireWritableLocalStorage(): void {
  if (runningOnVercel() && !r2Configured) {
    throw new Error(
      "Persistent storage is not configured. Connect Cloudflare R2 and redeploy.",
    );
  }
}

export async function readText(pathname: string): Promise<string | null> {
  if (r2Configured) {
    try {
      const command = new GetObjectCommand({
        Bucket: R2_BUCKET!,
        Key: pathname,
      });
      const response = await s3!.send(command);
      const body = response.Body as NodeJS.ReadableStream;
      const chunks: Buffer[] = [];
      for await (const chunk of body) chunks.push(Buffer.from(chunk));
      return Buffer.concat(chunks).toString("utf8");
    } catch (error: unknown) {
      const err = error as { name?: string; $metadata?: { httpStatusCode?: number } };
      if (
        err.name === "NoSuchKey" ||
        err.$metadata?.httpStatusCode === 404
      ) {
        return null;
      }
      console.warn("[storage] R2 read failed:", error);
    }
  }

  try {
    return await fs.readFile(localPath(pathname), "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

export async function writeText(
  pathname: string,
  value: string,
  options: {
    access?: BlobAccess;
    contentType?: string;
    addRandomSuffix?: boolean;
    allowOverwrite?: boolean;
  } = {},
): Promise<{ url: string; pathname: string }> {
  const key = options.addRandomSuffix
    ? `${pathname}-${randomUUID()}`
    : pathname;

  if (r2Configured) {
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET!,
      Key: key,
      Body: value,
      ContentType: options.contentType ?? "text/plain; charset=utf-8",
    });
    await s3!.send(command);

    const isPublic = options.access === "public" && Boolean(PUBLIC_BASE);
    const url = isPublic ? `${PUBLIC_BASE}/${key}` : `/${key}`;
    return { url, pathname: key };
  }

  requireWritableLocalStorage();
  const destination = localPath(key);
  await fs.mkdir(path.dirname(destination), { recursive: true });

  if (options.allowOverwrite === false) {
    const handle = await fs.open(destination, "wx");
    try {
      await handle.writeFile(value, "utf8");
    } finally {
      await handle.close();
    }
    return { url: `/${key}`, pathname: key };
  }

  const temp = `${destination}.tmp-${process.pid}-${Date.now()}`;
  await fs.writeFile(temp, value, "utf8");
  await fs.rename(temp, destination);
  return { url: `/${key}`, pathname: key };
}

export async function writeBinary(
  pathname: string,
  body: Buffer,
  contentType: string,
): Promise<string> {
  if (r2Configured) {
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET!,
      Key: pathname,
      Body: body,
      ContentType: contentType,
    });
    await s3!.send(command);
    return PUBLIC_BASE ? `${PUBLIC_BASE}/${pathname}` : `/${pathname}`;
  }

  requireWritableLocalStorage();
  const destination = publicPath(pathname);
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.writeFile(destination, body);
  return `/${pathname}`;
}

export async function publicUrl(pathname: string): Promise<string | null> {
  if (r2Configured && PUBLIC_BASE) {
    return `${PUBLIC_BASE}/${pathname}`;
  }

  try {
    await fs.stat(publicPath(pathname));
    return `/${pathname}`;
  } catch {
    return null;
  }
}

export async function deleteObject(pathname: string): Promise<void> {
  if (r2Configured) {
    try {
      await s3!.send(
        new DeleteObjectCommand({ Bucket: R2_BUCKET!, Key: pathname }),
      );
    } catch {
      // Ignore missing objects.
    }
    return;
  }

  try {
    await fs.unlink(localPath(pathname));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}

export async function getPresignedUploadUrl(
  pathname: string,
  contentType: string,
): Promise<{ uploadUrl: string; publicUrl: string }> {
  if (!r2Configured) {
    throw new Error("R2 is not configured");
  }

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET!,
    Key: pathname,
    ContentType: contentType,
  });
  const uploadUrl = await getSignedUrl(s3!, command, { expiresIn: 300 });
  const publicUrl = PUBLIC_BASE
    ? `${PUBLIC_BASE}/${pathname}`
    : `/${pathname}`;
  return { uploadUrl, publicUrl };
}

export async function storeSubmission(
  kind: "registration" | "support",
  record: Record<string, unknown>,
): Promise<void> {
  if (r2Configured) {
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    await writeText(
      `data/${kind}/${stamp}-${randomUUID()}.json`,
      JSON.stringify(record),
      {
        access: "private",
        contentType: "application/json",
      },
    );
    return;
  }

  requireWritableLocalStorage();
  const file = kind === "support" ? "data/support.ndjson" : "data/messages.ndjson";
  const destination = localPath(file);
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.appendFile(destination, `${JSON.stringify(record)}\n`, "utf8");
}
