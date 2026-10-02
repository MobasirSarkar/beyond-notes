"use client";

import { useState } from "react";

import { labelsSchema } from "@/lib/validation";

export function LabelInput({
  value,
  onChange,
  placeholder = "add tag ↵",
}: {
  value: string[];
  onChange: (labels: string[]) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  const add = () => {
    const parsed = labelsSchema.safeParse([...value, ...draft.split(/[,\s]+/).filter(Boolean)]);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid tag");
      return;
    }
    setError(null);
    setDraft("");
    onChange(parsed.data);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-1 border-2 border-line bg-bg p-1">
        {value.map((l) => (
          <span key={l} className="px-tag text-accent-2">
            #{l}
            <button
              type="button"
              aria-label={`Remove ${l}`}
              className="ml-1 hover:text-danger"
              onClick={() => onChange(value.filter((x) => x !== l))}
            >
              x
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              if (draft.trim()) add();
            } else if (e.key === "Backspace" && !draft && value.length > 0) {
              onChange(value.slice(0, -1));
            }
          }}
          onBlur={() => draft.trim() && add()}
          placeholder={placeholder}
          maxLength={24}
          className="min-w-24 flex-1 bg-transparent px-1 outline-none placeholder:text-muted"
        />
      </div>
      {error ? <p className="term text-base text-danger">! {error}</p> : null}
    </div>
  );
}
