import type { NavWindow } from "@/types/ui";

/** The app's "windows", shown tmux-style in the status line (press 1–6). */
export const NAV_WINDOWS = [
  { index: 1, href: "/boards", label: "boards", description: "Kanban boards" },
  { index: 2, href: "/notes", label: "notes", description: "Markdown notes" },
  { index: 3, href: "/calendar", label: "calendar", description: "Due dates & reminders" },
  { index: 4, href: "/focus", label: "focus", description: "Pomodoro timer" },
  { index: 5, href: "/stats", label: "stats", description: "Activity & streaks" },
  { index: 6, href: "/settings", label: "settings", description: "Preferences & account" },
] as const satisfies readonly NavWindow[];

export function activeWindow(pathname: string): NavWindow | undefined {
  return NAV_WINDOWS.find((w) => pathname === w.href || pathname.startsWith(`${w.href}/`));
}
