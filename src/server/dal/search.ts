import "server-only";

import { sql } from "drizzle-orm";

import type { SearchHitDto } from "@/types/dto";

import { db } from "../db";
import { note, task } from "../db/schema";
import { toPrefixTsQuery } from "./util";

/**
 * Full-text search across tasks and notes for the command palette.
 * Highlights use non-HTML sentinels (« ») so the client renders them safely.
 */
export async function searchEverything(userId: string, q: string): Promise<SearchHitDto[]> {
  const tsq = toPrefixTsQuery(q);
  if (!tsq) return [];
  const opts = "StartSel=«, StopSel=», MaxWords=14, MinWords=4, MaxFragments=1";

  const rows = await db.execute<{
    kind: "task" | "note";
    id: string;
    title: string;
    snippet: string;
    board_id: string | null;
    rank: number;
  }>(sql`
    (
      select 'task' as kind, ${task.id} as id, ${task.title} as title,
        ts_headline('simple', ${task.title} || ' ' || ${task.description}, to_tsquery('simple', ${tsq}), ${opts}) as snippet,
        ${task.boardId} as board_id,
        ts_rank(${task.search}, to_tsquery('simple', ${tsq})) as rank
      from ${task}
      where ${task.userId} = ${userId} and ${task.search} @@ to_tsquery('simple', ${tsq})
      order by rank desc limit 12
    )
    union all
    (
      select 'note' as kind, ${note.id} as id, ${note.title} as title,
        ts_headline('simple', ${note.title} || ' ' || left(${note.content}, 20000), to_tsquery('simple', ${tsq}), ${opts}) as snippet,
        null as board_id,
        ts_rank(${note.search}, to_tsquery('simple', ${tsq})) as rank
      from ${note}
      where ${note.userId} = ${userId} and ${note.archivedAt} is null and ${note.search} @@ to_tsquery('simple', ${tsq})
      order by rank desc limit 12
    )
    order by rank desc limit 20
  `);

  return rows.map((r) => ({
    kind: r.kind,
    id: r.id,
    title: r.title,
    snippet: r.snippet,
    boardId: r.board_id,
  }));
}
