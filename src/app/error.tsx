"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main id="main" className="page flex min-h-[70dvh] flex-col items-start justify-center gap-6">
      <p className="label">exit code 1</p>
      <h1 className="heading text-display">something broke.</h1>
      <p className="text-sm text-muted">
        An unexpected error occurred.{" "}
        {error.digest ? <span className="text-subtle">ref {error.digest}</span> : null}
      </p>
      <Button variant="solid" onClick={reset}>
        ↻ try again
      </Button>
    </main>
  );
}
