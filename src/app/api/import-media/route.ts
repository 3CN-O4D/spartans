import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { lookup } from "node:dns/promises";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, isValidSession } from "@/lib/auth";
import { publicStorageConfigured, writeBinary } from "@/lib/storage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_IMAGE_BYTES = 12 * 1024 * 1024; // 12 MB
const MAX_VIDEO_BYTES = 100 * 1024 * 1024; // 100 MB
const FETCH_TIMEOUT_MS = 25_000;
const MAX_REDIRECTS = 3;

// SVG is deliberately excluded: it can carry script and would be served from
// our own origin as a stored-XSS vector.
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

function isVideoExt(ext: string): boolean {
  return Object.values(VIDEO_TYPES).includes(ext);
}

function normalizeContentType(value: string | null): string {
  return (value ?? "").split(";")[0].trim().toLowerCase();
}

/** Best-effort type detection for hosts that send octet-stream or nothing. */
function sniffType(buf: Buffer): { mime: string; ext: string } | null {
  if (buf.length < 12) return null;

  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return { mime: "image/jpeg", ext: ".jpg" };
  }
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    return { mime: "image/png", ext: ".png" };
  }
  if (buf.subarray(0, 4).toString("latin1") === "GIF8") {
    return { mime: "image/gif", ext: ".gif" };
  }
  if (
    buf.subarray(0, 4).toString("latin1") === "RIFF" &&
    buf.subarray(8, 12).toString("latin1") === "WEBP"
  ) {
    return { mime: "image/webp", ext: ".webp" };
  }
  if (buf.subarray(0, 2).toString("latin1") === "BM") {
    return { mime: "image/bmp", ext: ".bmp" };
  }
  if (buf.subarray(4, 8).toString("latin1") === "ftyp") {
    const brand = buf.subarray(8, 12).toString("latin1");
    if (brand.startsWith("avi")) return { mime: "image/avif", ext: ".avif" };
    if (brand.startsWith("qt")) return { mime: "video/quicktime", ext: ".mov" };
    if (brand.startsWith("webm")) return { mime: "video/webm", ext: ".webm" };
    return { mime: "video/mp4", ext: ".mp4" };
  }
  if (
    buf[0] === 0x1a &&
    buf[1] === 0x45 &&
    buf[2] === 0xdf &&
    buf[3] === 0xa3
  ) {
    return { mime: "video/webm", ext: ".webm" };
  }
  return null;
}

function isPrivateIp(raw: string): boolean {
  const ip = raw.trim().toLowerCase();

  const v4 = ip.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (v4) {
    const a = Number(v4[1]);
    const b = Number(v4[2]);
    if (a === 0 || a === 10 || a === 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
    if (a >= 224) return true;
    return false;
  }

  if (ip === "::" || ip === "::1") return true;
  const mapped = ip.startsWith("::ffff:") ? ip.slice(7) : "";
  if (mapped) return isPrivateIp(mapped);
  if (ip.startsWith("fc") || ip.startsWith("fd")) return true;
  if (ip.startsWith("fe80")) return true;
  return false;
}

/**
 * Reject anything that is not a public http(s) target. Without this the admin
 * import route would be a server-side request forgery primitive that could
 * reach cloud metadata endpoints or internal services.
 */
async function assertPublicHttpUrl(raw: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("That link is not a valid URL");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only http and https links can be imported");
  }

  const host = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal")
  ) {
    throw new Error("That link points to a private address");
  }

  let addresses: { address: string }[] = [];
  try {
    addresses = await lookup(host, { all: true });
  } catch {
    throw new Error("That link's host could not be resolved");
  }
  if (!addresses.length) {
    throw new Error("That link's host could not be resolved");
  }
  if (addresses.some((entry) => isPrivateIp(entry.address))) {
    throw new Error("That link points to a private address");
  }

  return url;
}

async function readCapped(res: Response, maxBytes: number): Promise<Buffer> {
  const declared = Number(res.headers.get("content-length") ?? "0");
  if (declared > maxBytes) {
    throw new Error(
      `That file is ${Math.round(declared / 1024 / 1024)} MB. The limit is ${Math.round(maxBytes / 1024 / 1024)} MB`,
    );
  }
  if (!res.body) throw new Error("That link returned an empty response");

  const reader = res.body.getReader();
  const chunks: Buffer[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel().catch(() => undefined);
      throw new Error(
        `That file is larger than the ${Math.round(maxBytes / 1024 / 1024)} MB limit`,
      );
    }
    chunks.push(Buffer.from(value));
  }
  return Buffer.concat(chunks);
}

function safeStem(url: URL): string {
  const base = url.pathname.split("/").filter(Boolean).pop() ?? "";
  return (
    base
      .replace(/\.[a-z0-9]{1,5}$/i, "")
      .replace(/[^a-z0-9-_]/gi, "-")
      .toLowerCase()
      .slice(0, 40) || "imported"
  );
}

export async function POST(req: Request) {
  const jar = await cookies();
  if (!(await isValidSession(jar.get(ADMIN_COOKIE)?.value))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!publicStorageConfigured()) {
    return NextResponse.json(
      { error: "Storage is not configured on this deployment" },
      { status: 501 },
    );
  }

  let body: { url?: unknown };
  try {
    body = (await req.json()) as { url?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const raw = typeof body.url === "string" ? body.url.trim() : "";
  if (!raw) {
    return NextResponse.json({ error: "Paste a link to import" }, { status: 400 });
  }

  try {
    // Follow redirects manually so every hop is re-validated against the SSRF
    // checks above; a public URL must not be able to bounce to 127.0.0.1.
    let target = await assertPublicHttpUrl(raw);
    let response: Response | null = null;

    for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
      response = await fetch(target, {
        redirect: "manual",
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; SpartansMediaBot/1.0; +https://spartanssocceracademy.com)",
          Accept: "image/*,video/*;q=0.9,*/*;q=0.5",
        },
      });

      const location = response.headers.get("location");
      if (response.status >= 300 && response.status < 400 && location) {
        target = await assertPublicHttpUrl(new URL(location, target).toString());
        continue;
      }
      break;
    }

    if (!response) {
      return NextResponse.json({ error: "Could not fetch that link" }, { status: 400 });
    }
    if (!response.ok) {
      return NextResponse.json(
        { error: `That link returned HTTP ${response.status}` },
        { status: 400 },
      );
    }

    const headerType = normalizeContentType(response.headers.get("content-type"));
    const headerExt = TYPES[headerType];

    const maxBytes = headerExt && isVideoExt(headerExt) ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
    const buffer = await readCapped(response, maxBytes);
    if (!buffer.length) {
      return NextResponse.json({ error: "That link returned an empty file" }, { status: 400 });
    }

    const detected = headerExt
      ? { mime: headerType, ext: headerExt }
      : sniffType(buffer);

    if (!detected || !TYPES[detected.mime]) {
      return NextResponse.json(
        {
          error:
            "That link is not a supported image or video. Paste a direct image or video URL (PNG, JPEG, WebP, GIF, AVIF, BMP, MP4, WebM, MOV or MKV).",
        },
        { status: 400 },
      );
    }

    const limit = isVideoExt(detected.ext) ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
    if (buffer.length > limit) {
      return NextResponse.json(
        {
          error: `That file is larger than the ${Math.round(limit / 1024 / 1024)} MB limit`,
        },
        { status: 413 },
      );
    }

    const pathname = `uploads/imported-${target.hostname.replace(/[^a-z0-9.-]/gi, "-")}-${Date.now()}-${randomUUID().slice(0, 8)}-${safeStem(target)}${detected.ext}`;
    const url = await writeBinary(pathname, buffer, detected.mime);

    return NextResponse.json({ url });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not import that link";
    console.warn("[import-media] failed:", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
