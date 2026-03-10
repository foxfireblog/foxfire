import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center px-6 text-center">
      <h1 className="font-[family-name:var(--font-display)] text-6xl font-semibold tracking-tight text-foreground sm:text-8xl">
        404
      </h1>
      <p className="mt-4 text-lg text-muted">
        This page doesn&apos;t exist yet &mdash; but maybe it should.
      </p>
      <div className="mt-8 flex gap-4">
        <Link
          href="/"
          className="rounded-full bg-white/[0.06] px-6 py-2.5 text-sm text-foreground/80 transition-all hover:bg-white/[0.1] hover:text-foreground"
        >
          Go home
        </Link>
        <Link
          href="/explorations"
          className="rounded-full bg-white/[0.06] px-6 py-2.5 text-sm text-foreground/80 transition-all hover:bg-white/[0.1] hover:text-foreground"
        >
          Browse explorations
        </Link>
      </div>
    </div>
  );
}
