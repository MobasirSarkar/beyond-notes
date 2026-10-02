"use client";

import {
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
import { useState } from "react";

import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { useMoveTask } from "@/lib/api/mutations";
import { playBeep } from "@/lib/browser/sound";
import { getPrefs } from "@/lib/stores/prefs";
import type { BoardDto, TaskDto } from "@/types/dto";
import type { ColumnItems } from "@/types/kanban";

import { starBurst } from "./burst";
import { kanbanKeyboardCoordinates } from "./keyboard-coordinates";

const findContainer = (id: UniqueIdentifier, source: ColumnItems): string | undefined => {
  const key = String(id);
  if (key in source) return key;
  return Object.keys(source).find((col) => source[col]?.includes(key));
};

/**
 * Multi-column drag & drop state for a board. Items move between columns
 * locally during the drag; on drop a single `moveTask` mutation is sent with
 * the neighbour ids (the server computes the fractional position).
 */
export function useBoardDnd(
  board: BoardDto,
  baseItems: ColumnItems,
  taskById: Map<string, TaskDto>,
) {
  const reduced = useReducedMotion();
  const moveTask = useMoveTask();
  const [dragItems, setDragItems] = useState<ColumnItems | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: kanbanKeyboardCoordinates,
      // Space lifts/drops; Enter is reserved for opening the task.
      keyboardCodes: { start: ["Space"], cancel: ["Escape"], end: ["Space"] },
    }),
  );

  const onDragStart = (e: DragStartEvent) => {
    setActiveId(String(e.active.id));
    setDragItems(baseItems);
    if (getPrefs().sound) playBeep("blip");
  };

  const onDragOver = ({ active, over }: DragOverEvent) => {
    if (!over) return;
    setDragItems((prev) => {
      const current = prev ?? baseItems;
      const from = findContainer(active.id, current);
      const to = findContainer(over.id, current);
      if (!from || !to || from === to) return current;
      const toList = current[to] ?? [];
      const overIndex = toList.indexOf(String(over.id));
      const insertAt = overIndex >= 0 ? overIndex : toList.length;
      return {
        ...current,
        [from]: (current[from] ?? []).filter((id) => id !== String(active.id)),
        [to]: [...toList.slice(0, insertAt), String(active.id), ...toList.slice(insertAt)],
      };
    });
  };

  const reset = () => {
    setActiveId(null);
    setDragItems(null);
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    const current = dragItems ?? baseItems;
    reset();
    if (!over) return;

    const taskId = String(active.id);
    const container = findContainer(taskId, current);
    if (!container || container !== findContainer(over.id, current)) return;

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
      if (rect) starBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, reduced);
      if (getPrefs().sound) playBeep("done");
    }
    moveTask.mutate({ taskId, columnId: container, afterTaskId, beforeTaskId });
  };

  return {
    sensors,
    items: dragItems ?? baseItems,
    activeTask: activeId ? taskById.get(activeId) : undefined,
    handlers: { onDragStart, onDragOver, onDragEnd, onDragCancel: reset },
  };
}
