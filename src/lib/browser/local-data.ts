"use client";

import { createStore, clear } from "idb-keyval";

export const queryCacheStore = () => createStore("beyond-notes", "query-cache");

/**
 * Wipes every trace of the signed-in user's data from this device: persisted
 * query cache, paused mutations and service-worker runtime caches. Called on
 * sign-out so shared devices don't leak data to the next user.
 */
export async function clearLocalUserData(): Promise<void> {
  try {
    await clear(queryCacheStore());
  } catch {
    /* IndexedDB unavailable */
  }
  try {
    const names = await caches.keys();
    await Promise.all(names.filter((n) => !n.includes("precache")).map((n) => caches.delete(n)));
  } catch {
    /* Cache Storage unavailable */
  }
}
