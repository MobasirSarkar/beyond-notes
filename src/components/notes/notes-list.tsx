"use client";

import { formatDistanceToNowStrict } from "date-fns";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDeferredValue, useState } from "react";

import { AsciiSpinner } from "@/components/ascii/ascii-spinner";
import { PixelButton } from "@/components/ascii/pixel-button";
import { ScrambleText } from "@/components/ascii/scramble-text";
import { cn } from "@/lib/cn";
import { useCreateNote, useUpdateNote } from "@/lib/mutations";
import { useNotes } from "@/lib/queries";

/** Strips the most common Markdown syntax for plain-text excerpts. */
function plain(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[#>*_`~[\]()!-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function NotesList() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [tag, setTag] = useState<string | undefined>(undefined);
  const [archived, setArchived] = useState(false);
  const deferredQ = useDeferredValue(q.trim());
  const notes = useNotes({
    ...(deferredQ ? { q: deferredQ } : {}),
    ...(tag ? { tag } : {}),
    ...(archived ? { archived } : {}),
  });
  const create = useCreateNote();
  const update = useUpdateNote();

  const newNote = () =>
    create.mutate(
      { id: crypto.randomUUID(), title: "", ...(tag ? { tags: [tag] } : {}) },
      { onSuccess: (n) => router.push(`/notes/${n.id}`) },
    );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="term glow text-4xl uppercase">
          <span className="text-muted" aria-hidden>
            &gt;{" "}
          </span>
          <ScrambleText text={archived ? "archive" : "notes"} />
        </h1>
        {notes.isFetching ? <AsciiSpinner className="term text-2xl text-accent" /> : null}
        <div className="ml-auto flex gap-2">
          <PixelButton size="sm" aria-pressed={archived} onClick={() => setArchived((a) => !a)}>
            {archived ? "◂ active" : "archive ▸"}
          </PixelButton>
          <PixelButton variant="primary" onClick={newNote} disabled={create.isPending}>
            + new note
          </PixelButton>
        </div>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-start">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="/ full-text search notes"
          maxLength={120}
          className="px-input md:w-80"
          aria-label="Search notes"
        />
        <div className="flex flex-wrap gap-1" aria-label="Filter by tag">
          {notes.data?.tags.map((t) => (
            <button
              key={t.tag}
              type="button"
              aria-pressed={tag === t.tag}
              onClick={() => setTag(tag === t.tag ? undefined : t.tag)}
              className={cn("px-tag", tag === t.tag ? "bg-accent text-accent-fg" : "text-accent")}
            >
              #{t.tag} <span className="ml-1 opacity-60">{t.count}</span>
            </button>
          ))}
        </div>
      </div>

      {notes.isPending ? (
        <p className="term text-2xl text-fg-dim">
          <AsciiSpinner /> reading disk…
        </p>
      ) : notes.data?.notes.length === 0 ? (
        <div className="px-panel term p-10 text-center text-2xl text-muted">
          <pre className="mb-4 inline-block text-left font-mono text-sm leading-tight">{` _______
|       |
| EMPTY |
|_______|`}</pre>
          <p>{q || tag ? "no notes match." : "no notes yet. press n to write one."}</p>
        </div>
      ) : (
        <motion.ul layout className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence initial={false}>
            {notes.data?.notes.map((n, i) => (
              <motion.li
                key={n.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0, transition: { delay: Math.min(i, 12) * 0.025 } }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="group relative"
              >
                <Link
                  href={`/notes/${n.id}`}
                  className="px-panel flex h-full flex-col gap-2 p-4 transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5"
                >
                  <h2 className="term truncate pr-8 text-2xl">
                    {n.pinned ? <span className="text-accent">▲ </span> : null}
                    {n.title || <span className="text-muted">untitled</span>}
                  </h2>
                  <p className="line-clamp-4 text-sm text-fg-dim">{plain(n.excerpt) || "…"}</p>
                  <div className="mt-auto flex flex-wrap items-center gap-1 pt-2">
                    {n.tags.map((t) => (
                      <span key={t} className="px-tag text-accent">
                        #{t}
                      </span>
                    ))}
                    <span className="term ml-auto text-base text-muted">
                      {formatDistanceToNowStrict(new Date(n.updatedAt), { addSuffix: true })}
                    </span>
                  </div>
                </Link>
                <button
                  type="button"
                  onClick={() => update.mutate({ noteId: n.id, pinned: !n.pinned })}
                  aria-label={n.pinned ? "Unpin note" : "Pin note"}
                  className="term absolute top-3 right-3 text-xl text-muted opacity-0 group-hover:opacity-100 hover:text-accent focus:opacity-100"
                >
                  {n.pinned ? "▲" : "△"}
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
      )}
    </div>
  );
}
