import type { ReactNode } from "react";

type Props = { title: string; description?: ReactNode; children: ReactNode };

/** One preference: label + explanation on the left, control on the right. */
export function SettingRow({ title, description, children }: Props) {
  return (
    <div className="flex flex-col gap-3 py-5 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
      <div className="flex max-w-md flex-col gap-1">
        <p className="text-sm font-medium">{title}</p>
        {description ? <p className="text-xs leading-relaxed text-muted">{description}</p> : null}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}
