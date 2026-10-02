import type { InputHTMLAttributes, Ref, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

const FIELD =
  "lift w-full rounded-control px-3 text-sm text-fg outline-none transition-[border-color,box-shadow] duration-(--dur-2) placeholder:text-subtle hover:rule-strong focus:rule-strong focus:shadow-glow focus-visible:outline-none disabled:opacity-50";

export function Input({
  className,
  ref,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { ref?: Ref<HTMLInputElement> }) {
  return <input ref={ref} className={cn(FIELD, "h-9", className)} {...rest} />;
}

export function Textarea({
  className,
  ref,
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { ref?: Ref<HTMLTextAreaElement> }) {
  return (
    <textarea
      ref={ref}
      className={cn(FIELD, "resize-y py-2 leading-relaxed", className)}
      {...rest}
    />
  );
}

export function Select({
  className,
  ref,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement> & { ref?: Ref<HTMLSelectElement> }) {
  return <select ref={ref} className={cn(FIELD, "h-9 pr-8", className)} {...rest} />;
}
