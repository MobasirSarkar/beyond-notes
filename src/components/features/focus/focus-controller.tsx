"use client";

import { useEffect } from "react";
import { toast } from "sonner";

import { useLogFocus } from "@/lib/api/mutations";
import { useOpenTasks } from "@/lib/api/queries";
import { notify } from "@/lib/browser/platform";
import { playBeep } from "@/lib/browser/sound";
import { FOCUS_LABEL, focusTimer, hydrateFocusTimer, onSegmentEnd } from "@/lib/stores/focus-timer";
import { getPrefs, usePrefs } from "@/lib/stores/prefs";

/**
 * Headless controller mounted once in the shell: restores the timer, logs
 * finished sessions (queued offline like any mutation), and notifies.
 */
export function FocusController() {
  const { mutate: logFocus } = useLogFocus();
  const { data: tasks } = useOpenTasks();
  const lengths = usePrefs((p) => `${p.focusMinutes}/${p.shortBreakMinutes}/${p.longBreakMinutes}`);

  useEffect(() => {
    hydrateFocusTimer();
  }, []);

  useEffect(() => {
    focusTimer.syncLength();
  }, [lengths]);

  useEffect(
    () =>
      onSegmentEnd((e) => {
        const seconds = Math.round(e.activeMs / 1000);
        if (seconds >= 60) {
          const endedAt = new Date();
          logFocus({
            id: crypto.randomUUID(),
            taskId: e.kind === "focus" ? e.taskId : null,
            kind: e.kind,
            startedAt: new Date(endedAt.getTime() - seconds * 1000).toISOString(),
            endedAt: endedAt.toISOString(),
          });
        }
        if (e.partial) return;
        if (getPrefs().sound) playBeep("alarm");
        const task = tasks?.find((t) => t.id === e.taskId);
        const title = e.kind === "focus" ? "Focus block complete" : "Break over";
        const body =
          e.kind === "focus"
            ? `${task ? `“${task.title}” · ` : ""}Next: ${FOCUS_LABEL[e.next]}`
            : "Ready for another round?";
        toast.success(title, { description: body });
        void notify(title, body, "focus");
      }),
    [logFocus, tasks],
  );

  return null;
}
