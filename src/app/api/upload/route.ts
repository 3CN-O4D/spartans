import { NextResponse } from "next/server";
import path from "node:path";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, isValidSession } from "@/lib/auth";
import {
  getPresignedUploadUrl,
  publicStorageConfigured,
  writeBinary,
} from "@/lib/storage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8 MB
const MAX_VIDEO_BYTES = 100 * 1024 * 1024; // 100 MB

// SVG is deliberately excluded: an uploaded SVG is served from our own origin
// and can carry script, which would be a stored-XSS vector.
const IMAGE_TYPES: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/avif": ".avif",
  "image/bmp": ".bmp",
};

const VIDEO_TYPES: Record<string, string> = {
  "video/mp4": ".mp4",
  "video/webm": ".webm",
  "video/quicktime": ".mov",
  "video/x-matroska": ".mkv",
};

const TYPES: Record<string, string> = { ...IMAGE_TYPES, ...VIDEO_TYPES };
const ALLOWED_TYPES = Object.keys(TYPES);

const VIDEO_EXTENSIONS = new Set(Object.values(VIDEO_TYPES));

function maxBytesFor(ext: string): number {
  return VIDEO_EXTENSIONS.has(ext) ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
}

function safeName(originalName: string, ext: string) {
  const base = path
    .basename(originalName, path.extname(originalName))
    .replace(/[^a-z0-9-_]/gi, "-")
    .toLowerCase()
    .slice(0, 40);
  return `${base || "file"}-${Date.now()}${ext}`;
}

function isVideo(ext: string): boolean {
  return VIDEO_EXTENSIONS.has(ext);
}

export async function POST(req: Request) {
  const jar = await cookies();
  if (!(await isValidSession(jar.get(ADMIN_COOKIE)?.value))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contentType = req.headers.get("content-type") || "";

  // Cloudflare R2 presigned URL. The browser asks this route for a short-lived
  // presigned PUT URL, then uploads the file directly to R2. This bypasses the
  // ~4.5 MB serverless request-body limit and is the production path.
  if (contentType.includes("application/json")) {
    if (!publicStorageConfigured()) {
      return NextResponse.json(
        { error: "Storage is not configured on this deployment" },
        { status: 501 },
      );
    }

    try {
      const body = (await req.json()) as {
        pathname?: string;
        contentType?: string;
      };

      const pathname = body.pathname;
      const fileType = body.contentType;

      if (!pathname || !fileType) {
        return NextResponse.json(
          { error: "Missing pathname or contentType" },
          { status: 400 },
        );
      }

      const extFromName = path.extname(pathname).toLowerCase();
      const extFromType = TYPES[fileType] ?? "";
      // Normalize .jpeg → .jpg so both extensions are accepted.
      const normalizedExt = (ext: string): string =>
        ext === ".jpeg" ? ".jpg" : ext;
      const ext = normalizedExt(extFromName) || normalizedExt(extFromType);

      if (!pathname.startsWith("uploads/")) {
        return NextResponse.json(
          { error: `Path must start with uploads/. Got: ${pathname}` },
          { status: 400 },
        );
      }
      if (!Object.values(TYPES).includes(ext)) {
        return NextResponse.json(
          { error: `Unsupported extension '${extFromName}' for content type '${fileType}'` },
          { status: 400 },
        );
      }

      if (!ALLOWED_TYPES.includes(fileType)) {
        return NextResponse.json({ error: `Invalid content type: ${fileType}` }, { status: 400 });
      }

      // Ensure the pathname carries the correct extension so R2 stores it properly.
      const normalizedPathname = extFromName
        ? pathname.replace(/\.jpeg$/i, ".jpg")
        : `${pathname}${extFromType}`;

      const { uploadUrl, publicUrl } = await getPresignedUploadUrl(
        normalizedPathname,
        fileType,
      );
      return NextResponse.json({ uploadUrl, publicUrl });
    } catch (error) {
      console.error("[upload] presigned URL failed:", error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Upload failed" },
        { status: 400 },
      );
    }
  }

  // Local development (and a small-file fallback): receive multipart form data
  // and let the storage layer decide between disk and Cloudflare R2.
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const ext = TYPES[file.type];
    if (!ext) {
      return NextResponse.json(
        {
          error: `Unsupported file type '${file.type}'. Use PNG, JPEG, WebP, GIF, AVIF, BMP, MP4, WebM, MOV or MKV.`,
        },
        { status: 400 },
      );
    }

    const maxBytes = maxBytesFor(ext);
    if (file.size > maxBytes) {
      const kind = isVideo(ext) ? "Video" : "Image";
      return NextResponse.json(
        { error: `${kind} must be ${Math.round(maxBytes / 1024 / 1024)} MB or smaller` },
        { status: 413 },
      );
    }
    if (file.size === 0) {
      return NextResponse.json({ error: "File is empty" }, { status: 400 });
    }

    const filename = safeName(file.name, ext);
    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await writeBinary(`uploads/${filename}`, buffer, file.type);

    return NextResponse.json({ url });
  } catch (error) {
    console.error("[upload] Upload failed:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
