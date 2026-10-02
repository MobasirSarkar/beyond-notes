"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "motion/react";
import { memo } from "react";

import { Progress } from "@/components/ui/progress";
import { PRIORITY_META } from "@/lib/constants/priority";
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
  const due = task.dueAt && !task.completedAt ? relativeDue(task.dueAt) : null;
  const completed = task.completedAt !== null;
  const emphasis = !completed && (task.priority === "urgent" || task.priority === "high");

  return (
    <div
      className={cn(
        "flex flex-col gap-2.5 bg-bg p-3 transition-colors duration-(--dur-1) hairline",
        lifted ? "-rotate-1 rule-strong" : "group-hover:rule-strong",
        emphasis && "edge-l",
      )}
    >
      <p
        className={cn(
          "text-sm leading-snug font-medium break-words",
          completed && "text-subtle line-through",
        )}
      >
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
          <span title={`${task.priority} priority`} className={cn(emphasis && "font-bold text-fg")}>
            {PRIORITY_META[task.priority].glyph}
          </span>
        ) : null}
        {due ? (
          <span
            className={cn(
              due.tone === "overdue" && "bg-fg px-1 text-bg",
              due.tone === "soon" && "text-fg",
            )}
          >
            {task.remindAt ? "⏰ " : ""}
            {due.label}
          </span>
        ) : null}
        {task.subtasks.length > 0 ? (
          <span className="flex items-center gap-1.5">
            <Progress value={done} max={task.subtasks.length} width={5} label="Subtasks" />
            {done}/{task.subtasks.length}
          </span>
        ) : null}
        {task.focusSeconds > 0 ? <span>◷ {formatDuration(task.focusSeconds)}</span> : null}
        {task.description ? <span aria-label="Has notes">≡</span> : null}
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
