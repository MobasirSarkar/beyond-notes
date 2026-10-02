import Link from "next/link";
import type { ReactNode } from "react";

import { CosmosBackdrop } from "@/components/ui/cosmos-backdrop";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <CosmosBackdrop variant="hero" />
      <main
        id="main"
        className="flex min-h-dvh flex-col items-center justify-center gap-8 px-4 py-12"
      >
        <Link href="/" className="type-wordmark text-2xl">
          beyond
        </Link>
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </>
  );
}
