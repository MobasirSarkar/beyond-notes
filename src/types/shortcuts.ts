import type { SHORTCUTS } from "@/lib/constants/shortcuts";

export type ShortcutDef = {
  id: string;
  keys: readonly string[];
  label: string;
  group: "General" | "Create" | "Navigate";
};

export type ShortcutId = (typeof SHORTCUTS)[number]["id"];
