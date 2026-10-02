"use client";

import { Command } from "cmdk";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useDeferredValue, useState, type ReactNode } from "react";

import { Modal } from "@/components/ui/modal";
import { Spinner } from "@/components/ui/spinner";
import { useSignOut } from "@/hooks/use-sign-out";
import { useCreateNote } from "@/lib/api/mutations";
import { useBoards, useSearch } from "@/lib/api/queries";
import { NAV_WINDOWS } from "@/lib/constants/nav";
import { setPrefs, usePrefs } from "@/lib/stores/prefs";
import { ui, useUi } from "@/lib/stores/ui";
import type { ThemePref } from "@/types/prefs";

import { Highlight } from "./highlight";

const THEMES: readonly ThemePref[] = ["system", "light", "dark"];

const ITEM =
  "flex h-10 cursor-pointer items-center gap-3 px-4 text-sm data-[selected=true]:bg-fg data-[selected=true]:text-bg";
const GROUP =
  "py-2 [&_[cmdk-group-heading]]:label [&_[cmdk-group-heading]]:px-4 [&_[cmdk-group-heading]]:pb-1";

function Hint({ children }: { children: ReactNode }) {
  return <span className="ml-auto text-xs opacity-60">{children}</span>;
}

export function CommandPalette() {
  const open = useUi((s) => s.paletteOpen);
  const router = useRouter();
  const theme = usePrefs((p) => p.theme);
  const [query, setQuery] = useState("");
  const deferred = useDeferredValue(query);
  const search = useSearch(deferred);
  const boards = useBoards();
  const createNote = useCreateNote();
  const { signOut } = useSignOut();

  const close = () => {
    ui.closePalette();
    setQuery("");
  };
  const go = <T extends string>(href: Route<T>) => {
    close();
    router.push(href);
  };
  const hasResults = (search.data?.length ?? 0) > 0;

  return (
    <Modal open={open} onClose={close} title="Command palette" bare placement="top">
      <Command label="Command palette" shouldFilter={!hasResults} loop>
        <div className="flex h-14 items-center gap-3 px-4 rule-b">
          <span aria-hidden className="text-subtle">
            &gt;
          </span>
          <Command.Input
            data-autofocus
            value={query}
            onValueChange={setQuery}
            placeholder="search tasks & notes, or type a command"
            maxLength={120}
            className="h-full flex-1 bg-transparent text-md outline-none placeholder:text-subtle"
          />
          {search.isFetching ? <Spinner className="text-muted" label="Searching" /> : null}
        </div>
        <Command.List className="max-h-[55vh] overflow-y-auto pb-2">
          <Command.Empty className="px-4 py-8 text-center text-sm text-muted">
            {query.trim().length >= 2 && !search.isFetching ? "no matches" : "…"}
          </Command.Empty>

          {hasResults ? (
            <Command.Group heading="results" className={GROUP}>
              {search.data?.map((hit) => (
                <Command.Item
                  key={`${hit.kind}-${hit.id}`}
                  value={`${hit.kind}-${hit.id}-${hit.title}`}
                  onSelect={() =>
                    hit.kind === "note"
                      ? go(`/notes/${hit.id}`)
                      : go(`/boards/${hit.boardId ?? ""}?task=${hit.id}`)
                  }
                  className={`${ITEM} h-auto py-2`}
                >
                  <span aria-hidden className="w-4 opacity-60">
                    {hit.kind === "note" ? "¶" : "□"}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{hit.title || "untitled"}</span>
                    <span className="block truncate text-xs opacity-70">
                      <Highlight text={hit.snippet} />
                    </span>
                  </span>
                  <Hint>{hit.kind}</Hint>
                </Command.Item>
              ))}
            </Command.Group>
          ) : null}

          <Command.Group heading="create" className={GROUP}>
            <Command.Item className={ITEM} onSelect={() => ui.openCapture()}>
              <span aria-hidden className="w-4">
                +
              </span>{" "}
              new task <Hint>t</Hint>
            </Command.Item>
            <Command.Item className={ITEM} onSelect={() => ui.openCapture({ voice: true })}>
              <span aria-hidden className="w-4">
                ◉
              </span>{" "}
              voice capture <Hint>v</Hint>
            </Command.Item>
            <Command.Item
              className={ITEM}
              onSelect={() =>
                createNote.mutate(
                  { id: crypto.randomUUID(), title: "" },
                  { onSuccess: (n) => go(`/notes/${n.id}`) },
                )
              }
            >
              <span aria-hidden className="w-4">
                ¶
              </span>{" "}
              new note <Hint>n</Hint>
            </Command.Item>
          </Command.Group>

          <Command.Group heading="go to" className={GROUP}>
            {NAV_WINDOWS.map((w) => (
              <Command.Item key={w.href} className={ITEM} onSelect={() => go(w.href)}>
                <span aria-hidden className="w-4 opacity-60">
                  {w.index}
                </span>{" "}
                {w.label}
                <Hint>{w.description}</Hint>
              </Command.Item>
            ))}
            {boards.data?.map((b) => (
              <Command.Item
                key={b.id}
                value={`board ${b.name}`}
                className={ITEM}
                onSelect={() => go(`/boards/${b.id}`)}
              >
                <span aria-hidden className="w-4 opacity-60">
                  ▤
                </span>{" "}
                board / {b.name}
                <Hint>{b.openTasks} open</Hint>
              </Command.Item>
            ))}
          </Command.Group>

          <Command.Group heading="system" className={GROUP}>
            <Command.Item
              className={ITEM}
              onSelect={() =>
                setPrefs({ theme: THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length] ?? "system" })
              }
            >
              <span aria-hidden className="w-4">
                ◐
              </span>{" "}
              cycle theme <Hint>{theme}</Hint>
            </Command.Item>
            <Command.Item className={ITEM} onSelect={ui.openHelp}>
              <span aria-hidden className="w-4">
                ?
              </span>{" "}
              keyboard shortcuts <Hint>?</Hint>
            </Command.Item>
            <Command.Item className={ITEM} onSelect={signOut}>
              <span aria-hidden className="w-4">
                ⏻
              </span>{" "}
              sign out
            </Command.Item>
          </Command.Group>
        </Command.List>
      </Command>
    </Modal>
  );
}
