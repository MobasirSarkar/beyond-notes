import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

// Server and browser can differ in the last bits of Math.cos/sin, which would
// make SSR'd attributes mismatch on hydration; round the geometry once here.
const round = (n: number) => Math.round(n * 1000) / 1000;
const TICKS = Array.from({ length: 60 }, (_, t) => {
  const major = t % 5 === 0;
  const a = (t / 60) * Math.PI * 2;
  const r1 = 49.5;
  const r2 = major ? 47.6 : 48.6;
  return {
    t,
    major,
    x1: round(50 + r1 * Math.cos(a)),
    y1: round(50 + r1 * Math.sin(a)),
    x2: round(50 + r2 * Math.cos(a)),
    y2: round(50 + r2 * Math.sin(a)),
  };
});
const R = 44;
const C = 2 * Math.PI * R;

type Props = {
  /** 0…1 share of the session that has elapsed. */
  progress: number;
  running: boolean;
  label: string;
  children: ReactNode;
  className?: string;
};

/**
 * Session dial: a bezel of minute ticks, an orbit that fills as time passes and
 * a small body travelling along it. An inner moon drifts while the timer runs.
 */
export function OrbitDial({ progress, running, label, children, className }: Props) {
  const p = Math.min(1, Math.max(0, progress));
  const angle = p * 360;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(p * 100)}
      className={cn("relative aspect-square", className)}
    >
      <svg viewBox="0 0 100 100" aria-hidden className="absolute inset-0 size-full -rotate-90">
        <g className="text-line">
          {TICKS.map(({ t, major, x1, y1, x2, y2 }) => (
            <line
              key={t}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="currentColor"
              strokeWidth={major ? 0.35 : 0.2}
              className={cn(major && "text-subtle")}
            />
          ))}
        </g>
        <circle cx={50} cy={50} r={R} fill="none" stroke="var(--line)" strokeWidth={0.25} />
        <circle
          cx={50}
          cy={50}
          r={R}
          fill="none"
          stroke="var(--fg)"
          strokeWidth={0.6}
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - p)}
          className="transition-[stroke-dashoffset] duration-(--dur-3) ease-out"
        />
        <g transform={`rotate(${angle} 50 50)`}>
          <circle cx={50 + R} cy={50} r={3.2} fill="var(--fg)" opacity={0.08} />
          <circle cx={50 + R} cy={50} r={1.9} fill="var(--fg)" opacity={0.16} />
          <circle cx={50 + R} cy={50} r={1.1} fill="var(--fg)" />
        </g>
        <circle
          cx={50}
          cy={50}
          r={36}
          fill="none"
          stroke="var(--line)"
          strokeWidth={0.2}
          strokeDasharray="0.6 1.4"
        />
        <g
          className={cn("origin-center animate-orbit", !running && "[animation-play-state:paused]")}
        >
          <circle cx={86} cy={50} r={0.7} fill="var(--fg-muted)" />
        </g>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
        {children}
      </div>
    </div>
  );
}
