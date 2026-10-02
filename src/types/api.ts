/** Minimal structural view of a next-safe-action result. */
export type SafeResultLike = {
  data?: unknown;
  serverError?: unknown;
  validationErrors?: unknown;
};

/** Payload the server sends through Web Push and the service worker renders. */
export type PushPayload = {
  title: string;
  body: string;
  url: string;
  tag: string;
  /** ISO due date; formatted on the device in its own locale. */
  dueAt: string | null;
};

export type DueReminder = {
  taskId: string;
  boardId: string;
  userId: string;
  title: string;
  dueAt: Date | null;
};

export type ReminderDispatchResult = { claimed: number; sent: number; pruned: number };
