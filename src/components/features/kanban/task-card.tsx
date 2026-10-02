"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "motion/react";
import { memo } from "react";

import { AlignLeft, Bell, Timer } from "lucide-react";

import { Icon } from "@/components/ui/icon";
import { PriorityMark } from "@/components/ui/priority-mark";
import { useNow } from "@/hooks/use-now";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils/cn";
import { formatDuration, relativeDue } from "@/lib/utils/format";
import type { TaskDto } from "@/types/dto";

/** Visual body of a card (also used in the drag overlay). */
export const TaskCardBody = memo(function TaskCardBody({
  task,
  lifted,
}: {
  task: TaskDto;
  lifted?: boolean;
}) {
  const done = task.subtasks.filter((s) => s.done).length;
  // Relative to the viewer's clock and time zone, so it waits for the client.
  const now = useNow();
  const due =
    task.dueAt && !task.completedAt && now !== null ? relativeDue(task.dueAt, new Date(now)) : null;
  const completed = task.completedAt !== null;
  const emphasis = !completed && (task.priority === "urgent" || task.priority === "high");

  return (
    <div
      className={cn(
        "flex flex-col gap-2.5 rounded-card lift p-3.5 transition-[border-color,box-shadow,transform] duration-(--dur-2)",
        lifted ? "-rotate-1 rule-strong shadow-float" : "group-hover:rule-strong",
        emphasis &&
          !lifted &&
          "shadow-[inset_0_var(--bw)_0_var(--highlight),0_0_1.25rem_-0.5rem_var(--glow)]",
      )}
    >
      <p className={cn("text-sm font-medium break-words", completed && "text-subtle line-through")}>
        {task.title}
      </p>

      {task.labels.length > 0 ? (
        <p className="flex flex-wrap gap-x-2 text-xs text-muted">
          {task.labels.map((l) => (
            <span key={l}>#{l}</span>
          ))}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted empty:hidden">
        {task.priority !== "none" ? (
          <PriorityMark priority={task.priority} className={cn(emphasis && "text-fg")} />
        ) : null}
        {due ? (
          <span
            className={cn(
              "inline-flex items-center gap-1",
              due.tone === "overdue" && "rounded-full bg-fg px-2 text-bg",
              due.tone === "soon" && "text-fg",
            )}
          >
            {task.remindAt ? <Icon icon={Bell} className="size-3" /> : null}
            {due.label}
          </span>
        ) : null}
        {task.subtasks.length > 0 ? (
          <span className="flex items-center gap-1.5">
            <Progress value={done} max={task.subtasks.length} label="Subtasks" className="w-8" />
            {done}/{task.subtasks.length}
          </span>
        ) : null}
        {task.focusSeconds > 0 ? (
          <span className="inline-flex items-center gap-1">
            <Icon icon={Timer} className="size-3" />
            {formatDuration(task.focusSeconds)}
          </span>
        ) : null}
        {task.description ? <Icon icon={AlignLeft} className="size-3" label="Has notes" /> : null}
      </div>
    </div>
  );
});

export function SortableTaskCard({
  task,
  onOpen,
}: {
  task: TaskDto;
  onOpen: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: "task" },
  });

  return (
    <motion.li
      layout="position"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.12 } }}
      transition={{ type: "spring", stiffness: 700, damping: 50 }}
      data-task-id={task.id}
      className="list-none"
    >
      {/* dnd-kit owns this node's transform; Motion animates the outer <li>. */}
      <div
        ref={setNodeRef}
        style={{ transform: CSS.Translate.toString(transform), transition }}
        {...attributes}
        role="button"
        tabIndex={0}
        aria-roledescription="Draggable task"
        aria-label={task.title}
        {...listeners}
        onClick={() => onOpen(task.id)}
        onKeyDown={(e) => {
          listeners?.["onKeyDown"]?.(e);
          if (e.key === "Enter" && !e.defaultPrevented) onOpen(task.id);
        }}
        className={cn(
          "group block cursor-grab touch-manipulation active:cursor-grabbing",
          isDragging && "opacity-30",
        )}
      >
        <TaskCardBody task={task} />
      </div>
    </motion.li>
  );
}
