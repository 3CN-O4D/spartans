import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { BlobNotFoundError, del, get, head, put } from "@vercel/blob";

/**
 * Storage abstraction for the CMS.
 *
 * Local development uses the repository's `data/` and `public/` folders. On
 * Vercel (or any host with a Blob token) the same paths are stored in Vercel
 * Blob instead, because the deployment filesystem is read-only and ephemeral.
 *
 * Public images are stored in a public Blob store. Content JSON, sync state,
 * lock files and form submissions are private Blob objects.
 */

export type BlobAccess = "public" | "private";

const ROOT = process.env.SPARTANS_STORAGE_ROOT?.trim() || process.cwd();

/**
 * Images live in a public Blob store so browsers can load them directly.
 * Content, sync state, locks and form submissions live in a separate private
 * store. Vercel Blob access is a property of the store, so two stores are used.
 */
export function publicBlobToken(): string {
  return (
    process.env.BLOB_PUBLIC_READ_WRITE_TOKEN?.trim() ||
    process.env.BLOB_READ_WRITE_TOKEN?.trim() ||
    ""
  );
}

export function privateBlobToken(): string {
  return process.env.BLOB_PRIVATE_READ_WRITE_TOKEN?.trim() || "";
}

export function publicStorageConfigured(): boolean {
  return Boolean(publicBlobToken());
}

export function privateStorageConfigured(): boolean {
  return Boolean(privateBlobToken());
}

export function blobConfigured(): boolean {
  return publicStorageConfigured() && privateStorageConfigured();
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
  if (runningOnVercel()) {
    throw new Error(
      "Persistent storage is not configured. Connect a Vercel Blob store and redeploy.",
    );
  }
}

export async function readText(
  pathname: string,
  access: BlobAccess = "private",
): Promise<string | null> {
  const token = access === "private" ? privateBlobToken() : publicBlobToken();
  if (token) {
    try {
      const result = await get(pathname, { access, useCache: false, token });
      if (result?.statusCode === 200) {
        return await new Response(result.stream).text();
      }
    } catch (error) {
      // A missing Blob should fall through to the bundled seed file. Other
      // failures are logged but still fall back so public pages keep working.
      console.warn(
        "[storage] Blob read failed:",
        error instanceof Error ? error.message : error,
      );
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
  const access = options.access ?? "private";
  const token = access === "private" ? privateBlobToken() : publicBlobToken();
  if (token) {
    const result = await put(pathname, value, {
      access,
      addRandomSuffix: options.addRandomSuffix ?? false,
      allowOverwrite: options.allowOverwrite ?? true,
      contentType: options.contentType ?? "text/plain; charset=utf-8",
      token,
    });
    return { url: result.url, pathname: result.pathname };
  }

  requireWritableLocalStorage();
  const destination = localPath(pathname);
  await fs.mkdir(path.dirname(destination), { recursive: true });

  if (options.allowOverwrite === false) {
    const handle = await fs.open(destination, "wx");
    try {
      await handle.writeFile(value, "utf8");
    } finally {
      await handle.close();
    }
    return { url: `/${pathname}`, pathname };
  }

  const temp = `${destination}.tmp-${process.pid}-${Date.now()}`;
  await fs.writeFile(temp, value, "utf8");
  await fs.rename(temp, destination);
  return { url: `/${pathname}`, pathname };
}

export async function writeBinary(
  pathname: string,
  body: Buffer,
  contentType: string,
): Promise<string> {
  const token = publicBlobToken();
  if (token) {
    const result = await put(pathname, body, {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType,
      cacheControlMaxAge: 60 * 60 * 24 * 30,
      token,
    });
    return result.url;
  }

  requireWritableLocalStorage();
  const destination = publicPath(pathname);
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.writeFile(destination, body);
  return `/${pathname}`;
}

export async function publicUrl(pathname: string): Promise<string | null> {
  const token = publicBlobToken();
  if (token) {
    try {
      const info = await head(pathname, { token });
      return info.url;
    } catch {
      // Fall through to the bundled local file, if any.
    }
  }

  try {
    await fs.stat(publicPath(pathname));
    return `/${pathname}`;
  } catch {
    return null;
  }
}

export async function deleteObject(
  pathname: string,
  access: BlobAccess = "private",
): Promise<void> {
  const token = access === "private" ? privateBlobToken() : publicBlobToken();
  if (token) {
    try {
      await del(pathname, { token });
    } catch (error) {
      if (!(error instanceof BlobNotFoundError)) throw error;
    }
    return;
  }

  try {
    await fs.unlink(localPath(pathname));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}

export async function storeSubmission(
  kind: "registration" | "support",
  record: Record<string, unknown>,
): Promise<void> {
  if (privateBlobToken()) {
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    await writeText(`data/${kind}/${stamp}-${randomUUID()}.json`, JSON.stringify(record), {
      access: "private",
      contentType: "application/json",
    });
    return;
  }

  requireWritableLocalStorage();
  const file = kind === "support" ? "data/support.ndjson" : "data/messages.ndjson";
  const destination = localPath(file);
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.appendFile(destination, `${JSON.stringify(record)}\n`, "utf8");
}
