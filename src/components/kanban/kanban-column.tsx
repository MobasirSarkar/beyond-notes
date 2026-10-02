"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { AnimatePresence } from "motion/react";
import { useState, type FormEvent } from "react";

import { Dropdown, MenuItem } from "@/components/ascii/dropdown";
import { cn } from "@/lib/cn";
import { formText } from "@/lib/form";
import type { ColumnDto, TaskDto } from "@/lib/dto";
import { useCreateTask, useDeleteColumn, useMoveColumn, useUpdateColumn } from "@/lib/mutations";
import { parseCapture } from "@/lib/nl-parse";

import { SortableTaskCard } from "./task-card";

type Props = {
  boardId: string;
  column: ColumnDto;
  tasks: TaskDto[];
  isFirst: boolean;
  isLast: boolean;
  onOpenTask: (id: string) => void;
  dndDisabled: boolean;
};

export function KanbanColumn({
  boardId,
  column,
  tasks,
  isFirst,
  isLast,
  onOpenTask,
  dndDisabled,
}: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id, data: { type: "column" } });
  const createTask = useCreateTask();
  const updateColumn = useUpdateColumn();
  const moveColumn = useMoveColumn();
  const deleteColumn = useDeleteColumn();
  const [adding, setAdding] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [editingWip, setEditingWip] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const overLimit = column.wipLimit !== null && tasks.length > column.wipLimit;

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

  function rename(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const name = formText(e.currentTarget, "name");
    if (name && name !== column.name) updateColumn.mutate({ columnId: column.id, name });
    setRenaming(false);
  }

  return (
    <section
      aria-label={`${column.name} column`}
      className={cn(
        "flex max-h-[calc(100dvh-11rem)] w-[18.5rem] shrink-0 flex-col border-2 border-line bg-bg-2 shadow-px",
        isOver && "border-accent",
        overLimit && "border-danger",
      )}
    >
      <header className="flex items-center gap-2 border-b-2 border-line px-2 py-1">
        {renaming ? (
          <form onSubmit={rename} className="flex-1">
            <input
              name="name"
              defaultValue={column.name}
              autoFocus
              maxLength={40}
              onBlur={(e) => e.currentTarget.form?.requestSubmit()}
              onKeyDown={(e) => e.key === "Escape" && setRenaming(false)}
              className="px-input term py-0 text-xl"
            />
          </form>
        ) : (
          <h2 className="term min-w-0 flex-1 truncate text-xl uppercase">
            {column.isDone ? <span className="text-ok">✓ </span> : null}
            {column.name}
          </h2>
        )}
        <span
          className={cn("term text-lg", overLimit ? "bg-danger px-1 text-bg" : "text-muted")}
          title={column.wipLimit ? "Tasks / WIP limit" : "Tasks"}
        >
          [{tasks.length}
          {column.wipLimit ? `/${column.wipLimit}` : ""}]
        </span>
        <Dropdown label="⋮">
          {(close) => (
            <>
              <MenuItem
                onSelect={() => {
                  setRenaming(true);
                  close();
                }}
              >
                rename
              </MenuItem>
              <MenuItem
                onSelect={() => {
                  setEditingWip(true);
                  close();
                }}
              >
                set wip limit
              </MenuItem>
              <MenuItem
                onSelect={() => {
                  updateColumn.mutate({ columnId: column.id, isDone: !column.isDone });
                  close();
                }}
              >
                {column.isDone ? "unmark done column" : "mark as done column"}
              </MenuItem>
              <MenuItem
                disabled={isFirst}
                onSelect={() => {
                  moveColumn.mutate({ columnId: column.id, direction: "left" });
                  close();
                }}
              >
                ← move left
              </MenuItem>
              <MenuItem
                disabled={isLast}
                onSelect={() => {
                  moveColumn.mutate({ columnId: column.id, direction: "right" });
                  close();
                }}
              >
                move right →
              </MenuItem>
              <MenuItem
                danger
                onSelect={() => {
                  if (confirmDelete) {
                    deleteColumn.mutate({ columnId: column.id });
                    close();
                  } else setConfirmDelete(true);
                }}
              >
                {confirmDelete ? `really delete (+${tasks.length} tasks)?` : "delete column"}
              </MenuItem>
            </>
          )}
        </Dropdown>
      </header>

      {editingWip ? (
        <form
          className="term flex items-center gap-2 border-b-2 border-dashed border-line px-2 py-1 text-lg"
          onSubmit={(e) => {
            e.preventDefault();
            const n = Number.parseInt(formText(e.currentTarget, "wip"), 10);
            updateColumn.mutate({
              columnId: column.id,
              wipLimit: Number.isFinite(n) && n > 0 ? Math.min(n, 99) : null,
            });
            setEditingWip(false);
          }}
        >
          <label htmlFor={`wip-${column.id}`}>wip limit</label>
          <input
            id={`wip-${column.id}`}
            name="wip"
            type="number"
            min={0}
            max={99}
            autoFocus
            defaultValue={column.wipLimit ?? ""}
            onKeyDown={(e) => e.key === "Escape" && setEditingWip(false)}
            className="px-input w-16 py-0"
          />
          <button type="submit" className="hover:text-accent">
            [ok]
          </button>
          <span className="text-muted">0 = none</span>
        </form>
      ) : null}

      <SortableContext
        id={column.id}
        items={tasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
        disabled={dndDisabled}
      >
        <ul ref={setNodeRef} className="flex min-h-16 flex-1 flex-col gap-2 overflow-y-auto p-2">
          <AnimatePresence initial={false}>
            {tasks.map((t) => (
              <SortableTaskCard key={t.id} task={t} onOpen={onOpenTask} />
            ))}
          </AnimatePresence>
          {tasks.length === 0 ? (
            <li className="term pointer-events-none grid flex-1 place-items-center border-2 border-dashed border-muted py-6 text-lg text-muted">
              ░ drop here ░
            </li>
          ) : null}
        </ul>
      </SortableContext>

      <footer className="border-t-2 border-dashed border-line p-2">
        {adding ? (
          <form onSubmit={addTask}>
            <input
              name="title"
              autoFocus
              maxLength={200}
              placeholder="title · tomorrow · !! · #tag ↵"
              onKeyDown={(e) => e.key === "Escape" && setAdding(false)}
              onBlur={(e) => !e.currentTarget.value && setAdding(false)}
              className="px-input"
            />
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="term w-full text-left text-lg text-fg-dim hover:text-accent"
          >
            + add task
          </button>
        )}
      </footer>
    </section>
  );
}
