"use client";

import { ArrowLeft, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useRef, useState } from "react";

import { MicButton } from "@/components/features/voice/mic-button";
import { Waveform } from "@/components/features/voice/waveform";
import { LabelInput } from "@/components/features/kanban/label-input";
import { Field } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { Listbox } from "@/components/ui/listbox";
import { Menu } from "@/components/ui/menu";
import { Segmented } from "@/components/ui/segmented";
import { Spinner } from "@/components/ui/spinner";
import { TimeAgo } from "@/components/ui/time-ago";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { useDeleteNote, useUpdateNote } from "@/lib/api/mutations";
import { useNote, useOpenTasks } from "@/lib/api/queries";
import { LIMITS } from "@/lib/schemas/input";
import { cn } from "@/lib/utils/cn";
import { plural } from "@/lib/utils/format";
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
        <Link
          href="/notes"
          className="inline-flex items-center gap-2 text-sm text-muted hover:text-fg"
        >
          <Icon icon={ArrowLeft} className="size-3.5" /> Notes
        </Link>
        <span className="ml-auto flex items-center gap-2 text-xs text-subtle" aria-live="polite">
          {saving ? (
            <>
              <Spinner label="Saving" /> Saving…
            </>
          ) : (
            <>
              Saved <TimeAgo date={note.updatedAt} />
            </>
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
            { value: "write", label: "Write" },
            { value: "split", label: "Split" },
            { value: "read", label: "Read" },
          ]}
        />
        <Menu
          label={<Icon icon={MoreHorizontal} />}
          ariaLabel="Note options"
          items={[
            {
              id: "pin",
              label: note.pinned ? "Unpin" : "Pin to top",
              onSelect: () => update.mutate({ noteId: note.id, pinned: !note.pinned }),
            },
            {
              id: "archive",
              label: note.archived ? "Unarchive" : "Archive",
              onSelect: () => update.mutate({ noteId: note.id, archived: !note.archived }),
            },
            {
              id: "delete",
              danger: true,
              label: "Delete note",
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
        placeholder="Untitled"
        maxLength={LIMITS.noteTitle}
        aria-label="Note title"
        className="w-full bg-transparent type-title outline-none placeholder:text-subtle"
      />

      <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_18rem]">
        <Field label="Tags" htmlFor={`${ids}-tags`}>
          <LabelInput
            id={`${ids}-tags`}
            value={note.tags}
            onChange={(tags) => update.mutate({ noteId: note.id, tags })}
          />
        </Field>
        <Field label="Linked task" htmlFor={`${ids}-task`}>
          <Listbox
            id={`${ids}-task`}
            value={note.taskId ?? ""}
            onChange={(v) => update.mutate({ noteId: note.id, taskId: v || null })}
            options={[
              { value: "", label: "None" },
              ...(openTasks.data ?? []).map((t) => ({
                value: t.id,
                label: t.title.slice(0, 80),
                hint: t.boardName,
              })),
            ]}
          />
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
          className="min-h-[60vh] resize-y rounded-panel glass p-6 font-mono text-sm leading-relaxed outline-none placeholder:text-subtle focus:rule-strong"
        />
        {view !== "write" ? (
          <section
            aria-label="Preview"
            className="min-h-[60vh] overflow-x-auto rounded-panel glass p-6 sm:p-8"
          >
            {content.trim() ? (
              <LazyMarkdown source={content} />
            ) : (
              <p className="text-sm text-subtle">Nothing to preview yet.</p>
            )}
          </section>
        ) : null}
      </div>

      <footer className="flex flex-wrap gap-x-6 gap-y-1 pt-3 text-xs text-subtle rule-t">
        <span className="type-numeric">{plural(wordCount(content), "word")}</span>
        <span className="type-numeric">{plural(content.length, "character")}</span>
        <span className="ml-auto">Markdown · saves automatically</span>
      </footer>
    </article>
  );
}
