import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { readContent, writeContent } from "@/lib/store";
import { ADMIN_COOKIE, isValidSession } from "@/lib/auth";
import type { Content } from "@/lib/data";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_BODY_BYTES = 2 * 1024 * 1024; // 2 MB is plenty for text content

async function authorized() {
  const jar = await cookies();
  return isValidSession(jar.get(ADMIN_COOKIE)?.value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isContent(value: unknown): value is Content {
  if (!isRecord(value)) return false;
  if (!isRecord(value.club)) return false;
  const arrays = ["players", "fixtures", "leagueTable", "articles", "gallery"] as const;
  return arrays.every((key) => Array.isArray(value[key]));
}

export async function GET() {
  if (!(await authorized())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const content = await readContent();
  return NextResponse.json(content, {
    headers: { "Cache-Control": "no-store" },
  });
}

export async function PUT(req: Request) {
  if (!(await authorized())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!isContent(body)) {
    return NextResponse.json({ error: "Invalid content payload" }, { status: 400 });
  }

  try {
    await writeContent(body);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to save content" }, { status: 500 });
  }
}
