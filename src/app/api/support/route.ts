import { NextResponse } from "next/server";
import { storeSubmission } from "@/lib/storage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 6;
const attempts = new Map<string, { count: number; resetAt: number }>();

const SUPPORT_TYPES = [
  "Sponsor a kit",
  "Donate equipment",
  "Volunteer",
  "Partner with us",
  "Something else",
] as const;

type Payload = {
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  type?: unknown;
  message?: unknown;
  website?: unknown; // honeypot
};

function clientKey(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for");
  return (forwarded?.split(",")[0] ?? req.headers.get("x-real-ip") ?? "unknown").trim();
}

function tooMany(key: string) {
  const now = Date.now();
  const bucket = attempts.get(key);
  if (!bucket || now > bucket.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  bucket.count += 1;
  return bucket.count > MAX_ATTEMPTS;
}

function text(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function POST(req: Request) {
  if (tooMany(clientKey(req))) {
    return NextResponse.json({ error: "Too many messages. Try again later." }, { status: 429 });
  }

  let body: Payload;
  try {
    body = (await req.json()) as Payload;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Bots fill hidden fields. Pretend success so they do not retry.
  if (text(body.website, 200)) return NextResponse.json({ ok: true });

  const name = text(body.name, 80);
  const email = text(body.email, 120);
  const phone = text(body.phone, 30);
  const message = text(body.message, 1500);
  const type = SUPPORT_TYPES.includes(body.type as (typeof SUPPORT_TYPES)[number])
    ? (body.type as string)
    : "Something else";

  if (name.length < 2) {
    return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }
  if (message.length < 10) {
    return NextResponse.json({ error: "Please tell us a little more." }, { status: 400 });
  }

  const record = {
    id: `support-${Date.now()}`,
    createdAt: new Date().toISOString(),
    name,
    email,
    phone,
    type,
    message,
  };

  // Optional: forward to a webhook or form service. No API key is required
  // for a webhook URL, and the form still works locally without one.
  const webhook = process.env.SUPPORT_WEBHOOK_URL || process.env.CONTACT_WEBHOOK_URL;
  if (webhook) {
    try {
      const res = await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: "support", ...record }),
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) throw new Error(`Webhook responded ${res.status}`);
      return NextResponse.json({ ok: true });
    } catch {
      return NextResponse.json(
        { error: "We could not send your message. Please email us directly." },
        { status: 502 },
      );
    }
  }

  // Fallback: local disk in development, private Vercel Blob objects in
  // production. A webhook is still the best way to get an instant notification.
  try {
    await storeSubmission("support", record);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[support] Could not store support message:", error);
    return NextResponse.json(
      { error: "We could not send your message. Please email us directly." },
      { status: 500 },
    );
  }
}
