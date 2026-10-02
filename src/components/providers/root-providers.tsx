"use client";

import { SerwistProvider } from "@serwist/turbopack/react";
import { MotionConfig } from "motion/react";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "sonner";

import { CrtOverlay } from "@/components/ascii/crt-overlay";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { applyPrefsToDocument, usePrefs } from "@/lib/prefs";

export function RootProviders({ children }: { children: ReactNode }) {
  const prefs = usePrefs();
  const reduced = useReducedMotion();

  useEffect(() => {
    applyPrefsToDocument(prefs);
  }, [prefs]);

  return (
    <SerwistProvider swUrl="/serwist/sw.js" disable={process.env.NODE_ENV === "development"}>
      <MotionConfig reducedMotion={reduced ? "always" : "never"}>
        {children}
        <CrtOverlay />
        <Toaster
          position="bottom-right"
          toastOptions={{
            unstyled: true,
            classNames: {
              toast:
                "px-panel term flex w-[22rem] items-start gap-3 px-4 py-3 text-lg !bg-bg-2 text-fg",
              title: "uppercase tracking-wide",
              description: "text-fg-dim font-mono text-sm",
              actionButton: "px-btn !text-base",
              cancelButton: "px-btn !text-base",
              error: "!border-danger !text-danger",
              success: "!border-ok",
            },
          }}
        />
      </MotionConfig>
    </SerwistProvider>
  );
}
