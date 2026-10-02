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

import { AsciiSpinner } from "@/components/ascii/ascii-spinner";
import { Panel } from "@/components/ascii/panel";
import { PixelButton } from "@/components/ascii/pixel-button";
import { ScrambleText } from "@/components/ascii/scramble-text";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/cn";
import { formText } from "@/lib/form";
import type { CalendarTaskDto } from "@/lib/dto";
import { PRIORITY_META } from "@/lib/format";
import { useCreateTask, useUpdateTask } from "@/lib/mutations";
import { parseCapture } from "@/lib/nl-parse";
import { useCalendar } from "@/lib/queries";

const WEEKDAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

function TaskChip({ task }: { task: CalendarTaskDto }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { task },
  });
  const p = PRIORITY_META[task.priority];
  return (
    <div
      ref={setNodeRef}
      style={
        transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined
      }
      {...attributes}
      {...listeners}
      className={cn(
        "flex cursor-grab items-center gap-1 truncate border border-line bg-bg px-1 text-xs active:cursor-grabbing",
        task.completedAt && "text-muted line-through",
        isDragging && "relative z-20 shadow-px-sm",
      )}
      title={task.title}
    >
      {task.remindAt ? <span aria-hidden>⏰</span> : null}
      {task.priority !== "none" ? <span className={p.cls}>{p.glyph}</span> : null}
      <span className="truncate">{task.title}</span>
    </div>
  );
}

function DayCell({
  day,
  month,
  tasks,
  selected,
  onSelect,
}: {
  day: Date;
  month: Date;
  tasks: CalendarTaskDto[];
  selected: boolean;
  onSelect: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: day.toISOString() });
  const outside = !isSameMonth(day, month);
  return (
    <div
      ref={setNodeRef}
      data-cell=""
      role="gridcell"
      aria-selected={selected}
      tabIndex={selected ? 0 : -1}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        "flex min-h-20 cursor-pointer flex-col gap-0.5 border-r-2 border-b-2 border-line p-1 sm:min-h-28",
        outside ? "bg-bg/60 text-muted" : "bg-bg-2",
        isOver && "bg-accent/20 outline-2 outline-accent",
        selected && "outline-2 -outline-offset-2 outline-accent-2",
      )}
    >
      <span
        className={cn(
          "term self-end px-1 text-lg leading-none",
          isToday(day) && "bg-accent text-accent-fg",
        )}
      >
        {format(day, "d")}
      </span>
      <div className="hidden flex-col gap-0.5 sm:flex">
        {tasks.slice(0, 3).map((t) => (
          <TaskChip key={t.id} task={t} />
        ))}
        {tasks.length > 3 ? (
          <span className="term text-base text-muted">+{tasks.length - 3} more</span>
        ) : null}
      </div>
      {tasks.length > 0 ? (
        <span className="term text-base text-accent sm:hidden" aria-label={`${tasks.length} tasks`}>
          {"▪".repeat(Math.min(tasks.length, 4))}
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
      const key = format(new Date(t.dueAt), "yyyy-MM-dd");
      map.set(key, [...(map.get(key) ?? []), t]);
    }
    return map;
  }, [calendar.data]);

  // Pixel "wipe" of the grid whenever the month changes (anime.js grid stagger).
  useEffect(() => {
    const el = gridRef.current;
    if (!el || reduced) return;
    const cells = el.querySelectorAll<HTMLElement>("[data-cell]");
    const anim = animate(cells, {
      opacity: [0, 1],
      scale: [0.85, 1],
      delay: stagger(14, { grid: [7, Math.ceil(cells.length / 7)], from: "first" }),
      duration: 260,
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
    if (!over) return;
    const task = (active.data.current as { task?: CalendarTaskDto } | undefined)?.task;
    if (!task) return;
    const target = new Date(String(over.id));
    const due = new Date(task.dueAt);
    if (isSameDay(due, target)) return;
    const next = new Date(target);
    next.setHours(due.getHours(), due.getMinutes(), 0, 0);
    // Shift the reminder by the same offset so it stays relative to the due date.
    const remind = task.remindAt
      ? new Date(Date.parse(task.remindAt) + (next.getTime() - due.getTime())).toISOString()
      : undefined;
    update.mutate({
      taskId: task.id,
      dueAt: next.toISOString(),
      ...(remind ? { remindAt: remind } : {}),
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

  const selectedTasks = byDay.get(format(selected, "yyyy-MM-dd")) ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="term glow text-4xl uppercase">
          <span className="text-muted" aria-hidden>
            &gt;{" "}
          </span>
          <ScrambleText text={format(month, "MMMM yyyy")} />
        </h1>
        {calendar.isFetching ? <AsciiSpinner className="term text-2xl text-accent" /> : null}
        <div className="ml-auto flex gap-2">
          <PixelButton
            size="sm"
            onClick={() => setMonth((m) => addMonths(m, -1))}
            aria-label="Previous month"
          >
            ◂
          </PixelButton>
          <PixelButton
            size="sm"
            onClick={() => {
              setMonth(startOfMonth(new Date()));
              setSelected(new Date());
            }}
          >
            today
          </PixelButton>
          <PixelButton
            size="sm"
            onClick={() => setMonth((m) => addMonths(m, 1))}
            aria-label="Next month"
          >
            ▸
          </PixelButton>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_20rem]">
        <DndContext sensors={sensors} onDragEnd={onDragEnd}>
          <div
            role="grid"
            aria-label={format(month, "MMMM yyyy")}
            className="border-t-2 border-l-2 border-line shadow-px"
          >
            <div role="row" className="grid grid-cols-7 bg-fg text-bg">
              {WEEKDAYS.map((d) => (
                <div key={d} role="columnheader" className="term py-0.5 text-center text-lg">
                  {d}
                </div>
              ))}
            </div>
            <div ref={gridRef} className="grid grid-cols-7">
              {days.map((d) => (
                <DayCell
                  key={d.toISOString()}
                  day={d}
                  month={month}
                  tasks={byDay.get(format(d, "yyyy-MM-dd")) ?? []}
                  selected={isSameDay(d, selected)}
                  onSelect={() => setSelected(d)}
                />
              ))}
            </div>
          </div>
        </DndContext>

        <Panel title={format(selected, "EEE d MMM")}>
          <ul className="mb-4 flex flex-col gap-2">
            {selectedTasks.length === 0 ? (
              <li className="term text-lg text-muted">nothing due. enjoy ☺</li>
            ) : null}
            {selectedTasks.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/boards/${t.boardId}?task=${t.id}`}
                  className={cn(
                    "flex items-center gap-2 border-2 border-line bg-bg px-2 py-1 hover:border-accent",
                    t.completedAt && "text-muted line-through",
                  )}
                >
                  <span className="term text-lg text-fg-dim">
                    {format(new Date(t.dueAt), "HH:mm")}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{t.title}</span>
                  {t.remindAt ? <span aria-label="Has reminder">⏰</span> : null}
                </Link>
              </li>
            ))}
          </ul>
          <form onSubmit={quickAdd}>
            <input
              name="title"
              maxLength={200}
              placeholder="+ task for this day (e.g. 3pm call)"
              className="px-input"
            />
          </form>
          <p className="term mt-3 text-base text-muted">drag chips between days to reschedule</p>
        </Panel>
      </div>
    </div>
  );
}
