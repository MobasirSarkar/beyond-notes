import Link from "next/link";
import type { ReactNode } from "react";

import { AsciiField } from "@/components/ascii/ascii-field";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main id="main" className="relative flex min-h-dvh items-center justify-center p-4">
      <AsciiField className="pointer-events-none fixed inset-0 h-full w-full opacity-25" />
      <div className="relative z-10 w-full max-w-md">
        <Link href="/" className="pixel glow mb-8 block text-center text-sm text-fg">
          BEYOND<span className="text-accent">_</span>NOTES
        </Link>
        {children}
      </div>
    </main>
  );
}
