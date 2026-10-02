"use client";

import { useIsMutating } from "@tanstack/react-query";
import { Pause, Play, Sparkle } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Icon } from "@/components/ui/icon";
import { Spinner } from "@/components/ui/spinner";
import { useClock } from "@/hooks/use-clock";
import { useOnline } from "@/hooks/use-online";
import { activeWindow, NAV_WINDOWS } from "@/lib/constants/nav";
import { FOCUS_LABEL, formatClock, useFocusTimer, useRemainingMs } from "@/lib/stores/focus-timer";
import { cn } from "@/lib/utils/cn";

function FocusBadge() {
  const running = useFocusTimer((s) => s.endsAt !== null);
  const started = useFocusTimer((s) => s.elapsedMs > 0);
  const kind = useFocusTimer((s) => s.kind);
  const remaining = useRemainingMs();
  if (!running && !started) return null;
  return (
    <Link
      href="/focus"
      aria-label={`Focus timer ${running ? "running" : "paused"}, ${formatClock(remaining)} left`}
      className="flex items-center gap-2 rounded-full px-3 font-mono hover:bg-surface-2"
    >
      <Icon icon={running ? Play : Pause} className="size-3" />
      <span className="hidden xl:inline">{FOCUS_LABEL[kind]}</span>
      <span className="tabular-nums">{formatClock(remaining)}</span>
    </Link>
  );
}

function SyncState() {
  const online = useOnline();
  const pending = useIsMutating();
  return (
    <span className="flex items-center gap-2 px-3" aria-live="polite">
      {pending > 0 && online ? (
        <>
          <Spinner label="Syncing" /> sync
        </>
      ) : (
        <>
          <span aria-hidden className={`size-1.5 rounded-full ${online ? "bg-fg" : "hairline"}`} />
          {online ? "online" : `offline${pending ? ` · ${pending} queued` : ""}`}
        </>
      )}
    </span>
  );
}

/** Floating glass dock: home · windows (1–6) · focus timer · sync · clock. */
export function StatusLine({ userName }: { userName: string }) {
  const pathname = usePathname();
  const current = activeWindow(pathname);
  const clock = useClock();

  return (
    <nav
      aria-label="Windows"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-(--z-chrome) flex justify-center px-3 pb-[max(var(--dock-gap),env(safe-area-inset-bottom))] text-xs"
    >
      <div className="pointer-events-auto flex h-(--status-h) max-w-full items-stretch gap-1 rounded-full glass-strong p-1">
        <Link
          href="/"
          aria-label="Beyond home"
          className="hidden aspect-square items-center justify-center rounded-full bg-fg text-bg sm:flex"
        >
          <Icon icon={Sparkle} className="size-4" />
        </Link>

        <ul className="flex min-w-0 flex-1 items-stretch gap-0.5 overflow-x-auto">
          {NAV_WINDOWS.map((w) => {
            const active = current?.href === w.href;
            return (
              <li key={w.href} className="flex flex-1 sm:flex-none">
                <Link
                  href={w.href}
                  aria-current={active ? "page" : undefined}
                  title={`${w.description} (${w.index})`}
                  className={cn(
                    "flex w-full min-w-11 items-center justify-center gap-2 rounded-full px-3 whitespace-nowrap transition-colors duration-(--dur-2) sm:px-3.5",
                    active
                      ? "bg-surface-2 font-medium text-fg shadow-[inset_0_var(--bw)_0_var(--highlight)]"
                      : "text-muted hover:text-fg",
                  )}
                >
                  <Icon icon={w.icon} className="size-4 sm:size-3.5" />
                  <span className="sr-only sm:not-sr-only">{w.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="hidden items-stretch text-muted md:flex">
          <span aria-hidden className="my-2 w-(--bw) bg-line" />
          <FocusBadge />
          <SyncState />
          <span className="hidden items-center px-3 lg:flex">@{userName}</span>
          <span className="flex items-center rounded-full bg-surface-2 px-3.5 font-mono text-fg tabular-nums">
            {clock}
          </span>
        </div>
      </div>
    </nav>
  );
}
