import "server-only";

import { keysAfter } from "@/lib/position";

import { db } from "../db";
import { board, boardColumn, note, task } from "../db/schema";

const WELCOME = `# Welcome to Beyond Notes

\`\`\`
 ____  _____ __   __ ___  _   _ ____
| __ )| ____|\\ \\ / // _ \\| \\ | |  _ \\
|  _ \\|  _|   \\ V /| | | |  \\| | | | |
| |_) | |___   | | | |_| | |\\  | |_| |
|____/|_____|  |_|  \\___/|_| \\_|____/
\`\`\`

A few things to try:

- Press **⌘K** / **Ctrl+K** for the command palette
- Press **t** to quick-capture a task (try the mic: *"fix login tomorrow 5pm urgent #auth"*)
- Press **?** to see every keyboard shortcut
- Drag cards between columns on your board
- Start a focus session from any task

Notes support **Markdown**, tags and voice dictation.
`;

/** Creates the starter board, columns and a welcome note for a new account. */
export async function seedWorkspace(userId: string): Promise<void> {
  await db.transaction(async (tx) => {
    const [b] = await tx
      .insert(board)
      .values({ userId, name: "Main Quest", position: keysAfter(null, 1)[0] ?? "a0" })
      .returning({ id: board.id });
    if (!b) return;

    const colNames = ["Backlog", "To Do", "Doing", "Done"] as const;
    const positions = keysAfter(null, colNames.length);
    const cols = await tx
      .insert(boardColumn)
      .values(
        colNames.map((name, i) => ({
          userId,
          boardId: b.id,
          name,
          position: positions[i] ?? `a${i}`,
          wipLimit: name === "Doing" ? 3 : null,
          isDone: name === "Done",
        })),
      )
      .returning({ id: boardColumn.id, name: boardColumn.name });

    const todo = cols.find((c) => c.name === "To Do");
    const backlog = cols.find((c) => c.name === "Backlog");
    if (todo && backlog) {
      const [p1, p2] = keysAfter(null, 2);
      await tx.insert(task).values([
        {
          userId,
          boardId: b.id,
          columnId: todo.id,
          title: "Drag me to Doing →",
          description:
            "Cards can be dragged with the mouse, touch or keyboard (space to lift, arrows to move).",
          priority: "medium",
          labels: ["tutorial"],
          position: p1 ?? "a0",
        },
        {
          userId,
          boardId: b.id,
          columnId: backlog.id,
          title: "Try voice capture with the mic button",
          priority: "low",
          labels: ["tutorial", "voice"],
          position: p2 ?? "a1",
        },
      ]);
    }

    await tx.insert(note).values({
      userId,
      title: "README.txt",
      content: WELCOME,
      tags: ["welcome"],
      pinned: true,
    });
  });
}
