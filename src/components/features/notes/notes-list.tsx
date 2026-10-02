"use client";

import { AnimatePresence, motion } from "motion/react";
import { FileText, Pin, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDeferredValue, useState } from "react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Segmented } from "@/components/ui/segmented";
import { Spinner } from "@/components/ui/spinner";
import { TagToggle } from "@/components/ui/tag";
import { TimeAgo } from "@/components/ui/time-ago";
import { useCreateNote, useUpdateNote } from "@/lib/api/mutations";
import { useNotes } from "@/lib/api/queries";
import { cn } from "@/lib/utils/cn";
import { plainExcerpt } from "@/lib/utils/markdown";

type Scope = "active" | "archived";

/** Notes as an `ls -l`-style listing: dense, scannable, keyboard friendly. */
export function NotesList() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [tag, setTag] = useState<string | undefined>(undefined);
  const [scope, setScope] = useState<Scope>("active");
  const deferredQ = useDeferredValue(q.trim());
  const notes = useNotes({
    ...(deferredQ ? { q: deferredQ } : {}),
    ...(tag ? { tag } : {}),
    ...(scope === "archived" ? { archived: true } : {}),
  });
  const create = useCreateNote();
  const update = useUpdateNote();

  const newNote = () =>
    create.mutate(
      { id: crypto.randomUUID(), title: "", ...(tag ? { tags: [tag] } : {}) },
      { onSuccess: (n) => router.push(`/notes/${n.id}`) },
    );

  const list = notes.data?.notes ?? [];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="library"
        title="notes"
        description={
          notes.data ? `${list.length} ${scope} note${list.length === 1 ? "" : "s"}` : " "
        }
        actions={
          <Button variant="solid" onClick={newNote} disabled={create.isPending}>
            <Icon icon={Plus} /> new note
          </Button>
        }
        className="mb-0"
      />

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <Input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="full-text search"
            maxLength={120}
            aria-label="Search notes"
            className="w-full sm:w-72"
          />
          <Segmented
            label="Note scope"
            size="sm"
            value={scope}
            onChange={setScope}
            options={[
              { value: "active", label: "active" },
              { value: "archived", label: "archived" },
            ]}
          />
          {notes.isFetching ? <Spinner className="text-muted" label="Loading notes" /> : null}
        </div>
        {notes.data?.tags.length ? (
          <div className="flex flex-wrap gap-1" aria-label="Filter by tag">
            {notes.data.tags.map((t) => (
              <TagToggle
                key={t.tag}
                active={tag === t.tag}
                onClick={() => setTag(tag === t.tag ? undefined : t.tag)}
              >
                #{t.tag} <span className="opacity-60">{t.count}</span>
              </TagToggle>
            ))}
          </div>
        ) : null}
      </div>

      {notes.isPending ? (
        <p className="text-sm text-muted">
          <Spinner /> reading notes…
        </p>
      ) : list.length === 0 ? (
        <EmptyState
          title={q || tag ? "No notes match" : "No notes yet"}
          action={
            q || tag ? null : (
              <Button onClick={newNote} size="sm">
                write the first one (n)
              </Button>
            )
          }
        >
          {q || tag
            ? "Try a different search or clear the tag filter."
            : "Notes support Markdown, tags and dictation."}
        </EmptyState>
      ) : (
        <ul className="overflow-hidden rounded-panel glass [&>li+li]:rule-t">
          <li
            aria-hidden
            className="hidden grid-cols-[1rem_minmax(0,16rem)_minmax(0,1fr)_8rem] gap-4 px-5 py-3 label md:grid"
          >
            <span />
            <span>name</span>
            <span>excerpt</span>
            <span className="text-right">modified</span>
          </li>
          <AnimatePresence initial={false}>
            {list.map((n) => (
              <motion.li
                key={n.id}
                layout="position"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="group relative"
              >
                <Link
                  href={`/notes/${n.id}`}
                  className="grid grid-cols-[1rem_minmax(0,1fr)] gap-x-4 gap-y-1 px-5 py-3.5 transition-colors duration-(--dur-1) hover:bg-surface-2/50 md:grid-cols-[1rem_minmax(0,16rem)_minmax(0,1fr)_8rem] md:items-center"
                >
                  <Icon icon={n.pinned ? Pin : FileText} className="size-3.5 text-subtle" />
                  <span className="truncate text-sm font-medium">{n.title || "untitled"}</span>
                  <span className="col-start-2 truncate text-xs text-muted md:col-start-auto md:text-sm">
                    {n.tags.length > 0 ? (
                      <span className="mr-3 text-subtle">
                        {n.tags.map((t) => `#${t}`).join(" ")}
                      </span>
                    ) : null}
                    {plainExcerpt(n.excerpt) || "—"}
                  </span>
                  <span className="col-start-2 text-xs text-subtle md:col-start-auto md:text-right">
                    <TimeAgo date={n.updatedAt} />
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={() => update.mutate({ noteId: n.id, pinned: !n.pinned })}
                  aria-label={n.pinned ? `Unpin ${n.title || "note"}` : `Pin ${n.title || "note"}`}
                  className={cn(
                    "absolute top-2 right-2 h-7 px-2 text-xs text-muted hover:text-fg focus-visible:opacity-100 md:top-1/2 md:right-36 md:-translate-y-1/2",
                    "opacity-0 group-hover:opacity-100",
                  )}
                >
                  {n.pinned ? "unpin" : "pin"}
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}
