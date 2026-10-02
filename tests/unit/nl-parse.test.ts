import { describe, expect, it } from "vitest";

import { parseCapture } from "@/lib/utils/nl-parse";

// Thursday 2 Oct 2026, 10:00 local time.
const REF = new Date(2026, 9, 2, 10, 0, 0);

describe("parseCapture", () => {
  it("extracts date, time, priority and tags from a dictated phrase", () => {
    const p = parseCapture("fix login tomorrow 5pm urgent #auth", REF);
    expect(p.kind).toBe("task");
    expect(p.title).toBe("Fix login");
    expect(p.priority).toBe("urgent");
    expect(p.labels).toEqual(["auth"]);
    expect(p.dueAt?.getDate()).toBe(3);
    expect(p.dueAt?.getHours()).toBe(17);
    expect(p.remindAt).toBeNull();
  });

  it("treats 'remind me to' as a task with a reminder", () => {
    const p = parseCapture("remind me to call mom on friday at 6pm", REF);
    expect(p.title).toBe("Call mom");
    expect(p.remindAt).not.toBeNull();
    expect(p.remindAt?.getTime()).toBe(p.dueAt?.getTime());
    expect(p.dueAt?.getDay()).toBe(5);
  });

  it("defaults to 09:00 when only a date is given", () => {
    const p = parseCapture("pay rent next monday", REF);
    expect(p.dueAt?.getHours()).toBe(9);
    expect(p.title).toBe("Pay rent");
  });

  it("detects notes and spoken hashtags", () => {
    const p = parseCapture("note hashtag ideas pixel fonts are great", REF);
    expect(p.kind).toBe("note");
    expect(p.labels).toEqual(["ideas"]);
    expect(p.dueAt).toBeNull();
  });

  it("parses priority shorthands", () => {
    expect(parseCapture("deploy !!", REF).priority).toBe("medium");
    expect(parseCapture("deploy !!!", REF).priority).toBe("high");
    expect(parseCapture("deploy !!!!", REF).priority).toBe("urgent");
    expect(parseCapture("refactor low priority", REF).priority).toBe("low");
    expect(parseCapture("plain task", REF).priority).toBe("none");
  });

  it("never returns more than 12 labels", () => {
    const tags = Array.from({ length: 20 }, (_, i) => `#t${i}`).join(" ");
    expect(parseCapture(`x ${tags}`, REF).labels).toHaveLength(12);
  });
});
