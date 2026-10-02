import Link from "next/link";
import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main
      id="main"
      className="flex min-h-dvh flex-col items-center justify-center gap-8 dots px-4 py-12"
    >
      <Link href="/" className="text-sm font-bold">
        beyond<span className="animate-blink">_</span>
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </main>
  );
}
