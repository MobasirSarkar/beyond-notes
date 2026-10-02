"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";

import { useLatch } from "@/hooks/use-latch";
import { useUi } from "@/lib/stores/ui";

// Code-split overlays: kept out of the initial bundle, prefetched when idle.
const loadPalette = () => import("@/components/features/palette/command-palette");
const loadCapture = () => import("@/components/features/voice/quick-capture");
const loadHelp = () => import("@/components/features/palette/shortcut-help");

const CommandPalette = dynamic(() => loadPalette().then((m) => m.CommandPalette), { ssr: false });
const QuickCapture = dynamic(() => loadCapture().then((m) => m.QuickCapture), { ssr: false });
const ShortcutHelp = dynamic(() => loadHelp().then((m) => m.ShortcutHelp), { ssr: false });

function usePrefetchWhenIdle() {
  useEffect(() => {
    const prefetch = () => {
      void loadPalette();
      void loadCapture();
      void loadHelp();
    };
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(prefetch, { timeout: 3000 });
      return () => window.cancelIdleCallback(id);
    }
    const id = globalThis.setTimeout(prefetch, 1500);
    return () => globalThis.clearTimeout(id);
  }, []);
}

export function Overlays() {
  usePrefetchWhenIdle();
  const palette = useLatch(useUi((s) => s.paletteOpen));
  const capture = useLatch(useUi((s) => s.capture.open));
  const help = useLatch(useUi((s) => s.helpOpen));
  return (
    <>
      {palette ? <CommandPalette /> : null}
      {capture ? <QuickCapture /> : null}
      {help ? <ShortcutHelp /> : null}
    </>
  );
}
