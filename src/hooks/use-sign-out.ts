"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useTransition } from "react";

import { expectSignOut } from "@/lib/api/client";
import { signOut } from "@/lib/auth/client";
import { clearLocalUserData } from "@/lib/browser/local-data";

/** Signs out and wipes every local trace of the user's data on this device. */
export function useSignOut() {
  const qc = useQueryClient();
  const [pending, start] = useTransition();
  const run = () =>
    start(async () => {
      expectSignOut();
      await signOut();
      await qc.cancelQueries();
      qc.clear();
      await clearLocalUserData();
      // Full navigation, not router.replace + refresh: a refresh can re-request
      // the current (protected) route first and bounce to sign-in. A fresh load
      // also drops every bit of in-memory state from the signed-in session.
      window.location.assign("/");
    });
  return { signOut: run, pending };
}
