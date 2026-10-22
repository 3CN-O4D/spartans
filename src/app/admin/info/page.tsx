"use client";

import { useAdmin } from "@/components/admin/AdminProvider";
import { Btn, Card, Field, TextInput } from "@/components/admin/ui";
import type { InfoRow } from "@/lib/data";

export default function AdminInfo() {
  const { content, setContent, loading } = useAdmin();
  if (loading || !content) return <p className="text-white/50">Loading…</p>;

  const info = content.info;

  function setTraining(rows: InfoRow[]) {
    setContent((c) => (c ? { ...c, info: { ...c.info, training: rows } } : c));
  }
  function setFees(rows: InfoRow[]) {
    setContent((c) => (c ? { ...c, info: { ...c.info, fees: rows } } : c));
  }
  function setTournament(patch: Partial<typeof info.tournament>) {
    setContent((c) =>
      c ? { ...c, info: { ...c.info, tournament: { ...c.info.tournament, ...patch } } } : c,
    );
  }

  function rowEditor(rows: InfoRow[], set: (r: InfoRow[]) => void) {
    return (
      <div className="space-y-2">
        {rows.map((r, i) => (
          <div key={i} className="flex flex-wrap items-end gap-2">
            <Field label="Label" className="flex-1 min-w-[160px]">
              <TextInput
                value={r.label}
                onChange={(e) => set(rows.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
              />
            </Field>
            <Field label="Value" className="flex-1 min-w-[160px]">
              <TextInput
                value={r.value}
                onChange={(e) => set(rows.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))}
              />
            </Field>
            <Btn variant="danger" onClick={() => set(rows.filter((_, j) => j !== i))}>
              ✕
            </Btn>
          </div>
        ))}
        <Btn onClick={() => set([...rows, { label: "New item", value: "" }])}>+ Add row</Btn>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl uppercase">Training &amp; Fees</h1>
        <p className="mt-1 text-sm text-white/50">
          Shown on the Contact page. Press Save changes to publish.
        </p>
      </div>

      <Card title="Training times">{rowEditor(info.training, setTraining)}</Card>
      <Card title="Fees & registration">{rowEditor(info.fees, setFees)}</Card>

      <Card title="Tournament / trip">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Title" className="sm:col-span-2">
            <TextInput
              value={info.tournament.title}
              onChange={(e) => setTournament({ title: e.target.value })}
            />
          </Field>
          <Field label="Dates">
            <TextInput
              value={info.tournament.dates}
              onChange={(e) => setTournament({ dates: e.target.value })}
            />
          </Field>
          <Field label="Cost">
            <TextInput
              value={info.tournament.cost}
              onChange={(e) => setTournament({ cost: e.target.value })}
            />
          </Field>
          <Field label="Note" className="sm:col-span-2">
            <TextInput
              value={info.tournament.note}
              onChange={(e) => setTournament({ note: e.target.value })}
            />
          </Field>
        </div>
      </Card>
    </div>
  );
}
