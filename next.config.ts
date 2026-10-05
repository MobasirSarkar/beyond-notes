import withSerwistInit from "@serwist/next";
import type { NextConfig } from "next";

/**
 * Static security headers applied to every response.
 * The Content-Security-Policy is per-request (nonce based) and is set in `src/proxy.ts`.
 */
const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
  {
    key: "Permissions-Policy",
    value:
      "microphone=(self), camera=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=(), browsing-topics=()",
  },
] as const;

const nextConfig: NextConfig = {
  // Self-contained server bundle (server.js + only the traced node_modules),
  // opted into by the Docker build so local `next start` stays unchanged.
  ...(process.env["NEXT_OUTPUT"] === "standalone" ? { output: "standalone" as const } : {}),
  reactCompiler: true,
  typedRoutes: true,
  poweredByHeader: false,
  reactStrictMode: true,
  serverExternalPackages: ["web-push"],
  async headers() {
    return [
      { source: "/:path*", headers: [...securityHeaders] },
      {
        source: "/api/:path*",
        headers: [{ key: "Cache-Control", value: "private, no-store, max-age=0" }],
      },
    ];
  },
};
const revision = process.env["VERCEL_GIT_COMMIT_SHA"] ?? crypto.randomUUID();

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV !== "production" || Boolean(process.env["TURBOPACK"]),
  additionalPrecacheEntries: [{ url: "/~offline", revision }],
});

export default withSerwist(nextConfig);
