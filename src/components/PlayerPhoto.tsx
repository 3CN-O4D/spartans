"use client";

import { useState } from "react";
import type { Player } from "@/lib/data";

/**
 * Squad-card photo with an optional front/back toggle. The front image is
 * always the primary portrait; the back image is only shown when the coach
 * has uploaded one and a visitor taps the "Back" control.
 */
export function PlayerPhoto({ player }: { player: Player }) {
  const [showBack, setShowBack] = useState(false);
  const hasBack = Boolean(player.photo && player.photoBack);
  const src = showBack && player.photoBack ? player.photoBack : player.photo;

  return (
    <div className="relative h-full w-full">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={showBack ? `${player.name}, back view` : `${player.name}, ${player.position}`}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover object-top transition duration-500 group-hover:scale-[1.03]"
        />
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-2">
          <span className="font-display text-6xl text-white/20">{player.jerseyNo}</span>
          <span className="text-[10px] uppercase tracking-[0.3em] text-white/30">
            Photo coming
          </span>
        </div>
      )}

      {hasBack && (
        <button
          type="button"
          onClick={() => setShowBack((value) => !value)}
          className="absolute left-1/2 top-3 z-20 -translate-x-1/2 rounded-sm border border-white/20 bg-black/70 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-white backdrop-blur transition hover:border-white"
          aria-pressed={showBack}
        >
          {showBack ? "Front" : "Back"}
        </button>
      )}
    </div>
  );
}
