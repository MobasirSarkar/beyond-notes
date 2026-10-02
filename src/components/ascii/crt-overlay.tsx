"use client";

import { usePrefs } from "@/lib/prefs";

export function CrtOverlay() {
  const { crt } = usePrefs();
  if (!crt) return null;
  return <div aria-hidden className="crt-overlay" />;
}
