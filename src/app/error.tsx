"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="grid min-h-[70vh] place-items-center bg-spartan-ink px-4 text-white">
      <div className="max-w-md text-center">
        <div className="eyebrow">Something went wrong</div>
        <h1 className="mt-3 font-display text-3xl uppercase sm:text-4xl">
          We hit a problem
        </h1>
        <p className="mt-3 text-sm text-white/60">
          The page could not be loaded. Please try again — if it keeps happening, contact the club.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={reset} className="btn-primary">
            Try again
          </button>
          <Link href="/" className="btn-ghost">
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
