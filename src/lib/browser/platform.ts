export const isMacPlatform = (): boolean =>
  typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

export const supportsPush = (): boolean =>
  typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window;

export const getRecognizerCtor = (): SpeechRecognitionConstructor | null =>
  typeof window === "undefined"
    ? null
    : (window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null);

/** Converts a base64url VAPID key into the BufferSource PushManager expects. */
export function base64UrlToBytes(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

/** Shows a notification through the service worker when possible. */
export async function notify(title: string, body: string, tag = "beyond"): Promise<void> {
  try {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) {
      await reg.showNotification(title, { body, tag, icon: "/icons/icon-192.png" });
      return;
    }
    const n = new Notification(title, { body, tag });
    n.addEventListener("click", () => window.focus());
  } catch {
    /* notifications unavailable */
  }
}
