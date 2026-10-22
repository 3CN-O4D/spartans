import { NextResponse } from "next/server";
import path from "node:path";
import { cookies } from "next/headers";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { ADMIN_COOKIE, isValidSession } from "@/lib/auth";
import { publicBlobToken, publicStorageConfigured, writeBinary } from "@/lib/storage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

// SVG is deliberately excluded: an uploaded SVG is served from our own origin
// and can carry script, which would be a stored-XSS vector.
const TYPES: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
  "image/gif": ".gif",
};
const ALLOWED_TYPES = Object.keys(TYPES);

function safeName(originalName: string, ext: string) {
  const base = path
    .basename(originalName, path.extname(originalName))
    .replace(/[^a-z0-9-_]/gi, "-")
    .toLowerCase()
    .slice(0, 40);
  return `${base || "image"}-${Date.now()}${ext}`;
}

export async function POST(req: Request) {
  const jar = await cookies();
  if (!(await isValidSession(jar.get(ADMIN_COOKIE)?.value))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contentType = req.headers.get("content-type") || "";

  // Vercel Blob client uploads. The browser asks this route for a short-lived
  // token, then uploads the file directly to Blob. This bypasses the ~4.5 MB
  // serverless request-body limit and is the production path.
  if (contentType.includes("application/json")) {
    if (!publicStorageConfigured()) {
      return NextResponse.json(
        { error: "Vercel Blob is not configured on this deployment" },
        { status: 501 },
      );
    }

    try {
      const body = (await req.json()) as HandleUploadBody;
      const result = await handleUpload({
        body,
        request: req,
        token: publicBlobToken(),
        onBeforeGenerateToken: async (pathname) => {
          const ext = path.extname(pathname).toLowerCase();
          if (!pathname.startsWith("uploads/") || !Object.values(TYPES).includes(ext)) {
            throw new Error("Invalid upload path");
          }
          return {
            allowedContentTypes: ALLOWED_TYPES,
            maximumSizeInBytes: MAX_BYTES,
            addRandomSuffix: true,
            allowOverwrite: false,
            cacheControlMaxAge: 60 * 60 * 24 * 30,
          };
        },
      });
      return NextResponse.json(result);
    } catch (error) {
      console.error("[upload] Blob token request failed:", error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Upload failed" },
        { status: 400 },
      );
    }
  }

  // Local development (and a small-file fallback): receive multipart form data
  // and let the storage layer decide between disk and Vercel Blob.
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const ext = TYPES[file.type];
    if (!ext) {
      return NextResponse.json(
        { error: "Unsupported image type. Use PNG, JPEG, WebP or GIF." },
        { status: 400 },
      );
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "Image must be 8 MB or smaller" }, { status: 413 });
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
