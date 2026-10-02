import "server-only";

import { and, eq, inArray, isNull, lte, sql } from "drizzle-orm";

import type { DueReminder } from "@/types/api";
import type { PushSubscriptionData } from "@/types/input";

import { db } from "../db";
import { pushSubscription, task } from "../db/schema";

export async function savePushSubscription(
  userId: string,
  sub: PushSubscriptionData,
  userAgent: string | null,
): Promise<void> {
  await db
    .insert(pushSubscription)
    .values({
      userId,
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
      userAgent: userAgent?.slice(0, 256) ?? null,
    })
    .onConflictDoUpdate({
      target: pushSubscription.endpoint,
      set: { userId, p256dh: sub.keys.p256dh, auth: sub.keys.auth },
    });
}

export async function deletePushSubscription(userId: string, endpoint: string): Promise<void> {
  await db
    .delete(pushSubscription)
    .where(and(eq(pushSubscription.userId, userId), eq(pushSubscription.endpoint, endpoint)));
}

export async function deletePushSubscriptionsByEndpoint(endpoints: string[]): Promise<void> {
  if (endpoints.length === 0) return;
  await db.delete(pushSubscription).where(inArray(pushSubscription.endpoint, endpoints));
}

/**
 * Atomically claims up to `limit` due reminders (marks them sent) so concurrent
 * cron invocations never deliver the same reminder twice.
 */
export async function claimDueReminders(limit = 200): Promise<DueReminder[]> {
  return db.transaction(async (tx) => {
    const due = await tx
      .select({
        taskId: task.id,
        boardId: task.boardId,
        userId: task.userId,
        title: task.title,
        dueAt: task.dueAt,
      })
      .from(task)
      .where(
        and(lte(task.remindAt, new Date()), isNull(task.reminderSentAt), isNull(task.completedAt)),
      )
      .limit(limit)
      .for("update", { skipLocked: true });
    if (due.length === 0) return [];
    await tx
      .update(task)
      .set({ reminderSentAt: sql`now()` })
      .where(
        inArray(
          task.id,
          due.map((d) => d.taskId),
        ),
      );
    return due;
  });
}

export async function subscriptionsForUsers(userIds: string[]) {
  if (userIds.length === 0) return [];
  return db.select().from(pushSubscription).where(inArray(pushSubscription.userId, userIds));
}

export async function listPushEndpoints(userId: string): Promise<string[]> {
  const rows = await db
    .select({ endpoint: pushSubscription.endpoint })
    .from(pushSubscription)
    .where(eq(pushSubscription.userId, userId));
  return rows.map((r) => r.endpoint);
}
