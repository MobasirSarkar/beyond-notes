"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Input } from "@/components/ui/input";
import { useCreateBoard } from "@/lib/api/mutations";
import { useBoards } from "@/lib/api/queries";
import { cn } from "@/lib/utils/cn";
import { formText } from "@/lib/utils/form";

/** Boards as tabs (replacing the old sidebar list), plus an inline "new board". */
export function BoardTabs({ activeId }: { activeId: string }) {
  const router = useRouter();
  const boards = useBoards();
  const create = useCreateBoard();
  const [adding, setAdding] = useState(false);

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const name = formText(e.currentTarget, "name");
    if (!name) return setAdding(false);
    create.mutate(
      { name },
      {
        onSuccess: (b) => {
          setAdding(false);
          router.push(`/boards/${b.id}`);
        },
      },
    );
  }

  return (
    <nav aria-label="Boards" className="flex items-end gap-1 overflow-x-auto rule-b">
      {boards.data?.map((b) => {
        const active = b.id === activeId;
        return (
          <Link
            key={b.id}
            href={`/boards/${b.id}`}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex h-10 shrink-0 items-center gap-2 px-3 text-sm whitespace-nowrap transition-colors duration-(--dur-1)",
              active ? "font-medium text-fg edge-b" : "text-muted hover:text-fg",
            )}
          >
            {b.name}
            <span className="text-xs text-subtle tabular-nums">{b.openTasks}</span>
          </Link>
        );
      })}
      {adding ? (
        <form onSubmit={submit} className="flex h-10 shrink-0 items-center">
          <Input
            name="name"
            autoFocus
            maxLength={60}
            aria-label="New board name"
            placeholder="board name ↵"
            onBlur={() => setAdding(false)}
            onKeyDown={(e) => e.key === "Escape" && setAdding(false)}
            className="h-8 w-44"
          />
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="flex h-10 shrink-0 items-center px-3 text-sm text-subtle hover:text-fg"
        >
          + new board
        </button>
      )}
    </nav>
  );
}
