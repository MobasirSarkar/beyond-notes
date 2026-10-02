export const qk = {
  boards: ["boards"] as const,
  board: (id: string) => ["board", id] as const,
  task: (id: string) => ["task", id] as const,
  notes: (params: { q?: string; tag?: string; archived?: boolean }) => ["notes", params] as const,
  notesAll: ["notes"] as const,
  note: (id: string) => ["note", id] as const,
  search: (q: string) => ["search", q] as const,
  calendar: (from: string, to: string) => ["calendar", from, to] as const,
  calendarAll: ["calendar"] as const,
  openTasks: ["open-tasks"] as const,
  stats: (tz: string) => ["stats", tz] as const,
  statsAll: ["stats"] as const,
};
