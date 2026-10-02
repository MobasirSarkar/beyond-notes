"use client";

import { animate, stagger } from "animejs";
import { format, parseISO } from "date-fns";
import { useEffect, useRef, useState } from "react";

import { Frame } from "@/components/ui/frame";
import { PageHeader } from "@/components/ui/page-header";
import { Segmented } from "@/components/ui/segmented";
import { Spinner } from "@/components/ui/spinner";
import { Stat } from "@/components/ui/stat";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { useStats } from "@/lib/api/queries";
import { cn } from "@/lib/utils/cn";
import { formatDuration } from "@/lib/utils/format";
import type { FocusStatsDto } from "@/types/dto";

/**
 * Sequential scale for a monochrome UI: each day is a star whose size and
 * brightness grow with focus time, so the heatmap reads like a star chart.
 */
const LEVELS = [
  { label: "none", dot: "size-1 opacity-20" },
  { label: "< 25m", dot: "size-1.5 opacity-45" },
  { label: "25–60m", dot: "size-2 opacity-70" },
  { label: "1–2h", dot: "size-2.5 opacity-90" },
  { label: "> 2h", dot: "size-3 shadow-glow" },
] as const;

function level(seconds: number): number {
  if (seconds <= 0) return 0;
  if (seconds < 25 * 60) return 1;
  if (seconds < 60 * 60) return 2;
  if (seconds < 120 * 60) return 3;
  return 4;
}

function Star({ level: l }: { level: number }) {
  return <span className={cn("rounded-full bg-fg", LEVELS[l]?.dot)} />;
}

function Heatmap({ daily }: { daily: FocusStatsDto["daily"] }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const pad = daily[0] ? (parseISO(daily[0].day).getDay() + 6) % 7 : 0;
  const cells = [...Array.from({ length: pad }, () => null), ...daily];
  const weeks = Math.ceil(cells.length / 7);

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;
    const anim = animate(el.querySelectorAll("[data-heat]"), {
      opacity: [0, 1],
      scale: [0.4, 1],
      delay: stagger(8, { grid: [7, weeks], from: "center" }),
      duration: 420,
      ease: "outExpo",
    });
    return () => {
      anim.revert();
    };
  }, [daily, reduced, weeks]);

  return (
    <div className="flex flex-col gap-5">
      <div
        ref={ref}
        role="img"
        aria-label="Daily focus heatmap for the last 12 weeks. Table view lists the values."
        className="grid w-max grid-flow-col grid-rows-7 gap-1"
      >
        {cells.map((d, i) =>
          d ? (
            <span
              key={d.day}
              data-heat=""
              title={`${format(parseISO(d.day), "EEE d MMM")} · ${d.seconds ? formatDuration(d.seconds) : "no focus"}`}
              className="grid size-5 place-items-center hover:inset-frame"
            >
              <Star level={level(d.seconds)} />
            </span>
          ) : (
            <span key={`pad-${i}`} aria-hidden className="size-5" />
          ),
        )}
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted" aria-label="Legend">
        {LEVELS.map((l, i) => (
          <li key={l.label} className="flex items-center gap-2">
            <span className="grid size-3 place-items-center">
              <Star level={i} />
            </span>
            {l.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

function WeeklyBars({ weekly }: { weekly: FocusStatsDto["weekly"] }) {
  const ref = useRef<HTMLUListElement>(null);
  const reduced = useReducedMotion();
  const max = Math.max(1, ...weekly.map((w) => w.completed));

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;
    const anim = animate(el.querySelectorAll("[data-bar]"), {
      scaleX: [0, 1],
      delay: stagger(50),
      duration: 640,
      ease: "outExpo",
    });
    return () => {
      anim.revert();
    };
  }, [weekly, reduced]);

  return (
    <ul ref={ref} className="flex flex-col gap-3" aria-label="Tasks completed per week">
      {weekly.map((w) => (
        <li
          key={w.week}
          className="grid grid-cols-[4ch_minmax(0,1fr)_3ch] items-center gap-3 text-xs"
          title={`${w.week}: ${w.completed} completed`}
        >
          <span className="text-subtle">{w.week.replace(/^\d{4}-/, "").toLowerCase()}</span>
          <span className="relative h-1.5 bg-line/40">
            <span
              data-bar=""
              className="absolute inset-y-0 left-0 origin-left rounded-r-full bg-fg"
              style={{ width: `${(w.completed / max) * 100}%` }}
            />
          </span>
          <span className="text-right text-muted tabular-nums">{w.completed}</span>
        </li>
      ))}
    </ul>
  );
}

type View = "chart" | "table";

export function StatsView() {
  const stats = useStats();
  const [view, setView] = useState<View>("chart");

  return (
    <div className="flex flex-col">
      <PageHeader
        eyebrow="telemetry"
        title="stats"
        description="focus time, streaks and throughput"
        actions={
          <Segmented
            label="Display"
            size="sm"
            value={view}
            onChange={setView}
            options={[
              { value: "chart", label: "chart" },
              { value: "table", label: "table" },
            ]}
          />
        }
      />

      {stats.isPending ? (
        <p className="flex items-center gap-2 text-sm text-muted">
          <Spinner /> charting your orbit…
        </p>
      ) : !stats.data ? (
        <p className="text-sm">! could not load stats</p>
      ) : (
        <StatsBody data={stats.data} view={view} />
      )}
    </div>
  );
}

function StatsBody({ data, view }: { data: FocusStatsDto; view: View }) {
  const { totals, daily, weekly, topTasks } = data;
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label="focus time"
          value={formatDuration(totals.focusSeconds)}
          hint={`${totals.sessions} sessions`}
        />
        <Stat
          label="streak"
          value={`${totals.currentStreak}d`}
          hint={`best ${totals.longestStreak}d`}
        />
        <Stat label="completed" value={totals.completedTasks} hint={`${totals.openTasks} open`} />
        <Stat label="notes" value={totals.notes} hint="active" />
      </div>

      {view === "table" ? (
        <div className="grid gap-6 md:grid-cols-2">
          <Frame title="focus per day" bodyClassName="p-0">
            <table className="w-full text-sm">
              <thead className="label">
                <tr className="rule-b">
                  <th className="px-4 py-2 text-left font-normal">day</th>
                  <th className="px-4 py-2 text-right font-normal">focus</th>
                </tr>
              </thead>
              <tbody>
                {daily
                  .filter((d) => d.seconds > 0)
                  .toReversed()
                  .map((d) => (
                    <tr key={d.day} className="rule-b last:border-0">
                      <td className="px-4 py-2">{d.day}</td>
                      <td className="px-4 py-2 text-right tabular-nums">
                        {formatDuration(d.seconds)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </Frame>
          <Frame title="completed per week" bodyClassName="p-0">
            <table className="w-full text-sm">
              <thead className="label">
                <tr className="rule-b">
                  <th className="px-4 py-2 text-left font-normal">week</th>
                  <th className="px-4 py-2 text-right font-normal">tasks</th>
                </tr>
              </thead>
              <tbody>
                {weekly.map((w) => (
                  <tr key={w.week} className="rule-b last:border-0">
                    <td className="px-4 py-2">{w.week}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{w.completed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Frame>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          <Frame title="focus · 12 weeks" bodyClassName="overflow-x-auto">
            <Heatmap daily={daily} />
          </Frame>
          <Frame title="completed per week">
            <WeeklyBars weekly={weekly} />
          </Frame>
        </div>
      )}

      <Frame title="top tasks" meta="last 30 days">
        {topTasks.length === 0 ? (
          <p className="text-sm text-subtle">
            no focus sessions yet. start one from the focus window (4).
          </p>
        ) : (
          <ol className="flex flex-col">
            {topTasks.map((t, i) => (
              <li key={t.taskId} className="flex items-center gap-4 py-2 text-sm">
                <span className="text-xs text-subtle tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0 flex-1 truncate">{t.title}</span>
                <span className="text-muted tabular-nums">{formatDuration(t.seconds)}</span>
              </li>
            ))}
          </ol>
        )}
      </Frame>
    </div>
  );
}
