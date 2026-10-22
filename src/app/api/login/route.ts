import { NextResponse } from "next/server";
import { ADMIN_COOKIE, adminPassword, adminToken, isAdminConfigured, timingSafeEqual } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 8;

type Bucket = { count: number; resetAt: number };
const attempts = new Map<string, Bucket>();

function clientKey(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for");
  return (forwarded?.split(",")[0] ?? req.headers.get("x-real-ip") ?? "unknown").trim();
}

function rateLimited(key: string) {
  const now = Date.now();
  const bucket = attempts.get(key);
  if (!bucket || now > bucket.resetAt) {
    attempts.set(key, { count: 0, resetAt: now + WINDOW_MS });
    return false;
  }
  if (bucket.count >= MAX_ATTEMPTS) return true;
  bucket.count += 1;
  return false;
}

export async function POST(req: Request) {
  if (!isAdminConfigured()) {
    return NextResponse.json(
      { error: "Admin access is not configured on this deployment." },
      { status: 503 },
    );
  }

  const key = clientKey(req);
  if (rateLimited(key)) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429 },
    );
  }

  const body = (await req.json().catch(() => ({}))) as { password?: unknown };
  const password = typeof body.password === "string" ? body.password : "";

  if (!timingSafeEqual(password, adminPassword())) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  // Successful login clears the bucket so a legitimate user is not punished.
  attempts.delete(key);

  const res = NextResponse.json({ ok: true });
  // Keep the explicit attribute order/types stable for older clients.
  res.cookies.set(ADMIN_COOKIE, await adminToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
