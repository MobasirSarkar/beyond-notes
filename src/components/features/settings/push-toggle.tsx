"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { unwrap } from "@/lib/api/client";
import { base64UrlToBytes, supportsPush } from "@/lib/browser/platform";
import { subscribePushAction, unsubscribePushAction } from "@/server/actions/push";

type Status = "loading" | "unsupported" | "unconfigured" | "denied" | "off" | "on";

const COPY: Record<Status, string> = {
  loading: "checking…",
  unsupported: "not supported here — on iOS, add the app to your home screen first",
  unconfigured: "not configured on this server",
  denied: "blocked in browser settings",
  off: "off",
  on: "on for this device",
};

async function currentStatus(vapidKey: string | null): Promise<Status> {
  if (!vapidKey) return "unconfigured";
  if (!supportsPush()) return "unsupported";
  if (Notification.permission === "denied") return "denied";
  const reg = await navigator.serviceWorker.getRegistration();
  return (await reg?.pushManager.getSubscription()) ? "on" : "off";
}

export function PushToggle({ vapidPublicKey }: { vapidPublicKey: string | null }) {
  const [status, setStatus] = useState<Status>("loading");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const s = await currentStatus(vapidPublicKey);
      if (!cancelled) setStatus(s);
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
          applicationServerKey: base64UrlToBytes(vapidPublicKey),
        }));
      const json = sub.toJSON();
      await unwrap(
        subscribePushAction({
          endpoint: json.endpoint ?? sub.endpoint,
          keys: { p256dh: json.keys?.["p256dh"] ?? "", auth: json.keys?.["auth"] ?? "" },
        }),
      );
      setStatus("on");
      toast.success("Push reminders enabled");
    } catch (e) {
      toast.error("Could not enable push", {
        description: e instanceof Error ? e.message : "Unknown error",
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

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted">{COPY[status]}</span>
      {status === "off" ? (
        <Button size="sm" variant="solid" onClick={enable} disabled={busy}>
          enable
        </Button>
      ) : null}
      {status === "on" ? (
        <Button size="sm" onClick={disable} disabled={busy}>
          disable
        </Button>
      ) : null}
    </div>
  );
}
