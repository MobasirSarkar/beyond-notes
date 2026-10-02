"use client";

import { useEffect, useState, type ReactNode } from "react";

import type { ButtonSize } from "@/types/ui";

import { Button } from "./button";

/** Two-step destructive action: first press arms it, second press confirms. */
export function ConfirmButton({
  onConfirm,
  children,
  size = "sm",
  className,
}: {
  onConfirm: () => void;
  children: ReactNode;
  size?: ButtonSize;
  className?: string;
}) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const t = window.setTimeout(() => setArmed(false), 3000);
    return () => window.clearTimeout(t);
  }, [armed]);
  return (
    <Button
      variant={armed ? "solid" : "danger"}
      size={size}
      className={className}
      onClick={() => {
        if (!armed) return setArmed(true);
        setArmed(false);
        onConfirm();
      }}
    >
      {armed ? "confirm?" : children}
    </Button>
  );
}
