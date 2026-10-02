"use client";

import { AnimatePresence, motion } from "motion/react";
import { useSyncExternalStore } from "react";

import { PixelButton } from "@/components/ascii/pixel-button";

import { SidebarContent } from "./sidebar";
import { useUi } from "./ui-state";

const subscribeNoop = () => () => {};

export function Topbar({ user }: { user: { name: string; email: string } }) {
  const ui = useUi();
  const isMac = useSyncExternalStore(
    subscribeNoop,
    () => /Mac|iPhone|iPad/.test(navigator.platform),
    () => true,
  );

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center gap-2 border-b-2 border-line bg-bg/95 px-3 py-2 backdrop-blur-sm sm:px-4">
        <PixelButton
          size="sm"
          variant="ghost"
          className="lg:hidden"
          onClick={() => ui.setNavOpen(true)}
          aria-label="Open navigation"
        >
          ≡
        </PixelButton>

        <button
          type="button"
          onClick={() => ui.setPaletteOpen(true)}
          className="term flex min-w-0 flex-1 items-center gap-2 border-2 border-line bg-bg px-3 text-left text-lg text-muted hover:border-accent sm:max-w-md"
        >
          <span aria-hidden>&gt;</span>
          <span className="truncate">search or run a command…</span>
          <span className="px-kbd ml-auto hidden sm:inline-block">{isMac ? "⌘ K" : "Ctrl K"}</span>
        </button>

        <div className="ml-auto flex items-center gap-2">
          <PixelButton
            size="sm"
            onClick={() => ui.openCapture({ voice: true })}
            aria-label="Voice capture"
            title="Voice capture (v)"
          >
            ◉ <span className="hidden sm:inline">VOICE</span>
          </PixelButton>
          <PixelButton
            size="sm"
            variant="primary"
            onClick={() => ui.openCapture()}
            title="Quick capture (t)"
          >
            + <span className="hidden sm:inline">TASK</span>
          </PixelButton>
        </div>
      </header>

      <AnimatePresence>
        {ui.navOpen ? (
          <div
            className="fixed inset-0 z-50 lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
          >
            <motion.div
              className="absolute inset-0 bg-bg/70"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => ui.setNavOpen(false)}
            />
            <motion.aside
              className="absolute inset-y-0 left-0 w-72 border-r-2 border-line bg-bg-2"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", ease: [0.7, 0, 0.3, 1], duration: 0.25 }}
            >
              <SidebarContent user={user} onNavigate={() => ui.setNavOpen(false)} />
            </motion.aside>
          </div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
