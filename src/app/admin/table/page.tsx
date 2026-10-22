"use client";

import { useAdmin } from "@/components/admin/AdminProvider";
import { Btn, Card, EmptyState, Field, ImageField, NumberInput, TextInput } from "@/components/admin/ui";
import type { TableRow } from "@/lib/data";

const blank = (): TableRow => ({
  pos: 1,
  team: "New Team",
  played: 0,
  won: 0,
  drawn: 0,
  lost: 0,
  gd: 0,
  points: 0,
});

export default function AdminTable() {
  const { content, setContent, loading } = useAdmin();
  if (loading || !content) return <p className="text-white/50">Loading…</p>;

  const rows = content.leagueTable;

  function update(i: number, patch: Partial<TableRow>) {
    setContent((c) =>
      c
        ? { ...c, leagueTable: c.leagueTable.map((r, idx) => (idx === i ? { ...r, ...patch } : r)) }
        : c,
    );
  }

  function remove(i: number) {
    setContent((c) => (c ? { ...c, leagueTable: c.leagueTable.filter((_, idx) => idx !== i) } : c));
  }

  function add() {
    setContent((c) => (c ? { ...c, leagueTable: [...c.leagueTable, blank()] } : c));
  }

  function renumber() {
    setContent((c) =>
      c
        ? {
            ...c,
            leagueTable: [...c.leagueTable]
              .sort((a, b) => b.points - a.points || b.gd - a.gd)
              .map((r, idx) => ({ ...r, pos: idx + 1 })),
          }
        : c,
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl uppercase">League Table</h1>
          <p className="mt-1 text-sm text-white/50">
            Rows where the team name matches the club name are highlighted automatically.
          </p>
        </div>
        <div className="flex gap-2">
          <Btn onClick={renumber}>Auto-order by points</Btn>
          <Btn variant="primary" onClick={add}>
            + Add team
          </Btn>
        </div>
      </div>

      {rows.length === 0 && <EmptyState>No table rows.</EmptyState>}

      <div className="space-y-3">
        {rows.map((r, i) => (
          <Card key={i}>
            <div className="grid items-end gap-3 lg:grid-cols-[120px_1fr_repeat(7,minmax(0,1fr))_auto]">
              <ImageField
                label="Logo"
                value={r.logo}
                onChange={(url) => update(i, { logo: url })}
              />
              <Field label="Team">
                <TextInput value={r.team} onChange={(e) => update(i, { team: e.target.value })} />
              </Field>
              <Field label="P">
                <NumberInput value={r.played} onChange={(e) => update(i, { played: Number(e.target.value) })} />
              </Field>
              <Field label="W">
                <NumberInput value={r.won} onChange={(e) => update(i, { won: Number(e.target.value) })} />
              </Field>
              <Field label="D">
                <NumberInput value={r.drawn} onChange={(e) => update(i, { drawn: Number(e.target.value) })} />
              </Field>
              <Field label="L">
                <NumberInput value={r.lost} onChange={(e) => update(i, { lost: Number(e.target.value) })} />
              </Field>
              <Field label="GD">
                <NumberInput value={r.gd} onChange={(e) => update(i, { gd: Number(e.target.value) })} />
              </Field>
              <Field label="Pts">
                <NumberInput value={r.points} onChange={(e) => update(i, { points: Number(e.target.value) })} />
              </Field>
              <Field label="Pos">
                <NumberInput value={r.pos} onChange={(e) => update(i, { pos: Number(e.target.value) })} />
              </Field>
              <Btn variant="danger" onClick={() => remove(i)}>
                ✕
              </Btn>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
