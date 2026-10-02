"use client";

import { createContext, use, useMemo, useState, type ReactNode } from "react";

type Capture = {
  open: boolean;
  voice: boolean;
  boardId?: string | undefined;
  columnId?: string | undefined;
};

type UiState = {
  paletteOpen: boolean;
  setPaletteOpen: (open: boolean) => void;
  helpOpen: boolean;
  setHelpOpen: (open: boolean) => void;
  capture: Capture;
  openCapture: (opts?: Omit<Capture, "open">) => void;
  closeCapture: () => void;
  navOpen: boolean;
  setNavOpen: (open: boolean) => void;
};

const UiContext = createContext<UiState | null>(null);

export function UiStateProvider({ children }: { children: ReactNode }) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [capture, setCapture] = useState<Capture>({ open: false, voice: false });

  const value = useMemo<UiState>(
    () => ({
      paletteOpen,
      setPaletteOpen,
      helpOpen,
      setHelpOpen,
      navOpen,
      setNavOpen,
      capture,
      openCapture: (opts) => {
        setPaletteOpen(false);
        setCapture({
          open: true,
          voice: opts?.voice ?? false,
          boardId: opts?.boardId,
          columnId: opts?.columnId,
        });
      },
      closeCapture: () => setCapture({ open: false, voice: false }),
    }),
    [paletteOpen, helpOpen, navOpen, capture],
  );
  return <UiContext value={value}>{children}</UiContext>;
}

export function useUi(): UiState {
  const ctx = use(UiContext);
  if (!ctx) throw new Error("useUi must be used inside <UiStateProvider>");
  return ctx;
}
