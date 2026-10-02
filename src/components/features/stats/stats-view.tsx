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
import { formatDuration, plural } from "@/lib/utils/format";
import type { FocusStatsDto } from "@/types/dto";

/**
 * Sequential scale for a monochrome UI: each day is a star whose size and
 * brightness grow with focus time, so the heatmap reads like a star chart.
 */
const LEVELS = [
  { label: "None", dot: "size-1 opacity-20" },
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
              title={`${format(parseISO(d.day), "EEE d MMM")} · ${d.seconds ? formatDuration(d.seconds) : "No focus"}`}
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
          <span className="type-numeric text-subtle">{w.week.replace(/^\d{4}-/, "")}</span>
          <span className="relative h-1.5 bg-line/40">
            <span
              data-bar=""
              className="absolute inset-y-0 left-0 origin-left rounded-r-full bg-fg"
              style={{ width: `${(w.completed / max) * 100}%` }}
            />
          </span>
          <span className="text-right type-numeric text-muted">{w.completed}</span>
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
        eyebrow="Telemetry"
        title="Stats"
        description="Focus time, streaks and throughput"
        actions={
          <Segmented
            label="Display"
            size="sm"
            value={view}
            onChange={setView}
            options={[
              { value: "chart", label: "Chart" },
              { value: "table", label: "Table" },
            ]}
          />
        }
      />

      {stats.isPending ? (
        <p className="flex items-center gap-2 text-sm text-muted">
          <Spinner /> Loading stats…
        </p>
      ) : !stats.data ? (
        <p className="text-sm text-muted">
          Couldn’t load stats. Check your connection and try again.
        </p>
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
          label="Focus time"
          value={formatDuration(totals.focusSeconds)}
          hint={`${totals.sessions} sessions`}
        />
        <Stat
          label="Streak"
          value={plural(totals.currentStreak, "day")}
          hint={`Best: ${plural(totals.longestStreak, "day")}`}
        />
        <Stat label="Completed" value={totals.completedTasks} hint={`${totals.openTasks} open`} />
        <Stat label="Notes" value={totals.notes} hint="Active" />
      </div>

      {view === "table" ? (
        <div className="grid gap-6 md:grid-cols-2">
          <Frame title="Focus per day" bodyClassName="p-0">
            <table className="w-full text-sm">
              <thead className="type-overline">
                <tr className="rule-b">
                  <th className="px-4 py-2 text-left font-medium">Day</th>
                  <th className="px-4 py-2 text-right font-medium">Focus</th>
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
          <Frame title="Completed per week" bodyClassName="p-0">
            <table className="w-full text-sm">
              <thead className="type-overline">
                <tr className="rule-b">
                  <th className="px-4 py-2 text-left font-medium">Week</th>
                  <th className="px-4 py-2 text-right font-medium">Tasks</th>
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
          <Frame title="Focus · last 12 weeks" bodyClassName="overflow-x-auto">
            <Heatmap daily={daily} />
          </Frame>
          <Frame title="Completed per week">
            <WeeklyBars weekly={weekly} />
          </Frame>
        </div>
      )}

      <Frame title="Top tasks" meta="Last 30 days">
        {topTasks.length === 0 ? (
          <p className="text-sm text-subtle">
            No focus sessions yet. Start one from Focus (press 4).
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
