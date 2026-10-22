export default function Loading() {
  return (
    <div className="min-h-screen bg-spartan-ink text-white" aria-busy="true" aria-live="polite">
      <div className="section py-16">
        <div className="h-4 w-28 animate-pulse rounded bg-white/10" />
        <div className="mt-4 h-10 w-2/3 animate-pulse rounded bg-white/10" />
        <div className="mt-3 h-4 w-1/2 animate-pulse rounded bg-white/10" />
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card h-48 animate-pulse bg-white/5" />
          ))}
        </div>
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
