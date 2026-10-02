"use client";

import { useEffect, useState } from "react";

import { useReducedMotion } from "@/hooks/use-reduced-motion";

const FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

export function Spinner({ className, label = "Loading" }: { className?: string; label?: string }) {
  const reduced = useReducedMotion();
  const [i, setI] = useState(0);
  useEffect(() => {
    if (reduced) return;
    const id = window.setInterval(() => setI((n) => (n + 1) % FRAMES.length), 90);
    return () => window.clearInterval(id);
  }, [reduced]);
  return (
    <span role="status" aria-label={label} className={className}>
      {reduced ? "…" : FRAMES[i]}
    </span>
  );
}
