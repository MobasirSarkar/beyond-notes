import type { Priority } from "./domain";

/** Task ids per column id, in display order. */
export type ColumnItems = Record<string, string[]>;

export type BoardFilters = {
  query: string;
  /** Minimum priority shown; `none` shows every task. */
  minPriority: Priority;
  label: string | null;
};
