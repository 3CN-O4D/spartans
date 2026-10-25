import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, isValidSession } from "@/lib/auth";
import { listSubmissions } from "@/lib/storage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE)?.value;
  if (!(await isValidSession(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const kind = searchParams.get("kind") === "support" ? "support" : "registration";
  const limit = Number(searchParams.get("limit") || "50");

  try {
    const submissions = await listSubmissions(kind, Number.isFinite(limit) ? limit : 50);
    return NextResponse.json({ ok: true, submissions });
  } catch (error) {
    console.error("[submissions] Failed to list:", error);
    return NextResponse.json({ error: "Failed to load submissions" }, { status: 500 });
  }
}
