"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "motion/react";

import { AsciiProgress } from "@/components/ascii/ascii-progress";
import { cn } from "@/lib/cn";
import type { TaskDto } from "@/lib/dto";
import { formatDuration, PRIORITY_META, relativeDue } from "@/lib/format";

export function TaskCardBody({ task, dragging }: { task: TaskDto; dragging?: boolean }) {
  const done = task.subtasks.filter((s) => s.done).length;
  const due = task.dueAt ? relativeDue(task.dueAt) : null;
  const p = PRIORITY_META[task.priority];
  const completed = task.completedAt !== null;

  return (
    <div
      className={cn(
        "border-2 border-line bg-bg p-2.5 text-left",
        dragging ? "rotate-2 shadow-[6px_6px_0_0_var(--shadow)]" : "shadow-px-sm",
        task.priority === "urgent" && !completed && "border-l-[6px] border-l-danger",
        task.priority === "high" && !completed && "border-l-[6px] border-l-accent",
      )}
    >
      <div className="flex items-start gap-2">
        {task.priority !== "none" ? (
          <span
            className={cn("term shrink-0 text-lg leading-tight", p.cls)}
            aria-label={`${p.label} priority`}
          >
            {p.glyph}
          </span>
        ) : null}
        <p
          className={cn(
            "min-w-0 flex-1 font-medium break-words",
            completed && "text-muted line-through",
          )}
        >
          {task.title}
        </p>
      </div>

      {task.labels.length > 0 ? (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {task.labels.map((l) => (
            <span key={l} className="px-tag text-accent-2">
              #{l}
            </span>
          ))}
        </div>
      ) : null}

      {due || task.subtasks.length > 0 || task.focusSeconds > 0 || task.description ? (
        <div className="term mt-1.5 flex flex-wrap items-center gap-x-3 text-base text-fg-dim">
          {due && !completed ? (
            <span
              className={cn(
                due.tone === "overdue" && "bg-danger px-1 text-bg",
                due.tone === "soon" && "text-warn",
              )}
            >
              {task.remindAt ? "⏰" : "◷"} {due.label}
            </span>
          ) : null}
          {task.subtasks.length > 0 ? (
            <span className="flex items-center gap-1">
              <AsciiProgress value={done} max={task.subtasks.length} width={5} label="Subtasks" />
              {done}/{task.subtasks.length}
            </span>
          ) : null}
          {task.focusSeconds > 0 ? <span>⏱ {formatDuration(task.focusSeconds)}</span> : null}
          {task.description ? <span aria-label="Has description">≡</span> : null}
        </div>
      ) : null}
    </div>
  );
}

export function SortableTaskCard({
  task,
  onOpen,
}: {
  task: TaskDto;
  onOpen: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: "task", columnId: task.columnId },
  });

  return (
    <motion.li
      layout="position"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.12 } }}
      transition={{ type: "spring", stiffness: 700, damping: 45 }}
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
          "block w-full cursor-grab touch-manipulation outline-offset-2 hover:-translate-x-px hover:-translate-y-px active:cursor-grabbing",
          isDragging && "opacity-30",
        )}
      >
        <TaskCardBody task={task} />
      </div>
    </motion.li>
  );
}
