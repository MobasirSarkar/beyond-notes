"use client";

import { motion } from "motion/react";

import { ScrambleText } from "@/components/ascii/scramble-text";

const FEATURES = [
  {
    icon: "▤",
    title: "Kanban boards",
    body: "Drag cards with mouse, touch or keyboard. WIP limits, labels, subtasks and due dates.",
    art: "┌──┐┌──┐┌──┐\n│▓▓││▓ ││  │\n│▓ ││  ││  │\n└──┘└──┘└──┘",
  },
  {
    icon: "✎",
    title: "Markdown notes",
    body: "Autosaving notes with live preview, tags, pinning and full-text search.",
    art: "# idea\n- [x] write\n- [ ] ship\n> stay pixel",
  },
  {
    icon: "◉",
    title: "Voice capture",
    body: 'Say "fix login tomorrow 5pm urgent" — the date, priority and tags are parsed for you.',
    art: "▁▂▅▇█▇▅▂▁▂▅▇\n  ◉ REC 00:04",
  },
  {
    icon: "▦",
    title: "Calendar + reminders",
    body: "Month view of everything due. Push reminders reach you even when the app is closed.",
    art: "M T W T F S S\n· · ▪ · · · ·\n· ▪ · · ▪ · ·",
  },
  {
    icon: "◷",
    title: "Focus timer",
    body: "Pomodoro sessions linked to tasks, with streaks and an activity heatmap.",
    art: " ▄▄  ▄▄    ▄▄  ▄▄\n █▀█ █▀█ ▪ █▀█ █▀█\n 25:00",
  },
  {
    icon: "⌁",
    title: "Offline PWA",
    body: "Install it. Read offline, keep editing, and changes sync when you're back online.",
    art: "[ OFFLINE ]\n queued: 3\n syncing ▓▓▓░░",
  },
] as const;

export function FeatureGrid() {
  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
      {FEATURES.map((f, i) => (
        <motion.article
          key={f.title}
          className="px-panel group p-5"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.4, delay: (i % 3) * 0.08, ease: [0.2, 0.9, 0.1, 1] }}
          whileHover={{ x: -2, y: -2 }}
        >
          <div className="flex items-center gap-3">
            <span className="pixel text-xl text-accent" aria-hidden>
              {f.icon}
            </span>
            <ScrambleText
              as="h3"
              text={f.title}
              trigger="hover"
              className="term glow text-2xl uppercase"
            />
          </div>
          <p className="mt-3 text-fg-dim">{f.body}</p>
          <pre
            aria-hidden
            className="mt-4 border-t-2 border-dashed border-line pt-3 text-xs leading-tight text-muted"
          >
            {f.art}
          </pre>
        </motion.article>
      ))}
    </div>
  );
}
