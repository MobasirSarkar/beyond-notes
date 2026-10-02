import {
  CalendarDays,
  CloudOff,
  Mic,
  NotebookPen,
  SquareKanban,
  Timer,
  type LucideIcon,
} from "lucide-react";

import { Icon } from "@/components/ui/icon";

const FEATURES: readonly { title: string; body: string; icon: LucideIcon }[] = [
  {
    title: "Kanban boards",
    body: "Drag with mouse, touch or keyboard. WIP limits, labels, subtasks and due dates.",
    icon: SquareKanban,
  },
  {
    title: "Markdown notes",
    body: "Split-view editor, autosave, tags, pinning and instant full-text search.",
    icon: NotebookPen,
  },
  {
    title: "Voice capture",
    body: "Say “fix login tomorrow 5pm urgent #auth” — date, priority and tags are parsed.",
    icon: Mic,
  },
  {
    title: "Calendar",
    body: "A month of due dates at a glance. Drag to reschedule, with push reminders.",
    icon: CalendarDays,
  },
  {
    title: "Focus timer",
    body: "Pomodoro blocks tied to tasks, orbiting quietly in the dock while you work.",
    icon: Timer,
  },
  {
    title: "Offline first",
    body: "Install it. Read and edit offline; changes sync when you reconnect.",
    icon: CloudOff,
  },
];

export function FeatureList() {
  return (
    <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {FEATURES.map((f, i) => (
        <li
          key={f.title}
          className="group flex flex-col gap-4 rounded-panel glass p-6 transition-[border-color] duration-(--dur-2) hover:rule-strong"
        >
          <div className="flex items-center justify-between">
            <span className="grid size-10 place-items-center rounded-full lift">
              <Icon icon={f.icon} />
            </span>
            <span className="type-numeric text-xs text-subtle">
              {String(i + 1).padStart(2, "0")}
            </span>
          </div>
          <h3 className="type-heading">{f.title}</h3>
          <p className="text-sm text-muted">{f.body}</p>
        </li>
      ))}
    </ol>
  );
}
