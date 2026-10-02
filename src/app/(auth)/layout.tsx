import Link from "next/link";
import type { ReactNode } from "react";

import { AsciiBackdrop } from "@/components/ui/ascii-backdrop";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AsciiBackdrop focus="center" />
      <main
        id="main"
        className="flex min-h-dvh flex-col items-center justify-center gap-8 dots px-4 py-12"
      >
        <Link href="/" className="heading text-md">
          beyond<span className="animate-blink">_</span>
        </Link>
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </>
  );
}
