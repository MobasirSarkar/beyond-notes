import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

type Props = { label: string; value: ReactNode; hint?: ReactNode; className?: string };

export function Stat({ label, value, hint, className }: Props) {
  return (
    <div className={cn("flex flex-col gap-2 bg-bg p-4 hairline sm:p-5", className)}>
      <p className="label">{label}</p>
      <p className="heading text-2xl tabular-nums">{value}</p>
      {hint ? <p className="text-xs text-subtle">{hint}</p> : null}
    </div>
  );
}
