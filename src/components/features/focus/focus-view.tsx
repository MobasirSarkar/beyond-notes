"use client";

import { useEffect, useId } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/ui/field";
import { Frame } from "@/components/ui/frame";
import { Input, Select } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Progress } from "@/components/ui/progress";
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
import type { FocusKind } from "@/types/domain";
import type { Prefs, TimerLengthKey } from "@/types/prefs";

import { BigClock } from "./big-clock";

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
        path="~/focus"
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
          className="w-full"
        />

        <section
          aria-label="Timer"
          className="flex flex-col items-center gap-8 px-4 py-12 hairline sm:py-16"
        >
          <BigClock
            value={clock}
            blink={running}
            className="text-[clamp(0.375rem,1.6vw,0.875rem)]"
          />
          <Progress
            value={total - remaining}
            max={total}
            width={32}
            label="Session progress"
            className="text-xs sm:text-sm"
          />
          <p
            className="text-xs text-muted"
            aria-label={`${cycle} of ${LONG_BREAK_INTERVAL} focus blocks before a long break`}
          >
            {Array.from({ length: LONG_BREAK_INTERVAL }, (_, i) => (i < cycle ? "■" : "□")).join(
              " ",
            )}
            <span className="ml-3 text-subtle">{completed} completed</span>
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {running ? (
              <Button size="lg" variant="solid" onClick={focusTimer.pause} className="min-w-36">
                ❚❚ pause
              </Button>
            ) : (
              <Button size="lg" variant="solid" onClick={start} className="min-w-36">
                ▶ {started ? "resume" : "start"}
              </Button>
            )}
            <Button
              size="lg"
              onClick={focusTimer.reset}
              title="Reset (logs focus of 1 min or more)"
            >
              ↺ reset
            </Button>
            <Button size="lg" variant="ghost" onClick={focusTimer.skip}>
              skip →
            </Button>
          </div>
        </section>

        <div className="grid gap-6 md:grid-cols-2">
          <Frame title="target">
            <Field label="working on" htmlFor={`${ids}-task`}>
              <Select
                id={`${ids}-task`}
                value={taskId ?? ""}
                onChange={(e) => focusTimer.setTask(e.target.value || null)}
              >
                <option value="">free focus</option>
                {tasks.data?.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.boardName} / {t.title.slice(0, 60)}
                  </option>
                ))}
              </Select>
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
                8-bit sounds
              </Checkbox>
            </div>
          </Frame>
        </div>
      </div>
    </div>
  );
}
