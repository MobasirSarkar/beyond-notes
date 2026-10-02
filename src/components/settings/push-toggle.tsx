"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { PixelButton } from "@/components/ascii/pixel-button";
import { unwrap } from "@/lib/api-client";
import { subscribePushAction, unsubscribePushAction } from "@/server/actions/push";

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

type Status = "loading" | "unsupported" | "denied" | "off" | "on";

export function PushToggle({ vapidPublicKey }: { vapidPublicKey: string | null }) {
  const [status, setStatus] = useState<Status>("loading");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const next: Status = await (async () => {
        if (!vapidPublicKey || !("serviceWorker" in navigator) || !("PushManager" in window))
          return "unsupported";
        if (Notification.permission === "denied") return "denied";
        const reg = await navigator.serviceWorker.getRegistration();
        const sub = await reg?.pushManager.getSubscription();
        return sub ? "on" : "off";
      })();
      if (!cancelled) setStatus(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [vapidPublicKey]);

  async function enable() {
    if (!vapidPublicKey) return;
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "denied" : "off");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        }));
      const json = sub.toJSON();
      await unwrap(
        subscribePushAction({
          endpoint: json.endpoint ?? sub.endpoint,
          keys: { p256dh: json.keys?.["p256dh"] ?? "", auth: json.keys?.["auth"] ?? "" },
        }),
      );
      setStatus("on");
      toast.success("Push reminders enabled on this device");
    } catch (e) {
      toast.error("Could not enable push", {
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await unwrap(unsubscribePushAction({ endpoint: sub.endpoint }));
        await sub.unsubscribe();
      }
      setStatus("off");
    } finally {
      setBusy(false);
    }
  }

  const copy: Record<Status, string> = {
    loading: "checking…",
    unsupported: vapidPublicKey
      ? "Push isn't supported here. On iOS, install the app to your home screen first."
      : "Push is not configured on this server (VAPID keys missing).",
    denied: "Notifications are blocked. Re-enable them in your browser's site settings.",
    off: "Get task reminders even when the app is closed.",
    on: "Reminders will be pushed to this device.",
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <p className="flex-1 text-fg-dim">{copy[status]}</p>
      {status === "off" ? (
        <PixelButton variant="primary" onClick={enable} disabled={busy}>
          enable push
        </PixelButton>
      ) : null}
      {status === "on" ? (
        <PixelButton onClick={disable} disabled={busy}>
          disable
        </PixelButton>
      ) : null}
    </div>
  );
}
