"use client";

import { formatDistanceToNowStrict } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { AsciiSpinner } from "@/components/ascii/ascii-spinner";
import { ConfirmButton } from "@/components/ascii/confirm-button";
import { PixelButton } from "@/components/ascii/pixel-button";
import { LabelInput } from "@/components/kanban/label-input";
import { MicButton, Waveform } from "@/components/voice/mic-button";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { cn } from "@/lib/cn";
import type { NoteDto } from "@/lib/dto";
import { useDeleteNote, useUpdateNote } from "@/lib/mutations";
import { useNote, useOpenTasks } from "@/lib/queries";
import { LIMITS } from "@/lib/validation";

import { Markdown } from "./markdown";

const AUTOSAVE_MS = 700;
type View = "split" | "edit" | "preview";

export function NoteEditor({ initial }: { initial: NoteDto }) {
  const router = useRouter();
  const { data: note = initial } = useNote(initial.id, initial);
  const update = useUpdateNote();
  const del = useDeleteNote();
  const openTasks = useOpenTasks();

  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [view, setView] = useState<View>("split");
  const [dirty, setDirty] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const latest = useRef({ title, content });

  useEffect(() => {
    latest.current = { title, content };
  }, [title, content]);

  // Debounced autosave.
  const { mutate } = update;
  useEffect(() => {
    if (!dirty) return;
    const t = window.setTimeout(() => {
      mutate({ noteId: note.id, title: latest.current.title, content: latest.current.content });
      setDirty(false);
    }, AUTOSAVE_MS);
    return () => window.clearTimeout(t);
  }, [dirty, title, content, mutate, note.id]);

  // Flush pending edits when leaving the page.
  const dirtyRef = useRef(dirty);
  useEffect(() => {
    dirtyRef.current = dirty;
  }, [dirty]);
  useEffect(() => {
    const flush = () => {
      if (dirtyRef.current) {
        mutate({ noteId: note.id, ...latest.current });
        dirtyRef.current = false;
      }
    };
    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, [mutate, note.id]);

  /** Inserts dictated text at the caret position. */
  const insertAtCursor = (text: string) => {
    const el = textareaRef.current;
    const current = latest.current.content;
    const pos = el ? el.selectionStart : current.length;
    const before = current.slice(0, pos);
    const after = current.slice(pos);
    const glue = before && !/\s$/.test(before) ? " " : "";
    const next = `${before}${glue}${text}${after}`.slice(0, LIMITS.noteContent);
    setContent(next);
    setDirty(true);
    requestAnimationFrame(() => {
      if (!el) return;
      const caret = before.length + glue.length + text.length;
      el.setSelectionRange(caret, caret);
    });
  };

  const speech = useSpeechRecognition({ continuous: true, onFinal: insertAtCursor });

  const words = content.trim() ? content.trim().split(/\s+/).length : 0;
  const saving = update.isPending || dirty;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Link href="/notes" className="term text-xl text-fg-dim hover:text-accent">
          ◂ notes
        </Link>
        <span className="term ml-auto text-lg text-muted" aria-live="polite">
          {saving ? (
            <>
              <AsciiSpinner /> saving
            </>
          ) : (
            <>saved {formatDistanceToNowStrict(new Date(note.updatedAt), { addSuffix: true })}</>
          )}
        </span>
        <MicButton
          listening={speech.listening}
          supported={speech.supported}
          onClick={speech.toggle}
        />
        <div className="flex border-2 border-line" role="group" aria-label="View mode">
          {(["edit", "split", "preview"] as const).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={view === v}
              onClick={() => setView(v)}
              className={cn(
                "term px-2 text-lg",
                view === v ? "bg-fg text-bg" : "hover:bg-bg-3",
                v === "split" && "hidden lg:block",
              )}
            >
              {v}
            </button>
          ))}
        </div>
        <PixelButton
          size="sm"
          aria-pressed={note.pinned}
          onClick={() => update.mutate({ noteId: note.id, pinned: !note.pinned })}
        >
          {note.pinned ? "▲ pinned" : "△ pin"}
        </PixelButton>
        <PixelButton
          size="sm"
          onClick={() => update.mutate({ noteId: note.id, archived: !note.archived })}
        >
          {note.archived ? "unarchive" : "archive"}
        </PixelButton>
        <ConfirmButton
          onConfirm={() =>
            del.mutate({ noteId: note.id }, { onSuccess: () => router.push("/notes") })
          }
        >
          delete
        </ConfirmButton>
      </div>

      <input
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
          setDirty(true);
        }}
        placeholder="untitled"
        maxLength={LIMITS.noteTitle}
        aria-label="Note title"
        className="term glow w-full bg-transparent text-4xl outline-none placeholder:text-muted"
      />

      <div className="flex flex-col gap-3 md:flex-row md:items-start">
        <div className="flex-1">
          <LabelInput
            value={note.tags}
            onChange={(tags) => update.mutate({ noteId: note.id, tags })}
            placeholder="add tag ↵"
          />
        </div>
        <label className="term flex items-center gap-2 text-lg">
          linked task
          <select
            value={note.taskId ?? ""}
            onChange={(e) => update.mutate({ noteId: note.id, taskId: e.target.value || null })}
            className="px-input w-56 py-0.5 font-mono text-sm"
          >
            <option value="">— none —</option>
            {openTasks.data?.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title.slice(0, 60)}
              </option>
            ))}
          </select>
        </label>
      </div>

      {speech.listening || speech.interim || speech.error ? (
        <div className="term flex items-center gap-3 text-lg text-danger">
          <Waveform active={speech.listening} />
          <span className="truncate">
            {speech.error ?? (speech.interim || "listening… dictation inserts at cursor")}
          </span>
        </div>
      ) : null}

      <div className={cn("grid gap-4", view === "split" && "lg:grid-cols-2")}>
        {view !== "preview" ? (
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              setDirty(true);
            }}
            maxLength={LIMITS.noteContent}
            spellCheck
            placeholder={"# start typing…\n\n- markdown supported\n- [ ] checklists too"}
            aria-label="Note content (Markdown)"
            className="px-input min-h-[60vh] resize-y font-mono leading-relaxed"
          />
        ) : null}
        {view !== "edit" ? (
          <article className="px-panel min-h-[60vh] overflow-x-auto p-5" aria-label="Preview">
            {content.trim() ? (
              <Markdown source={content} />
            ) : (
              <p className="text-muted">nothing to preview…</p>
            )}
          </article>
        ) : null}
      </div>

      <footer className="term flex gap-4 border-t-2 border-line pt-1 text-lg text-muted">
        <span>-- {view === "preview" ? "VIEW" : "INSERT"} --</span>
        <span>{words} words</span>
        <span>{content.length} chars</span>
        <span className="ml-auto">markdown · autosave</span>
      </footer>
    </div>
  );
}
