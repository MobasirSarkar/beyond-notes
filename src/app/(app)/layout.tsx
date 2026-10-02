import type { ReactNode } from "react";

import { AppProviders } from "@/components/providers/app-providers";
import { AppShell } from "@/components/shell/app-shell";
import { requireUser } from "@/server/session";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();
  return (
    <AppProviders userId={user.id}>
      <AppShell user={{ name: user.name, email: user.email }}>{children}</AppShell>
    </AppProviders>
  );
}
