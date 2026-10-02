"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { useOpenTasks } from "@/lib/queries";
import { playBeep } from "@/lib/sound";
import { usePrefs } from "@/lib/prefs";

const SEEN_KEY = "bn:reminded";

function loadSeen(): Set<string> {
  try {
    const raw = sessionStorage.getItem(SEEN_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

/**
 * In-app reminders while the app is open (complements Web Push, which covers
 * the closed-app case). Checks open tasks every 20s for reminders that fell due.
 */
export function ReminderWatcher() {
  const router = useRouter();
  const prefs = usePrefs();
  const { data } = useOpenTasks();
  const seen = useRef<Set<string> | null>(null);

  useEffect(() => {
    seen.current ??= loadSeen();
    const check = () => {
      const now = Date.now();
      for (const t of data ?? []) {
        if (!t.remindAt) continue;
        const at = Date.parse(t.remindAt);
        const key = `${t.id}:${t.remindAt}`;
        // Fire for reminders due within the last 10 minutes that we haven't shown.
        if (at <= now && now - at < 10 * 60_000 && !seen.current?.has(key)) {
          seen.current?.add(key);
          try {
            sessionStorage.setItem(SEEN_KEY, JSON.stringify([...(seen.current ?? [])].slice(-200)));
          } catch {
            /* ignore */
          }
          if (prefs.sound) playBeep("alarm");
          toast(`⏰ ${t.title}`, {
            description: `Reminder · ${t.boardName}`,
            duration: 15_000,
            action: {
              label: "Open",
              onClick: () => router.push(`/boards/${t.boardId}?task=${t.id}`),
            },
          });
        }
      }
    };
    check();
    const id = window.setInterval(check, 20_000);
    return () => window.clearInterval(id);
  }, [data, prefs.sound, router]);

  return null;
}
