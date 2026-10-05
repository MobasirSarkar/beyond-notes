"use client";

import { SerwistProvider } from "@serwist/next/react";
import { MotionConfig } from "motion/react";
import { useEffect, type ReactNode } from "react";

import { Toaster } from "@/components/ui/toaster";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { hydratePrefs } from "@/lib/stores/prefs";

export function RootProviders({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();
  useEffect(() => hydratePrefs(), []);

  return (
    <SerwistProvider swUrl="/sw.js" disable={process.env.NODE_ENV !== "production"}>
      <MotionConfig reducedMotion={reduced ? "always" : "never"}>
        {children}
        <Toaster />
      </MotionConfig>
    </SerwistProvider>
  );
}
