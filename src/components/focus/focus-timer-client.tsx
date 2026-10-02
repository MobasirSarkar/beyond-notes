"use client";

import dynamic from "next/dynamic";

import { AsciiSpinner } from "@/components/ascii/ascii-spinner";

/** The timer lives entirely in client state (localStorage), so skip SSR. */
export const FocusTimerClient = dynamic(() => import("./focus-timer").then((m) => m.FocusTimer), {
  ssr: false,
  loading: () => (
    <p className="term p-8 text-2xl text-fg-dim">
      <AsciiSpinner /> booting timer…
    </p>
  ),
});
