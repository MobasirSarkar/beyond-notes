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
  { index: 1, href: "/boards", label: "Boards", description: "Kanban boards", icon: SquareKanban },
  { index: 2, href: "/notes", label: "Notes", description: "Markdown notes", icon: NotebookPen },
  {
    index: 3,
    href: "/calendar",
    label: "Calendar",
    description: "Due dates and reminders",
    icon: CalendarDays,
  },
  { index: 4, href: "/focus", label: "Focus", description: "Pomodoro timer", icon: Timer },
  {
    index: 5,
    href: "/stats",
    label: "Stats",
    description: "Activity and streaks",
    icon: ChartNoAxesColumn,
  },
  {
    index: 6,
    href: "/settings",
    label: "Settings",
    description: "Preferences and account",
    icon: Settings2,
  },
] as const satisfies readonly NavWindow[];

export function activeWindow(pathname: string): NavWindow | undefined {
  return NAV_WINDOWS.find((w) => pathname === w.href || pathname.startsWith(`${w.href}/`));
}
