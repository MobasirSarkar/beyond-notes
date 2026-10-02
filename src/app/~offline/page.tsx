import type { Metadata } from "next";
import Link from "next/link";

import { buttonStyles } from "@/components/ui/button";

export const metadata: Metadata = { title: "Offline" };

export default function OfflinePage() {
  return (
    <main id="main" className="page flex min-h-dvh flex-col items-start justify-center gap-6">
      <p className="type-overline">Offline</p>
      <h1 className="type-display">You’re offline.</h1>
      <p className="max-w-md text-sm text-muted">
        This page isn’t cached yet. Pages you’ve opened before still work, and changes you make are
        queued until you reconnect.
      </p>
      <Link href="/boards" className={buttonStyles({ variant: "solid" })}>
        Try again
      </Link>
    </main>
  );
}
