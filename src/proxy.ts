import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PREFIXES = ["/boards", "/notes", "/calendar", "/focus", "/stats", "/settings"];

function buildCsp(nonce: string, isDev: boolean, isHttps: boolean): string {
  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": [
      "'self'",
      `'nonce-${nonce}'`,
      "'strict-dynamic'",
      ...(isDev ? ["'unsafe-eval'"] : []),
    ],
    // Inline style attributes are required by React `style` props and animation
    // libraries; style injection is far lower risk than script injection.
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "blob:", "data:", "https://avatars.githubusercontent.com"],
    "font-src": ["'self'", "data:"],
    "connect-src": ["'self'", ...(isDev ? ["ws:", "wss:"] : [])],
    "media-src": ["'self'", "blob:", "data:"],
    "worker-src": ["'self'", "blob:"],
    "manifest-src": ["'self'"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
    "frame-src": ["'none'"],
  };
  const policy = Object.entries(directives)
    .map(([k, v]) => `${k} ${v.join(" ")}`)
    .join("; ");
  return isHttps && !isDev ? `${policy}; upgrade-insecure-requests` : policy;
}

/**
 * Next.js 16 proxy (formerly middleware):
 *  1. Generates a per-request CSP nonce (consumed by Next for its inline scripts).
 *  2. Performs an *optimistic* auth redirect based on cookie presence. Real
 *     authorization always happens server-side in the data-access layer.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasSession = getSessionCookie(request, { cookiePrefix: "bn" }) !== null;

  if (
    !hasSession &&
    PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }

  const nonce = btoa(crypto.randomUUID());
  const isHttps =
    request.nextUrl.protocol === "https:" || request.headers.get("x-forwarded-proto") === "https";
  const csp = buildCsp(nonce, process.env.NODE_ENV === "development", isHttps);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    {
      source:
        "/((?!api/|_next/static|_next/image|sw\\.js|swe-worker|icons/|favicon.ico|manifest.webmanifest|robots.txt).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
