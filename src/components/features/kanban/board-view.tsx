"use client";

import { closestCorners, DndContext, DragOverlay } from "@dnd-kit/core";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";

import { ConfirmButton } from "@/components/ui/confirm-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { useLatch } from "@/hooks/use-latch";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { useCreateColumn, useDeleteBoard, useRenameBoard } from "@/lib/api/mutations";
import { useBoard } from "@/lib/api/queries";
import { comparePosition } from "@/lib/utils/position";
import { formText } from "@/lib/utils/form";
import type { BoardDto, TaskDto } from "@/types/dto";
import type { BoardFilters, ColumnItems } from "@/types/kanban";

import { BoardTabs } from "./board-tabs";
import { BoardToolbar } from "./board-toolbar";
import { KanbanColumn } from "./kanban-column";
import { TaskCardBody } from "./task-card";
import { useBoardDnd } from "./use-board-dnd";

const TaskSheet = dynamic(() => import("./task-sheet").then((m) => m.TaskSheet), { ssr: false });

const NO_FILTERS: BoardFilters = { query: "", priority: "all", label: null };

function matches(t: TaskDto, f: BoardFilters, q: string): boolean {
  return (
    (!q || t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)) &&
    (f.priority === "all" || t.priority === f.priority) &&
    (f.label === null || t.labels.includes(f.label))
  );
}

// Native history API: Next keeps useSearchParams in sync without a route
// navigation, so opening a task doesn't re-run the page transition.
function setOpenTask(id: string | null) {
  const url = new URL(window.location.href);
  if (id) url.searchParams.set("task", id);
  else url.searchParams.delete("task");
  window.history.replaceState(null, "", url.toString());
}

export function BoardView({ initial }: { initial: BoardDto }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reduced = useReducedMotion();
  const { data: board = initial } = useBoard(initial.id, initial);
  const createColumn = useCreateColumn();
  const renameBoard = useRenameBoard();
  const deleteBoard = useDeleteBoard();
  const [filters, setFilters] = useState<BoardFilters>(NO_FILTERS);
  const [renaming, setRenaming] = useState(false);

  const taskById = useMemo(() => new Map(board.tasks.map((t) => [t.id, t])), [board.tasks]);
  const labels = useMemo(
    () => [...new Set(board.tasks.flatMap((t) => t.labels))].toSorted(),
    [board.tasks],
  );
  const baseItems = useMemo<ColumnItems>(() => {
    const q = filters.query.trim().toLowerCase();
    const items: ColumnItems = Object.fromEntries(board.columns.map((c) => [c.id, []]));
    for (const t of board.tasks.toSorted(comparePosition)) {
      if (matches(t, filters, q)) items[t.columnId]?.push(t.id);
    }
    return items;
  }, [board, filters]);

  const dnd = useBoardDnd(board, baseItems, taskById);
  const openTaskId = searchParams.get("task");
  const openTask = openTaskId ? (taskById.get(openTaskId) ?? null) : null;
  const sheetMounted = useLatch(openTaskId !== null);
  const openCount = board.tasks.filter((t) => !t.completedAt).length;

  function addColumn(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const name = formText(form, "name");
    if (name) createColumn.mutate({ boardId: board.id, name });
    form.reset();
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        path="~/boards"
        title={board.name}
        description={`${board.columns.length} columns · ${openCount} open · ${board.tasks.length - openCount} done`}
        actions={
          renaming ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const name = formText(e.currentTarget, "name");
                if (name) renameBoard.mutate({ boardId: board.id, name });
                setRenaming(false);
              }}
            >
              <Input
                name="name"
                defaultValue={board.name}
                autoFocus
                maxLength={60}
                aria-label="Board name"
                onBlur={(e) => e.currentTarget.form?.requestSubmit()}
                onKeyDown={(e) => e.key === "Escape" && setRenaming(false)}
                className="w-56"
              />
            </form>
          ) : (
            <>
              <Button size="sm" variant="ghost" onClick={() => setRenaming(true)}>
                rename
              </Button>
              <ConfirmButton
                onConfirm={() =>
                  deleteBoard.mutate(
                    { boardId: board.id },
                    { onSuccess: () => router.push("/boards") },
                  )
                }
              >
                delete board
              </ConfirmButton>
            </>
          )
        }
        className="mb-0"
      >
        <BoardTabs activeId={board.id} />
      </PageHeader>

      <BoardToolbar
        filters={filters}
        labels={labels}
        onChange={(patch) => setFilters((f) => ({ ...f, ...patch }))}
      />

      <DndContext
        sensors={dnd.sensors}
        collisionDetection={closestCorners}
        {...dnd.handlers}
        accessibility={{
          screenReaderInstructions: {
            draggable:
              "To pick up a task press space. Use arrow keys to move between columns and positions, space to drop, escape to cancel.",
          },
        }}
      >
        <div className="-mx-(--gutter) flex snap-x snap-mandatory scroll-px-(--gutter) items-start gap-3 overflow-x-auto px-(--gutter) pb-4 sm:snap-none">
          {board.columns.map((col, i) => (
            <KanbanColumn
              key={col.id}
              boardId={board.id}
              column={col}
              tasks={(dnd.items[col.id] ?? []).flatMap((id) => taskById.get(id) ?? [])}
              isFirst={i === 0}
              isLast={i === board.columns.length - 1}
              onOpenTask={setOpenTask}
            />
          ))}
          <form onSubmit={addColumn} className="w-(--column-w) shrink-0 snap-start">
            <Input
              name="name"
              maxLength={40}
              placeholder="+ new column"
              aria-label="New column name"
            />
          </form>
        </div>

        <DragOverlay
          dropAnimation={reduced ? null : { duration: 160, easing: "cubic-bezier(0.2,0.8,0.2,1)" }}
        >
          {dnd.activeTask ? (
            <div className="w-(--column-w) cursor-grabbing px-2">
              <TaskCardBody task={dnd.activeTask} lifted />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {sheetMounted ? <TaskSheet task={openTask} onClose={() => setOpenTask(null)} /> : null}
    </div>
  );
}
