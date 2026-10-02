import type { LucideIcon } from "lucide-react";
import type { Route } from "next";
import type { ReactNode } from "react";

export type CaptureState = {
  open: boolean;
  voice: boolean;
  boardId?: string | undefined;
  columnId?: string | undefined;
};

export type UiState = {
  paletteOpen: boolean;
  helpOpen: boolean;
  capture: CaptureState;
};

/** A "window" in the floating dock (press its index to switch). */
export type NavWindow = {
  index: number;
  href: Route;
  label: string;
  description: string;
  icon: LucideIcon;
};

export type ButtonVariant = "solid" | "outline" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export type MenuItemDef = {
  id: string;
  label: ReactNode;
  onSelect: () => void;
  danger?: boolean;
  disabled?: boolean;
};

export type SegmentOption<T extends string> = { value: T; label: ReactNode };

export type Toastable = { title: string; description?: string };
