"use client";

import { useEffect } from "react";

export default function GlobalError({
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
    <main id="main" className="grid min-h-[70dvh] place-items-center p-6">
      <div className="px-panel max-w-lg p-8 text-center">
        <p className="pixel text-2xl text-danger">SYSTEM ERROR</p>
        <p className="term mt-4 text-xl text-fg-dim">
          Something crashed.{" "}
          {error.digest ? <span className="text-muted">ref: {error.digest}</span> : null}
        </p>
        <button type="button" onClick={reset} className="px-btn mt-6" data-variant="primary">
          [ REBOOT ]
        </button>
      </div>
    </main>
  );
}
