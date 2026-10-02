import {
  CalendarDays,
  ChartNoAxesColumn,
  NotebookPen,
  Settings2,
  SquareKanban,
  Timer,
} from "lucide-react";

import type { NavWindow } from "@/types/ui";

/** The app's windows, shown in the bottom dock (press 1–6). */
export const NAV_WINDOWS = [
  { index: 1, href: "/boards", label: "boards", description: "Kanban boards", icon: SquareKanban },
  { index: 2, href: "/notes", label: "notes", description: "Markdown notes", icon: NotebookPen },
  {
    index: 3,
    href: "/calendar",
    label: "calendar",
    description: "Due dates & reminders",
    icon: CalendarDays,
  },
  { index: 4, href: "/focus", label: "focus", description: "Pomodoro timer", icon: Timer },
  {
    index: 5,
    href: "/stats",
    label: "stats",
    description: "Activity & streaks",
    icon: ChartNoAxesColumn,
  },
  {
    index: 6,
    href: "/settings",
    label: "settings",
    description: "Preferences & account",
    icon: Settings2,
  },
] as const satisfies readonly NavWindow[];

export function activeWindow(pathname: string): NavWindow | undefined {
  return NAV_WINDOWS.find((w) => pathname === w.href || pathname.startsWith(`${w.href}/`));
}
