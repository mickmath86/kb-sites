import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Wildcard subdomain proxy.
 *
 * Incoming:  ef-oxnard-oxn.sites.kickbord.com/  →  rewrite to /s/ef-oxnard-oxn
 * Apex (sites.kickbord.com)                     →  pass through (marketing root)
 * Local dev: ef-oxnard-oxn.sites.localhost:3000 →  same rewrite
 *
 * NOTE: Next 16 renamed middleware.ts → proxy.ts and the exported fn must be named `proxy`.
 * NOTE: Internal route lives at /s/[slug] (NOT /_sites/...) — folders prefixed with
 * `_` are private folders in App Router and excluded from routing.
 */

// What we treat as "sites.kickbord.com" or "sites.localhost".
// Read at request time (env may not be set during build for proxy).
function getRootDomain(host: string): string {
  // Strip port for matching (host on Vercel won't include port, local will)
  const cleaned = host.split(":")[0];
  // Allow Vercel preview URLs (*.vercel.app) to act as the root
  if (cleaned.endsWith(".vercel.app")) return cleaned;
  // Otherwise expect the env-configured root, fallback to sites.kickbord.com
  return (
    process.env.NEXT_PUBLIC_PREVIEW_ROOT_DOMAIN ?? "sites.kickbord.com"
  );
}

function extractSubdomain(host: string, rootDomain: string): string | null {
  const cleaned = host.split(":")[0];
  if (cleaned === rootDomain) return null; // apex hit
  if (cleaned === `www.${rootDomain}`) return null;
  if (!cleaned.endsWith(`.${rootDomain}`)) return null;
  const sub = cleaned.slice(0, -1 * (rootDomain.length + 1));
  if (!sub || sub.includes(".")) return null; // no nested subdomains
  return sub.toLowerCase();
}

export function proxy(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const { pathname } = request.nextUrl;

  // Never rewrite Next internals, static, public, or API
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/s/") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/favicon") ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml"
  ) {
    return NextResponse.next();
  }

  // Local dev convenience: if host is localhost / 127.0.0.1 with no subdomain,
  // allow ?slug=... to test the template without DNS.
  const cleanedHost = host.split(":")[0];
  if (
    (cleanedHost === "localhost" || cleanedHost === "127.0.0.1") &&
    !cleanedHost.includes("sites.")
  ) {
    const slugParam = request.nextUrl.searchParams.get("slug");
    if (slugParam) {
      const url = request.nextUrl.clone();
      url.pathname = `/s/${slugParam}`;
      url.search = "";
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();
  }

  const rootDomain = getRootDomain(host);
  const subdomain = extractSubdomain(host, rootDomain);

  if (!subdomain) {
    // Apex / unknown host → let it pass through to the marketing root (/)
    return NextResponse.next();
  }

  // Rewrite to internal /_sites/[slug]
  const url = request.nextUrl.clone();
  url.pathname = `/s/${subdomain}${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: [
    // Run on everything except API routes, static, image opt, and metadata files
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
