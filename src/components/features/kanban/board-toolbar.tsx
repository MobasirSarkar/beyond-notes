"use client";

import { Input } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";
import { TagToggle } from "@/components/ui/tag";
import { PRIORITY_META } from "@/lib/constants/priority";
import { PRIORITIES } from "@/lib/schemas/input";
import type { BoardFilters, PriorityFilter } from "@/types/kanban";
import type { SegmentOption } from "@/types/ui";

const PRIORITY_OPTIONS: readonly SegmentOption<PriorityFilter>[] = [
  { value: "all", label: "all" },
  ...PRIORITIES.map((p) => ({ value: p, label: PRIORITY_META[p].glyph })),
];

type Props = {
  filters: BoardFilters;
  labels: readonly string[];
  onChange: (patch: Partial<BoardFilters>) => void;
};

export function BoardToolbar({ filters, labels, onChange }: Props) {
  const active =
    filters.query.trim() !== "" || filters.priority !== "all" || filters.label !== null;
  return (
    <div role="search" aria-label="Filter tasks" className="flex flex-wrap items-center gap-3">
      <Input
        type="search"
        value={filters.query}
        onChange={(e) => onChange({ query: e.target.value })}
        placeholder="filter cards"
        maxLength={120}
        aria-label="Filter by text"
        className="w-full sm:w-56"
      />
      <Segmented
        label="Filter by priority"
        size="sm"
        value={filters.priority}
        options={PRIORITY_OPTIONS}
        onChange={(priority) => onChange({ priority })}
      />
      {labels.length > 0 ? (
        <div className="flex flex-wrap gap-1" aria-label="Filter by label">
          {labels.map((l) => (
            <TagToggle
              key={l}
              active={filters.label === l}
              onClick={() => onChange({ label: filters.label === l ? null : l })}
            >
              #{l}
            </TagToggle>
          ))}
        </div>
      ) : null}
      {active ? (
        <button
          type="button"
          className="text-xs text-muted underline decoration-dotted underline-offset-4 hover:text-fg"
          onClick={() => onChange({ query: "", priority: "all", label: null })}
        >
          clear filters
        </button>
      ) : null}
    </div>
  );
}
