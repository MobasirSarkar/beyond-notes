"use client";

import { format } from "date-fns";

import { Panel } from "@/components/ascii/panel";
import { ScrambleText } from "@/components/ascii/scramble-text";
import { cn } from "@/lib/cn";
import { setPrefs, usePrefs, type Prefs } from "@/lib/prefs";

import { PushToggle } from "./push-toggle";

function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: readonly T[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap border-2 border-line">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          role="radio"
          aria-checked={value === o}
          onClick={() => onChange(o)}
          className={cn(
            "term flex-1 px-3 py-0.5 text-xl",
            value === o ? "bg-fg text-bg" : "hover:bg-bg-3",
          )}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

const THEMES = [
  "system",
  "phosphor",
  "amber",
  "paper",
] as const satisfies readonly Prefs["theme"][];
const MOTION = ["system", "full", "reduced"] as const satisfies readonly Prefs["motion"][];

export function SettingsView({
  user,
  vapidPublicKey,
}: {
  user: { name: string; email: string; createdAt: string };
  vapidPublicKey: string | null;
}) {
  const prefs = usePrefs();
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <h1 className="term glow text-4xl uppercase">
        <span className="text-muted" aria-hidden>
          &gt;{" "}
        </span>
        <ScrambleText text="settings" />
      </h1>

      <Panel title="display">
        <div className="flex flex-col gap-5">
          <div>
            <p className="term mb-1 text-lg text-muted">theme</p>
            <Segmented
              label="Theme"
              value={prefs.theme}
              options={THEMES}
              onChange={(theme) => setPrefs({ theme })}
            />
          </div>
          <div>
            <p className="term mb-1 text-lg text-muted">motion (anime.js · gsap · motion)</p>
            <Segmented
              label="Motion"
              value={prefs.motion}
              options={MOTION}
              onChange={(motion) => setPrefs({ motion })}
            />
          </div>
          <label className="term flex items-center gap-3 text-xl">
            <input
              type="checkbox"
              checked={prefs.crt}
              onChange={(e) => setPrefs({ crt: e.target.checked })}
            />
            CRT scanlines &amp; flicker
          </label>
          <label className="term flex items-center gap-3 text-xl">
            <input
              type="checkbox"
              checked={prefs.sound}
              onChange={(e) => setPrefs({ sound: e.target.checked })}
            />
            8-bit sound effects
          </label>
        </div>
      </Panel>

      <Panel title="notifications">
        <PushToggle vapidPublicKey={vapidPublicKey} />
      </Panel>

      <Panel title="data">
        <div className="flex flex-wrap items-center gap-3">
          <p className="flex-1 text-fg-dim">
            Download everything you own as JSON (boards, tasks, notes, focus history).
          </p>
          {/* Plain link: a file download, not client navigation. */}
          <a href="/api/export" className="px-btn" download>
            export json
          </a>
        </div>
      </Panel>

      <Panel title="account">
        <dl className="grid grid-cols-[8rem_1fr] gap-y-1">
          <dt className="term text-lg text-muted">handle</dt>
          <dd>@{user.name}</dd>
          <dt className="term text-lg text-muted">email</dt>
          <dd>{user.email}</dd>
          <dt className="term text-lg text-muted">joined</dt>
          <dd>{format(new Date(user.createdAt), "d MMM yyyy")}</dd>
        </dl>
      </Panel>
    </div>
  );
}
