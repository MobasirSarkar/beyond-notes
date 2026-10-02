"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { z } from "zod";

import { fetchJson } from "./api-client";
import {
  boardDto,
  boardSummaryDto,
  calendarTaskDto,
  focusStatsDto,
  noteDto,
  noteSummaryDto,
  openTaskDto,
  searchHitDto,
  taskDto,
  type BoardDto,
  type NoteDto,
} from "./dto";
import { qk } from "./query-keys";

export function useBoards() {
  return useQuery({
    queryKey: qk.boards,
    queryFn: ({ signal }) => fetchJson("/api/v1/boards", z.array(boardSummaryDto), { signal }),
  });
}

export function useBoard(boardId: string, initialData?: BoardDto) {
  return useQuery({
    queryKey: qk.board(boardId),
    queryFn: ({ signal }) => fetchJson(`/api/v1/boards/${boardId}`, boardDto, { signal }),
    ...(initialData ? { initialData } : {}),
  });
}

export function useTask(taskId: string | null) {
  return useQuery({
    queryKey: qk.task(taskId ?? "none"),
    queryFn: ({ signal }) => fetchJson(`/api/v1/tasks/${taskId ?? ""}`, taskDto, { signal }),
    enabled: taskId !== null,
  });
}

const notesResponse = z.object({
  notes: z.array(noteSummaryDto),
  tags: z.array(z.object({ tag: z.string(), count: z.number().int() })),
});

export function useNotes(params: { q?: string; tag?: string; archived?: boolean }) {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.tag) search.set("tag", params.tag);
  if (params.archived) search.set("archived", "true");
  return useQuery({
    queryKey: qk.notes(params),
    queryFn: ({ signal }) =>
      fetchJson(`/api/v1/notes?${search.toString()}`, notesResponse, { signal }),
    placeholderData: keepPreviousData,
  });
}

export function useNote(noteId: string, initialData?: NoteDto) {
  return useQuery({
    queryKey: qk.note(noteId),
    queryFn: ({ signal }) => fetchJson(`/api/v1/notes/${noteId}`, noteDto, { signal }),
    ...(initialData ? { initialData } : {}),
  });
}

export function useSearch(q: string) {
  const trimmed = q.trim();
  return useQuery({
    queryKey: qk.search(trimmed),
    queryFn: ({ signal }) =>
      fetchJson(`/api/v1/search?q=${encodeURIComponent(trimmed)}`, z.array(searchHitDto), {
        signal,
      }),
    enabled: trimmed.length >= 2,
    staleTime: 10_000,
    placeholderData: keepPreviousData,
  });
}

export function useCalendar(from: Date, to: Date) {
  const f = from.toISOString();
  const t = to.toISOString();
  return useQuery({
    queryKey: qk.calendar(f, t),
    queryFn: ({ signal }) =>
      fetchJson(
        `/api/v1/calendar?from=${encodeURIComponent(f)}&to=${encodeURIComponent(t)}`,
        z.array(calendarTaskDto),
        { signal },
      ),
    placeholderData: keepPreviousData,
  });
}

export function useOpenTasks() {
  return useQuery({
    queryKey: qk.openTasks,
    queryFn: ({ signal }) => fetchJson("/api/v1/tasks/open", z.array(openTaskDto), { signal }),
  });
}

export function useStats() {
  const tz = new Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  return useQuery({
    queryKey: qk.stats(tz),
    queryFn: ({ signal }) =>
      fetchJson(`/api/v1/stats?tz=${encodeURIComponent(tz)}`, focusStatsDto, { signal }),
  });
}
