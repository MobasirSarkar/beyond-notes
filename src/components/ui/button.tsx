import type { ButtonHTMLAttributes, Ref } from "react";

import { cn } from "@/lib/utils/cn";
import type { ButtonSize, ButtonVariant } from "@/types/ui";

const BASE =
  "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium transition-[background-color,color,border-color,box-shadow] duration-(--dur-2) ease-out disabled:pointer-events-none disabled:opacity-40";

const VARIANTS: Record<ButtonVariant, string> = {
  solid: "hairline rule-strong bg-fg text-bg hover:shadow-glow",
  outline: "glass text-fg shadow-none hover:rule-strong",
  ghost: "text-muted hover:bg-surface-2/60 hover:text-fg",
  danger: "hairline rule-dashed text-fg hover:rule-strong hover:bg-surface-2/60",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-7 px-3 text-xs",
  md: "h-9 px-4 text-sm",
  lg: "h-11 px-6 text-base",
};

/** Shared class builder so links can look like buttons. */
export function buttonStyles({
  variant = "outline",
  size = "md",
  className,
}: { variant?: ButtonVariant; size?: ButtonSize; className?: string | undefined } = {}): string {
  return cn(BASE, VARIANTS[variant], SIZES[size], className);
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  ref?: Ref<HTMLButtonElement>;
};

export function Button({ variant, size, className, type = "button", ref, ...rest }: ButtonProps) {
  return (
    <button
      ref={ref}
      type={type}
      className={buttonStyles({
        ...(variant ? { variant } : {}),
        ...(size ? { size } : {}),
        className,
      })}
      {...rest}
    />
  );
}
