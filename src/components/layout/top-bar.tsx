"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { useIsMac } from "@/hooks/use-platform";
import { activeWindow } from "@/lib/constants/nav";
import { ui } from "@/lib/stores/ui";

export function TopBar() {
  const pathname = usePathname();
  const isMac = useIsMac();
  const current = activeWindow(pathname);

  return (
    <header className="sticky top-0 z-(--z-chrome) h-(--header-h) bg-bg/90 backdrop-blur-sm rule-b">
      <div className="page flex h-full items-center gap-3 sm:gap-6">
        <Link
          href="/boards"
          className="flex min-w-0 items-baseline gap-1 text-sm"
          aria-label="Beyond Notes home"
        >
          <span className="heading text-md">beyond</span>
          <span className="truncate text-subtle">:~/{current?.label ?? ""}</span>
        </Link>

        <button
          type="button"
          onClick={ui.openPalette}
          className="ml-auto flex h-9 min-w-0 items-center gap-3 px-3 text-sm text-subtle transition-colors duration-(--dur-1) hairline hover:rule-strong hover:text-fg sm:w-full sm:max-w-sm md:mx-auto"
          aria-label="Search or run a command"
        >
          <span aria-hidden>/</span>
          <span className="hidden truncate sm:inline">search or run a command</span>
          <Kbd className="ml-auto hidden sm:inline-flex">{isMac ? "⌘K" : "Ctrl K"}</Kbd>
        </button>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="outline"
            onClick={() => ui.openCapture({ voice: true })}
            aria-label="Voice capture"
            title="Voice capture (v)"
          >
            <span aria-hidden>◉</span>
            <span className="hidden lg:inline">voice</span>
          </Button>
          <Button
            variant="solid"
            onClick={() => ui.openCapture()}
            title="Quick capture (t)"
            aria-label="Quick capture"
          >
            <span aria-hidden>+</span>
            <span className="hidden sm:inline">capture</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
