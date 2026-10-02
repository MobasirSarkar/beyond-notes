import { describe, expect, it } from "vitest";

import { computeStreaks } from "@/lib/streaks";
import {
  createTaskInput,
  labelsSchema,
  logFocusInput,
  pushSubscriptionInput,
} from "@/lib/validation";

const iso = (ms: number) => new Date(ms).toISOString();

describe("input validation", () => {
  it("normalises and de-duplicates labels", () => {
    expect(labelsSchema.parse(["Bug", "bug", " ui "])).toEqual(["bug", "ui"]);
  });

  it("rejects labels with markup", () => {
    expect(labelsSchema.safeParse(["<script>"]).success).toBe(false);
  });

  it("caps task titles and requires content", () => {
    expect(createTaskInput.safeParse({ title: "   " }).success).toBe(false);
    expect(createTaskInput.safeParse({ title: "x".repeat(201) }).success).toBe(false);
    expect(createTaskInput.safeParse({ title: "ok", boardId: "not-a-uuid" }).success).toBe(false);
  });

  it("rejects impossible focus sessions", () => {
    const now = Date.now();
    expect(
      logFocusInput.safeParse({
        taskId: null,
        kind: "focus",
        startedAt: iso(now - 1000),
        endedAt: iso(now - 2000),
      }).success,
    ).toBe(false);
    expect(
      logFocusInput.safeParse({
        taskId: null,
        kind: "focus",
        startedAt: iso(now - 5 * 3600e3),
        endedAt: iso(now),
      }).success,
    ).toBe(false);
    expect(
      logFocusInput.safeParse({
        taskId: null,
        kind: "focus",
        startedAt: iso(now - 1500e3),
        endedAt: iso(now),
      }).success,
    ).toBe(true);
  });

  it("only accepts https push endpoints", () => {
    const keys = { p256dh: "k", auth: "a" };
    expect(
      pushSubscriptionInput.safeParse({ endpoint: "http://push.example/x", keys }).success,
    ).toBe(false);
    expect(
      pushSubscriptionInput.safeParse({ endpoint: "https://push.example/x", keys }).success,
    ).toBe(true);
  });
});

describe("computeStreaks", () => {
  it("counts the current streak even if today is not active yet", () => {
    expect(computeStreaks([true, false, true, true, true, false])).toEqual({
      current: 3,
      longest: 3,
    });
  });
  it("tracks the longest run", () => {
    expect(computeStreaks([true, true, true, true, false, true])).toEqual({
      current: 1,
      longest: 4,
    });
  });
  it("handles empty input", () => {
    expect(computeStreaks([])).toEqual({ current: 0, longest: 0 });
  });
});
