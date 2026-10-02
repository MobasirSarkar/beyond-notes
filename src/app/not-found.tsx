import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { buttonStyles } from "@/components/ui/button";
import { CosmosBackdrop } from "@/components/ui/cosmos-backdrop";
import { Icon } from "@/components/ui/icon";

export default function NotFound() {
  return (
    <main id="main" className="page flex min-h-dvh flex-col items-start justify-center gap-6">
      <CosmosBackdrop variant="hero" />
      <p className="type-overline">Error 404 · Signal lost</p>
      <h1 className="type-display">Lost in space.</h1>
      <p className="max-w-md text-sm text-muted">
        This page drifted out of range, or never existed. Head back to familiar orbit.
      </p>
      <Link href="/boards" className={buttonStyles({ variant: "solid", size: "lg" })}>
        <Icon icon={ArrowLeft} /> Back to boards
      </Link>
    </main>
  );
}
