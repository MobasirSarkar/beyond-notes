import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

type Props = { label: string; value: ReactNode; hint?: ReactNode; className?: string };

export function Stat({ label, value, hint, className }: Props) {
  return (
    <div className={cn("flex flex-col gap-2 rounded-panel glass p-4 sm:p-5", className)}>
      <p className="type-overline">{label}</p>
      <p className="type-title tabular-nums">{value}</p>
      {hint ? <p className="type-caption">{hint}</p> : null}
    </div>
  );
}
