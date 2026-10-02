"use client";

import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { useState, type ReactNode } from "react";

import { CACHE_MAX_AGE, makePersister, makeQueryClient } from "@/lib/api/query-client";

/**
 * Query client for the signed-in app. The cache (and mutations paused while
 * offline) is persisted to IndexedDB per user, then resumed when back online.
 */
export function AppProviders({ userId, children }: { userId: string; children: ReactNode }) {
  const [queryClient] = useState(makeQueryClient);
  const [persister] = useState(() => makePersister(userId));

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister, maxAge: CACHE_MAX_AGE, buster: `v2:${userId}` }}
      onSuccess={() => {
        void queryClient.resumePausedMutations().then(() => queryClient.invalidateQueries());
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
