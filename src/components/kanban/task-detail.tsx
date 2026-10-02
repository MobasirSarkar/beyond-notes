"use client";

import { format } from "date-fns";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { AsciiProgress } from "@/components/ascii/ascii-progress";
import { ConfirmButton } from "@/components/ascii/confirm-button";
import { Modal } from "@/components/ascii/modal";
import { PixelButton } from "@/components/ascii/pixel-button";
import { Markdown } from "@/components/notes/markdown";
import { MicButton } from "@/components/voice/mic-button";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { cn } from "@/lib/cn";
import type { TaskDto } from "@/lib/dto";
import { formatDuration, fromLocalInput, PRIORITY_META, toLocalInput } from "@/lib/format";
import {
  useCreateSubtask,
  useDeleteSubtask,
  useDeleteTask,
  useUpdateSubtask,
  useUpdateTask,
} from "@/lib/mutations";
import { LIMITS, PRIORITIES } from "@/lib/validation";

import { LabelInput } from "./label-input";

export function TaskDetail({ task, onClose }: { task: TaskDto | null; onClose: () => void }) {
  return (
    <Modal
      open={task !== null}
      onClose={onClose}
      title={task ? `task://${task.id.slice(0, 8)}` : "task"}
      position="right"
    >
      {task ? <TaskEditor key={task.id} task={task} onClose={onClose} /> : null}
    </Modal>
  );
}

function TaskEditor({ task, onClose }: { task: TaskDto; onClose: () => void }) {
  const update = useUpdateTask();
  const del = useDeleteTask();
  const addSub = useCreateSubtask();
  const updateSub = useUpdateSubtask(task.id);
  const delSub = useDeleteSubtask(task.id);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [preview, setPreview] = useState(task.description.length > 0);
  const [subDraft, setSubDraft] = useState("");

  const descRef = useRef(description);
  useEffect(() => {
    descRef.current = description;
  }, [description]);

  const speech = useSpeechRecognition({
    continuous: true,
    onFinal: (text) => {
      const d = descRef.current;
      const next = `${d}${d && !d.endsWith("\n") ? " " : ""}${text}`.slice(
        0,
        LIMITS.taskDescription,
      );
      descRef.current = next;
      setDescription(next);
      update.mutate({ taskId: task.id, description: next });
    },
  });

  const saveTitle = () => {
    const t = title.trim();
    if (t && t !== task.title) update.mutate({ taskId: task.id, title: t });
    else setTitle(task.title);
  };
  const saveDescription = () => {
    if (description !== task.description) update.mutate({ taskId: task.id, description });
  };
  const doneCount = task.subtasks.filter((s) => s.done).length;

  return (
    <div className="flex flex-col gap-5 p-4">
      <textarea
        value={title}
        onChange={(e) => setTitle(e.target.value.replace(/\n/g, ""))}
        onBlur={saveTitle}
        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), e.currentTarget.blur())}
        maxLength={LIMITS.taskTitle}
        rows={2}
        aria-label="Title"
        className="term glow w-full resize-none bg-transparent text-3xl leading-tight outline-none"
      />

      <section aria-label="Priority">
        <h3 className="term mb-1 text-lg text-muted">priority</h3>
        <div className="flex flex-wrap border-2 border-line" role="radiogroup">
          {PRIORITIES.map((p) => (
            <button
              key={p}
              type="button"
              role="radio"
              aria-checked={task.priority === p}
              onClick={() => update.mutate({ taskId: task.id, priority: p })}
              className={cn(
                "term flex-1 px-2 text-lg",
                task.priority === p ? "bg-fg text-bg" : cn("hover:bg-bg-3", PRIORITY_META[p].cls),
              )}
            >
              {PRIORITY_META[p].glyph} {p}
            </button>
          ))}
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="term text-lg text-muted">◷ due</span>
          <input
            type="datetime-local"
            defaultValue={toLocalInput(task.dueAt)}
            onChange={(e) =>
              update.mutate({ taskId: task.id, dueAt: fromLocalInput(e.target.value) })
            }
            className="px-input"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="term text-lg text-muted">⏰ remind</span>
          <input
            type="datetime-local"
            defaultValue={toLocalInput(task.remindAt)}
            onChange={(e) =>
              update.mutate({ taskId: task.id, remindAt: fromLocalInput(e.target.value) })
            }
            className="px-input"
          />
        </label>
      </div>

      <section>
        <h3 className="term mb-1 text-lg text-muted">labels</h3>
        <LabelInput
          value={task.labels}
          onChange={(labels) => update.mutate({ taskId: task.id, labels })}
        />
      </section>

      <section>
        <div className="mb-1 flex items-center justify-between gap-2">
          <h3 className="term text-lg text-muted">description (markdown)</h3>
          <div className="flex gap-2">
            <MicButton
              listening={speech.listening}
              supported={speech.supported}
              onClick={speech.toggle}
              className="px-2! py-0! text-base!"
            />
            <PixelButton size="sm" onClick={() => setPreview((p) => !p)}>
              {preview ? "edit" : "preview"}
            </PixelButton>
          </div>
        </div>
        {speech.interim ? <p className="term text-lg text-danger">… {speech.interim}</p> : null}
        {speech.error ? <p className="term text-lg text-danger">! {speech.error}</p> : null}
        {preview ? (
          <div
            className="min-h-24 cursor-text border-2 border-dashed border-line p-3"
            onDoubleClick={() => setPreview(false)}
          >
            {description ? (
              <Markdown source={description} />
            ) : (
              <p className="text-muted">nothing here yet…</p>
            )}
          </div>
        ) : (
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={saveDescription}
            maxLength={LIMITS.taskDescription}
            rows={8}
            placeholder="details, links, checklists…"
            className="px-input resize-y font-mono"
          />
        )}
      </section>

      <section>
        <div className="mb-1 flex items-center gap-2">
          <h3 className="term text-lg text-muted">subtasks</h3>
          {task.subtasks.length > 0 ? (
            <AsciiProgress
              value={doneCount}
              max={task.subtasks.length}
              width={12}
              label="Subtask progress"
            />
          ) : null}
        </div>
        <ul className="flex flex-col gap-1">
          {task.subtasks.map((s) => (
            <li key={s.id} className="group flex items-center gap-2">
              <button
                type="button"
                role="checkbox"
                aria-checked={s.done}
                onClick={() => updateSub.mutate({ subtaskId: s.id, done: !s.done })}
                className="term text-xl hover:text-accent"
              >
                {s.done ? "[x]" : "[ ]"}
              </button>
              <span className={cn("flex-1", s.done && "text-muted line-through")}>{s.title}</span>
              <button
                type="button"
                aria-label={`Delete subtask ${s.title}`}
                onClick={() => delSub.mutate({ subtaskId: s.id })}
                className="term text-lg text-muted opacity-0 group-hover:opacity-100 hover:text-danger focus:opacity-100"
              >
                [del]
              </button>
            </li>
          ))}
        </ul>
        <form
          className="mt-2"
          onSubmit={(e) => {
            e.preventDefault();
            const t = subDraft.trim();
            if (!t) return;
            addSub.mutate({ id: crypto.randomUUID(), taskId: task.id, title: t });
            setSubDraft("");
          }}
        >
          <input
            value={subDraft}
            onChange={(e) => setSubDraft(e.target.value)}
            maxLength={LIMITS.subtaskTitle}
            placeholder="+ add subtask ↵"
            className="px-input"
          />
        </form>
      </section>

      <div className="term flex flex-wrap gap-x-4 text-lg text-muted">
        <span>created {format(new Date(task.createdAt), "d MMM yyyy")}</span>
        {task.focusSeconds > 0 ? <span>focused {formatDuration(task.focusSeconds)}</span> : null}
        {task.completedAt ? (
          <span className="text-ok">✓ done {format(new Date(task.completedAt), "d MMM")}</span>
        ) : null}
      </div>

      <div className="flex flex-wrap justify-between gap-2 border-t-2 border-dashed border-line pt-4">
        <Link href={`/focus?task=${task.id}`} className="px-btn" data-variant="primary">
          ◷ focus on this
        </Link>
        <ConfirmButton
          size="md"
          onConfirm={() => {
            del.mutate({ taskId: task.id });
            onClose();
          }}
        >
          delete task
        </ConfirmButton>
      </div>
    </div>
  );
}
