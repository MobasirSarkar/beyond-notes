"use client";

import type { CaptureState, UiState } from "@/types/ui";

import { createStore } from "./create-store";

const CLOSED_CAPTURE: CaptureState = { open: false, voice: false };

const store = createStore<UiState>({
  paletteOpen: false,
  helpOpen: false,
  capture: CLOSED_CAPTURE,
});

export const useUi = store.useStore;

export const ui = {
  openPalette: () => store.set({ paletteOpen: true, helpOpen: false }),
  closePalette: () => store.set({ paletteOpen: false }),
  togglePalette: () => store.set((s) => ({ paletteOpen: !s.paletteOpen })),
  openHelp: () => store.set({ helpOpen: true, paletteOpen: false }),
  closeHelp: () => store.set({ helpOpen: false }),
  openCapture: (opts: Omit<CaptureState, "open"> = { voice: false }) =>
    store.set({ paletteOpen: false, capture: { ...opts, open: true } }),
  closeCapture: () => store.set({ capture: CLOSED_CAPTURE }),
};
