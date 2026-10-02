"use client";

import { useSyncExternalStore } from "react";

import { Modal } from "@/components/ascii/modal";
import { formatKey, SHORTCUTS } from "@/lib/shortcuts";

import { useUi } from "./ui-state";

const noop = () => () => {};

export function ShortcutHelp() {
  const ui = useUi();
  const isMac = useSyncExternalStore(
    noop,
    () => /Mac|iPhone|iPad/.test(navigator.platform),
    () => true,
  );
  const groups = Object.groupBy(SHORTCUTS, (s) => s.group);

  return (
    <Modal open={ui.helpOpen} onClose={() => ui.setHelpOpen(false)} title="Keyboard shortcuts">
      <div className="grid gap-6 p-5 sm:grid-cols-2">
        {Object.entries(groups).map(([group, items]) => (
          <section key={group}>
            <h3 className="term mb-2 text-xl text-muted uppercase">── {group} ──</h3>
            <ul className="flex flex-col gap-1.5">
              {items?.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-3">
                  <span>{s.label}</span>
                  <span className="flex gap-1">
                    {s.keys.map((k) => (
                      <kbd key={k} className="px-kbd">
                        {formatKey(k, isMac)}
                      </kbd>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
        <p className="term col-span-full text-lg text-muted">
          On a board: focus a card and press <kbd className="px-kbd">space</kbd> to lift, arrows to
          move, space to drop.
        </p>
      </div>
    </Modal>
  );
}
