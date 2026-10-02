import { relations, sql, type SQL } from "drizzle-orm";
import {
  bigint,
  boolean,
  customType,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

const tsvector = customType<{ data: string }>({
  dataType() {
    return "tsvector";
  },
});

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

/* -------------------------------------------------------------------------- */
/*                       better-auth tables (core schema)                     */
/* -------------------------------------------------------------------------- */

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  ...timestamps,
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull().unique(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (t) => [index("session_user_idx").on(t.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
    scope: text("scope"),
    password: text("password"),
    ...timestamps,
  },
  (t) => [index("account_user_idx").on(t.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ...timestamps,
  },
  (t) => [index("verification_identifier_idx").on(t.identifier)],
);

export const rateLimit = pgTable("rate_limit", {
  id: text("id").primaryKey(),
  key: text("key").notNull().unique(),
  count: integer("count").notNull(),
  lastRequest: bigint("last_request", { mode: "number" }).notNull(),
});

/* -------------------------------------------------------------------------- */
/*                                 App domain                                 */
/* -------------------------------------------------------------------------- */

export const priorityEnum = pgEnum("task_priority", ["none", "low", "medium", "high", "urgent"]);
export const focusKindEnum = pgEnum("focus_kind", ["focus", "short_break", "long_break"]);

const ownerId = () =>
  text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" });

export const board = pgTable(
  "board",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: ownerId(),
    name: text("name").notNull(),
    position: text("position").notNull(),
    ...timestamps,
  },
  (t) => [index("board_user_idx").on(t.userId)],
);

export const boardColumn = pgTable(
  "board_column",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: ownerId(),
    boardId: uuid("board_id")
      .notNull()
      .references(() => board.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    position: text("position").notNull(),
    wipLimit: integer("wip_limit"),
    /** Tasks entering a "done" column are marked completed. */
    isDone: boolean("is_done").notNull().default(false),
    ...timestamps,
  },
  (t) => [index("column_board_idx").on(t.userId, t.boardId)],
);

export const task = pgTable(
  "task",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: ownerId(),
    boardId: uuid("board_id")
      .notNull()
      .references(() => board.id, { onDelete: "cascade" }),
    columnId: uuid("column_id")
      .notNull()
      .references(() => boardColumn.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    priority: priorityEnum("priority").notNull().default("none"),
    labels: text("labels")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    position: text("position").notNull(),
    estimate: integer("estimate"),
    dueAt: timestamp("due_at", { withTimezone: true }),
    remindAt: timestamp("remind_at", { withTimezone: true }),
    reminderSentAt: timestamp("reminder_sent_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    ...timestamps,
    search: tsvector("search").generatedAlwaysAs(
      (): SQL =>
        sql`setweight(to_tsvector('simple', coalesce(${task.title}, '')), 'A') || setweight(to_tsvector('simple', coalesce(${task.description}, '')), 'B')`,
    ),
  },
  (t) => [
    index("task_column_idx").on(t.userId, t.columnId),
    index("task_board_idx").on(t.userId, t.boardId),
    index("task_due_idx").on(t.userId, t.dueAt),
    index("task_remind_idx")
      .on(t.remindAt)
      .where(sql`${t.reminderSentAt} is null and ${t.completedAt} is null`),
    index("task_search_idx").using("gin", t.search),
  ],
);

export const subtask = pgTable(
  "subtask",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: ownerId(),
    taskId: uuid("task_id")
      .notNull()
      .references(() => task.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    done: boolean("done").notNull().default(false),
    position: text("position").notNull(),
    ...timestamps,
  },
  (t) => [index("subtask_task_idx").on(t.userId, t.taskId)],
);

export const note = pgTable(
  "note",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: ownerId(),
    title: text("title").notNull().default(""),
    content: text("content").notNull().default(""),
    tags: text("tags")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    pinned: boolean("pinned").notNull().default(false),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    taskId: uuid("task_id").references(() => task.id, { onDelete: "set null" }),
    ...timestamps,
    search: tsvector("search").generatedAlwaysAs(
      (): SQL =>
        sql`setweight(to_tsvector('simple', coalesce(${note.title}, '')), 'A') || setweight(to_tsvector('simple', coalesce(${note.content}, '')), 'B')`,
    ),
  },
  (t) => [
    index("note_user_idx").on(t.userId, t.updatedAt),
    index("note_search_idx").using("gin", t.search),
    index("note_tags_idx").using("gin", t.tags),
  ],
);

export const focusSession = pgTable(
  "focus_session",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: ownerId(),
    taskId: uuid("task_id").references(() => task.id, { onDelete: "set null" }),
    kind: focusKindEnum("kind").notNull().default("focus"),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
    endedAt: timestamp("ended_at", { withTimezone: true }).notNull(),
    durationSec: integer("duration_sec").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("focus_user_started_idx").on(t.userId, t.startedAt)],
);

export const pushSubscription = pgTable(
  "push_subscription",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: ownerId(),
    endpoint: text("endpoint").notNull(),
    p256dh: text("p256dh").notNull(),
    auth: text("auth").notNull(),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("push_endpoint_uq").on(t.endpoint), index("push_user_idx").on(t.userId)],
);

/* -------------------------------------------------------------------------- */
/*                                  Relations                                 */
/* -------------------------------------------------------------------------- */

export const boardRelations = relations(board, ({ many }) => ({
  columns: many(boardColumn),
  tasks: many(task),
}));

export const columnRelations = relations(boardColumn, ({ one, many }) => ({
  board: one(board, { fields: [boardColumn.boardId], references: [board.id] }),
  tasks: many(task),
}));

export const taskRelations = relations(task, ({ one, many }) => ({
  board: one(board, { fields: [task.boardId], references: [board.id] }),
  column: one(boardColumn, { fields: [task.columnId], references: [boardColumn.id] }),
  subtasks: many(subtask),
}));

export const subtaskRelations = relations(subtask, ({ one }) => ({
  task: one(task, { fields: [subtask.taskId], references: [task.id] }),
}));

export type Priority = (typeof priorityEnum.enumValues)[number];
export type FocusKind = (typeof focusKindEnum.enumValues)[number];
