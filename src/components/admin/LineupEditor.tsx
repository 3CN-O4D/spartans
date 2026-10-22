"use client";

import { useEffect, useMemo, useState } from "react";
import { useAdmin } from "@/components/admin/AdminProvider";
import { Btn } from "@/components/admin/ui";
import { PlayerAvatar, ringColor } from "@/components/PlayerAvatar";
import type { Player } from "@/lib/data";
import {
  defaultLineup,
  formations,
  isValidFormation,
  placedPlayers,
  type FormationKey,
} from "@/lib/formations";

export function LineupEditor() {
  const { content, setContent } = useAdmin();
  const [selectedBench, setSelectedBench] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  const players = useMemo(() => content?.players ?? [], [content]);
  const settings = content?.settings;

  const enabled = (settings?.enabledFormations ?? []).filter(isValidFormation) as FormationKey[];
  const fallbackKey: FormationKey = enabled.includes(settings?.defaultFormation as FormationKey)
    ? (settings!.defaultFormation as FormationKey)
    : enabled[0] ?? "4-3-3";

  const lineup = content?.lineup;
  const key: FormationKey =
    lineup && isValidFormation(lineup.formation) && enabled.includes(lineup.formation)
      ? lineup.formation
      : fallbackKey;
  const formation = formations[key];
  const slotCount = formation.slots.length;

  useEffect(() => {
    if (!content) return;
    if (!content.lineup || !isValidFormation(content.lineup.formation)) {
      setContent((c) => (c ? { ...c, lineup: defaultLineup(c.players, fallbackKey) } : c));
    }
  }, [content, fallbackKey, setContent]);

  const byId = useMemo(() => new Map(players.map((p) => [p.id, p] as const)), [players]);

  const slots = useMemo(() => {
    const raw = lineup && isValidFormation(lineup.formation) ? lineup.slots : [];
    const arr = [...raw];
    while (arr.length < slotCount) arr.push(null);
    return arr.slice(0, slotCount);
  }, [lineup, slotCount]);

  const placed = slots.map((id) => (id ? byId.get(id) : undefined));
  const used = new Set(slots.filter((x): x is string => !!x));
  const bench = [...players].sort((a, b) => a.squadNo - b.squadNo).filter((p) => !used.has(p.id));

  function writeSlots(next: (string | null)[]) {
    setContent((c) => (c ? { ...c, lineup: { formation: key, slots: next } } : c));
  }

  function changeFormation(next: FormationKey) {
    const currentStarters = placed.filter((p): p is Player => !!p);
    const remapped = placedPlayers(formations[next], currentStarters);
    const nextSlots = formations[next].slots.map((_, i) => remapped[i]?.id ?? null);
    setContent((c) => (c ? { ...c, lineup: { formation: next, slots: nextSlots } } : c));
    setSelectedBench(null);
  }

  function moveToSlot(id: string, index: number) {
    const s = [...slots];
    const src = s.indexOf(id);
    if (src >= 0) {
      const tmp = s[index];
      s[index] = id;
      s[src] = tmp;
    } else {
      s[index] = id;
    }
    writeSlots(s);
    setSelectedBench(null);
  }

  function toBench(id: string) {
    writeSlots(slots.map((x) => (x === id ? null : x)));
    setSelectedBench(null);
  }

  function autoFill() {
    const s = defaultLineup(players, key).slots;
    writeSlots(s);
    setSelectedBench(null);
  }

  function onSlotClick(index: number, player?: Player) {
    if (selectedBench) moveToSlot(selectedBench, index);
    else if (player) setSelectedBench(null);
  }

  if (!content) return <p className="text-white/50">Loading…</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <label className="mr-2 text-[11px] font-bold uppercase tracking-widest text-white/50">
            Formation
          </label>
          <select
            value={key}
            onChange={(e) => changeFormation(e.target.value as FormationKey)}
            className="rounded-sm border border-white/15 bg-black/40 px-3 py-2 text-sm outline-none focus:border-spartan-red"
          >
            {enabled.map((k) => (
              <option key={k} value={k}>
                {k} — {formations[k].style}
              </option>
            ))}
          </select>
        </div>
        <Btn onClick={autoFill}>Auto-fill best XI</Btn>
        <Btn
          variant="danger"
          onClick={() => writeSlots(Array(slotCount).fill(null))}
        >
          Clear pitch
        </Btn>
        <span className="text-xs text-white/40">
          Drag players onto the pitch, or tap a substitute then tap a position.
        </span>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.35fr_1fr]">
        <div>
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-md border border-white/15 bg-gradient-to-b from-emerald-800 via-emerald-900 to-emerald-950 sm:aspect-[3/4]">
            <div className="pitch-stripes absolute inset-0" />
            <div className="absolute inset-3 rounded-sm border-2 border-white/35" />
            <div className="absolute left-3 right-3 top-1/2 h-0.5 -translate-y-1/2 bg-white/35" />
            <div className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/35" />
            <div className="absolute left-1/2 top-3 h-[15%] w-[58%] -translate-x-1/2 border-2 border-t-0 border-white/35" />
            <div className="absolute bottom-3 left-1/2 h-[15%] w-[58%] -translate-x-1/2 border-2 border-b-0 border-white/35" />

            {placed.map((player, i) => {
              const slot = formation.slots[i];
              const isTarget = !!selectedBench || dragOver === i;
              return (
                <div
                  key={slot.key}
                  onClick={() => onSlotClick(i, player)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(i);
                  }}
                  onDragLeave={() => setDragOver((v) => (v === i ? null : v))}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(null);
                    const id = e.dataTransfer.getData("text/player");
                    if (id) moveToSlot(id, i);
                  }}
                  className="absolute z-20 -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                  style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
                >
                  <div className="flex flex-col items-center">
                    <div
                      className={`relative rounded-full p-1 transition-transform duration-300 hover:scale-110 ${
                        isTarget ? "animate-ring" : ""
                      }`}
                    >
                      <div
                        className="rounded-full ring-2"
                        style={{ boxShadow: `0 0 22px ${player ? ringColor(player) : "#fff"}66` }}
                      >
                        {player ? (
                          <div
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData("text/player", player.id);
                              e.dataTransfer.effectAllowed = "move";
                            }}
                          >
                            <PlayerAvatar player={player} className="h-12 w-12 sm:h-14 sm:w-14" />
                          </div>
                        ) : (
                          <div className="grid h-12 w-12 place-items-center rounded-full border border-dashed border-white/40 text-xs text-white/50 sm:h-14 sm:w-14">
                            +
                          </div>
                        )}
                      </div>
                      <span className="pointer-events-none absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-black/80 px-1.5 text-[10px] font-bold text-white">
                        {slot.label}
                      </span>
                    </div>
                    <span className="mt-1.5 max-w-[84px] truncate rounded-sm bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white sm:text-[11px]">
                      {player ? player.name.split(" ").slice(-1)[0] : "Empty"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const id = e.dataTransfer.getData("text/player");
            if (id) toBench(id);
          }}
        >
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl uppercase text-spartan-gold">
              Bench ({bench.length})
            </h2>
            <span className="text-xs uppercase tracking-widest text-white/40">
              drag to/from pitch
            </span>
          </div>
          <div className="mt-4 grid max-h-[70vh] grid-cols-1 gap-3 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-1">
            {bench.map((p) => {
              const sel = selectedBench === p.id;
              return (
                <div
                  key={p.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/player", p.id);
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  onClick={() => setSelectedBench(sel ? null : p.id)}
                  className={`flex cursor-grab items-center gap-3 rounded-sm border p-3 text-left transition ${
                    sel
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
                </div>
              );
            })}
            {bench.length === 0 && <p className="text-sm text-white/40">Everyone is on the pitch.</p>}
          </div>
          {selectedBench && (
            <p className="mt-3 text-center text-xs uppercase tracking-widest text-spartan-gold">
              Tap a position to place this player
            </p>
          )}
        </div>
      </div>

      <p className="text-xs text-white/40">
        Press <span className="text-spartan-gold">Save changes</span> (top right) to publish this
        lineup to the website.
      </p>
    </div>
  );
}
