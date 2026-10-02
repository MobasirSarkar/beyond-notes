import type { Metadata } from "next";
import Link from "next/link";

import { buttonStyles } from "@/components/ui/button";

export const metadata: Metadata = { title: "Offline" };

export default function OfflinePage() {
  return (
    <main id="main" className="page flex min-h-dvh flex-col items-start justify-center gap-6">
      <p className="label">no carrier</p>
      <h1 className="heading text-display">you&apos;re offline.</h1>
      <p className="max-w-md text-sm leading-relaxed text-muted">
        This page isn&apos;t cached yet. Pages you&apos;ve opened before still work, and changes you
        make are queued until you reconnect.
      </p>
      <Link href="/boards" className={buttonStyles({ variant: "solid" })}>
        ↻ retry
      </Link>
    </main>
  );
}
