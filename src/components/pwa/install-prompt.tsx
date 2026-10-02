"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

import { PixelButton } from "@/components/ascii/pixel-button";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "bn:install-dismissed";

export function InstallPrompt() {
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      try {
        if (localStorage.getItem(DISMISS_KEY)) return;
      } catch {
        /* ignore */
      }
      setEvent(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
    setEvent(null);
  };

  return (
    <AnimatePresence>
      {event ? (
        <motion.div
          role="status"
          initial={{ y: 120 }}
          animate={{ y: 0 }}
          exit={{ y: 120 }}
          transition={{ type: "spring", stiffness: 300, damping: 24 }}
          className="px-panel fixed right-4 bottom-20 z-40 flex max-w-sm items-center gap-3 p-3 lg:bottom-4"
        >
          <span className="pixel text-xs text-accent">▼</span>
          <p className="term flex-1 text-lg">Install Beyond Notes for offline use & reminders.</p>
          <PixelButton
            size="sm"
            variant="primary"
            onClick={async () => {
              await event.prompt();
              await event.userChoice;
              setEvent(null);
            }}
          >
            INSTALL
          </PixelButton>
          <PixelButton size="sm" variant="ghost" onClick={dismiss} aria-label="Dismiss">
            x
          </PixelButton>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
