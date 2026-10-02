"use client";

import { animate, stagger, steps } from "animejs";
import { format, parseISO } from "date-fns";
import { useEffect, useRef, useState } from "react";

import { AsciiSpinner } from "@/components/ascii/ascii-spinner";
import { Panel } from "@/components/ascii/panel";
import { PixelButton } from "@/components/ascii/pixel-button";
import { ScrambleText } from "@/components/ascii/scramble-text";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import type { FocusStatsDto } from "@/lib/dto";
import { formatDuration } from "@/lib/format";
import { useStats } from "@/lib/queries";

/** Sequential, single-hue scale encoded as glyph density (plus opacity). */
const LEVELS = [
  { glyph: "·", label: "none" },
  { glyph: "░", label: "< 25 min" },
  { glyph: "▒", label: "25–60 min" },
  { glyph: "▓", label: "1–2 h" },
  { glyph: "█", label: "> 2 h" },
] as const;

function level(seconds: number): number {
  if (seconds <= 0) return 0;
  if (seconds < 25 * 60) return 1;
  if (seconds < 60 * 60) return 2;
  if (seconds < 120 * 60) return 3;
  return 4;
}

/** Counts up to `value` with anime.js; static under reduced motion. */
function CountUp({ value, render = String }: { value: number; render?: (n: number) => string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();
  useEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;
    const obj = { n: 0 };
    const anim = animate(obj, {
      n: value,
      duration: 900,
      ease: "outExpo",
      onUpdate: () => {
        el.textContent = render(Math.round(obj.n));
      },
    });
    return () => {
      anim.revert();
      el.textContent = render(value);
    };
  }, [value, reduced, render]);
  return <span ref={ref}>{render(value)}</span>;
}

function Tile({
  label,
  value,
  render,
  hint,
}: {
  label: string;
  value: number;
  render?: (n: number) => string;
  hint?: string;
}) {
  return (
    <div className="px-panel p-4">
      <p className="term text-lg text-muted uppercase">{label}</p>
      <p className="term glow text-5xl leading-none text-fg">
        <CountUp value={value} {...(render ? { render } : {})} />
      </p>
      {hint ? <p className="term mt-1 text-base text-fg-dim">{hint}</p> : null}
    </div>
  );
}

function Heatmap({ daily }: { daily: FocusStatsDto["daily"] }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  // Pad so the first column starts on Monday.
  const pad = daily[0] ? (parseISO(daily[0].day).getDay() + 6) % 7 : 0;
  const cells = [...Array.from({ length: pad }, () => null), ...daily];
  const weeks = Math.ceil(cells.length / 7);

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;
    const anim = animate(el.querySelectorAll("[data-heat]"), {
      opacity: [0, 1],
      scale: [0.4, 1],
      delay: stagger(8, { grid: [7, weeks], from: "first", axis: "y" }),
      duration: 300,
      ease: steps(3),
    });
    return () => {
      anim.revert();
    };
  }, [daily, reduced, weeks]);

  return (
    <div>
      <div
        ref={ref}
        role="img"
        aria-label="Daily focus heatmap, last 12 weeks. See table view for values."
        className="grid w-max grid-flow-col grid-rows-7 gap-[3px]"
      >
        {cells.map((d, i) =>
          d ? (
            <span
              key={d.day}
              data-heat=""
              title={`${format(parseISO(d.day), "EEE d MMM")}: ${d.seconds ? formatDuration(d.seconds) : "no focus"}`}
              className="term grid size-5 place-items-center text-lg leading-none text-accent hover:outline-2 hover:outline-fg"
              style={{ opacity: 0.35 + level(d.seconds) * 0.16 }}
            >
              {LEVELS[level(d.seconds)]?.glyph}
            </span>
          ) : (
            <span key={`pad-${i}`} className="size-5" aria-hidden />
          ),
        )}
      </div>
      <div className="term mt-3 flex flex-wrap items-center gap-3 text-base text-fg-dim">
        {LEVELS.map((l, i) => (
          <span key={l.label} className="flex items-center gap-1">
            <span className="text-accent" style={{ opacity: 0.35 + i * 0.16 }}>
              {l.glyph}
            </span>
            {l.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function WeeklyBars({ weekly }: { weekly: FocusStatsDto["weekly"] }) {
  const ref = useRef<HTMLUListElement>(null);
  const reduced = useReducedMotion();
  const max = Math.max(1, ...weekly.map((w) => w.completed));
  const WIDTH = 24;

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;
    const anim = animate(el.querySelectorAll("[data-bar]"), {
      clipPath: ["inset(0 100% 0 0)", "inset(0 0% 0 0)"],
      delay: stagger(60),
      duration: 500,
      ease: steps(8),
    });
    return () => {
      anim.revert();
    };
  }, [weekly, reduced]);

  return (
    <ul ref={ref} className="flex flex-col gap-1" aria-label="Tasks completed per week">
      {weekly.map((w) => {
        const n = Math.round((w.completed / max) * WIDTH);
        return (
          <li
            key={w.week}
            className="term flex items-center gap-3 text-lg"
            title={`${w.week}: ${w.completed} completed`}
          >
            <span className="w-20 shrink-0 text-muted">{w.week.replace(/^\d{4}-/, "")}</span>
            <span data-bar="" className="whitespace-pre text-accent">
              {"█".repeat(n) || "▏"}
            </span>
            <span className="text-fg-dim">{w.completed}</span>
          </li>
        );
      })}
    </ul>
  );
}

export function StatsView() {
  const stats = useStats();
  const [table, setTable] = useState(false);

  if (stats.isPending) {
    return (
      <p className="term p-8 text-2xl text-fg-dim">
        <AsciiSpinner /> crunching numbers…
      </p>
    );
  }
  if (!stats.data) return <p className="term p-8 text-2xl text-danger">! could not load stats</p>;
  const { totals, daily, weekly, topTasks } = stats.data;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <h1 className="term glow text-4xl uppercase">
          <span className="text-muted" aria-hidden>
            &gt;{" "}
          </span>
          <ScrambleText text="stats" />
        </h1>
        <PixelButton
          size="sm"
          className="ml-auto"
          aria-pressed={table}
          onClick={() => setTable((t) => !t)}
        >
          {table ? "chart view" : "table view"}
        </PixelButton>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Tile
          label="focus time"
          value={totals.focusSeconds}
          render={formatDuration}
          hint={`${totals.sessions} sessions`}
        />
        <Tile
          label="streak"
          value={totals.currentStreak}
          render={(n) => `${n}d`}
          hint={`best ${totals.longestStreak}d`}
        />
        <Tile label="completed" value={totals.completedTasks} hint={`${totals.openTasks} open`} />
        <Tile label="notes" value={totals.notes} />
      </div>

      {table ? (
        <Panel title="data">
          <div className="grid gap-6 md:grid-cols-2">
            <table className="w-full text-sm">
              <caption className="term text-left text-lg text-muted">Focus per day</caption>
              <thead>
                <tr className="border-b-2 border-line text-left">
                  <th>day</th>
                  <th className="text-right">focus</th>
                </tr>
              </thead>
              <tbody>
                {daily
                  .filter((d) => d.seconds > 0)
                  .toReversed()
                  .map((d) => (
                    <tr key={d.day}>
                      <td>{d.day}</td>
                      <td className="text-right">{formatDuration(d.seconds)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
            <table className="w-full text-sm">
              <caption className="term text-left text-lg text-muted">Completed per week</caption>
              <thead>
                <tr className="border-b-2 border-line text-left">
                  <th>week</th>
                  <th className="text-right">tasks</th>
                </tr>
              </thead>
              <tbody>
                {weekly.map((w) => (
                  <tr key={w.week}>
                    <td>{w.week}</td>
                    <td className="text-right">{w.completed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          <Panel title="focus heatmap · 12 weeks" bodyClassName="overflow-x-auto">
            <Heatmap daily={daily} />
          </Panel>
          <Panel title="completed per week">
            <WeeklyBars weekly={weekly} />
          </Panel>
        </div>
      )}

      <Panel title="top tasks · 30 days">
        {topTasks.length === 0 ? (
          <p className="term text-lg text-muted">no focus sessions yet. start one from /focus.</p>
        ) : (
          <ol className="flex flex-col gap-1">
            {topTasks.map((t, i) => (
              <li key={t.taskId} className="flex items-center gap-3">
                <span className="term text-xl text-muted">{String(i + 1).padStart(2, "0")}</span>
                <span className="min-w-0 flex-1 truncate">{t.title}</span>
                <span className="term text-xl text-fg-dim">{formatDuration(t.seconds)}</span>
              </li>
            ))}
          </ol>
        )}
      </Panel>
    </div>
  );
}
