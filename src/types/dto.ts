import type { z } from "zod";

import type {
  boardDto,
  boardSummaryDto,
  calendarTaskDto,
  columnDto,
  focusSessionDto,
  focusStatsDto,
  noteDto,
  noteSummaryDto,
  openTaskDto,
  searchHitDto,
  subtaskDto,
  taskDto,
} from "@/lib/schemas/dto";

/** Response shapes of the read API, inferred from the Zod contracts. */
export type ColumnDto = z.infer<typeof columnDto>;
export type SubtaskDto = z.infer<typeof subtaskDto>;
export type TaskDto = z.infer<typeof taskDto>;
export type BoardSummaryDto = z.infer<typeof boardSummaryDto>;
export type BoardDto = z.infer<typeof boardDto>;
export type NoteSummaryDto = z.infer<typeof noteSummaryDto>;
export type NoteDto = z.infer<typeof noteDto>;
export type SearchHitDto = z.infer<typeof searchHitDto>;
export type CalendarTaskDto = z.infer<typeof calendarTaskDto>;
export type OpenTaskDto = z.infer<typeof openTaskDto>;
export type FocusStatsDto = z.infer<typeof focusStatsDto>;
export type FocusSessionDto = z.infer<typeof focusSessionDto>;

export type NoteTagCount = { tag: string; count: number };
export type NotesResponse = { notes: NoteSummaryDto[]; tags: NoteTagCount[] };
