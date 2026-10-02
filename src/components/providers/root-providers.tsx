"use client";

import { SerwistProvider } from "@serwist/turbopack/react";
import { MotionConfig } from "motion/react";
import { useEffect, type ReactNode } from "react";

import { Toaster } from "@/components/ui/toaster";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { hydratePrefs } from "@/lib/stores/prefs";

export function RootProviders({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();
  useEffect(() => hydratePrefs(), []);

  return (
    <SerwistProvider swUrl="/serwist/sw.js" disable={process.env.NODE_ENV === "development"}>
      <MotionConfig reducedMotion={reduced ? "always" : "never"}>
        {children}
        <Toaster />
      </MotionConfig>
    </SerwistProvider>
  );
}
