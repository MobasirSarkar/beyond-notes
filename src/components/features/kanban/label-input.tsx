"use client";

import { X } from "lucide-react";
import { useState } from "react";

import { Icon } from "@/components/ui/icon";
import { labelsSchema } from "@/lib/schemas/input";

type Props = {
  value: string[];
  onChange: (labels: string[]) => void;
  placeholder?: string;
  id?: string;
};

/** Token input for tags: Enter/comma adds, Backspace removes the last one. */
export function LabelInput({ value, onChange, placeholder = "Add a tag", id }: Props) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  const add = () => {
    const parsed = labelsSchema.safeParse([...value, ...draft.split(/[,\s]+/).filter(Boolean)]);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid tag.");
      return;
    }
    setError(null);
    setDraft("");
    onChange(parsed.data);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex min-h-9 flex-wrap items-center gap-1.5 rounded-control lift px-2 py-1 focus-within:rule-strong">
        {value.map((l) => (
          <span
            key={l}
            className="flex h-6 items-center gap-1 rounded-full bg-surface-2 px-2 text-xs"
          >
            #{l}
            <button
              type="button"
              aria-label={`Remove ${l}`}
              className="flex items-center text-subtle hover:text-fg"
              onClick={() => onChange(value.filter((x) => x !== l))}
            >
              <Icon icon={X} className="size-3" />
            </button>
          </span>
        ))}
        <input
          id={id}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if ((e.key === "Enter" || e.key === ",") && draft.trim()) {
              e.preventDefault();
              add();
            } else if (e.key === "Backspace" && !draft && value.length > 0) {
              onChange(value.slice(0, -1));
            }
          }}
          onBlur={() => draft.trim() && add()}
          placeholder={value.length === 0 ? placeholder : ""}
          maxLength={24}
          className="h-7 min-w-24 flex-1 bg-transparent text-sm outline-none placeholder:text-subtle"
        />
      </div>
      {error ? <p className="type-caption text-fg">{error}</p> : null}
    </div>
  );
}
