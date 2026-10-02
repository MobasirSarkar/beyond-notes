import type { Metadata } from "next";

import { SettingsView } from "@/components/settings/settings-view";
import { env } from "@/env";
import { requireUser } from "@/server/session";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await requireUser();
  return (
    <SettingsView
      user={{ name: user.name, email: user.email, createdAt: user.createdAt.toISOString() }}
      vapidPublicKey={env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null}
    />
  );
}
