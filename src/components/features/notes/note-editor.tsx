"use client";

import { formatDistanceToNowStrict } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useRef, useState } from "react";

import { MicButton } from "@/components/features/voice/mic-button";
import { Waveform } from "@/components/features/voice/waveform";
import { LabelInput } from "@/components/features/kanban/label-input";
import { Field } from "@/components/ui/field";
import { Select } from "@/components/ui/input";
import { Menu } from "@/components/ui/menu";
import { Segmented } from "@/components/ui/segmented";
import { Spinner } from "@/components/ui/spinner";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { useDeleteNote, useUpdateNote } from "@/lib/api/mutations";
import { useNote, useOpenTasks } from "@/lib/api/queries";
import { LIMITS } from "@/lib/schemas/input";
import { cn } from "@/lib/utils/cn";
import { wordCount } from "@/lib/utils/markdown";
import type { NoteDto } from "@/types/dto";

import { LazyMarkdown } from "./lazy-markdown";
import { useAutosave } from "./use-autosave";

type View = "write" | "split" | "read";

export function NoteEditor({ initial }: { initial: NoteDto }) {
  const ids = useId();
  const router = useRouter();
  const { data: note = initial } = useNote(initial.id, initial);
  const update = useUpdateNote();
  const del = useDeleteNote();
  const openTasks = useOpenTasks();

  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [view, setView] = useState<View>("split");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { dirty, markDirty } = useAutosave({ title, content }, (v) =>
    update.mutate({ noteId: note.id, title: v.title, content: v.content }),
  );

  /** Inserts dictated text at the caret position. */
  const insertAtCursor = (text: string) => {
    const el = textareaRef.current;
    const pos = el ? el.selectionStart : content.length;
    const before = content.slice(0, pos);
    const glue = before && !/\s$/.test(before) ? " " : "";
    setContent(`${before}${glue}${text}${content.slice(pos)}`.slice(0, LIMITS.noteContent));
    markDirty();
    requestAnimationFrame(() => {
      const caret = before.length + glue.length + text.length;
      el?.setSelectionRange(caret, caret);
    });
  };
  const speech = useSpeechRecognition({ continuous: true, onFinal: insertAtCursor });

  const saving = update.isPending || dirty;

  return (
    <article className="flex flex-col gap-6">
      <nav className="flex flex-wrap items-center gap-3" aria-label="Note toolbar">
        <Link href="/notes" className="text-sm text-muted hover:text-fg">
          ← notes
        </Link>
        <span className="ml-auto flex items-center gap-2 text-xs text-subtle" aria-live="polite">
          {saving ? (
            <>
              <Spinner label="Saving" /> saving
            </>
          ) : (
            `saved ${formatDistanceToNowStrict(new Date(note.updatedAt), { addSuffix: true })}`
          )}
        </span>
        <MicButton
          size="sm"
          listening={speech.listening}
          supported={speech.supported}
          onClick={speech.toggle}
        />
        <Segmented
          label="View mode"
          size="sm"
          value={view}
          onChange={setView}
          options={[
            { value: "write", label: "write" },
            { value: "split", label: "split" },
            { value: "read", label: "read" },
          ]}
        />
        <Menu
          label="⋯"
          ariaLabel="Note options"
          items={[
            {
              id: "pin",
              label: note.pinned ? "unpin" : "pin to top",
              onSelect: () => update.mutate({ noteId: note.id, pinned: !note.pinned }),
            },
            {
              id: "archive",
              label: note.archived ? "unarchive" : "archive",
              onSelect: () => update.mutate({ noteId: note.id, archived: !note.archived }),
            },
            {
              id: "delete",
              danger: true,
              label: "delete note",
              onSelect: () =>
                del.mutate({ noteId: note.id }, { onSuccess: () => router.push("/notes") }),
            },
          ]}
        />
      </nav>

      <input
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
          markDirty();
        }}
        placeholder="untitled"
        maxLength={LIMITS.noteTitle}
        aria-label="Note title"
        className="w-full bg-transparent heading text-display outline-none placeholder:text-subtle"
      />

      <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_18rem]">
        <Field label="tags" htmlFor={`${ids}-tags`}>
          <LabelInput
            id={`${ids}-tags`}
            value={note.tags}
            onChange={(tags) => update.mutate({ noteId: note.id, tags })}
          />
        </Field>
        <Field label="linked task" htmlFor={`${ids}-task`}>
          <Select
            id={`${ids}-task`}
            value={note.taskId ?? ""}
            onChange={(e) => update.mutate({ noteId: note.id, taskId: e.target.value || null })}
          >
            <option value="">none</option>
            {openTasks.data?.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title.slice(0, 60)}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      {speech.listening || speech.interim || speech.error ? (
        <p className="flex items-center gap-3 text-sm text-muted">
          <Waveform active={speech.listening} />
          <span className="truncate">
            {speech.error ?? (speech.interim || "listening · dictation inserts at the cursor")}
          </span>
        </p>
      ) : null}

      <div className={cn("grid gap-4", view === "split" && "lg:grid-cols-2")}>
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            markDirty();
          }}
          hidden={view === "read"}
          maxLength={LIMITS.noteContent}
          spellCheck
          placeholder={"# start writing\n\n- markdown supported\n- [ ] checklists too"}
          aria-label="Note content (Markdown)"
          className="min-h-[60vh] resize-y bg-bg p-5 text-sm leading-relaxed outline-none hairline placeholder:text-subtle focus:rule-strong"
        />
        {view !== "write" ? (
          <section
            aria-label="Preview"
            className="min-h-[60vh] overflow-x-auto bg-surface p-5 hairline sm:p-8"
          >
            {content.trim() ? (
              <LazyMarkdown source={content} />
            ) : (
              <p className="text-sm text-subtle">nothing to preview</p>
            )}
          </section>
        ) : null}
      </div>

      <footer className="flex flex-wrap gap-x-6 gap-y-1 pt-3 text-xs text-subtle rule-t">
        <span>-- {view === "read" ? "read" : "insert"} --</span>
        <span>{wordCount(content)} words</span>
        <span>{content.length} chars</span>
        <span className="ml-auto">markdown · autosave</span>
      </footer>
    </article>
  );
}
