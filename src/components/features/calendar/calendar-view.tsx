"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { animate, stagger } from "animejs";
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Frame } from "@/components/ui/frame";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Spinner } from "@/components/ui/spinner";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { useCreateTask, useUpdateTask } from "@/lib/api/mutations";
import { useCalendar } from "@/lib/api/queries";
import { PRIORITY_META } from "@/lib/constants/priority";
import { cn } from "@/lib/utils/cn";
import { formText } from "@/lib/utils/form";
import { parseCapture } from "@/lib/utils/nl-parse";
import type { CalendarTaskDto } from "@/types/dto";

const WEEKDAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
const dayKey = (d: Date) => format(d, "yyyy-MM-dd");

function TaskChip({ task }: { task: CalendarTaskDto }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
  });
  return (
    <div
      ref={setNodeRef}
      style={
        transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined
      }
      {...attributes}
      {...listeners}
      title={task.title}
      className={cn(
        "flex h-6 cursor-grab items-center gap-1 truncate bg-bg px-1.5 text-2xs hairline active:cursor-grabbing",
        task.completedAt && "text-subtle line-through",
        isDragging && "relative z-(--z-sticky) rule-strong",
      )}
    >
      {task.priority !== "none" ? (
        <span className="font-bold">{PRIORITY_META[task.priority].glyph}</span>
      ) : null}
      <span className="truncate">{task.title}</span>
    </div>
  );
}

type DayProps = {
  day: Date;
  month: Date;
  tasks: CalendarTaskDto[];
  selected: boolean;
  onSelect: () => void;
};

function DayCell({ day, month, tasks, selected, onSelect }: DayProps) {
  const { setNodeRef, isOver } = useDroppable({ id: dayKey(day) });
  const outside = !isSameMonth(day, month);
  const today = isToday(day);
  return (
    <div
      ref={setNodeRef}
      data-cell=""
      role="gridcell"
      aria-selected={selected}
      aria-label={`${format(day, "EEEE d MMMM")}, ${tasks.length} tasks`}
      tabIndex={selected ? 0 : -1}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        "flex min-h-16 cursor-pointer flex-col gap-1 p-1.5 transition-colors duration-(--dur-1) rule-b rule-r sm:min-h-28 sm:p-2",
        outside ? "bg-surface text-subtle" : "bg-bg",
        isOver && "bg-surface-2",
        selected && "inset-frame",
      )}
    >
      <span
        className={cn(
          "flex size-6 items-center justify-center self-end text-xs tabular-nums",
          today && "bg-fg font-bold text-bg",
        )}
      >
        {format(day, "d")}
      </span>
      <div className="hidden flex-col gap-1 sm:flex">
        {tasks.slice(0, 3).map((t) => (
          <TaskChip key={t.id} task={t} />
        ))}
        {tasks.length > 3 ? (
          <span className="text-2xs text-muted">+{tasks.length - 3} more</span>
        ) : null}
      </div>
      {tasks.length > 0 ? (
        <span aria-hidden className="text-2xs tracking-widest sm:hidden">
          {"•".repeat(Math.min(tasks.length, 4))}
        </span>
      ) : null}
    </div>
  );
}

export function CalendarView() {
  const reduced = useReducedMotion();
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState(() => new Date());
  const gridRef = useRef<HTMLDivElement>(null);

  const gridStart = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
  const gridEnd = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
  const days: Date[] = [];
  for (let d = gridStart; d <= gridEnd; d = addDays(d, 1)) days.push(d);

  const calendar = useCalendar(gridStart, addDays(gridEnd, 1));
  const update = useUpdateTask();
  const create = useCreateTask();

  const byDay = useMemo(() => {
    const map = new Map<string, CalendarTaskDto[]>();
    for (const t of calendar.data ?? []) {
      const key = dayKey(new Date(t.dueAt));
      map.set(key, [...(map.get(key) ?? []), t]);
    }
    return map;
  }, [calendar.data]);
  const byId = useMemo(() => new Map((calendar.data ?? []).map((t) => [t.id, t])), [calendar.data]);

  // Diagonal reveal of the grid whenever the month changes (anime.js grid stagger).
  useEffect(() => {
    const el = gridRef.current;
    if (!el || reduced) return;
    const cells = el.querySelectorAll<HTMLElement>("[data-cell]");
    const anim = animate(cells, {
      opacity: [0, 1],
      delay: stagger(12, { grid: [7, Math.ceil(cells.length / 7)], from: "first" }),
      duration: 240,
      ease: "outQuad",
    });
    return () => {
      anim.revert();
    };
  }, [month, reduced]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  );

  function onDragEnd({ active, over }: DragEndEvent) {
    const task = byId.get(String(active.id));
    if (!over || !task) return;
    const [y, m, d] = String(over.id).split("-").map(Number);
    if (y === undefined || m === undefined || d === undefined) return;
    const due = new Date(task.dueAt);
    const next = new Date(y, m - 1, d, due.getHours(), due.getMinutes());
    if (isSameDay(due, next)) return;
    // Shift the reminder by the same offset so it stays relative to the due date.
    const remindAt = task.remindAt
      ? new Date(Date.parse(task.remindAt) + (next.getTime() - due.getTime())).toISOString()
      : undefined;
    update.mutate({
      taskId: task.id,
      dueAt: next.toISOString(),
      ...(remindAt ? { remindAt } : {}),
    });
  }

  function quickAdd(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const raw = formText(form, "title");
    if (!raw) return;
    const p = parseCapture(raw, selected);
    const due = p.dueAt ?? new Date(new Date(selected).setHours(9, 0, 0, 0));
    create.mutate({
      id: crypto.randomUUID(),
      title: p.title || raw.slice(0, 200),
      priority: p.priority,
      labels: p.labels,
      dueAt: due.toISOString(),
    });
    form.reset();
  }

  const agenda = byDay.get(dayKey(selected)) ?? [];

  return (
    <div className="flex flex-col">
      <PageHeader
        path="~/calendar"
        title={format(month, "MMMM yyyy").toLowerCase()}
        description="drag tasks between days to reschedule"
        actions={
          <>
            {calendar.isFetching ? <Spinner className="text-muted" /> : null}
            <Button
              size="sm"
              onClick={() => setMonth((m) => addMonths(m, -1))}
              aria-label="Previous month"
            >
              ←
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setMonth(startOfMonth(new Date()));
                setSelected(new Date());
              }}
            >
              today
            </Button>
            <Button
              size="sm"
              onClick={() => setMonth((m) => addMonths(m, 1))}
              aria-label="Next month"
            >
              →
            </Button>
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <DndContext sensors={sensors} onDragEnd={onDragEnd}>
          <div role="grid" aria-label={format(month, "MMMM yyyy")} className="rule-l rule-t">
            <div role="row" className="grid grid-cols-7 bg-surface">
              {WEEKDAYS.map((d) => (
                <div key={d} role="columnheader" className="py-2 text-center label rule-b rule-r">
                  {d}
                </div>
              ))}
            </div>
            <div ref={gridRef} role="row" className="grid grid-cols-7">
              {days.map((d) => (
                <DayCell
                  key={dayKey(d)}
                  day={d}
                  month={month}
                  tasks={byDay.get(dayKey(d)) ?? []}
                  selected={isSameDay(d, selected)}
                  onSelect={() => setSelected(d)}
                />
              ))}
            </div>
          </div>
        </DndContext>

        <Frame
          title={format(selected, "EEE d MMM").toLowerCase()}
          meta={`${agenda.length} due`}
          as="aside"
        >
          <div className="flex flex-col gap-4">
            {agenda.length === 0 ? (
              <p className="text-sm text-subtle">nothing due</p>
            ) : (
              <ul className="flex flex-col">
                {agenda.map((t) => (
                  <li key={t.id}>
                    <Link
                      href={`/boards/${t.boardId}?task=${t.id}`}
                      className={cn(
                        "-mx-2 flex items-center gap-3 px-2 py-2 text-sm hover:bg-surface",
                        t.completedAt && "text-subtle line-through",
                      )}
                    >
                      <span className="text-xs text-subtle tabular-nums">
                        {format(new Date(t.dueAt), "HH:mm")}
                      </span>
                      <span className="min-w-0 flex-1 truncate">{t.title}</span>
                      {t.remindAt ? <span aria-label="Has reminder">⏰</span> : null}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <form onSubmit={quickAdd}>
              <Input
                name="title"
                maxLength={200}
                placeholder="+ add for this day (e.g. 3pm call)"
                aria-label="New task for this day"
              />
            </form>
          </div>
        </Frame>
      </div>
    </div>
  );
}
