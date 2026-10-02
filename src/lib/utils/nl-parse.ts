import * as chrono from "chrono-node";

import type { ParsedCapture, Priority } from "@/types/domain";

const PRIORITY_RULES: readonly [RegExp, Priority][] = [
  // `!` shorthands mirror the glyphs shown on cards: !! medium, !!! high, !!!! urgent.
  [/\b(urgent(ly)?|asap|critical|p0)\b|!!!!/i, "urgent"],
  [/\b(high[ -]priority|important|p1)\b|!!!/i, "high"],
  [/\b(medium[ -]priority|normal priority|p2)\b|!!/i, "medium"],
  [/\b(low[ -]priority|someday|whenever|p3)\b/i, "low"],
];

const KIND_PREFIX =
  /^\s*(?:(note|memo|idea|jot down)|(task|todo|to do|add task|add)|(remind me to|remind me))\b[\s:,-]*/i;
const DANGLING = /\b(?:by|on|at|due|for|before|until|in)\s*$/i;
const LABEL_TOKEN = /(?:^|\s)#([\p{L}\p{N}_-]{1,24})/gu;
const SPOKEN_LABEL = /\b(?:hashtag|tag|label)\s+([\p{L}\p{N}_-]{1,24})/giu;

/**
 * Turns free text (typed or dictated) into a structured capture:
 *   "remind me to fix login tomorrow 5pm urgent #auth"
 *   → { kind: task, title: "Fix login", dueAt/remindAt: tomorrow 17:00, priority: urgent, labels: [auth] }
 */
export function parseCapture(input: string, ref: Date = new Date()): ParsedCapture {
  let text = input.replace(/\s+/g, " ").trim();
  let kind: ParsedCapture["kind"] = "task";
  let isReminder = false;

  const prefix = KIND_PREFIX.exec(text);
  if (prefix) {
    if (prefix[1]) kind = "note";
    if (prefix[3]) isReminder = true;
    text = text.slice(prefix[0].length);
  }

  const labels = new Set<string>();
  text = text
    .replace(LABEL_TOKEN, (_m, tag: string) => {
      labels.add(tag.toLowerCase());
      return " ";
    })
    .replace(SPOKEN_LABEL, (_m, tag: string) => {
      labels.add(tag.toLowerCase());
      return " ";
    });

  let priority: Priority = "none";
  for (const [re, p] of PRIORITY_RULES) {
    if (re.test(text)) {
      priority = p;
      text = text.replace(re, " ");
      break;
    }
  }

  let dueAt: Date | null = null;
  if (kind === "task") {
    const [hit] = chrono.parse(text, ref, { forwardDate: true });
    if (hit) {
      const date = hit.start.date();
      if (!hit.start.isCertain("hour")) date.setHours(9, 0, 0, 0);
      dueAt = date;
      text = `${text.slice(0, hit.index)} ${text.slice(hit.index + hit.text.length)}`;
    }
  }

  let title = text.replace(/\s+/g, " ").trim();
  for (let i = 0; i < 3 && DANGLING.test(title); i++) title = title.replace(DANGLING, "").trim();
  title = title.replace(/^[\s,.;:-]+|[\s,;:-]+$/g, "");
  title = title.charAt(0).toUpperCase() + title.slice(1);

  return {
    kind,
    title,
    dueAt,
    remindAt: isReminder && dueAt ? dueAt : null,
    priority,
    labels: [...labels].slice(0, 12),
  };
}
