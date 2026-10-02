import Link from "next/link";

import { buttonStyles } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main id="main" className="page flex min-h-[70dvh] flex-col items-start justify-center gap-6">
      <pre aria-hidden className="text-xs leading-tight text-subtle">
        {"┌──────────────┐\n│ 404 · ENOENT │\n└──────────────┘"}
      </pre>
      <h1 className="heading text-display">nothing here.</h1>
      <p className="text-sm text-muted">The page you asked for doesn&apos;t exist or was moved.</p>
      <Link href="/boards" className={buttonStyles({ variant: "solid" })}>
        ← back to boards
      </Link>
    </main>
  );
}
