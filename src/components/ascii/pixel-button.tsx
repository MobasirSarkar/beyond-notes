import type { ButtonHTMLAttributes, Ref } from "react";

import { cn } from "@/lib/cn";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "primary" | "danger" | "ghost";
  size?: "md" | "sm";
  /** Render as `[ LABEL ]`. */
  bracket?: boolean;
  ref?: Ref<HTMLButtonElement>;
};

export function PixelButton({
  variant = "default",
  size = "md",
  bracket = false,
  className,
  children,
  type = "button",
  ref,
  ...rest
}: Props) {
  return (
    <button
      ref={ref}
      type={type}
      data-variant={variant}
      data-size={size}
      className={cn("px-btn", className)}
      {...rest}
    >
      {bracket ? <span aria-hidden>[</span> : null}
      {children}
      {bracket ? <span aria-hidden>]</span> : null}
    </button>
  );
}
