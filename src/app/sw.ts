/// <reference lib="webworker" />
import { defaultCache } from "@serwist/turbopack/worker";
import { NetworkOnly, Serwist, type PrecacheEntry, type SerwistGlobalConfig } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

type PushPayload = { title: string; body: string; url: string; tag: string; dueAt: string | null };

function parsePayload(data: PushMessageData | null): PushPayload | null {
  try {
    const raw: unknown = data?.json();
    if (typeof raw !== "object" || raw === null) return null;
    const p = raw as Record<string, unknown>;
    const url =
      typeof p["url"] === "string" && p["url"].startsWith("/") && !p["url"].startsWith("//")
        ? p["url"]
        : "/boards";
    return {
      title: typeof p["title"] === "string" ? p["title"].slice(0, 120) : "Beyond Notes",
      body: typeof p["body"] === "string" ? p["body"].slice(0, 240) : "",
      url,
      tag: typeof p["tag"] === "string" ? p["tag"].slice(0, 80) : "reminder",
      dueAt: typeof p["dueAt"] === "string" ? p["dueAt"] : null,
    };
  } catch {
    return null;
  }
}

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST ?? [],
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // Personal JSON is persisted (and wiped on sign-out) by the query cache;
    // never duplicate it into Cache Storage.
    {
      matcher: ({ url, sameOrigin }) =>
        sameOrigin && (url.pathname.startsWith("/api/v1/") || url.pathname === "/api/export"),
      handler: new NetworkOnly(),
    },
    ...defaultCache,
  ],
  fallbacks: {
    entries: [{ url: "/~offline", matcher: ({ request }) => request.destination === "document" }],
  },
});

self.addEventListener("push", (event) => {
  const payload = parsePayload(event.data);
  if (!payload) return;
  const due = payload.dueAt ? new Date(payload.dueAt) : null;
  const body = due
    ? `${payload.body} · due ${due.toLocaleString(undefined, { weekday: "short", hour: "2-digit", minute: "2-digit" })}`
    : payload.body;
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body,
      tag: payload.tag,
      icon: "/icons/icon-192.png",
      badge: "/icons/badge-96.png",
      data: { url: payload.url },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const data: unknown = event.notification.data;
  const raw =
    typeof data === "object" && data !== null && "url" in data ? String(data.url) : "/boards";
  const target = new URL(
    raw.startsWith("/") && !raw.startsWith("//") ? raw : "/boards",
    self.location.origin,
  );
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of windows) {
        if (new URL(client.url).origin === target.origin && "focus" in client) {
          await client.focus();
          await client.navigate(target.href);
          return;
        }
      }
      await self.clients.openWindow(target.href);
    })(),
  );
});

serwist.addEventListeners();
