import type { Route } from "next";

export const NAV_ITEMS = [
  { href: "/boards", label: "Boards", glyph: "▤", key: "g b" },
  { href: "/notes", label: "Notes", glyph: "✎", key: "g n" },
  { href: "/calendar", label: "Calendar", glyph: "▦", key: "g c" },
  { href: "/focus", label: "Focus", glyph: "◷", key: "g f" },
  { href: "/stats", label: "Stats", glyph: "▥", key: "g s" },
  { href: "/settings", label: "Settings", glyph: "⚙", key: "g ," },
] as const satisfies readonly { href: Route; label: string; glyph: string; key: string }[];
