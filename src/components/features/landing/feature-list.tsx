const FEATURES = [
  {
    title: "Kanban boards",
    body: "Drag with mouse, touch or keyboard. WIP limits, labels, subtasks and due dates.",
  },
  {
    title: "Markdown notes",
    body: "Split-view editor, autosave, tags, pinning and instant full-text search.",
  },
  {
    title: "Voice capture",
    body: "Say “fix login tomorrow 5pm urgent #auth” — date, priority and tags are parsed.",
  },
  {
    title: "Calendar",
    body: "A month of due dates at a glance. Drag to reschedule, with push reminders.",
  },
  {
    title: "Focus timer",
    body: "Pomodoro blocks tied to tasks, running quietly in the status line.",
  },
  {
    title: "Offline first",
    body: "Install it. Read and edit offline; changes sync when you reconnect.",
  },
] as const;

export function FeatureList() {
  return (
    // Hairline grid: the 1-hairline gap reveals the line color behind the cells.
    <ol className="grid gap-(--bw) bg-line hairline sm:grid-cols-2 lg:grid-cols-3">
      {FEATURES.map((f, i) => (
        <li key={f.title} className="flex flex-col gap-3 bg-bg p-6">
          <span className="text-xs text-subtle tabular-nums">{String(i + 1).padStart(2, "0")}</span>
          <h3 className="heading text-lg">{f.title}</h3>
          <p className="text-sm leading-relaxed text-muted">{f.body}</p>
        </li>
      ))}
    </ol>
  );
}
