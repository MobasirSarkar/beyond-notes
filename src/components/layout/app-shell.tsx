import type { ReactNode } from "react";

import { ReminderWatcher } from "@/components/features/calendar/reminder-watcher";
import { FocusController } from "@/components/features/focus/focus-controller";
import { InstallPrompt } from "@/components/features/pwa/install-prompt";
import { AsciiBackdrop } from "@/components/ui/ascii-backdrop";

import { Hotkeys } from "./hotkeys";
import { Overlays } from "./overlays";
import { StatusLine } from "./status-line";
import { TopBar } from "./top-bar";

export function AppShell({ userName, children }: { userName: string; children: ReactNode }) {
  return (
    <>
      <AsciiBackdrop focus="edges" />
      <div className="flex min-h-dvh flex-col">
        <TopBar />
        <main id="main" className="flex-1 pb-[calc(var(--status-h)+var(--section-gap))]">
          {children}
        </main>
        <StatusLine userName={userName} />
      </div>
      <Hotkeys />
      <Overlays />
      <FocusController />
      <ReminderWatcher />
      <InstallPrompt />
    </>
  );
}
