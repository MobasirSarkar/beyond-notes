"use client";

import { useEffect, useState } from "react";

import { useReducedMotion } from "@/hooks/use-reduced-motion";

const FRAMES = {
  line: ["|", "/", "─", "\\"],
  braille: ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"],
  blocks: ["▖", "▘", "▝", "▗"],
} as const;

export function AsciiSpinner({
  kind = "braille",
  className,
  label = "Loading",
}: {
  kind?: keyof typeof FRAMES;
  className?: string;
  label?: string;
}) {
  const reduced = useReducedMotion();
  const [i, setI] = useState(0);
  useEffect(() => {
    if (reduced) return;
    const id = window.setInterval(() => setI((n) => n + 1), 90);
    return () => window.clearInterval(id);
  }, [reduced]);
  const frames = FRAMES[kind];
  return (
    <span role="status" aria-label={label} className={className}>
      {reduced ? "…" : frames[i % frames.length]}
    </span>
  );
}
