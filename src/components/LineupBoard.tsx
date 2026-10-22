"use client";

import { useMemo, useState } from "react";
import { PlayerAvatar, ringColor } from "@/components/PlayerAvatar";
import { RatingBadge } from "@/components/RatingBadge";
import { StrengthStrip } from "@/components/TeamStrength";
import { playerOverall, teamStrength } from "@/lib/ratings";
import type { Player, Lineup } from "@/lib/data";
import {
  defaultLineup,
  formations,
  isValidFormation,
  placedPlayers,
  resolveLineup,
  type FormationKey,
} from "@/lib/formations";

type Selection =
  | { kind: "slot"; index: number }
  | { kind: "bench"; id: string }
  | null;

function startingDraft(
  players: Player[],
  lineup: Lineup | undefined,
  defaultFormation: string,
): Lineup {
  if (lineup && isValidFormation(lineup.formation)) {
    const count = formations[lineup.formation].slots.length;
    const slots = [...lineup.slots];
    while (slots.length < count) slots.push(null);
    return { formation: lineup.formation, slots: slots.slice(0, count) };
  }
  return defaultLineup(players, defaultFormation);
}

export function LineupBoard({
  players,
  lineup,
  defaultFormation,
  clubName,
}: {
  players: Player[];
  lineup?: Lineup;
  defaultFormation: string;
  clubName: string;
}) {
  const initial = useMemo(
    () => startingDraft(players, lineup, defaultFormation),
    [players, lineup, defaultFormation],
  );
  const [draft, setDraft] = useState<Lineup>(initial);
  const [selected, setSelected] = useState<Selection>(null);

  const { formationKey, placed, bench } = resolveLineup(players, draft, defaultFormation);
  const formation = formations[formationKey];
  const starters = placed.filter((player): player is Player => Boolean(player));
  const strength = teamStrength(starters);
  const benchSelection = selected?.kind === "bench" ? selected : null;

  function changeFormation(nextKey: FormationKey) {
    const currentStarters = placed.filter((player): player is Player => Boolean(player));
    const remapped = placedPlayers(formations[nextKey], currentStarters);
    const slots = formations[nextKey].slots.map((_, i) => remapped[i]?.id ?? null);
    setDraft({ formation: nextKey, slots });
    setSelected(null);
  }

  function clickSlot(index: number) {
    if (selected?.kind === "bench") {
      const slots = [...draft.slots];
      slots[index] = selected.id;
      setDraft({ ...draft, slots });
      setSelected(null);
      return;
    }

    if (selected?.kind === "slot") {
      if (selected.index === index) {
        setSelected(null);
        return;
      }
      const slots = [...draft.slots];
      [slots[index], slots[selected.index]] = [slots[selected.index], slots[index]];
      setDraft({ ...draft, slots });
      setSelected(null);
      return;
    }

    setSelected({ kind: "slot", index });
  }

  function clickBench(id: string) {
    if (selected?.kind === "slot") {
      const slots = [...draft.slots];
      slots[selected.index] = id;
      setDraft({ ...draft, slots });
      setSelected(null);
      return;
    }
    setSelected(selected?.kind === "bench" && selected.id === id ? null : { kind: "bench", id });
  }

  function reset() {
    setDraft(initial);
    setSelected(null);
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 rounded-sm border border-spartan-gold/30 bg-spartan-gold/5 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-widest text-spartan-gold">
            Lineup sandbox
          </div>
          <p className="mt-1 text-sm text-white/60">
            Tap a position, then a substitute. Tap two positions to swap them. Changes are
            preview-only and reset when you reload.
          </p>
        </div>
        <button
          type="button"
          onClick={reset}
          className="shrink-0 rounded-sm border border-white/20 px-3 py-2 text-xs font-bold uppercase tracking-widest text-white/70 transition hover:border-spartan-gold hover:text-spartan-gold"
        >
          Reset XI
        </button>
      </div>

      <div className="mb-6">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <h2 className="font-display text-lg uppercase text-spartan-gold">Starting XI strength</h2>
          <span className="text-xs text-white/40">
            {formation.name} · {starters.length} players rated
          </span>
        </div>
        <StrengthStrip strength={strength} />
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.35fr_1fr]">
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="font-display uppercase tracking-wide">{clubName}</span>
            <div className="flex items-center gap-2">
              <label
                htmlFor="public-formation"
                className="text-[10px] font-bold uppercase tracking-widest text-white/40"
              >
                Formation
              </label>
              <select
                id="public-formation"
                value={formationKey}
                onChange={(event) => changeFormation(event.target.value as FormationKey)}
                className="rounded-sm border border-white/15 bg-black/40 px-3 py-2 text-xs text-white outline-none focus:border-spartan-gold"
              >
                {(Object.keys(formations) as FormationKey[]).map((key) => (
                  <option key={key} value={key}>
                    {key} — {formations[key].style}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="relative mt-4 aspect-[4/5] w-full overflow-hidden rounded-md border border-white/15 bg-gradient-to-b from-emerald-800 via-emerald-900 to-emerald-950 sm:aspect-[3/4]">
            <div className="pitch-stripes absolute inset-0" />
            <div className="absolute inset-3 rounded-sm border-2 border-white/35" />
            <div className="absolute left-3 right-3 top-1/2 h-0.5 -translate-y-1/2 bg-white/35" />
            <div className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/35" />
            <div className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/50" />
            <div className="absolute left-1/2 top-3 h-[15%] w-[58%] -translate-x-1/2 border-2 border-t-0 border-white/35" />
            <div className="absolute left-1/2 top-3 h-[6%] w-[30%] -translate-x-1/2 border-2 border-t-0 border-white/35" />
            <div className="absolute bottom-3 left-1/2 h-[15%] w-[58%] -translate-x-1/2 border-2 border-b-0 border-white/35" />
            <div className="absolute bottom-3 left-1/2 h-[6%] w-[30%] -translate-x-1/2 border-2 border-b-0 border-white/35" />

            {placed.map((player, i) => {
              const slot = formation.slots[i];
              const isSelected = selected?.kind === "slot" && selected.index === i;
              const isTarget = selected !== null && !isSelected;
              return (
                <button
                  key={slot.key}
                  type="button"
                  onClick={() => clickSlot(i)}
                  aria-pressed={isSelected}
                  aria-label={
                    player
                      ? `${player.name} at ${slot.label}. Select to swap.`
                      : `Empty ${slot.label} position. Select to place a player.`
                  }
                  className="absolute z-20 -translate-x-1/2 -translate-y-1/2 cursor-pointer border-0 bg-transparent p-0 text-inherit"
                  style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
                >
                  <div className="flex flex-col items-center">
                    <div
                      className={`animate-floaty relative rounded-full p-1 transition-transform duration-300 hover:scale-110 ${
                        isSelected ? "ring-2 ring-spartan-gold ring-offset-2 ring-offset-emerald-900" : ""
                      } ${isTarget ? "opacity-90" : ""}`}
                      style={{ animationDelay: `${(i % 5) * 0.4}s` }}
                    >
                      <div
                        className="rounded-full ring-2"
                        style={{ boxShadow: `0 0 22px ${player ? ringColor(player) : "#fff"}66` }}
                      >
                        {player ? (
                          <PlayerAvatar player={player} className="h-12 w-12 sm:h-14 sm:w-14" />
                        ) : (
                          <div className="grid h-12 w-12 place-items-center rounded-full bg-white/15 text-xs sm:h-14 sm:w-14">
                            —
                          </div>
                        )}
                      </div>
                      <span className="pointer-events-none absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-black/80 px-1.5 text-[10px] font-bold text-white">
                        {slot.label}
                      </span>
                      {player && (
                        <span className="pointer-events-none absolute -right-1 -top-1 z-30">
                          <RatingBadge compact value={playerOverall(player)} />
                        </span>
                      )}
                    </div>
                    <span className="mt-1.5 max-w-[84px] truncate rounded-sm bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white sm:text-[11px]">
                      {player ? player.name.split(" ").slice(-1)[0] : "—"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-xl uppercase text-spartan-gold">
              Substitutes ({bench.length})
            </h2>
            <span className="text-[10px] uppercase tracking-widest text-white/40">
              {benchSelection ? "Pick a position" : "Tap to select"}
            </span>
          </div>
          <div className="mt-4 grid max-h-[70vh] grid-cols-1 gap-3 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-1">
            {bench.map((p) => {
              const selectedBench = benchSelection?.id === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => clickBench(p.id)}
                  aria-pressed={selectedBench}
                  className={`flex w-full items-center gap-3 rounded-sm border p-3 text-left transition ${
                    selectedBench
                      ? "border-spartan-gold bg-spartan-gold/10"
                      : "border-white/10 bg-spartan-steel hover:border-white/40"
                  }`}
                >
                  <PlayerAvatar player={p} className="h-11 w-11 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{p.name}</div>
                    <div className="text-[11px] uppercase tracking-widest text-white/50">
                      {p.position} · #{p.jerseyNo}
                    </div>
                  </div>
                  <RatingBadge compact value={playerOverall(p)} />
                </button>
              );
            })}
            {bench.length === 0 && <p className="text-sm text-white/40">Everyone is on the pitch.</p>}
          </div>
          {benchSelection && (
            <p className="mt-3 text-center text-xs uppercase tracking-widest text-spartan-gold">
              Tap a position to place this player
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
