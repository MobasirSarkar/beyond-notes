"use client";

import { format } from "date-fns";

import { Button, buttonStyles } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Frame } from "@/components/ui/frame";
import { PageHeader } from "@/components/ui/page-header";
import { Segmented } from "@/components/ui/segmented";
import { useSignOut } from "@/hooks/use-sign-out";
import { setPrefs, usePrefs } from "@/lib/stores/prefs";
import type { MotionPref, ThemePref } from "@/types/prefs";
import type { SegmentOption } from "@/types/ui";

import { PushToggle } from "./push-toggle";
import { SettingRow } from "./setting-row";

const THEMES: readonly SegmentOption<ThemePref>[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];
const MOTION: readonly SegmentOption<MotionPref>[] = [
  { value: "system", label: "System" },
  { value: "full", label: "Full" },
  { value: "reduced", label: "Reduced" },
];

type Props = {
  user: { name: string; email: string; createdAt: string };
  vapidPublicKey: string | null;
};

export function SettingsView({ user, vapidPublicKey }: Props) {
  const theme = usePrefs((p) => p.theme);
  const motion = usePrefs((p) => p.motion);
  const sound = usePrefs((p) => p.sound);
  const ambient = usePrefs((p) => p.ambient);
  const { signOut, pending } = useSignOut();

  return (
    <div className="flex flex-col">
      <PageHeader
        eyebrow="Preferences"
        title="Settings"
        description="Preferences are stored on this device"
      />

      <div className="flex max-w-3xl flex-col gap-6">
        <Frame title="Appearance">
          <div className="flex flex-col [&>*+*]:rule-t">
            <SettingRow
              title="Theme"
              description="Deep-space dark or star-chart light, or follow the system."
            >
              <Segmented
                label="Theme"
                size="sm"
                value={theme}
                options={THEMES}
                onChange={(t) => setPrefs({ theme: t })}
              />
            </SettingRow>
            <SettingRow
              title="Motion"
              description="Controls every animation (GSAP, anime.js and Motion). “System” follows your OS reduced-motion setting."
            >
              <Segmented
                label="Motion"
                size="sm"
                value={motion}
                options={MOTION}
                onChange={(m) => setPrefs({ motion: m })}
              />
            </SettingRow>
            <SettingRow
              title="Ambient background"
              description="The live galaxy behind the app. Shown as a still image when motion is reduced."
            >
              <Checkbox checked={ambient} onChange={(a) => setPrefs({ ambient: a })}>
                {ambient ? "On" : "Off"}
              </Checkbox>
            </SettingRow>
            <SettingRow title="Sound" description="Soft chimes for drags, completions and timers.">
              <Checkbox checked={sound} onChange={(s) => setPrefs({ sound: s })}>
                {sound ? "On" : "Off"}
              </Checkbox>
            </SettingRow>
          </div>
        </Frame>

        <Frame title="Notifications">
          <SettingRow
            title="Push reminders"
            description="Get task reminders even when the app is closed."
          >
            <PushToggle vapidPublicKey={vapidPublicKey} />
          </SettingRow>
        </Frame>

        <Frame title="Data">
          <SettingRow
            title="Export"
            description="Download everything you own as JSON: boards, tasks, notes and focus history."
          >
            {/* Plain link: a file download, not client navigation. */}
            <a href="/api/export" download className={buttonStyles({ size: "sm" })}>
              Export JSON
            </a>
          </SettingRow>
        </Frame>

        <Frame title="Account">
          <div className="flex flex-col [&>*+*]:rule-t">
            <SettingRow
              title={`@${user.name}`}
              description={`${user.email} · Joined ${format(new Date(user.createdAt), "d MMMM yyyy")}`}
            >
              <Button size="sm" variant="danger" onClick={signOut} disabled={pending}>
                {pending ? "Signing out…" : "Sign out"}
              </Button>
            </SettingRow>
          </div>
        </Frame>
      </div>
    </div>
  );
}
