"use client";

import { format } from "date-fns";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/input";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { useCreateNote, useCreateTask } from "@/lib/api/mutations";
import { useBoards } from "@/lib/api/queries";
import { PRIORITY_META } from "@/lib/constants/priority";
import { ui, useUi } from "@/lib/stores/ui";
import { parseCapture } from "@/lib/utils/nl-parse";

import { MicButton } from "./mic-button";
import { Waveform } from "./waveform";

function Token({ label, children }: { label: string; children: ReactNode }) {
  return (
    <span className="inline-flex h-7 items-center gap-2 px-2 text-xs hairline">
      <span className="text-subtle">{label}</span>
      {children}
    </span>
  );
}

export function QuickCapture() {
  const capture = useUi((s) => s.capture);
  const router = useRouter();
  const boards = useBoards();
  const createTask = useCreateTask();
  const createNote = useCreateNote();
  const [text, setText] = useState("");
  const [boardId, setBoardId] = useState<string | undefined>(undefined);

  const speech = useSpeechRecognition({
    onFinal: (phrase) => setText((t) => (t ? `${t} ${phrase}` : phrase)),
  });

  const parsed = useMemo(
    () => parseCapture(`${text} ${speech.interim}`.trim()),
    [text, speech.interim],
  );
  const targetBoard = boardId ?? capture.boardId ?? boards.data?.[0]?.id;

  const { start: startSpeech, stop: stopSpeech } = speech;
  useEffect(() => {
    if (capture.open && capture.voice) startSpeech();
    if (!capture.open) stopSpeech();
  }, [capture.open, capture.voice, startSpeech, stopSpeech]);

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
          onSuccess: (n) =>
            toast.success("Note saved", {
              action: { label: "open", onClick: () => router.push(`/notes/${n.id}`) },
            }),
        },
      );
    } else {
      createTask.mutate(
        {
          id: crypto.randomUUID(),
          ...(targetBoard ? { boardId: targetBoard } : {}),
          ...(capture.columnId ? { columnId: capture.columnId } : {}),
          title: p.title,
          priority: p.priority,
          labels: p.labels,
          dueAt: p.dueAt?.toISOString() ?? null,
          remindAt: p.remindAt?.toISOString() ?? null,
        },
        {
          onSuccess: (t) =>
            toast.success("Task captured", {
              description: t.title,
              action: {
                label: "view",
                onClick: () => router.push(`/boards/${t.boardId}?task=${t.id}`),
              },
            }),
        },
      );
    }
    close();
  }

  return (
    <Modal
      open={capture.open}
      onClose={close}
      title={capture.voice ? "voice capture" : "capture"}
      placement="top"
    >
      <form onSubmit={submit} className="flex flex-col gap-5 p-5 sm:p-6">
        <div className="flex items-stretch gap-2">
          <input
            data-autofocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="fix login tomorrow 5pm urgent #auth"
            maxLength={200}
            aria-label="What needs doing?"
            className="min-w-0 flex-1 bg-transparent pb-2 text-lg outline-none rule-b placeholder:text-subtle focus:rule-strong"
          />
          <MicButton
            listening={speech.listening}
            supported={speech.supported}
            onClick={speech.toggle}
          />
        </div>

        <AnimatePresence initial={false}>
          {speech.listening || speech.interim ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-3 overflow-hidden text-sm"
            >
              <Waveform active={speech.listening} />
              <span className="truncate text-muted">{speech.interim || "listening…"}</span>
            </motion.div>
          ) : null}
        </AnimatePresence>
        {speech.error ? <p className="text-sm">! {speech.error}</p> : null}

        <div className="flex min-h-7 flex-wrap items-center gap-2" aria-live="polite">
          <Token label="type">{parsed.kind}</Token>
          {parsed.dueAt ? (
            <Token label={parsed.remindAt ? "remind" : "due"}>
              {format(parsed.dueAt, "EEE d MMM, HH:mm")}
            </Token>
          ) : null}
          {parsed.priority !== "none" ? (
            <Token label="priority">
              {PRIORITY_META[parsed.priority].glyph} {parsed.priority}
            </Token>
          ) : null}
          {parsed.labels.map((l) => (
            <Token key={l} label="tag">
              #{l}
            </Token>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-5 rule-t">
          {parsed.kind === "task" && boards.data && boards.data.length > 1 ? (
            <label className="flex items-center gap-2">
              <span className="label">board</span>
              <Select
                value={targetBoard}
                onChange={(e) => setBoardId(e.target.value)}
                className="h-8 w-auto"
              >
                {boards.data.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </Select>
            </label>
          ) : (
            <p className="text-xs text-subtle">
              start with <span className="text-muted">“note”</span> to save a note instead
            </p>
          )}
          <Button type="submit" variant="solid" disabled={!parsed.title}>
            save <Kbd className="border-bg/40 text-bg">↵</Kbd>
          </Button>
        </div>
      </form>
    </Modal>
  );
}
