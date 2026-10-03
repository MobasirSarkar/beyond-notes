import { createSerwistRoute } from "@serwist/turbopack";

const revision = process.env["VERCEL_GIT_COMMIT_SHA"] ?? crypto.randomUUID();

export const { dynamic, dynamicParams, revalidate, generateStaticParams, GET } = createSerwistRoute(
  {
    additionalPrecacheEntries: [{ url: "/~offline", revision }],
    swSrc: "src/app/sw.ts",
    // ponytail: use WASM esbuild because Cloudflare Workers isolates cannot run native binaries.
    useNativeEsbuild: false,
  },
);
