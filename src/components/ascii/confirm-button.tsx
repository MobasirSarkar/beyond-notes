"use client";

import { useEffect, useState, type ReactNode } from "react";

import { PixelButton } from "./pixel-button";

/** Two-step destructive button: first press arms it ("SURE?"), second press fires. */
export function ConfirmButton({
  onConfirm,
  children,
  size = "sm",
  className,
}: {
  onConfirm: () => void;
  children: ReactNode;
  size?: "sm" | "md";
  className?: string;
}) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const t = window.setTimeout(() => setArmed(false), 3000);
    return () => window.clearTimeout(t);
  }, [armed]);
  return (
    <PixelButton
      variant="danger"
      size={size}
      className={className}
      onClick={() => {
        if (armed) {
          setArmed(false);
          onConfirm();
        } else setArmed(true);
      }}
    >
      {armed ? "SURE? PRESS AGAIN" : children}
    </PixelButton>
  );
}
