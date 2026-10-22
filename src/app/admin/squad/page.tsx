"use client";

import { useAdmin } from "@/components/admin/AdminProvider";
import { RatingBadge } from "@/components/RatingBadge";
import { playerOverall } from "@/lib/ratings";
import {
  Btn,
  Card,
  EmptyState,
  Field,
  ImageField,
  NumberInput,
  Select,
  TextArea,
  TextInput,
} from "@/components/admin/ui";
import type { Player } from "@/lib/data";

const positions: Player["position"][] = ["Goalkeeper", "Defender", "Midfielder", "Forward"];

function statLabels(pos: Player["position"]) {
  return pos === "Goalkeeper"
    ? ["DIV", "HAN", "KIC", "REF", "SPD", "POS"]
    : ["PAC", "SHO", "PAS", "DRI", "DEF", "PHY"];
}

const blank = (): Player => ({
  id: `player-${Date.now()}`,
  name: "New Player",
  position: "Midfielder",
  squadNo: 99,
  jerseyNo: 99,
  age: 14,
  hometown: "Eldoret",
  initials: "NP",
  bio: "",
});

export default function AdminSquad() {
  const { content, setContent, loading } = useAdmin();
  if (loading || !content) return <p className="text-white/50">Loading…</p>;

  const players = [...content.players].sort((a, b) => a.squadNo - b.squadNo);

  function update(id: string, patch: Partial<Player>) {
    setContent((c) =>
      c ? { ...c, players: c.players.map((p) => (p.id === id ? { ...p, ...patch } : p)) } : c,
    );
  }

  function setStat(id: string, label: string, value: number) {
    setContent((c) =>
      c
        ? {
            ...c,
            players: c.players.map((p) =>
              p.id === id ? { ...p, stats: { ...(p.stats ?? {}), [label]: value } } : p,
            ),
          }
        : c,
    );
  }

  function clearStats(id: string) {
    update(id, { stats: undefined });
  }

  function add() {
    setContent((c) => (c ? { ...c, players: [...c.players, blank()] } : c));
  }

  function remove(id: string) {
    if (!confirm("Remove this player from the squad?")) return;
    setContent((c) => (c ? { ...c, players: c.players.filter((p) => p.id !== id) } : c));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl uppercase">Squad</h1>
          <p className="mt-1 text-sm text-white/50">
            <span className="text-spartan-gold">Squad number</span> sets selection order in the
            lineup (lower = first choice). <span className="text-spartan-gold">Jersey number</span>{" "}
            is what appears on the kit.
          </p>
        </div>
        <Btn variant="primary" onClick={add}>
          + Add player
        </Btn>
      </div>

      {players.length === 0 && <EmptyState>No players yet.</EmptyState>}

      <div className="space-y-4">
        {players.map((p) => (
          <Card key={p.id}>
            <div className="grid gap-4 lg:grid-cols-[200px_1fr]">
              <div>
                <ImageField
                  label="Front photo (portrait)"
                  value={p.photo}
                  onChange={(url) => update(p.id, { photo: url })}
                />
                <p className="mt-2 text-[11px] leading-relaxed text-white/40">
                  Used on the squad and lineup pages. A head-and-shoulders shot works best.
                </p>
                <div className="mt-4">
                  <ImageField
                    label="Back photo (optional)"
                    value={p.photoBack}
                    onChange={(url) => update(p.id, { photoBack: url })}
                  />
                  <p className="mt-2 text-[11px] leading-relaxed text-white/40">
                    Shown when a visitor taps “Back” on the squad card. The lineup uses the front
                    photo only.
                  </p>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Name">
                  <TextInput value={p.name} onChange={(e) => update(p.id, { name: e.target.value })} />
                </Field>
                <Field label="Position">
                  <Select
                    value={p.position}
                    onChange={(e) =>
                      update(p.id, { position: e.target.value as Player["position"] })
                    }
                  >
                    {positions.map((pos) => (
                      <option key={pos}>{pos}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Initials (fallback)">
                  <TextInput
                    value={p.initials}
                    onChange={(e) => update(p.id, { initials: e.target.value.slice(0, 3) })}
                  />
                </Field>
                <Field label="Squad no (order)">
                  <NumberInput
                    value={p.squadNo}
                    onChange={(e) => update(p.id, { squadNo: Number(e.target.value) })}
                  />
                </Field>
                <Field label="Jersey no">
                  <NumberInput
                    value={p.jerseyNo}
                    onChange={(e) => update(p.id, { jerseyNo: Number(e.target.value) })}
                  />
                </Field>
                <Field label="Age">
                  <NumberInput value={p.age} onChange={(e) => update(p.id, { age: Number(e.target.value) })} />
                </Field>
                <Field label="Hometown" className="sm:col-span-2 lg:col-span-2">
                  <TextInput value={p.hometown} onChange={(e) => update(p.id, { hometown: e.target.value })} />
                </Field>
                <Field label="Bio" className="sm:col-span-2 lg:col-span-3">
                  <TextArea rows={2} value={p.bio} onChange={(e) => update(p.id, { bio: e.target.value })} />
                </Field>
              </div>
            </div>

            <div className="mt-4 border-t border-white/10 pt-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-white/50">
                    Stats (optional — leave blank to auto-generate)
                  </span>
                  <RatingBadge value={playerOverall(p)} />
                </div>
                <Btn onClick={() => clearStats(p.id)}>Reset to auto</Btn>
              </div>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
                {statLabels(p.position).map((label) => (
                  <Field key={label} label={label}>
                    <NumberInput
                      min={1}
                      max={99}
                      value={p.stats?.[label] ?? ""}
                      placeholder="auto"
                      onChange={(e) => setStat(p.id, label, Number(e.target.value))}
                    />
                  </Field>
                ))}
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <Btn variant="danger" onClick={() => remove(p.id)}>
                Remove player
              </Btn>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
