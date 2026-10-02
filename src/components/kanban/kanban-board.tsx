"use client";

import {
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";

import { ConfirmButton } from "@/components/ascii/confirm-button";
import { PixelButton } from "@/components/ascii/pixel-button";
import { ScrambleText } from "@/components/ascii/scramble-text";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import type { BoardDto, TaskDto } from "@/lib/dto";
import { formText } from "@/lib/form";
import { PRIORITY_META } from "@/lib/format";
import { useCreateColumn, useDeleteBoard, useMoveTask, useRenameBoard } from "@/lib/mutations";
import { comparePosition } from "@/lib/position";
import { useBoard } from "@/lib/queries";
import { usePrefs } from "@/lib/prefs";
import { playBeep } from "@/lib/sound";
import { PRIORITIES } from "@/lib/validation";

import { asciiBurst } from "./burst";
import { KanbanColumn } from "./kanban-column";
import { kanbanKeyboardCoordinates } from "./keyboard-coordinates";
import { TaskCardBody } from "./task-card";
import { TaskDetail } from "./task-detail";

type Items = Record<string, string[]>;

function groupTasks(board: BoardDto, filter: (t: TaskDto) => boolean): Items {
  const items: Items = Object.fromEntries(board.columns.map((c) => [c.id, [] as string[]]));
  for (const t of board.tasks.toSorted(comparePosition)) {
    if (filter(t)) items[t.columnId]?.push(t.id);
  }
  return items;
}

// Native history API: Next keeps useSearchParams in sync without a route
// navigation, so opening a task doesn't re-run page transitions.
function setOpenTask(id: string | null) {
  const url = new URL(window.location.href);
  if (id) url.searchParams.set("task", id);
  else url.searchParams.delete("task");
  window.history.replaceState(null, "", url);
}

export function KanbanBoard({ initial }: { initial: BoardDto }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reduced = useReducedMotion();
  const prefs = usePrefs();
  const { data: board = initial } = useBoard(initial.id, initial);
  const moveTask = useMoveTask();
  const createColumn = useCreateColumn();
  const renameBoard = useRenameBoard();
  const deleteBoard = useDeleteBoard();

  const [query, setQuery] = useState("");
  const [priority, setPriority] = useState<(typeof PRIORITIES)[number] | "all">("all");
  const [label, setLabel] = useState<string | null>(null);
  const [dragItems, setDragItems] = useState<Items | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [renaming, setRenaming] = useState(false);

  const openTaskId = searchParams.get("task");

  const filtering = query.trim() !== "" || priority !== "all" || label !== null;
  const filter = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (t: TaskDto) =>
      (!q || t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)) &&
      (priority === "all" || t.priority === priority) &&
      (label === null || t.labels.includes(label));
  }, [query, priority, label]);

  const baseItems = useMemo(() => groupTasks(board, filter), [board, filter]);
  const items = dragItems ?? baseItems;
  const taskById = useMemo(() => new Map(board.tasks.map((t) => [t.id, t])), [board.tasks]);
  const allLabels = useMemo(
    () => [...new Set(board.tasks.flatMap((t) => t.labels))].toSorted(),
    [board.tasks],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: kanbanKeyboardCoordinates,
      // Space lifts/drops; Enter is reserved for opening the task.
      keyboardCodes: { start: ["Space"], cancel: ["Escape"], end: ["Space"] },
    }),
  );

  const findContainer = (id: UniqueIdentifier, source: Items): string | undefined => {
    const key = String(id);
    if (key in source) return key;
    return Object.keys(source).find((col) => source[col]?.includes(key));
  };

  function onDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
    setDragItems(baseItems);
    if (prefs.sound) playBeep("blip");
  }

  function onDragOver({ active, over }: DragOverEvent) {
    if (!over) return;
    setDragItems((prev) => {
      const current = prev ?? baseItems;
      const from = findContainer(active.id, current);
      const to = findContainer(over.id, current);
      if (!from || !to || from === to) return current;
      const fromList = current[from] ?? [];
      const toList = current[to] ?? [];
      const overIndex = toList.indexOf(String(over.id));
      const insertAt = overIndex >= 0 ? overIndex : toList.length;
      return {
        ...current,
        [from]: fromList.filter((id) => id !== String(active.id)),
        [to]: [...toList.slice(0, insertAt), String(active.id), ...toList.slice(insertAt)],
      };
    });
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    const current = dragItems ?? baseItems;
    setActiveId(null);
    setDragItems(null);
    if (!over) return;

    const taskId = String(active.id);
    const container = findContainer(taskId, current);
    const overContainer = findContainer(over.id, current);
    if (!container || container !== overContainer) return;

    let list = current[container] ?? [];
    const oldIndex = list.indexOf(taskId);
    const overIndex = list.indexOf(String(over.id));
    if (overIndex >= 0 && oldIndex !== overIndex) list = arrayMove(list, oldIndex, overIndex);

    const index = list.indexOf(taskId);
    const afterTaskId = list[index - 1] ?? null;
    const beforeTaskId = list[index + 1] ?? null;

    const original = taskById.get(taskId);
    const originalList = baseItems[original?.columnId ?? ""] ?? [];
    const originalIndex = originalList.indexOf(taskId);
    const unchanged =
      original?.columnId === container &&
      (originalList[originalIndex - 1] ?? null) === afterTaskId &&
      (originalList[originalIndex + 1] ?? null) === beforeTaskId;
    if (unchanged) return;

    const target = board.columns.find((c) => c.id === container);
    const source = board.columns.find((c) => c.id === original?.columnId);
    if (target?.isDone && !source?.isDone) {
      const rect = active.rect.current.translated;
      if (rect) asciiBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, reduced);
      if (prefs.sound) playBeep("done");
    }
    moveTask.mutate({ taskId, columnId: container, afterTaskId, beforeTaskId });
  }

  function addColumn(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const name = formText(form, "name");
    if (name) createColumn.mutate({ boardId: board.id, name });
    form.reset();
  }

  const activeTask = activeId ? taskById.get(activeId) : undefined;
  const openTask = openTaskId ? taskById.get(openTaskId) : undefined;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        {renaming ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const name = formText(e.currentTarget, "name");
              if (name) renameBoard.mutate({ boardId: board.id, name });
              setRenaming(false);
            }}
          >
            <input
              name="name"
              defaultValue={board.name}
              autoFocus
              maxLength={60}
              onBlur={(e) => e.currentTarget.form?.requestSubmit()}
              className="px-input term text-3xl"
            />
          </form>
        ) : (
          <h1 className="term glow text-4xl uppercase">
            <span className="text-muted" aria-hidden>
              &gt;{" "}
            </span>
            <ScrambleText text={board.name} />
          </h1>
        )}
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <PixelButton size="sm" onClick={() => setRenaming(true)}>
            rename
          </PixelButton>
          <ConfirmButton
            onConfirm={() =>
              deleteBoard.mutate({ boardId: board.id }, { onSuccess: () => router.push("/boards") })
            }
          >
            delete board
          </ConfirmButton>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2" role="search" aria-label="Filter tasks">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="/ filter cards"
          maxLength={120}
          className="px-input w-56"
          aria-label="Filter by text"
        />
        <div className="flex border-2 border-line" role="group" aria-label="Filter by priority">
          {(["all", ...PRIORITIES] as const).map((p) => (
            <button
              key={p}
              type="button"
              aria-pressed={priority === p}
              onClick={() => setPriority(p)}
              className={`term px-2 text-lg ${priority === p ? "bg-fg text-bg" : "hover:bg-bg-3"}`}
              title={p}
            >
              {p === "all" ? "all" : p === "none" ? "·" : PRIORITY_META[p].glyph}
            </button>
          ))}
        </div>
        {allLabels.map((l) => (
          <button
            key={l}
            type="button"
            aria-pressed={label === l}
            onClick={() => setLabel(label === l ? null : l)}
            className={`px-tag ${label === l ? "bg-accent-2 text-bg" : "text-accent-2"}`}
          >
            #{l}
          </button>
        ))}
        {filtering ? (
          <button
            type="button"
            className="term text-lg text-muted hover:text-accent"
            onClick={() => {
              setQuery("");
              setPriority("all");
              setLabel(null);
            }}
          >
            [clear]
          </button>
        ) : null}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        onDragCancel={() => {
          setActiveId(null);
          setDragItems(null);
        }}
        accessibility={{
          screenReaderInstructions: {
            draggable:
              "To pick up a task, press space or enter. Use arrow keys to move, space to drop, escape to cancel.",
          },
        }}
      >
        <div className="-mx-3 flex items-start gap-4 overflow-x-auto px-3 pt-1 pb-4 sm:-mx-6 sm:px-6">
          {board.columns.map((col, i) => (
            <KanbanColumn
              key={col.id}
              boardId={board.id}
              column={col}
              tasks={(items[col.id] ?? []).flatMap((id) => taskById.get(id) ?? [])}
              isFirst={i === 0}
              isLast={i === board.columns.length - 1}
              onOpenTask={setOpenTask}
              dndDisabled={false}
            />
          ))}

          <form
            onSubmit={addColumn}
            className="w-64 shrink-0 border-2 border-dashed border-line p-2"
          >
            <input
              name="name"
              maxLength={40}
              placeholder="+ new column ↵"
              className="px-input term text-xl"
            />
          </form>
        </div>

        <DragOverlay dropAnimation={reduced ? null : { duration: 160, easing: "steps(4, end)" }}>
          {activeTask ? (
            <div className="w-[17rem] cursor-grabbing">
              <TaskCardBody task={activeTask} dragging />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <TaskDetail task={openTask ?? null} onClose={() => setOpenTask(null)} />
    </div>
  );
}
