import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, isValidSession, timingSafeEqual } from "@/lib/auth";
import { syncSocials } from "@/lib/social-sync";
import type { SyncMode } from "@/lib/instagram-sync";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

function configuredSecrets(): string[] {
  return [process.env.SYNC_SECRET, process.env.CRON_SECRET]
    .map((value) => value?.trim() ?? "")
    .filter(Boolean);
}

async function authorize(req: Request): Promise<{ ok: boolean; publicAuto: boolean }> {
  const bearer = (req.headers.get("authorization") || "")
    .replace(/^Bearer\s+/i, "")
    .trim();
  const token = bearer || (req.headers.get("x-sync-secret") || "").trim();
  for (const secret of configuredSecrets()) {
    if (token && timingSafeEqual(token, secret)) {
      return { ok: true, publicAuto: false };
    }
  }

  const jar = await cookies();
  if (await isValidSession(jar.get(ADMIN_COOKIE)?.value)) {
    return { ok: true, publicAuto: false };
  }

  const enabled = process.env.INSTAGRAM_SYNC_ENABLED === "true";
  const publicEnabled = process.env.INSTAGRAM_SYNC_PUBLIC === "true";
  return { ok: enabled && publicEnabled, publicAuto: true };
}

async function handle(req: Request) {
  const url = new URL(req.url);
  const modeParam = url.searchParams.get("mode");
  const mode: SyncMode =
    modeParam === "auto" || modeParam === "cron" ? modeParam : "manual";

  const auth = await authorize(req);
  if (!auth.ok) {
    return NextResponse.json({ error: "Not authorised" }, { status: 401 });
  }
  if (auth.publicAuto && mode !== "auto") {
    return NextResponse.json({ error: "Not authorised" }, { status: 401 });
  }

  const dryRun = !auth.publicAuto && url.searchParams.get("dry") === "1";
  const force = !auth.publicAuto && url.searchParams.get("force") === "1";
  const sourceParam = url.searchParams.get("source");
  const source =
    sourceParam === "instagram" || sourceParam === "tiktok" ? sourceParam : "all";
  const result = await syncSocials({ mode, dryRun, force, source });

  return NextResponse.json(result, {
    status: result.ok ? 200 : 500,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function GET(req: Request) {
  return handle(req);
}

export async function POST(req: Request) {
  return handle(req);
}
