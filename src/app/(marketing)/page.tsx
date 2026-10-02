import Link from "next/link";

import { FeatureList } from "@/components/features/landing/feature-list";
import { Hero } from "@/components/features/landing/hero";
import { buttonStyles } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { Rule } from "@/components/ui/rule";
import { getSession } from "@/server/session";

const KEYS = [
  ["⌘K", "command palette"],
  ["t", "capture a task"],
  ["v", "capture by voice"],
  ["n", "new note"],
  ["1–6", "switch window"],
  ["?", "all shortcuts"],
] as const;

export default async function LandingPage() {
  const session = await getSession();
  return (
    <>
      <header className="rule-b">
        <div className="page flex h-(--header-h) items-center justify-between">
          <span className="text-sm font-bold">beyond</span>
          <Link
            href={session ? "/boards" : "/sign-in"}
            className={buttonStyles({ size: "sm", variant: "ghost" })}
          >
            {session ? "open →" : "sign in"}
          </Link>
        </div>
      </header>
      <main id="main">
        <Hero signedIn={session !== null} />
        <section className="page flex flex-col gap-8 py-(--section-gap)">
          <Rule>what&apos;s inside</Rule>
          <FeatureList />
        </section>
        <section className="page flex flex-col gap-8 pb-(--section-gap)">
          <Rule>keyboard first</Rule>
          <ul className="grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
            {KEYS.map(([k, d]) => (
              <li key={k} className="flex items-center gap-3 text-sm">
                <Kbd className="min-w-10">{k}</Kbd>
                <span className="text-muted">{d}</span>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <footer className="rule-t">
        <div className="page flex flex-wrap justify-between gap-2 py-6 text-xs text-subtle">
          <span>beyond · plain-text productivity</span>
          <span>offline · installable · open source friendly</span>
        </div>
      </footer>
    </>
  );
}
