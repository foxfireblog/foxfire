"use client";

import Link from "next/link";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center px-6 text-center">
      <h1 className="font-[family-name:var(--font-display)] text-6xl font-semibold tracking-tight text-foreground sm:text-8xl">
        Oops
      </h1>
      <p className="mt-4 text-lg text-muted">
        Something went wrong. Please try again.
      </p>
      <div className="mt-8 flex gap-4">
        <button
          onClick={() => reset()}
          className="rounded-full bg-white/[0.06] px-6 py-2.5 text-sm text-foreground/80 transition-all hover:bg-white/[0.1] hover:text-foreground"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-full bg-white/[0.06] px-6 py-2.5 text-sm text-foreground/80 transition-all hover:bg-white/[0.1] hover:text-foreground"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
