"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

const DISMISS_KEY = "bn:install-dismissed";

export function InstallPrompt() {
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handler = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      try {
        if (localStorage.getItem(DISMISS_KEY)) return;
      } catch {
        /* ignore */
      }
      setEvent(e);
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
        <motion.aside
          aria-label="Install app"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          className="fixed right-4 bottom-[calc(var(--dock-space)+0.5rem)] z-(--z-toast) flex max-w-sm items-center gap-3 rounded-card glass-strong p-4"
        >
          <p className="flex-1 text-sm">Install Beyond for offline use and reminders.</p>
          <Button
            size="sm"
            variant="solid"
            onClick={async () => {
              await event.prompt();
              await event.userChoice;
              setEvent(null);
            }}
          >
            install
          </Button>
          <Button size="sm" variant="ghost" onClick={dismiss} aria-label="Dismiss">
            ×
          </Button>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
}
