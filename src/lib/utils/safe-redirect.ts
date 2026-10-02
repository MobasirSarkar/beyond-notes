import type { Route } from "next";

/**
 * Accepts only same-origin relative paths to prevent open redirects
 * (rejects `//evil.com`, `/\evil.com`, absolute URLs and control characters).
 */
export function safeRedirectPath(input: unknown, fallback = "/boards"): string {
  if (typeof input !== "string" || input.length === 0 || input.length > 512) return fallback;
  if (!input.startsWith("/") || input.startsWith("//") || input.startsWith("/\\")) return fallback;
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f\u007f]/.test(input)) return fallback;
  try {
    const url = new URL(input, "http://local.invalid");
    if (url.origin !== "http://local.invalid") return fallback;
    return url.pathname + url.search + url.hash;
  } catch {
    return fallback;
  }
}

const APP_PREFIXES = ["/boards", "/notes", "/calendar", "/focus", "/stats", "/settings"] as const;

/** Type guard: narrows a sanitised path to a typed app route (no assertion needed). */
export function isAppRoute(path: string): path is Route {
  return APP_PREFIXES.some(
    (p) => path === p || path.startsWith(`${p}/`) || path.startsWith(`${p}?`),
  );
}
