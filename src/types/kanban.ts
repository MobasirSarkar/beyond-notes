import type { Priority } from "./domain";

/** Task ids per column id, in display order. */
export type ColumnItems = Record<string, string[]>;

export type PriorityFilter = Priority | "all";

export type BoardFilters = {
  query: string;
  priority: PriorityFilter;
  label: string | null;
};
