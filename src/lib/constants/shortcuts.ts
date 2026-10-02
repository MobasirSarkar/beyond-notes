import type { ShortcutDef } from "@/types/shortcuts";

export const SHORTCUTS = [
  { id: "palette", keys: ["mod+k"], label: "Command palette", group: "General" },
  { id: "help", keys: ["?"], label: "Keyboard shortcuts", group: "General" },
  { id: "quick-task", keys: ["t"], label: "Quick capture a task", group: "Create" },
  { id: "voice-task", keys: ["v"], label: "Voice capture", group: "Create" },
  { id: "new-note", keys: ["n"], label: "New note", group: "Create" },
  { id: "win-1", keys: ["1"], label: "Boards", group: "Navigate" },
  { id: "win-2", keys: ["2"], label: "Notes", group: "Navigate" },
  { id: "win-3", keys: ["3"], label: "Calendar", group: "Navigate" },
  { id: "win-4", keys: ["4"], label: "Focus", group: "Navigate" },
  { id: "win-5", keys: ["5"], label: "Stats", group: "Navigate" },
  { id: "win-6", keys: ["6"], label: "Settings", group: "Navigate" },
] as const satisfies readonly ShortcutDef[];

export function formatKey(key: string, isMac: boolean): string {
  if (key === "mod+k") return isMac ? "⌘K" : "Ctrl K";
  return key;
}
