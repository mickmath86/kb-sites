import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Edge middleware — defense-in-depth for introspection / diagnostic routes.
 *
 * In production, any request to a known "danger" path prefix returns a 404
 * regardless of whether the underlying route file exists. This prevents
 * accidental exposure if someone recreates a debug endpoint under one of
 * these names.
 *
 * Locally (NODE_ENV !== "production"), these routes remain reachable so
 * we can still poke at them during development.
 */

const BLOCKED_PREFIXES_IN_PROD = [
  "/api/debug",
  "/api/_debug",
  "/api/dev",
  "/api/introspect",
  "/api/env",
  "/api/inspect",
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProd = process.env.NODE_ENV === "production";

  if (isProd && BLOCKED_PREFIXES_IN_PROD.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return new NextResponse("Not Found", {
      status: 404,
      headers: { "cache-control": "no-store" },
    });
  }

  return NextResponse.next();
}

// Match only /api/* to keep the middleware cheap.
export const config = {
  matcher: ["/api/:path*"],
};
