"use client";

import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { MutationCache, QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { del, get, set } from "idb-keyval";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";

import { ApiError } from "@/lib/api-client";
import { queryCacheStore } from "@/lib/local-data";
import { registerMutationDefaults } from "@/lib/mutations";

const DAY = 24 * 60 * 60 * 1000;

function makeQueryClient() {
  const qc = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 7 * DAY,
        refetchOnWindowFocus: true,
        retry: (count, error) =>
          !(error instanceof ApiError && error.status >= 400 && error.status < 500) && count < 2,
      },
      mutations: { retry: 1 },
    },
    mutationCache: new MutationCache({
      onError: (error) => {
        toast.error("Action failed", { description: error.message });
      },
    }),
  });
  registerMutationDefaults(qc);
  return qc;
}

/**
 * Query client for the signed-in app. The cache (and any mutations paused
 * while offline) is persisted to IndexedDB under a per-user key, then resumed
 * once the app is back online.
 */
export function AppProviders({ userId, children }: { userId: string; children: ReactNode }) {
  const [queryClient] = useState(makeQueryClient);
  const [persister] = useState(() => {
    const store = queryCacheStore();
    return createAsyncStoragePersister({
      key: `cache:${userId}`,
      throttleTime: 1000,
      storage: {
        getItem: (k) => get<string>(k, store).then((v) => v ?? null),
        setItem: (k, v) => set(k, v, store),
        removeItem: (k) => del(k, store),
      },
    });
  });

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister, maxAge: 7 * DAY, buster: `v1:${userId}` }}
      onSuccess={() => {
        void queryClient.resumePausedMutations().then(() => queryClient.invalidateQueries());
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
