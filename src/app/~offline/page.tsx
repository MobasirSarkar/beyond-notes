import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Offline" };

export default function OfflinePage() {
  return (
    <main id="main" className="grid min-h-dvh place-items-center p-6">
      <div className="px-panel max-w-lg p-8 text-center">
        <pre
          aria-hidden
          className="mx-auto mb-6 inline-block text-left text-sm leading-tight text-fg-dim"
        >{`   .-""-.
  / .--. \\
 / /    \\ \\
 | |    | |
 | |.-""-.|
///\`.::::.\`\\
||| ::/  \\:: ;
||; ::\\__/:: ;
 \\\\\\ '::::' /
  \`=':-..-'\``}</pre>
        <h1 className="term glow text-4xl uppercase">[ NO CARRIER ]</h1>
        <p className="mt-3 text-fg-dim">
          You&apos;re offline and this page isn&apos;t cached yet. Pages you&apos;ve opened before
          still work, and changes you make are queued until you reconnect.
        </p>
        <Link href="/boards" className="px-btn mt-6" data-variant="primary">
          [ RETRY ]
        </Link>
      </div>
    </main>
  );
}
