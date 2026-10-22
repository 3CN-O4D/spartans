import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, isValidSession } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(ADMIN_COOKIE)?.value;

  if (await isValidSession(token)) return NextResponse.next();

  // API routes get a JSON 401 so the admin client can react cleanly.
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL("/login", req.url);
  url.searchParams.set("from", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  // Protect the admin UI *and* the write/read APIs. Previously only /admin was
  // matched, which left /api/content and /api/upload open to the public.
  matcher: ["/admin/:path*", "/api/content/:path*", "/api/upload/:path*"],
};
