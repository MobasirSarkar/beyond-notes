"use client";

import { format } from "date-fns";
import { Timer, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

import { LazyMarkdown } from "@/components/features/notes/lazy-markdown";
import { MicButton } from "@/components/features/voice/mic-button";
import { buttonStyles } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { Field } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import { Icon } from "@/components/ui/icon";
import { Modal } from "@/components/ui/modal";
import { Progress } from "@/components/ui/progress";
import { Rule } from "@/components/ui/rule";
import { StepSlider } from "@/components/ui/step-slider";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import {
  useCreateSubtask,
  useDeleteSubtask,
  useDeleteTask,
  useUpdateSubtask,
  useUpdateTask,
} from "@/lib/api/mutations";
import { focusTimer } from "@/lib/stores/focus-timer";
import { PRIORITY_STEPS } from "@/lib/constants/priority";
import { LIMITS } from "@/lib/schemas/input";
import { cn } from "@/lib/utils/cn";
import { formatDuration, fromLocalInput, toLocalInput } from "@/lib/utils/format";
import type { TaskDto } from "@/types/dto";

import { LabelInput } from "./label-input";

function TaskSheetTitle({ id }: { id: string }) {
  return (
    <>
      Task{" "}
      <span className="ml-1 type-numeric text-xs font-normal text-subtle">#{id.slice(0, 8)}</span>
    </>
  );
}

export function TaskSheet({ task, onClose }: { task: TaskDto | null; onClose: () => void }) {
  return (
    <Modal
      open={task !== null}
      onClose={onClose}
      title={task ? <TaskSheetTitle id={task.id} /> : "Task"}
      placement="sheet"
    >
      {task ? <TaskEditor key={task.id} task={task} onClose={onClose} /> : null}
    </Modal>
  );
}

function TaskEditor({ task, onClose }: { task: TaskDto; onClose: () => void }) {
  const ids = useId();
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
      setPreview(false);
      update.mutate({ taskId: task.id, description: next });
    },
  });

  const saveTitle = () => {
    const t = title.trim();
    if (t && t !== task.title) update.mutate({ taskId: task.id, title: t });
    else setTitle(task.title);
  };
  const doneCount = task.subtasks.filter((s) => s.done).length;

  return (
    <div className="flex flex-col gap-8 p-5 sm:p-6">
      <textarea
        value={title}
        onChange={(e) => setTitle(e.target.value.replace(/\n/g, ""))}
        onBlur={saveTitle}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            e.currentTarget.blur();
          }
        }}
        maxLength={LIMITS.taskTitle}
        rows={2}
        aria-label="Title"
        className="w-full resize-none bg-transparent type-heading outline-none"
      />

      <section className="flex flex-col gap-5">
        <Rule>Properties</Rule>
        <StepSlider
          label="Priority"
          value={task.priority}
          steps={PRIORITY_STEPS}
          onChange={(priority) => update.mutate({ taskId: task.id, priority })}
          start="Calm"
          end="Pressing"
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Due" htmlFor={`${ids}-due`}>
            <Input
              id={`${ids}-due`}
              type="datetime-local"
              defaultValue={toLocalInput(task.dueAt)}
              onChange={(e) =>
                update.mutate({ taskId: task.id, dueAt: fromLocalInput(e.target.value) })
              }
            />
          </Field>
          <Field label="Remind" htmlFor={`${ids}-remind`} hint="Push and in-app reminder">
            <Input
              id={`${ids}-remind`}
              type="datetime-local"
              defaultValue={toLocalInput(task.remindAt)}
              onChange={(e) =>
                update.mutate({ taskId: task.id, remindAt: fromLocalInput(e.target.value) })
              }
            />
          </Field>
        </div>
        <Field label="Labels" htmlFor={`${ids}-labels`}>
          <LabelInput
            id={`${ids}-labels`}
            value={task.labels}
            onChange={(labels) => update.mutate({ taskId: task.id, labels })}
          />
        </Field>
      </section>

      <section className="flex flex-col gap-3">
        <Rule>Notes</Rule>
        <div className="flex items-center justify-end gap-2">
          <MicButton
            size="sm"
            listening={speech.listening}
            supported={speech.supported}
            onClick={speech.toggle}
          />
          <button
            type="button"
            onClick={() => setPreview((p) => !p)}
            className={buttonStyles({ size: "sm", variant: "ghost" })}
          >
            {preview ? "Edit" : "Preview"}
          </button>
        </div>
        {speech.interim ? <p className="text-sm text-muted">{speech.interim}…</p> : null}
        {speech.error ? <p className="text-sm text-muted">{speech.error}</p> : null}
        {preview ? (
          <div className="min-h-24 rounded-card lift p-4">
            {description ? (
              <LazyMarkdown source={description} />
            ) : (
              <span className="text-subtle">No notes yet</span>
            )}
          </div>
        ) : (
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={() =>
              description !== task.description && update.mutate({ taskId: task.id, description })
            }
            maxLength={LIMITS.taskDescription}
            rows={8}
            aria-label="Notes (Markdown)"
            placeholder="Markdown supported: links, lists and - [ ] checklists"
          />
        )}
      </section>

      <section className="flex flex-col gap-3">
        <Rule>
          Subtasks {task.subtasks.length > 0 ? `· ${doneCount}/${task.subtasks.length}` : ""}
        </Rule>
        {task.subtasks.length > 0 ? (
          <Progress value={doneCount} max={task.subtasks.length} label="Subtask progress" />
        ) : null}
        <ul className="flex flex-col">
          {task.subtasks.map((s) => (
            <li key={s.id} className="group flex min-h-9 items-center gap-2">
              <Checkbox
                checked={s.done}
                onChange={(done) => updateSub.mutate({ subtaskId: s.id, done })}
                className="flex-1"
              >
                <span className={cn(s.done && "text-subtle line-through")}>{s.title}</span>
              </Checkbox>
              <button
                type="button"
                aria-label={`Delete subtask ${s.title}`}
                onClick={() => delSub.mutate({ subtaskId: s.id })}
                className="px-2 text-subtle opacity-0 group-hover:opacity-100 hover:text-fg focus-visible:opacity-100"
              >
                <Icon icon={X} className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const t = subDraft.trim();
            if (!t) return;
            addSub.mutate({ id: crypto.randomUUID(), taskId: task.id, title: t });
            setSubDraft("");
          }}
        >
          <Input
            value={subDraft}
            onChange={(e) => setSubDraft(e.target.value)}
            maxLength={LIMITS.subtaskTitle}
            placeholder="Add a subtask…"
            aria-label="New subtask"
          />
        </form>
      </section>

      <footer className="flex flex-col gap-4 pt-6 rule-t">
        <p className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-subtle">
          <span>Created {format(new Date(task.createdAt), "d MMM yyyy")}</span>
          {task.focusSeconds > 0 ? <span>Focused {formatDuration(task.focusSeconds)}</span> : null}
          {task.completedAt ? (
            <span>Completed {format(new Date(task.completedAt), "d MMM yyyy")}</span>
          ) : null}
        </p>
        <div className="flex flex-wrap justify-between gap-2">
          <Link
            href="/focus"
            onClick={() => focusTimer.setTask(task.id)}
            className={buttonStyles({ variant: "solid" })}
          >
            <Icon icon={Timer} /> Focus on this
          </Link>
          <ConfirmButton
            size="md"
            onConfirm={() => {
              del.mutate({ taskId: task.id });
              onClose();
            }}
          >
            Delete task
          </ConfirmButton>
        </div>
      </footer>
    </div>
  );
}
