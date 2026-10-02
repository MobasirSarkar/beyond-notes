"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";

import { ScrambleText } from "@/components/ascii/scramble-text";
import { cn } from "@/lib/cn";
import { useBoards } from "@/lib/queries";

import { NAV_ITEMS } from "./nav-items";
import { NewBoardButton } from "./new-board-button";
import { UserMenu } from "./user-menu";

const NOOP = () => {};

export function SidebarContent({
  user,
  onNavigate = NOOP,
}: {
  user: { name: string; email: string };
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const boards = useBoards();

  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <Link
        href="/boards"
        onClick={onNavigate}
        className="pixel glow block text-[11px] leading-relaxed text-fg"
      >
        BEYOND<span className="animate-blink text-accent">_</span>
        <br />
        NOTES
      </Link>

      <nav aria-label="Primary">
        <ul className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <li key={item.href} className="relative">
                {active ? (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-0 bg-fg"
                    transition={{ type: "spring", stiffness: 600, damping: 40 }}
                  />
                ) : null}
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "term relative flex items-center gap-3 px-2 py-0.5 text-xl uppercase",
                    active ? "text-bg" : "text-fg hover:text-accent",
                  )}
                >
                  <span aria-hidden className="w-5 text-center">
                    {item.glyph}
                  </span>
                  <ScrambleText text={item.label} trigger="hover" chars="upper" />
                  <span className="ml-auto text-sm opacity-60" aria-hidden>
                    {item.key}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="term relative mb-2 flex items-center justify-between text-lg text-muted">
          <span>── BOARDS ──</span>
          <NewBoardButton />
        </div>
        <ul className="flex flex-col">
          {boards.data?.map((b) => {
            const href = `/boards/${b.id}` as const;
            const active = pathname === href;
            return (
              <li key={b.id}>
                <Link
                  href={href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center justify-between gap-2 px-2 py-0.5 hover:bg-bg-3",
                    active && "text-accent",
                  )}
                >
                  <span className="truncate">
                    {active ? "▸ " : "  "}
                    {b.name}
                  </span>
                  <span className="term text-lg text-muted">{b.openTasks}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <UserMenu user={user} />
    </div>
  );
}

export function Sidebar({ user }: { user: { name: string; email: string } }) {
  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 border-r-2 border-line bg-bg-2 lg:block">
      <SidebarContent user={user} />
    </aside>
  );
}
