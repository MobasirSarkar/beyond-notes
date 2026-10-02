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
      <p className="type-overline">Error</p>
      <h1 className="type-display">Something broke.</h1>
      <p className="text-sm text-muted">
        An unexpected error occurred.{" "}
        {error.digest ? (
          <span className="type-numeric text-subtle">Ref. {error.digest}</span>
        ) : null}
      </p>
      <Button variant="solid" onClick={reset}>
        Try again
      </Button>
    </main>
  );
}
