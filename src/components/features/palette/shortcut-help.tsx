"use client";

import { Kbd } from "@/components/ui/kbd";
import { Modal } from "@/components/ui/modal";
import { Rule } from "@/components/ui/rule";
import { useIsMac } from "@/hooks/use-platform";
import { formatKey, SHORTCUTS } from "@/lib/constants/shortcuts";
import { ui, useUi } from "@/lib/stores/ui";

const GROUPS = Object.groupBy(SHORTCUTS, (s) => s.group);

export function ShortcutHelp() {
  const open = useUi((s) => s.helpOpen);
  const isMac = useIsMac();

  return (
    <Modal open={open} onClose={ui.closeHelp} title="Keyboard shortcuts">
      <div className="grid gap-8 p-6 sm:grid-cols-2">
        {Object.entries(GROUPS).map(([group, items]) => (
          <section key={group} className="flex flex-col gap-3">
            <Rule>{group}</Rule>
            <ul className="flex flex-col gap-2">
              {items?.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-4 text-sm">
                  <span>{s.label}</span>
                  <span className="flex gap-1">
                    {s.keys.map((k) => (
                      <Kbd key={k}>{formatKey(k, isMac)}</Kbd>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
        <p className="text-xs leading-relaxed text-muted sm:col-span-2">
          On a board, focus a card and press <Kbd>space</Kbd> to lift it, arrow keys to move, and{" "}
          <Kbd>space</Kbd> again to drop. <Kbd>enter</Kbd> opens the card.
        </p>
      </div>
    </Modal>
  );
}
