import { AsciiField } from "@/components/ascii/ascii-field";
import { Panel } from "@/components/ascii/panel";
import { BootSequence } from "@/components/landing/boot-sequence";
import { FeatureGrid } from "@/components/landing/feature-grid";
import { getSession } from "@/server/session";

export default async function LandingPage() {
  const session = await getSession();
  return (
    <main id="main" className="relative min-h-dvh overflow-hidden">
      <AsciiField className="pointer-events-none fixed inset-0 h-full w-full opacity-40" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_center,transparent_10%,var(--bg)_75%)]" />

      <section className="relative flex min-h-dvh flex-col justify-center py-16">
        <BootSequence signedIn={session !== null} />
      </section>

      <section className="relative z-10 mx-auto max-w-6xl px-4 pb-24">
        <FeatureGrid />
        <Panel title="keyboard first" className="mx-auto mt-16 max-w-3xl">
          <ul className="term grid grid-cols-1 gap-2 text-xl sm:grid-cols-2">
            {[
              ["⌘ K", "command palette"],
              ["t", "quick capture task"],
              ["n", "new note"],
              ["g b", "go to boards"],
              ["g f", "go to focus"],
              ["?", "all shortcuts"],
            ].map(([k, d]) => (
              <li key={k} className="flex items-center gap-3">
                <span className="px-kbd">{k}</span>
                <span className="text-fg-dim">{d}</span>
              </li>
            ))}
          </ul>
        </Panel>
        <footer className="term mt-16 text-center text-lg text-muted">
          ── beyond notes · built with next.js 16 · works offline · installable ──
        </footer>
      </section>
    </main>
  );
}
