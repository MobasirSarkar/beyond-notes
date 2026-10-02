"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { useOpenTasks } from "@/lib/api/queries";
import { playBeep } from "@/lib/browser/sound";
import { getPrefs } from "@/lib/stores/prefs";

const SEEN_KEY = "bn:reminded";
const WINDOW_MS = 10 * 60_000;

function loadSeen(): Set<string> {
  try {
    const data: unknown = JSON.parse(sessionStorage.getItem(SEEN_KEY) ?? "[]");
    return new Set(
      Array.isArray(data) ? data.filter((v): v is string => typeof v === "string") : [],
    );
  } catch {
    return new Set();
  }
}

/**
 * In-app reminders while the app is open (Web Push covers the closed case).
 * Checks open tasks every 20s for reminders that just fell due.
 */
export function ReminderWatcher() {
  const router = useRouter();
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
        if (at > now || now - at > WINDOW_MS || seen.current?.has(key)) continue;
        seen.current?.add(key);
        try {
          sessionStorage.setItem(SEEN_KEY, JSON.stringify([...(seen.current ?? [])].slice(-200)));
        } catch {
          /* ignore */
        }
        if (getPrefs().sound) playBeep("alarm");
        toast(`Reminder: ${t.title}`, {
          description: t.boardName,
          duration: 15_000,
          action: {
            label: "Open",
            onClick: () => router.push(`/boards/${t.boardId}?task=${t.id}`),
          },
        });
      }
    };
    check();
    const id = window.setInterval(check, 20_000);
    return () => window.clearInterval(id);
  }, [data, router]);

  return null;
}
