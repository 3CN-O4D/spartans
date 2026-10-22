"use client";

import { useRef, useState } from "react";
import type { GalleryItem } from "@/lib/data";

function PhotoIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="9" cy="10" r="2" />
      <path d="M21 15l-5-5L5 19" />
    </svg>
  );
}

function PlayIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M8 5.14v13.72a1 1 0 0 0 1.54.84l10.3-6.86a1 1 0 0 0 0-1.68L9.54 4.3A1 1 0 0 0 8 5.14Z" />
    </svg>
  );
}

function PlayBadge({ label }: { label?: string }) {
  return (
    <span className="pointer-events-none absolute inset-0 z-10 grid place-items-center">
      <span className="flex items-center gap-2 rounded-full bg-black/60 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white shadow-lg backdrop-blur transition group-hover:scale-105 group-hover:bg-spartan-red">
        <PlayIcon className="h-3.5 w-3.5" />
        {label || "Video"}
      </span>
    </span>
  );
}

const overlayButton =
  "absolute inset-0 z-20 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-spartan-gold";

export function GalleryGrid({ items }: { items: GalleryItem[] }) {
  const [active, setActive] = useState<GalleryItem | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  function open(item: GalleryItem) {
    setActive(item);
    dialogRef.current?.showModal();
  }

  function close() {
    dialogRef.current?.close();
    setActive(null);
  }

  if (!items.length) {
    return <p className="text-white/50">No photos yet.</p>;
  }

  const [feature, ...rest] = items;

  return (
    <>
      <figure className="group overflow-hidden rounded-md border border-white/10">
        <div className={`relative aspect-[4/3] w-full bg-gradient-to-br sm:aspect-[16/9] ${feature.tint}`}>
          {feature.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={feature.image}
              alt={feature.title}
              loading="eager"
              decoding="async"
              className="h-full w-full object-cover object-top transition duration-700 group-hover:scale-[1.02]"
            />
          ) : (
            <div className="relative h-full w-full">
              <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:16px_16px]" />
              <div className="relative flex h-full flex-col items-center justify-center gap-2 text-white/60">
                <PhotoIcon className="h-10 w-10" />
                <span className="text-[10px] font-bold uppercase tracking-[0.25em]">
                  Photo coming soon
                </span>
              </div>
            </div>
          )}
          {feature.video && <PlayBadge label="Play video" />}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 p-6 sm:p-8">
            {feature.date && (
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-spartan-gold">
                {feature.date}
              </div>
            )}
            <h2 className="mt-2 font-display text-2xl uppercase leading-tight sm:text-3xl">
              {feature.title}
            </h2>
            {feature.caption && (
              <p className="mt-2 line-clamp-3 max-w-2xl text-sm leading-relaxed text-white/70">
                {feature.caption}
              </p>
            )}
            <span className="mt-4 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-spartan-gold">
              {feature.video ? "Play video" : "Open story"} <span aria-hidden>→</span>
            </span>
          </div>
          <button
            type="button"
            onClick={() => open(feature)}
            className={overlayButton}
            aria-label={`Open ${feature.title}`}
          />
        </div>
      </figure>

      {rest.length > 0 && (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((g) => (
            <figure key={g.id} className="card group relative">
              <div className={`relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-br ${g.tint}`}>
                {g.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={g.image}
                    alt={g.title}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center opacity-30 [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:16px_16px]">
                    <PhotoIcon className="h-8 w-8 text-white/70" />
                  </div>
                )}
                {g.video && <PlayBadge />}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                {g.date && (
                  <span className="absolute left-3 top-3 rounded-sm bg-black/65 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
                    {g.date}
                  </span>
                )}
              </div>
              <figcaption className="p-4">
                <h3 className="font-display text-lg leading-tight transition group-hover:text-spartan-gold">
                  {g.title}
                </h3>
                {g.caption && (
                  <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-white/60">
                    {g.caption}
                  </p>
                )}
                <div className="mt-3 flex items-center justify-between gap-2 text-[10px] font-bold uppercase tracking-widest text-white/30">
                  <span className="truncate">{g.credit || "Spartans media"}</span>
                  <span className="shrink-0 text-spartan-gold opacity-0 transition group-hover:opacity-100">
                    {g.video ? "Play →" : "Open →"}
                  </span>
                </div>
              </figcaption>
              <button
                type="button"
                onClick={() => open(g)}
                className={overlayButton}
                aria-label={`Open ${g.title}`}
              />
            </figure>
          ))}
        </div>
      )}

      <dialog
        ref={dialogRef}
        onClose={() => setActive(null)}
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
        className="gallery-dialog w-[min(92vw,900px)] max-h-[90vh] overflow-y-auto rounded-md border border-white/15 bg-spartan-ink p-0 text-white shadow-2xl"
      >
        {active && (
          <div>
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-white/10 bg-spartan-ink/95 px-4 py-3 backdrop-blur">
              <span className="text-[10px] font-bold uppercase tracking-widest text-spartan-gold">
                {active.date || "Gallery"}
              </span>
              <button
                type="button"
                onClick={close}
                className="rounded-sm border border-white/20 px-2.5 py-1 text-xs font-bold uppercase tracking-widest text-white/70 transition hover:border-white hover:text-white"
              >
                Close
              </button>
            </div>
            {active.video ? (
              <video
                key={active.id}
                src={active.video}
                poster={active.image}
                controls
                autoPlay
                playsInline
                preload="metadata"
                className="max-h-[62vh] w-full bg-black object-contain"
              >
                Your browser does not support embedded video.
              </video>
            ) : (
              active.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={active.image}
                  alt={active.title}
                  className="max-h-[62vh] w-full bg-black object-contain"
                />
              )
            )}
            <div className="p-5 sm:p-6">
              <h2 className="font-display text-2xl uppercase leading-tight">{active.title}</h2>
              {active.caption && (
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-white/70">
                  {active.caption}
                </p>
              )}
              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-white/40">
                {active.credit && (
                  <span>
                    {active.video ? "Video" : "Photo"}: {active.credit}
                  </span>
                )}
                {active.link && (
                  <a
                    href={active.link}
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold uppercase tracking-widest text-spartan-gold hover:text-white"
                  >
                    View original →
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
