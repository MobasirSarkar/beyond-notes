import "server-only";

import webpush from "web-push";

import { env } from "@/env";

import {
  claimDueReminders,
  deletePushSubscriptionsByEndpoint,
  subscriptionsForUsers,
} from "./dal/push";

export const pushEnabled = Boolean(
  env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY && env.VAPID_SUBJECT,
);

let configured = false;
function configure() {
  if (configured || !pushEnabled) return;
  webpush.setVapidDetails(
    env.VAPID_SUBJECT ?? "",
    env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "",
    env.VAPID_PRIVATE_KEY ?? "",
  );
  configured = true;
}

export type PushPayload = {
  title: string;
  body: string;
  url: string;
  tag: string;
  /** ISO due date; the service worker formats it in the device locale. */
  dueAt: string | null;
};

/** Sends all due task reminders. Returns delivery counts for observability. */
export async function dispatchDueReminders(): Promise<{
  claimed: number;
  sent: number;
  pruned: number;
}> {
  const due = await claimDueReminders();
  if (due.length === 0 || !pushEnabled) return { claimed: due.length, sent: 0, pruned: 0 };
  configure();

  const subs = await subscriptionsForUsers([...new Set(due.map((d) => d.userId))]);
  const dead = new Set<string>();
  let sent = 0;

  await Promise.all(
    due.flatMap((reminder) =>
      subs
        .filter((s) => s.userId === reminder.userId)
        .map(async (s) => {
          const payload: PushPayload = {
            title: `⏰ ${reminder.title}`,
            body: "Task reminder",
            dueAt: reminder.dueAt?.toISOString() ?? null,
            url: `/boards/${reminder.boardId}?task=${reminder.taskId}`,
            tag: `task-${reminder.taskId}`,
          };
          try {
            await webpush.sendNotification(
              { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
              JSON.stringify(payload),
              { TTL: 60 * 60, urgency: "high" },
            );
            sent += 1;
          } catch (error: unknown) {
            const status =
              typeof error === "object" && error !== null && "statusCode" in error
                ? Number(error.statusCode)
                : 0;
            if (status === 404 || status === 410) dead.add(s.endpoint);
            else console.error("[push] delivery failed", status);
          }
        }),
    ),
  );

  await deletePushSubscriptionsByEndpoint([...dead]);
  return { claimed: due.length, sent, pruned: dead.size };
}
