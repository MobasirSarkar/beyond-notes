"use client";

import { Input } from "@/components/ui/input";
import { StepSlider } from "@/components/ui/step-slider";
import { TagToggle } from "@/components/ui/tag";
import { PRIORITY_STEPS_AT_LEAST } from "@/lib/constants/priority";
import type { BoardFilters } from "@/types/kanban";

type Props = {
  filters: BoardFilters;
  labels: readonly string[];
  onChange: (patch: Partial<BoardFilters>) => void;
};

export function BoardToolbar({ filters, labels, onChange }: Props) {
  const active =
    filters.query.trim() !== "" || filters.minPriority !== "none" || filters.label !== null;
  return (
    <div
      role="search"
      aria-label="Filter tasks"
      className="flex flex-wrap items-center gap-x-5 gap-y-3"
    >
      <Input
        type="search"
        value={filters.query}
        onChange={(e) => onChange({ query: e.target.value })}
        placeholder="filter cards"
        maxLength={120}
        aria-label="Filter by text"
        className="w-full sm:w-56"
      />
      <StepSlider
        layout="inline"
        label="priority"
        value={filters.minPriority}
        steps={PRIORITY_STEPS_AT_LEAST}
        onChange={(minPriority) => onChange({ minPriority })}
        className="w-full sm:w-80"
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
          onClick={() => onChange({ query: "", minPriority: "none", label: null })}
        >
          clear filters
        </button>
      ) : null}
    </div>
  );
}
