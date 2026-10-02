"use client";

import { Command } from "cmdk";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useDeferredValue, useState } from "react";

import { AsciiSpinner } from "@/components/ascii/ascii-spinner";
import { Modal } from "@/components/ascii/modal";
import { NAV_ITEMS } from "@/components/shell/nav-items";
import { useUi } from "@/components/shell/ui-state";
import { useCreateNote } from "@/lib/mutations";
import { setPrefs, usePrefs } from "@/lib/prefs";
import { useBoards, useSearch } from "@/lib/queries";

import { Highlight } from "./highlight";

const THEMES = ["phosphor", "amber", "paper", "system"] as const;

export function CommandPalette() {
  const ui = useUi();
  const router = useRouter();
  const prefs = usePrefs();
  const [query, setQuery] = useState("");
  const deferred = useDeferredValue(query);
  const search = useSearch(deferred);
  const boards = useBoards();
  const createNote = useCreateNote();

  const close = () => {
    ui.setPaletteOpen(false);
    setQuery("");
  };
  const go = <T extends string>(href: Route<T>) => {
    close();
    router.push(href);
  };

  const itemCls =
    "flex cursor-pointer items-center gap-3 px-3 py-1.5 data-[selected=true]:bg-fg data-[selected=true]:text-bg";

  return (
    <Modal open={ui.paletteOpen} onClose={close} title="Command palette" bare position="top">
      <Command
        label="Command palette"
        shouldFilter={!search.data?.length}
        loop
        className="flex flex-col"
      >
        <div className="flex items-center gap-2 border-b-2 border-line px-3">
          <span className="term text-2xl text-accent" aria-hidden>
            &gt;
          </span>
          <Command.Input
            autoFocus
            value={query}
            onValueChange={setQuery}
            placeholder="type a command or search…"
            className="term h-12 flex-1 bg-transparent text-2xl outline-none placeholder:text-muted"
            maxLength={120}
          />
          {search.isFetching ? <AsciiSpinner className="text-accent" /> : null}
        </div>
        <Command.List className="max-h-[55vh] overflow-y-auto py-2">
          <Command.Empty className="term px-3 py-4 text-lg text-muted">
            {query.trim().length >= 2 && !search.isFetching
              ? "no matches. try another spell."
              : "…"}
          </Command.Empty>

          {search.data && search.data.length > 0 ? (
            <Command.Group
              heading="Results"
              className="term text-lg text-muted [&_[cmdk-group-heading]]:px-3"
            >
              {search.data.map((hit) => (
                <Command.Item
                  key={`${hit.kind}-${hit.id}`}
                  value={`${hit.kind}-${hit.id}-${hit.title}`}
                  onSelect={() =>
                    hit.kind === "note"
                      ? go(`/notes/${hit.id}`)
                      : go(`/boards/${hit.boardId ?? ""}?task=${hit.id}`)
                  }
                  className={itemCls}
                >
                  <span aria-hidden className="text-accent">
                    {hit.kind === "note" ? "✎" : "▣"}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-mono text-sm font-bold">
                      {hit.title || "untitled"}
                    </span>
                    <span className="block truncate font-mono text-xs opacity-75">
                      <Highlight text={hit.snippet} />
                    </span>
                  </span>
                </Command.Item>
              ))}
            </Command.Group>
          ) : null}

          <Command.Group
            heading="Actions"
            className="term text-xl [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:text-muted"
          >
            <Command.Item className={itemCls} onSelect={() => ui.openCapture()}>
              <span aria-hidden>+</span> New task
            </Command.Item>
            <Command.Item className={itemCls} onSelect={() => ui.openCapture({ voice: true })}>
              <span aria-hidden>◉</span> Voice capture task
            </Command.Item>
            <Command.Item
              className={itemCls}
              onSelect={() =>
                createNote.mutate(
                  { id: crypto.randomUUID(), title: "" },
                  { onSuccess: (n) => go(`/notes/${n.id}`) },
                )
              }
            >
              <span aria-hidden>✎</span> New note
            </Command.Item>
            <Command.Item className={itemCls} onSelect={() => go("/focus")}>
              <span aria-hidden>◷</span> Start focus session
            </Command.Item>
            <Command.Item
              className={itemCls}
              onSelect={() => {
                const next = THEMES[(THEMES.indexOf(prefs.theme) + 1) % THEMES.length] ?? "system";
                setPrefs({ theme: next });
              }}
            >
              <span aria-hidden>◐</span> Cycle theme{" "}
              <span className="ml-auto text-muted">{prefs.theme}</span>
            </Command.Item>
            <Command.Item className={itemCls} onSelect={() => setPrefs({ crt: !prefs.crt })}>
              <span aria-hidden>▒</span> Toggle CRT effect{" "}
              <span className="ml-auto text-muted">{prefs.crt ? "on" : "off"}</span>
            </Command.Item>
            <Command.Item
              className={itemCls}
              onSelect={() => {
                close();
                ui.setHelpOpen(true);
              }}
            >
              <span aria-hidden>?</span> Keyboard shortcuts
            </Command.Item>
          </Command.Group>

          <Command.Group
            heading="Go to"
            className="term text-xl [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:text-muted"
          >
            {NAV_ITEMS.map((n) => (
              <Command.Item key={n.href} className={itemCls} onSelect={() => go(n.href)}>
                <span aria-hidden>{n.glyph}</span> {n.label}
                <span className="ml-auto text-muted">{n.key}</span>
              </Command.Item>
            ))}
            {boards.data?.map((b) => (
              <Command.Item
                key={b.id}
                value={`board ${b.name}`}
                className={itemCls}
                onSelect={() => go(`/boards/${b.id}`)}
              >
                <span aria-hidden>▤</span> Board: {b.name}
              </Command.Item>
            ))}
          </Command.Group>
        </Command.List>
      </Command>
    </Modal>
  );
}
