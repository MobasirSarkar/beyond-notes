import "./globals.css";

import { GeistMono } from "geist/font/mono";
import { GeistPixelSquare } from "geist/font/pixel";
import { GeistSans } from "geist/font/sans";
import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import type { ReactNode } from "react";

import { RootProviders } from "@/components/providers/root-providers";
import { CHROME_COLOR } from "@/lib/constants/theme";
import { PREFS_BOOTSTRAP } from "@/lib/stores/prefs";

export const metadata: Metadata = {
  title: { default: "Beyond", template: "%s · Beyond" },
  description:
    "A minimalist, keyboard-first task & notes workspace: kanban, Markdown notes, voice capture, reminders and a focus timer. Works offline.",
  applicationName: "Beyond",
  appleWebApp: { capable: true, title: "Beyond", statusBarStyle: "default" },
  formatDetection: { telephone: false },
  icons: {
    icon: [{ url: "/icons/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: CHROME_COLOR.dark },
    { media: "(prefers-color-scheme: light)", color: CHROME_COLOR.light },
  ],
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  // Per-request CSP nonce generated in `src/proxy.ts`.
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable} ${GeistPixelSquare.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Static constant (no user input): applies theme before first paint. */}
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: PREFS_BOOTSTRAP }} />
      </head>
      <body>
        <a
          href="#main"
          className="sr-only z-(--z-toast) rounded-full bg-fg px-4 py-2 text-bg focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
        >
          Skip to content
        </a>
        <RootProviders>{children}</RootProviders>
      </body>
    </html>
  );
}
