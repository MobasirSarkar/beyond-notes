"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { formText } from "@/lib/form";
import { useCreateBoard } from "@/lib/mutations";

export function NewBoardButton() {
  const [editing, setEditing] = useState(false);
  const router = useRouter();
  const create = useCreateBoard();

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const name = formText(e.currentTarget, "name");
    if (!name) return setEditing(false);
    create.mutate(
      { name },
      {
        onSuccess: (b) => {
          setEditing(false);
          router.push(`/boards/${b.id}`);
        },
      },
    );
  }

  if (editing) {
    return (
      <form onSubmit={submit} className="absolute right-4 left-4 z-10">
        <input
          name="name"
          autoFocus
          maxLength={60}
          placeholder="board name ↵"
          className="px-input"
          onBlur={() => setEditing(false)}
          onKeyDown={(e) => e.key === "Escape" && setEditing(false)}
        />
      </form>
    );
  }
  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="px-1 hover:text-accent"
      aria-label="New board"
    >
      [+]
    </button>
  );
}
