"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { AsciiProgress } from "@/components/ascii/ascii-progress";
import { Panel } from "@/components/ascii/panel";
import { PixelButton } from "@/components/ascii/pixel-button";
import { ScrambleText } from "@/components/ascii/scramble-text";
import { cn } from "@/lib/cn";
import { useLogFocus } from "@/lib/mutations";
import { setPrefs, usePrefs } from "@/lib/prefs";
import { useOpenTasks } from "@/lib/queries";
import { playBeep } from "@/lib/sound";
import { FOCUS_KINDS } from "@/lib/validation";

import { BigClock } from "./big-clock";

type Kind = (typeof FOCUS_KINDS)[number];

const KIND_LABEL: Record<Kind, string> = {
  focus: "FOCUS",
  short_break: "SHORT BREAK",
  long_break: "LONG BREAK",
};
const STORAGE_KEY = "bn:focus-timer";
const MIN_LOG_SECONDS = 60;

/** Persisted timer state so a reload (or a closed tab) never loses a session. */
const timerSchema = z.object({
  kind: z.enum(FOCUS_KINDS),
  taskId: z.uuid().nullable(),
  /** Epoch ms when the running segment ends (null when paused/idle). */
  endsAt: z.number().nullable(),
  /** Remaining ms while paused/idle. */
  remainingMs: z.number().nonnegative(),
  /** Accumulated active ms in this segment (excludes pauses). */
  elapsedMs: z.number().nonnegative(),
  /** Epoch ms when the current run leg started. */
  legStartedAt: z.number().nullable(),
  completedFocus: z.number().int().nonnegative(),
});
type TimerState = z.infer<typeof timerSchema>;

function durationFor(
  kind: Kind,
  prefs: { focusMinutes: number; shortBreakMinutes: number; longBreakMinutes: number },
) {
  const minutes =
    kind === "focus"
      ? prefs.focusMinutes
      : kind === "short_break"
        ? prefs.shortBreakMinutes
        : prefs.longBreakMinutes;
  return minutes * 60_000;
}

function loadState(): TimerState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? timerSchema.parse(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

const noopSubscribe = () => () => {};
const subscribeTick = (cb: () => void) => {
  const id = window.setInterval(cb, 250);
  return () => window.clearInterval(id);
};

async function notify(title: string, body: string) {
  try {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) await reg.showNotification(title, { body, icon: "/icons/icon-192.png", tag: "focus" });
    else {
      const n = new Notification(title, { body });
      n.addEventListener("click", () => window.focus());
    }
  } catch {
    /* ignore */
  }
}

export function FocusTimer({ initialTaskId }: { initialTaskId: string | null }) {
  const prefs = usePrefs();
  const tasks = useOpenTasks();
  const logFocus = useLogFocus();

  const [state, setState] = useState<TimerState>(() => {
    const fresh: TimerState = {
      kind: "focus",
      taskId: initialTaskId,
      endsAt: null,
      remainingMs: durationFor("focus", prefs),
      elapsedMs: 0,
      legStartedAt: null,
      completedFocus: 0,
    };
    const saved = loadState();
    if (!saved) return fresh;
    return initialTaskId && saved.endsAt === null ? { ...saved, taskId: initialTaskId } : saved;
  });

  // Re-render a few times a second while running.
  const now = useSyncExternalStore(
    state.endsAt ? subscribeTick : noopSubscribe,
    () => (state.endsAt ? Math.floor(Date.now() / 250) * 250 : 0),
    () => 0,
  );

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state]);

  const running = state.endsAt !== null;
  const total = durationFor(state.kind, prefs);
  const remaining = running ? Math.max(0, (state.endsAt ?? 0) - now) : state.remainingMs;
  const mm = Math.floor(remaining / 60_000);
  const ss = Math.floor((remaining % 60_000) / 1000);
  const clock = `${String(Math.min(mm, 99)).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
  const task = tasks.data?.find((t) => t.id === state.taskId);

  const log = useCallback(
    (s: TimerState, activeMs: number) => {
      const seconds = Math.round(activeMs / 1000);
      if (seconds < MIN_LOG_SECONDS) return;
      const endedAt = new Date();
      logFocus.mutate({
        id: crypto.randomUUID(),
        taskId: s.kind === "focus" ? s.taskId : null,
        kind: s.kind,
        startedAt: new Date(endedAt.getTime() - seconds * 1000).toISOString(),
        endedAt: endedAt.toISOString(),
      });
    },
    [logFocus],
  );

  const switchTo = useCallback(
    (kind: Kind, patch: Partial<TimerState> = {}) =>
      setState((s) => ({
        ...s,
        kind,
        endsAt: null,
        legStartedAt: null,
        elapsedMs: 0,
        remainingMs: durationFor(kind, prefs),
        ...patch,
      })),
    [prefs],
  );

  // Completion: a timer fires when the running segment ends (also right away
  // if the segment already ended while the tab was closed).
  useEffect(() => {
    const endsAt = state.endsAt;
    if (endsAt === null) return;
    const finished = state;
    const complete = () => {
      const activeMs = finished.elapsedMs + (Date.now() - (finished.legStartedAt ?? Date.now()));
      log(finished, Math.min(activeMs, total));
      if (prefs.sound) playBeep("alarm");
      if (finished.kind === "focus") {
        const completed = finished.completedFocus + 1;
        const next: Kind = completed % 4 === 0 ? "long_break" : "short_break";
        toast.success("Focus block complete!", {
          description: `Take a ${next === "long_break" ? "long" : "short"} break.`,
        });
        void notify(
          "Focus complete ✦",
          task ? `Nice work on "${task.title}". Break time.` : "Break time.",
        );
        switchTo(next, { completedFocus: completed });
      } else {
        toast("Break over", { description: "Ready for another round?" });
        void notify("Break over", "Back to it!");
        switchTo("focus");
      }
    };
    const id = window.setTimeout(complete, Math.max(0, endsAt - Date.now()));
    return () => window.clearTimeout(id);
  }, [state, total, log, prefs.sound, switchTo, task]);

  // Tab title shows the countdown.
  useEffect(() => {
    if (!running) return;
    const prev = document.title;
    document.title = `▶ ${clock} · ${KIND_LABEL[state.kind]}`;
    return () => {
      document.title = prev;
    };
  }, [running, clock, state.kind]);

  const start = () => {
    if (prefs.sound) playBeep("blip");
    if ("Notification" in window && Notification.permission === "default")
      void Notification.requestPermission();
    setState((s) => ({ ...s, endsAt: Date.now() + s.remainingMs, legStartedAt: Date.now() }));
  };
  const pause = () =>
    setState((s) => ({
      ...s,
      endsAt: null,
      remainingMs: Math.max(0, (s.endsAt ?? Date.now()) - Date.now()),
      elapsedMs: s.elapsedMs + (Date.now() - (s.legStartedAt ?? Date.now())),
      legStartedAt: null,
    }));
  const reset = () => {
    const activeMs =
      state.elapsedMs + (running ? Date.now() - (state.legStartedAt ?? Date.now()) : 0);
    if (state.kind === "focus") log(state, activeMs);
    switchTo(state.kind);
  };

  const dots = Array.from({ length: 4 }, (_, i) => (i < state.completedFocus % 4 ? "●" : "○")).join(
    " ",
  );

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <h1 className="term glow text-4xl uppercase">
        <span className="text-muted" aria-hidden>
          &gt;{" "}
        </span>
        <ScrambleText text="focus" />
      </h1>

      <div
        className="flex justify-center border-2 border-line"
        role="tablist"
        aria-label="Timer mode"
      >
        {FOCUS_KINDS.map((k) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={state.kind === k}
            disabled={running}
            onClick={() => switchTo(k)}
            className={cn(
              "term flex-1 px-3 py-0.5 text-xl disabled:cursor-not-allowed",
              state.kind === k ? "bg-fg text-bg" : "hover:bg-bg-3",
            )}
          >
            {KIND_LABEL[k]}
          </button>
        ))}
      </div>

      <Panel title={KIND_LABEL[state.kind]} bodyClassName="flex flex-col items-center gap-6 py-10">
        <BigClock
          value={clock}
          blink={running}
          className={cn(
            "text-[7px] sm:text-[11px] md:text-[14px]",
            state.kind !== "focus" && "[&_pre]:text-accent-2",
          )}
        />
        <AsciiProgress
          value={total - remaining}
          max={total}
          width={32}
          label="Session progress"
          className="text-xl sm:text-2xl"
        />
        <p
          className="term text-2xl text-fg-dim"
          aria-label={`${state.completedFocus % 4} of 4 focus blocks until long break`}
        >
          {dots} <span className="text-muted">· {state.completedFocus} done</span>
        </p>

        <div className="flex flex-wrap justify-center gap-3">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={running ? "pause" : "start"}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.12 }}
            >
              {running ? (
                <PixelButton onClick={pause} className="text-2xl">
                  [ ❚❚ PAUSE ]
                </PixelButton>
              ) : (
                <PixelButton variant="primary" onClick={start} className="text-2xl">
                  [ ▶ {state.elapsedMs > 0 ? "RESUME" : "START"} ]
                </PixelButton>
              )}
            </motion.div>
          </AnimatePresence>
          <PixelButton
            onClick={reset}
            className="text-2xl"
            title="Reset (logs partial focus ≥ 1 min)"
          >
            [ ↺ RESET ]
          </PixelButton>
          <PixelButton
            onClick={() =>
              state.kind === "focus"
                ? switchTo(state.completedFocus % 4 === 3 ? "long_break" : "short_break")
                : switchTo("focus")
            }
            className="text-2xl"
          >
            [ » SKIP ]
          </PixelButton>
        </div>
      </Panel>

      <div className="grid gap-6 md:grid-cols-2">
        <Panel title="target">
          <label className="flex flex-col gap-2">
            <span className="term text-lg text-muted">working on</span>
            <select
              value={state.taskId ?? ""}
              onChange={(e) => setState((s) => ({ ...s, taskId: e.target.value || null }))}
              className="px-input"
            >
              <option value="">— free focus —</option>
              {tasks.data?.map((t) => (
                <option key={t.id} value={t.id}>
                  [{t.boardName}] {t.title.slice(0, 70)}
                </option>
              ))}
            </select>
          </label>
          {task ? <p className="term mt-3 text-xl text-accent">▸ {task.title}</p> : null}
        </Panel>

        <Panel title="settings">
          <div className="grid grid-cols-3 gap-3">
            {(
              [
                ["focusMinutes", "focus"],
                ["shortBreakMinutes", "short"],
                ["longBreakMinutes", "long"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="flex flex-col gap-1">
                <span className="term text-lg text-muted">{label} min</span>
                <input
                  type="number"
                  min={1}
                  max={key === "focusMinutes" ? 120 : 60}
                  value={prefs[key]}
                  disabled={running}
                  onChange={(e) => {
                    const n = Number.parseInt(e.target.value, 10);
                    if (!Number.isFinite(n)) return;
                    setPrefs({ [key]: n });
                    if (!running && state.elapsedMs === 0) {
                      setState((s) => ({
                        ...s,
                        remainingMs: durationFor(s.kind, { ...prefs, [key]: n }),
                      }));
                    }
                  }}
                  className="px-input"
                />
              </label>
            ))}
          </div>
          <label className="term mt-3 flex items-center gap-2 text-lg">
            <input
              type="checkbox"
              checked={prefs.sound}
              onChange={(e) => setPrefs({ sound: e.target.checked })}
            />
            8-bit sounds
          </label>
        </Panel>
      </div>
    </div>
  );
}
