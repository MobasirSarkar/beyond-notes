"use client";

import { format } from "date-fns";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Modal } from "@/components/ascii/modal";
import { PixelButton } from "@/components/ascii/pixel-button";
import { useUi } from "@/components/shell/ui-state";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { useCreateNote, useCreateTask } from "@/lib/mutations";
import { parseCapture } from "@/lib/nl-parse";
import { useBoards } from "@/lib/queries";

import { MicButton, Waveform } from "./mic-button";

const PRIORITY_GLYPH = { none: "", low: "!", medium: "!!", high: "!!!", urgent: "!!!!" } as const;

export function QuickCapture() {
  const ui = useUi();
  const router = useRouter();
  const boards = useBoards();
  const createTask = useCreateTask();
  const createNote = useCreateNote();
  const [text, setText] = useState("");
  const [boardId, setBoardId] = useState<string | undefined>(undefined);

  const speech = useSpeechRecognition({
    continuous: false,
    onFinal: (phrase) => setText((t) => (t ? `${t} ${phrase}` : phrase)),
  });

  const open = ui.capture.open;
  const parsed = useMemo(
    () => parseCapture(`${text} ${speech.interim}`.trim()),
    [text, speech.interim],
  );
  const targetBoard = boardId ?? ui.capture.boardId ?? boards.data?.[0]?.id;

  // Start listening immediately when opened in voice mode.
  const { start: startSpeech, stop: stopSpeech } = speech;
  useEffect(() => {
    if (open && ui.capture.voice) startSpeech();
    if (!open) stopSpeech();
  }, [open, ui.capture.voice, startSpeech, stopSpeech]);

  const close = () => {
    stopSpeech();
    setText("");
    setBoardId(undefined);
    ui.closeCapture();
  };

  function submit(e: FormEvent) {
    e.preventDefault();
    const p = parseCapture(text);
    if (!p.title) return;
    if (p.kind === "note") {
      createNote.mutate(
        { id: crypto.randomUUID(), title: p.title, tags: p.labels },
        {
          onSuccess: (n) => {
            toast.success("Note saved", {
              action: { label: "Open", onClick: () => router.push(`/notes/${n.id}`) },
            });
          },
        },
      );
    } else {
      const id = crypto.randomUUID();
      createTask.mutate(
        {
          id,
          ...(targetBoard ? { boardId: targetBoard } : {}),
          ...(ui.capture.columnId ? { columnId: ui.capture.columnId } : {}),
          title: p.title,
          priority: p.priority,
          labels: p.labels,
          dueAt: p.dueAt?.toISOString() ?? null,
          remindAt: p.remindAt?.toISOString() ?? null,
        },
        {
          onSuccess: (t) => {
            toast.success("Task captured", {
              description: t.title,
              action: {
                label: "View",
                onClick: () => router.push(`/boards/${t.boardId}?task=${t.id}`),
              },
            });
          },
        },
      );
    }
    close();
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title={ui.capture.voice ? "Voice capture" : "Quick capture"}
      position="top"
    >
      <form onSubmit={submit} className="flex flex-col gap-4 p-4">
        <div className="flex items-stretch gap-2">
          <input
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder='e.g. "fix login tomorrow 5pm urgent #auth"'
            maxLength={200}
            className="px-input term text-2xl"
            aria-label="What needs doing?"
          />
          <MicButton
            listening={speech.listening}
            supported={speech.supported}
            onClick={speech.toggle}
          />
        </div>

        <AnimatePresence>
          {speech.listening || speech.interim ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-3 overflow-hidden text-danger"
            >
              <Waveform active={speech.listening} />
              <span className="term truncate text-xl text-fg-dim">
                {speech.interim || "listening…"}
              </span>
            </motion.div>
          ) : null}
        </AnimatePresence>
        {speech.error ? <p className="term text-lg text-danger">! {speech.error}</p> : null}
        {!speech.supported ? (
          <p className="term text-lg text-muted">
            Voice input isn&apos;t available in this browser — try Chrome, Edge or Safari.
          </p>
        ) : null}

        <div className="term flex min-h-8 flex-wrap items-center gap-2 border-2 border-dashed border-line p-2 text-lg">
          <span className="bg-fg px-1 text-bg uppercase">{parsed.kind}</span>
          <span className="truncate font-mono text-sm">{parsed.title || "…"}</span>
          {parsed.dueAt ? (
            <span className="px-tag text-accent-2">
              {parsed.remindAt ? "⏰" : "◷"} {format(parsed.dueAt, "EEE d MMM HH:mm")}
            </span>
          ) : null}
          {parsed.priority !== "none" ? (
            <span className="px-tag text-danger">
              {PRIORITY_GLYPH[parsed.priority]} {parsed.priority}
            </span>
          ) : null}
          {parsed.labels.map((l) => (
            <span key={l} className="px-tag text-accent">
              #{l}
            </span>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          {parsed.kind === "task" && boards.data && boards.data.length > 1 ? (
            <label className="term flex items-center gap-2 text-lg">
              board
              <select
                value={targetBoard}
                onChange={(e) => setBoardId(e.target.value)}
                className="px-input w-auto py-0"
              >
                {boards.data.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <span className="term text-lg text-muted">
              tip: start with &quot;note&quot; to save a note
            </span>
          )}
          <PixelButton type="submit" variant="primary" disabled={!parsed.title}>
            [ ↵ SAVE ]
          </PixelButton>
        </div>
      </form>
    </Modal>
  );
}
