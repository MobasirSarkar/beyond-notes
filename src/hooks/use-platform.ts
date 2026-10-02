"use client";

import { useSyncExternalStore } from "react";

import { isMacPlatform } from "@/lib/browser/platform";

const noopSubscribe = () => () => {};

export function useIsMac(): boolean {
  return useSyncExternalStore(noopSubscribe, isMacPlatform, () => true);
}
