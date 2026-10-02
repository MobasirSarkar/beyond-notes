"use client";

import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { MutationCache, QueryClient } from "@tanstack/react-query";
import { del, get, set } from "idb-keyval";
import { toast } from "sonner";

import { queryCacheStore } from "@/lib/browser/local-data";

import { ApiError } from "./client";
import { registerMutationDefaults } from "./mutations";

export const CACHE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

export function makeQueryClient(): QueryClient {
  const qc = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: CACHE_MAX_AGE,
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

/** IndexedDB persister, namespaced per user so accounts never share a cache. */
export function makePersister(userId: string) {
  const store = queryCacheStore();
  return createAsyncStoragePersister({
    key: `cache:${userId}`,
    throttleTime: 1000,
    storage: {
      getItem: async (k) => (await get<string>(k, store)) ?? null,
      setItem: (k, v) => set(k, v, store),
      removeItem: (k) => del(k, store),
    },
  });
}
