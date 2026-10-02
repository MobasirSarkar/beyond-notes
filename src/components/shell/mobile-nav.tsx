"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/cn";

import { NAV_ITEMS } from "./nav-items";

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Primary mobile"
      className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t-2 border-line bg-bg-2 pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      {NAV_ITEMS.slice(0, 5).map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "term flex flex-col items-center py-1 text-base uppercase",
              active ? "bg-fg text-bg" : "text-fg-dim",
            )}
          >
            <span aria-hidden className="text-xl leading-none">
              {item.glyph}
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
