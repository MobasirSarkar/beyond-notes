"use client";

import { Pause, Play, RotateCcw, SkipForward } from "lucide-react";
import { useEffect, useId } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/ui/field";
import { Frame } from "@/components/ui/frame";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Listbox } from "@/components/ui/listbox";
import { PageHeader } from "@/components/ui/page-header";
import { Segmented } from "@/components/ui/segmented";
import { useOpenTasks } from "@/lib/api/queries";
import { FOCUS_KINDS } from "@/lib/schemas/input";
import {
  durationFor,
  FOCUS_LABEL,
  focusTimer,
  formatClock,
  LONG_BREAK_INTERVAL,
  useFocusTimer,
  useRemainingMs,
} from "@/lib/stores/focus-timer";
import { setPrefs, usePrefs } from "@/lib/stores/prefs";
import { playBeep } from "@/lib/browser/sound";
import { cn } from "@/lib/utils/cn";
import type { FocusKind } from "@/types/domain";
import type { Prefs, TimerLengthKey } from "@/types/prefs";

import { BigClock } from "./big-clock";
import { OrbitDial } from "./orbit-dial";

const KIND_OPTIONS = FOCUS_KINDS.map((k) => ({ value: k, label: FOCUS_LABEL[k] }));
const LENGTHS: readonly { key: TimerLengthKey; label: string; max: number }[] = [
  { key: "focusMinutes", label: "focus", max: 120 },
  { key: "shortBreakMinutes", label: "short break", max: 60 },
  { key: "longBreakMinutes", label: "long break", max: 60 },
];

export function FocusView({ initialTaskId }: { initialTaskId: string | null }) {
  const ids = useId();
  const tasks = useOpenTasks();
  const prefs = usePrefs((p) => p);
  const kind = useFocusTimer((s) => s.kind);
  const taskId = useFocusTimer((s) => s.taskId);
  const running = useFocusTimer((s) => s.endsAt !== null);
  const started = useFocusTimer((s) => s.elapsedMs > 0);
  const completed = useFocusTimer((s) => s.completedFocus);
  const remaining = useRemainingMs();

  useEffect(() => {
    if (initialTaskId) focusTimer.setTask(initialTaskId);
  }, [initialTaskId]);

  const clock = formatClock(remaining);
  const total = durationFor(kind);
  const task = tasks.data?.find((t) => t.id === taskId);
  const cycle = completed % LONG_BREAK_INTERVAL;

  useEffect(() => {
    if (!running) return;
    const prev = document.title;
    document.title = `${clock} · ${FOCUS_LABEL[kind]}`;
    return () => {
      document.title = prev;
    };
  }, [running, clock, kind]);

  const start = () => {
    if (prefs.sound) playBeep("blip");
    if ("Notification" in window && Notification.permission === "default")
      void Notification.requestPermission();
    focusTimer.start();
  };

  return (
    <div className="flex flex-col">
      <PageHeader
        eyebrow="deep work"
        title="focus"
        description={
          task
            ? `working on “${task.title}”`
            : "free focus · pick a task below to track time against it"
        }
      />

      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <Segmented<FocusKind>
          label="Timer mode"
          value={kind}
          options={KIND_OPTIONS}
          onChange={(k) => focusTimer.switchTo(k)}
          disabled={running}
          className="mx-auto w-full max-w-md"
        />

        <section aria-label="Timer" className="flex flex-col items-center gap-8 py-6 sm:py-10">
          <OrbitDial
            progress={total > 0 ? (total - remaining) / total : 0}
            running={running}
            label="Session progress"
            className="w-full max-w-[min(100%,24rem,52dvh)]"
          >
            <span className="subheading text-muted">{FOCUS_LABEL[kind]}</span>
            <BigClock
              value={clock}
              blink={running}
              className="text-[clamp(3rem,min(13vw,9dvh),5.5rem)]"
            />
            <span
              className="flex items-center gap-1.5"
              aria-label={`${cycle} of ${LONG_BREAK_INTERVAL} focus blocks before a long break`}
            >
              {Array.from({ length: LONG_BREAK_INTERVAL }, (_, i) => (
                <span
                  key={i}
                  className={cn(
                    "size-1.5 rounded-full",
                    i < cycle ? "bg-fg" : "rule-strong opacity-40 hairline",
                  )}
                />
              ))}
            </span>
            <span className="text-xs text-subtle">{completed} completed</span>
          </OrbitDial>
          <div className="flex flex-wrap justify-center gap-2">
            {running ? (
              <Button size="lg" variant="solid" onClick={focusTimer.pause} className="min-w-36">
                <Icon icon={Pause} /> pause
              </Button>
            ) : (
              <Button size="lg" variant="solid" onClick={start} className="min-w-36">
                <Icon icon={Play} /> {started ? "resume" : "start"}
              </Button>
            )}
            <Button
              size="lg"
              onClick={focusTimer.reset}
              title="Reset (logs focus of 1 min or more)"
            >
              <Icon icon={RotateCcw} /> reset
            </Button>
            <Button size="lg" variant="ghost" onClick={focusTimer.skip}>
              skip <Icon icon={SkipForward} />
            </Button>
          </div>
        </section>

        <div className="grid gap-6 md:grid-cols-2">
          <Frame title="target">
            <Field label="working on" htmlFor={`${ids}-task`}>
              <Listbox
                id={`${ids}-task`}
                value={taskId ?? ""}
                onChange={(v) => focusTimer.setTask(v || null)}
                options={[
                  { value: "", label: "free focus" },
                  ...(tasks.data ?? []).map((t) => ({
                    value: t.id,
                    label: t.title.slice(0, 80),
                    hint: t.boardName,
                  })),
                ]}
              />
            </Field>
          </Frame>

          <Frame title="lengths" meta="minutes">
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-3 gap-3">
                {LENGTHS.map(({ key, label, max }) => (
                  <Field key={key} label={label} htmlFor={`${ids}-${key}`}>
                    <Input
                      id={`${ids}-${key}`}
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={max}
                      value={prefs[key]}
                      disabled={running}
                      onChange={(e) => {
                        const n = Number.parseInt(e.target.value, 10);
                        if (!Number.isFinite(n)) return;
                        const patch: Partial<Prefs> = {};
                        patch[key] = n;
                        setPrefs(patch);
                      }}
                    />
                  </Field>
                ))}
              </div>
              <Checkbox checked={prefs.sound} onChange={(sound) => setPrefs({ sound })}>
                chime sounds
              </Checkbox>
            </div>
          </Frame>
        </div>
      </div>
    </div>
  );
}
