"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { signOut } from "@/lib/auth/client";
import { clearLocalUserData } from "@/lib/browser/local-data";

/** Signs out and wipes every local trace of the user's data on this device. */
export function useSignOut() {
  const router = useRouter();
  const qc = useQueryClient();
  const [pending, start] = useTransition();
  const run = () =>
    start(async () => {
      await signOut();
      qc.clear();
      await clearLocalUserData();
      router.replace("/");
      router.refresh();
    });
  return { signOut: run, pending };
}
