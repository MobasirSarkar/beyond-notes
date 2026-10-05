import "server-only";

import { and, count, eq, isNull, sql } from "drizzle-orm";
import type { FocusSessionDto, FocusStatsDto } from "@/types/dto";
import { computeStreaks } from "@/lib/utils/streaks";
import type { LogFocusData } from "@/types/input";

import { db } from "../db";
import { focusSession, note, task } from "../db/schema";
import { ActionError, NotFoundError } from "../errors";
import { iso } from "./util";

export async function logFocusSession(
  userId: string,
  input: LogFocusData,
): Promise<FocusSessionDto> {
  if (input.taskId) {
    const [t] = await db
      .select({ id: task.id })
      .from(task)
      .where(and(eq(task.id, input.taskId), eq(task.userId, userId)));
    if (!t) throw new NotFoundError("Task");
  }
  const startedAt = new Date(input.startedAt);
  const endedAt = new Date(input.endedAt);
  const durationSec = Math.round((endedAt.getTime() - startedAt.getTime()) / 1000);

  const [row] = await db
    .insert(focusSession)
    .values({
      ...(input.id ? { id: input.id } : {}),
      userId,
      taskId: input.taskId,
      kind: input.kind,
      startedAt,
      endedAt,
      durationSec,
    })
    .onConflictDoNothing({ target: focusSession.id })
    .returning();

  const saved =
    row ??
    (input.id
      ? (
          await db
            .select()
            .from(focusSession)
            .where(and(eq(focusSession.id, input.id), eq(focusSession.userId, userId)))
        )[0]
      : undefined);
  if (!saved) throw new ActionError("Could not save session");

  return {
    id: saved.id,
    taskId: saved.taskId,
    kind: saved.kind,
    startedAt: iso(saved.startedAt),
    endedAt: iso(saved.endedAt),
    durationSec: saved.durationSec,
  };
}

const DAYS = 84;
const WEEKS = 8;

export async function getFocusStats(userId: string, tz: string): Promise<FocusStatsDto> {
  const [daily, weekly, topTasks, totalsRow, openTasks, notes] = await Promise.all([
    db.execute<{ day: string; seconds: number }>(sql`
      with days as (
        select generate_series(
          (now() at time zone ${tz})::date - ${DAYS - 1}::int,
          (now() at time zone ${tz})::date,
          interval '1 day'
        )::date as day
      )
      select to_char(d.day, 'YYYY-MM-DD') as day,
        coalesce(sum(f.duration_sec), 0)::int as seconds
      from days d
      left join ${focusSession} f
        on f.user_id = ${userId}
        and f.kind = 'focus'
        and (f.started_at at time zone ${tz})::date = d.day
      group by d.day order by d.day
    `),
    db.execute<{ week: string; completed: number }>(sql`
      with weeks as (
        select generate_series(
          date_trunc('week', now() at time zone ${tz}) - interval '${sql.raw(String(WEEKS - 1))} weeks',
          date_trunc('week', now() at time zone ${tz}),
          interval '1 week'
        ) as week
      )
      select to_char(w.week, 'IYYY-"W"IW') as week, count(t.id)::int as completed
      from weeks w
      left join ${task} t
        on t.user_id = ${userId}
        and t.completed_at is not null
        and date_trunc('week', t.completed_at at time zone ${tz}) = w.week
      group by w.week order by w.week
    `),
    db
      .select({
        taskId: task.id,
        title: task.title,
        seconds: sql<number>`sum(${focusSession.durationSec})::int`,
      })
      .from(focusSession)
      .innerJoin(task, eq(task.id, focusSession.taskId))
      .where(
        and(
          eq(focusSession.userId, userId),
          eq(focusSession.kind, "focus"),
          sql`${focusSession.startedAt} > now() - interval '30 days'`,
        ),
      )
      .groupBy(task.id, task.title)
      .orderBy(sql`sum(${focusSession.durationSec}) desc`)
      .limit(5),
    db
      .select({
        focusSeconds: sql<number>`coalesce(sum(${focusSession.durationSec}) filter (where ${focusSession.kind} = 'focus'), 0)::int`,
        sessions: sql<number>`count(*) filter (where ${focusSession.kind} = 'focus')::int`,
      })
      .from(focusSession)
      .where(eq(focusSession.userId, userId)),
    db
      .select({
        open: sql<number>`count(*) filter (where ${task.completedAt} is null)::int`,
        done: sql<number>`count(*) filter (where ${task.completedAt} is not null)::int`,
      })
      .from(task)
      .where(eq(task.userId, userId)),
    db
      .select({ value: count() })
      .from(note)
      .where(and(eq(note.userId, userId), isNull(note.archivedAt))),
  ]);

  const dailyArr = [...daily.rows];
  const streaks = computeStreaks(dailyArr.map((d) => d.seconds > 0));

  return {
    daily: dailyArr,
    weekly: [...weekly.rows],
    topTasks,
    totals: {
      focusSeconds: totalsRow[0]?.focusSeconds ?? 0,
      sessions: totalsRow[0]?.sessions ?? 0,
      completedTasks: openTasks[0]?.done ?? 0,
      openTasks: openTasks[0]?.open ?? 0,
      notes: notes[0]?.value ?? 0,
      currentStreak: streaks.current,
      longestStreak: streaks.longest,
    },
  };
}
