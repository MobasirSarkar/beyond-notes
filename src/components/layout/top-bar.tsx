"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Mic, Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Kbd } from "@/components/ui/kbd";
import { useIsMac } from "@/hooks/use-platform";
import { activeWindow } from "@/lib/constants/nav";
import { ui } from "@/lib/stores/ui";

export function TopBar() {
  const pathname = usePathname();
  const isMac = useIsMac();
  const current = activeWindow(pathname);

  return (
    <header className="sticky top-0 z-(--z-chrome) h-(--header-h) bg-linear-to-b from-bg via-bg/70 to-transparent">
      <div className="page flex h-full items-center gap-3 sm:gap-6">
        <Link
          href="/boards"
          className="flex min-w-0 items-center gap-2.5 text-sm"
          aria-label="Beyond Notes home"
        >
          <span className="heading text-lg">beyond</span>
          {current ? (
            <>
              <span aria-hidden className="h-4 w-(--bw) rotate-12 bg-strong/40" />
              <span className="truncate text-muted">{current.label}</span>
            </>
          ) : null}
        </Link>

        <button
          type="button"
          onClick={ui.openPalette}
          className="ml-auto flex h-9 min-w-0 items-center gap-3 rounded-full glass px-3.5 text-sm text-subtle shadow-none transition-colors duration-(--dur-2) hover:rule-strong hover:text-fg sm:w-full sm:max-w-sm md:mx-auto"
          aria-label="Search or run a command"
        >
          <Icon icon={Search} />
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
            <Icon icon={Mic} />
            <span className="hidden lg:inline">voice</span>
          </Button>
          <Button
            variant="solid"
            onClick={() => ui.openCapture()}
            title="Quick capture (t)"
            aria-label="Quick capture"
          >
            <Icon icon={Plus} />
            <span className="hidden sm:inline">capture</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
