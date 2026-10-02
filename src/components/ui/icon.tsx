import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils/cn";

/** Consistent line icon: decorative by default, hairline-ish 1.5 stroke. */
export function Icon({
  icon: Glyph,
  className,
  label,
}: {
  icon: LucideIcon;
  className?: string;
  label?: string;
}) {
  return (
    <Glyph
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? "img" : undefined}
      strokeWidth={1.5}
      className={cn("size-4 shrink-0", className)}
    />
  );
}
