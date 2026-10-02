"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

import { CommandPalette } from "@/components/palette/command-palette";
import { QuickCapture } from "@/components/voice/quick-capture";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { ReminderWatcher } from "@/components/calendar/reminder-watcher";
import { useHotkeys } from "@/hooks/use-hotkeys";
import { useCreateNote } from "@/lib/mutations";

import { MobileNav } from "./mobile-nav";
import { ShortcutHelp } from "./shortcut-help";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { UiStateProvider, useUi } from "./ui-state";

function Hotkeys() {
  const router = useRouter();
  const ui = useUi();
  const createNote = useCreateNote();
  useHotkeys({
    palette: () => ui.setPaletteOpen(!ui.paletteOpen),
    help: () => ui.setHelpOpen(true),
    "quick-task": () => ui.openCapture(),
    "voice-task": () => ui.openCapture({ voice: true }),
    "new-note": () =>
      createNote.mutate(
        { id: crypto.randomUUID(), title: "" },
        { onSuccess: (n) => router.push(`/notes/${n.id}`) },
      ),
    "go-boards": () => router.push("/boards"),
    "go-notes": () => router.push("/notes"),
    "go-calendar": () => router.push("/calendar"),
    "go-focus": () => router.push("/focus"),
    "go-stats": () => router.push("/stats"),
    "go-settings": () => router.push("/settings"),
  });
  return null;
}

export function AppShell({
  user,
  children,
}: {
  user: { name: string; email: string };
  children: ReactNode;
}) {
  return (
    <UiStateProvider>
      <Hotkeys />
      <div className="flex min-h-dvh">
        <Sidebar user={user} />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar user={user} />
          <main id="main" className="min-w-0 flex-1 px-3 pt-4 pb-24 sm:px-6 lg:pb-8">
            {children}
          </main>
        </div>
      </div>
      <MobileNav />
      <CommandPalette />
      <QuickCapture />
      <ShortcutHelp />
      <ReminderWatcher />
      <InstallPrompt />
    </UiStateProvider>
  );
}
