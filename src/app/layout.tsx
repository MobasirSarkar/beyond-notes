import "@fontsource/vt323/400.css";
import "@fontsource/press-start-2p/400.css";
import "@fontsource-variable/jetbrains-mono/wght.css";
import "./globals.css";

import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import type { ReactNode } from "react";

import { RootProviders } from "@/components/providers/root-providers";
import { PREFS_BOOTSTRAP } from "@/lib/prefs";

export const metadata: Metadata = {
  title: { default: "Beyond Notes", template: "%s · Beyond Notes" },
  description:
    "A pixel-art, offline-first task & notes manager with kanban boards, voice capture, reminders and a focus timer.",
  applicationName: "Beyond Notes",
  appleWebApp: { capable: true, title: "Beyond Notes", statusBarStyle: "black-translucent" },
  formatDetection: { telephone: false },
  icons: {
    icon: [{ url: "/icons/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#050a06" },
    { media: "(prefers-color-scheme: light)", color: "#f3efe3" },
  ],
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  // Per-request CSP nonce generated in `src/proxy.ts`.
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Static constant (no user input): applies theme before first paint. */}
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: PREFS_BOOTSTRAP }} />
      </head>
      <body>
        <a href="#main" className="px-btn sr-only fixed top-2 left-2 z-[200] focus:not-sr-only">
          Skip to content
        </a>
        <RootProviders>{children}</RootProviders>
      </body>
    </html>
  );
}
