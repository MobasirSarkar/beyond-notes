import Link from "next/link";

export default function NotFound() {
  return (
    <main id="main" className="grid min-h-[70dvh] place-items-center p-6">
      <div className="text-center">
        <p className="pixel glow text-5xl text-accent">404</p>
        <h1 className="term mt-4 text-3xl uppercase">file not found in this sector</h1>
        <Link href="/boards" className="px-btn mt-6" data-variant="primary">
          [ RETURN ]
        </Link>
      </div>
    </main>
  );
}
