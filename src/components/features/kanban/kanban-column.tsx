"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { AnimatePresence } from "motion/react";
import { useState, type FormEvent } from "react";

import { Input } from "@/components/ui/input";
import { Menu } from "@/components/ui/menu";
import {
  useCreateTask,
  useDeleteColumn,
  useMoveColumn,
  useUpdateColumn,
} from "@/lib/api/mutations";
import { cn } from "@/lib/utils/cn";
import { formText } from "@/lib/utils/form";
import { parseCapture } from "@/lib/utils/nl-parse";
import type { ColumnDto, TaskDto } from "@/types/dto";

import { SortableTaskCard } from "./task-card";

type Props = {
  boardId: string;
  column: ColumnDto;
  tasks: TaskDto[];
  isFirst: boolean;
  isLast: boolean;
  onOpenTask: (id: string) => void;
};

type Editing = "name" | "wip" | null;

export function KanbanColumn({ boardId, column, tasks, isFirst, isLast, onOpenTask }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id, data: { type: "column" } });
  const createTask = useCreateTask();
  const updateColumn = useUpdateColumn();
  const moveColumn = useMoveColumn();
  const deleteColumn = useDeleteColumn();
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Editing>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const overLimit = column.wipLimit !== null && tasks.length > column.wipLimit;
  const count = String(tasks.length).padStart(2, "0");

  function addTask(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const raw = formText(form, "title");
    if (!raw) return setAdding(false);
    const p = parseCapture(raw);
    createTask.mutate({
      id: crypto.randomUUID(),
      boardId,
      columnId: column.id,
      title: p.title || raw.slice(0, 200),
      priority: p.priority,
      labels: p.labels,
      dueAt: p.dueAt?.toISOString() ?? null,
    });
    form.reset();
  }

  function saveEdit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const value = formText(e.currentTarget, "value");
    if (editing === "name" && value && value !== column.name) {
      updateColumn.mutate({ columnId: column.id, name: value });
    }
    if (editing === "wip") {
      const n = Number.parseInt(value, 10);
      updateColumn.mutate({
        columnId: column.id,
        wipLimit: Number.isFinite(n) && n > 0 ? Math.min(n, 99) : null,
      });
    }
    setEditing(null);
  }

  return (
    <section
      aria-label={`${column.name} column`}
      className={cn(
        "flex max-h-[calc(100dvh-var(--header-h)-var(--status-h)-14rem)] min-h-48 w-(--column-w) shrink-0 snap-start flex-col bg-surface transition-colors duration-(--dur-1) hairline",
        isOver && "rule-strong",
      )}
    >
      <header className="flex h-11 items-center gap-2 pr-1 pl-3 rule-b">
        <h2 className="min-w-0 flex-1 truncate subheading">
          {column.isDone ? <span className="text-subtle">✓ </span> : null}
          {column.name}
        </h2>
        <span
          className={cn("text-xs tabular-nums", overLimit ? "bg-fg px-1 text-bg" : "text-subtle")}
          title={
            column.wipLimit
              ? `${tasks.length} of ${column.wipLimit} (WIP limit)`
              : `${tasks.length} tasks`
          }
        >
          {count}
          {column.wipLimit ? `/${String(column.wipLimit).padStart(2, "0")}` : ""}
        </span>
        <Menu
          label="⋯"
          ariaLabel={`${column.name} column options`}
          items={[
            { id: "rename", label: "rename", onSelect: () => setEditing("name") },
            { id: "wip", label: "set wip limit", onSelect: () => setEditing("wip") },
            {
              id: "done",
              label: column.isDone ? "unmark done column" : "mark as done column",
              onSelect: () => updateColumn.mutate({ columnId: column.id, isDone: !column.isDone }),
            },
            {
              id: "left",
              label: "← move left",
              disabled: isFirst,
              onSelect: () => moveColumn.mutate({ columnId: column.id, direction: "left" }),
            },
            {
              id: "right",
              label: "move right →",
              disabled: isLast,
              onSelect: () => moveColumn.mutate({ columnId: column.id, direction: "right" }),
            },
            {
              id: "delete",
              danger: true,
              label: confirmDelete ? `confirm delete (+${tasks.length} tasks)` : "delete column…",
              onSelect: () =>
                confirmDelete
                  ? deleteColumn.mutate({ columnId: column.id })
                  : setConfirmDelete(true),
            },
          ]}
        />
      </header>

      {editing ? (
        <form onSubmit={saveEdit} className="flex items-center gap-2 p-2 rule-b">
          <Input
            name="value"
            autoFocus
            aria-label={editing === "name" ? "Column name" : "WIP limit"}
            type={editing === "wip" ? "number" : "text"}
            min={editing === "wip" ? 0 : undefined}
            max={editing === "wip" ? 99 : undefined}
            maxLength={40}
            defaultValue={editing === "name" ? column.name : (column.wipLimit ?? "")}
            placeholder={editing === "wip" ? "0 = no limit" : undefined}
            onKeyDown={(e) => e.key === "Escape" && setEditing(null)}
            className="h-8"
          />
        </form>
      ) : null}

      <SortableContext
        id={column.id}
        items={tasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <ul ref={setNodeRef} className="flex min-h-24 flex-1 flex-col gap-2 overflow-y-auto p-2">
          <AnimatePresence initial={false}>
            {tasks.map((t) => (
              <SortableTaskCard key={t.id} task={t} onOpen={onOpenTask} />
            ))}
          </AnimatePresence>
          {tasks.length === 0 ? (
            <li className="pointer-events-none grid flex-1 place-items-center rule-dashed py-8 text-xs text-subtle hairline">
              drop here
            </li>
          ) : null}
        </ul>
      </SortableContext>

      <footer className="p-2 rule-t">
        {adding ? (
          <form onSubmit={addTask}>
            <Input
              name="title"
              autoFocus
              maxLength={200}
              aria-label={`New task in ${column.name}`}
              placeholder="title  tomorrow  !!  #tag"
              onKeyDown={(e) => e.key === "Escape" && setAdding(false)}
              onBlur={(e) => !e.currentTarget.value && setAdding(false)}
              className="h-8"
            />
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="flex h-8 w-full items-center px-2 text-left text-xs text-muted hover:bg-surface-2 hover:text-fg"
          >
            + add task
          </button>
        )}
      </footer>
    </section>
  );
}
