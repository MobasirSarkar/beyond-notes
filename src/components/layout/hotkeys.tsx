"use client";

import { useRouter } from "next/navigation";

import { useHotkeys } from "@/hooks/use-hotkeys";
import { useCreateNote } from "@/lib/api/mutations";
import { ui } from "@/lib/stores/ui";

export function Hotkeys() {
  const router = useRouter();
  const createNote = useCreateNote();
  useHotkeys({
    palette: ui.togglePalette,
    help: ui.openHelp,
    "quick-task": () => ui.openCapture(),
    "voice-task": () => ui.openCapture({ voice: true }),
    "new-note": () =>
      createNote.mutate(
        { id: crypto.randomUUID(), title: "" },
        { onSuccess: (n) => router.push(`/notes/${n.id}`) },
      ),
    "win-1": () => router.push("/boards"),
    "win-2": () => router.push("/notes"),
    "win-3": () => router.push("/calendar"),
    "win-4": () => router.push("/focus"),
    "win-5": () => router.push("/stats"),
    "win-6": () => router.push("/settings"),
  });
  return null;
}
