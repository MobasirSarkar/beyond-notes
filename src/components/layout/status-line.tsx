"use client";

import { useIsMutating } from "@tanstack/react-query";
import Link from "next/link";
import { usePathname } from "next/navigation";

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
      className="flex items-center gap-2 px-3 hover:bg-surface-2"
    >
      <span aria-hidden>{running ? "▶" : "❚❚"}</span>
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
          <span aria-hidden>{online ? "●" : "○"}</span>
          {online ? "online" : `offline${pending ? ` · ${pending} queued` : ""}`}
        </>
      )}
    </span>
  );
}

/** tmux-style status line: session · numbered windows · timer · sync · clock. */
export function StatusLine({ userName }: { userName: string }) {
  const pathname = usePathname();
  const current = activeWindow(pathname);
  const clock = useClock();

  return (
    <nav
      aria-label="Windows"
      className="fixed inset-x-0 bottom-0 z-(--z-chrome) h-(--status-h) bg-surface pb-[env(safe-area-inset-bottom)] text-xs rule-t"
    >
      <div className="flex h-(--status-h) items-stretch">
        <Link href="/" className="hidden items-center bg-fg px-3 heading text-bg sm:flex">
          [beyond]
        </Link>

        <ul className="flex min-w-0 flex-1 items-stretch overflow-x-auto">
          {NAV_WINDOWS.map((w) => {
            const active = current?.href === w.href;
            return (
              <li key={w.href} className="flex flex-1 sm:flex-none">
                <Link
                  href={w.href}
                  aria-current={active ? "page" : undefined}
                  title={`${w.description} (${w.index})`}
                  className={cn(
                    "flex w-full items-center justify-center gap-1 px-2 whitespace-nowrap transition-colors duration-(--dur-1) sm:px-3",
                    active ? "bg-surface-2 font-bold text-fg" : "text-muted hover:text-fg",
                  )}
                >
                  <span className="hidden text-subtle sm:inline">{w.index}:</span>
                  {w.label}
                  <span aria-hidden className="hidden w-[1ch] sm:inline">
                    {active ? "*" : ""}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="hidden items-stretch text-muted rule-l md:flex">
          <FocusBadge />
          <SyncState />
          <span className="hidden items-center px-3 lg:flex">@{userName}</span>
          <span className="flex items-center bg-surface-2 px-3 text-fg tabular-nums">{clock}</span>
        </div>
      </div>
    </nav>
  );
}
