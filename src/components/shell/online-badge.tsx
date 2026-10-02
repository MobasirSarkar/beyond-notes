"use client";

import { useIsMutating } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";

import { AsciiSpinner } from "@/components/ascii/ascii-spinner";
import { useOnline } from "@/hooks/use-online";

/** Connection + sync indicator: `[● ONLINE]`, `[○ OFFLINE · 3 queued]`, `[⠋ SYNC]`. */
export function OnlineBadge() {
  const online = useOnline();
  const pending = useIsMutating();
  return (
    <div className="term flex items-center gap-1 text-lg" aria-live="polite">
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={online ? (pending ? "sync" : "on") : "off"}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={{ duration: 0.15 }}
          className={online ? "text-ok" : "text-warn"}
        >
          {online ? (
            pending ? (
              <>
                [<AsciiSpinner /> SYNC]
              </>
            ) : (
              "[● ONLINE]"
            )
          ) : (
            `[○ OFFLINE${pending ? ` · ${pending} queued` : ""}]`
          )}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}
