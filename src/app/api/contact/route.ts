import { NextResponse } from "next/server";
import { storeSubmission } from "@/lib/storage";
import { sendClubEmail, registrationEmailBody } from "@/lib/email";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 6;
const attempts = new Map<string, { count: number; resetAt: number }>();

const AGE_GROUPS = ["Under 7", "Under 9", "Under 11", "Under 13", "Under 15"] as const;

type Payload = {
  childName?: unknown;
  ageGroup?: unknown;
  guardian?: unknown;
  phone?: unknown;
  email?: unknown;
  notes?: unknown;
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
    return NextResponse.json({ error: "Too many submissions. Try again later." }, { status: 429 });
  }

  let body: Payload;
  try {
    body = (await req.json()) as Payload;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Bots fill hidden fields. Pretend success so they do not retry.
  if (text(body.website, 200)) return NextResponse.json({ ok: true });

  const childName = text(body.childName, 80);
  const guardian = text(body.guardian, 80);
  const phone = text(body.phone, 30);
  const email = text(body.email, 120);
  const notes = text(body.notes, 2000);
  const ageGroup = AGE_GROUPS.includes(body.ageGroup as (typeof AGE_GROUPS)[number])
    ? (body.ageGroup as string)
    : "";

  if (childName.length < 2) {
    return NextResponse.json({ error: "Please enter the child's name." }, { status: 400 });
  }
  if (guardian.length < 2) {
    return NextResponse.json({ error: "Please enter a parent or guardian name." }, { status: 400 });
  }
  if (!ageGroup) {
    return NextResponse.json({ error: "Please choose an age group." }, { status: 400 });
  }
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) {
    return NextResponse.json({ error: "Please enter a valid phone number." }, { status: 400 });
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  const record = {
    id: `reg-${Date.now()}`,
    createdAt: new Date().toISOString(),
    childName,
    ageGroup,
    guardian,
    phone,
    email,
    notes,
  };

  // Send email to the club via Brevo SMTP (best-effort; submission is still stored).
  try {
    const email = registrationEmailBody(record);
    await sendClubEmail(email);
  } catch {
    // Email failure must not block registration storage.
  }

  // Preferred path: forward to a webhook / form service (works on serverless).
  const webhook = process.env.CONTACT_WEBHOOK_URL;
  if (webhook) {
    try {
      const res = await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "registration", ...record }),
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) throw new Error(`Webhook responded ${res.status}`);
      return NextResponse.json({ ok: true });
    } catch {
      return NextResponse.json(
        { error: "We could not send your registration. Please call or email us." },
        { status: 502 },
      );
    }
  }

  // Fallback: local disk in development, private Vercel Blob objects in
  // production. A webhook is still the best way to get an instant notification.
  try {
    await storeSubmission("registration", record);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[contact] Could not store registration:", error);
    return NextResponse.json(
      { error: "We could not send your registration. Please call or email us." },
      { status: 500 },
    );
  }
}
