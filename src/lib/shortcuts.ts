export const SHORTCUTS = [
  { id: "palette", keys: ["mod+k"], label: "Command palette", group: "General" },
  { id: "help", keys: ["?"], label: "Keyboard shortcuts", group: "General" },
  { id: "quick-task", keys: ["t"], label: "Quick capture a task", group: "Create" },
  { id: "voice-task", keys: ["v"], label: "Voice capture a task", group: "Create" },
  { id: "new-note", keys: ["n"], label: "New note", group: "Create" },
  { id: "go-boards", keys: ["g", "b"], label: "Go to boards", group: "Navigate" },
  { id: "go-notes", keys: ["g", "n"], label: "Go to notes", group: "Navigate" },
  { id: "go-calendar", keys: ["g", "c"], label: "Go to calendar", group: "Navigate" },
  { id: "go-focus", keys: ["g", "f"], label: "Go to focus", group: "Navigate" },
  { id: "go-stats", keys: ["g", "s"], label: "Go to stats", group: "Navigate" },
  { id: "go-settings", keys: ["g", ","], label: "Go to settings", group: "Navigate" },
] as const;

export type ShortcutId = (typeof SHORTCUTS)[number]["id"];

export function formatKey(key: string, isMac: boolean): string {
  if (key === "mod+k") return isMac ? "⌘ K" : "Ctrl K";
  return key.toUpperCase() === key.toLowerCase() ? key : key.toUpperCase();
}
