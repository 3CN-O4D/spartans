"use client";

import { useAdmin } from "@/components/admin/AdminProvider";
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
import type { Fixture } from "@/lib/data";

const blank = (): Fixture => ({
  id: `f-${Date.now()}`,
  competition: "Uasin Gishu Youth League",
  opponent: "New Opponent",
  opponentInfo: "",
  date: new Date().toISOString().slice(0, 10),
  time: "14:00",
  venue: "Home",
  ground: "Spartans Arena, Eldoret",
  status: "upcoming",
});

export default function AdminFixtures() {
  const { content, setContent, loading } = useAdmin();
  if (loading || !content) return <p className="text-white/50">Loading…</p>;

  const fixtures = content.fixtures;

  function update(id: string, patch: Partial<Fixture>) {
    setContent((c) =>
      c ? { ...c, fixtures: c.fixtures.map((f) => (f.id === id ? { ...f, ...patch } : f)) } : c,
    );
  }

  function remove(id: string) {
    if (!confirm("Delete this fixture?")) return;
    setContent((c) => (c ? { ...c, fixtures: c.fixtures.filter((f) => f.id !== id) } : c));
  }

  function add() {
    setContent((c) => (c ? { ...c, fixtures: [blank(), ...c.fixtures] } : c));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl uppercase">Fixtures &amp; Results</h1>
          <p className="mt-1 text-sm text-white/50">
            Upcoming fixtures power the match countdown on the homepage. Add the opponent logo,
            info, date and kick-off time.
          </p>
        </div>
        <Btn variant="primary" onClick={add}>
          + Add fixture
        </Btn>
      </div>

      {fixtures.length === 0 && <EmptyState>No fixtures yet.</EmptyState>}

      <div className="space-y-4">
        {fixtures.map((f) => (
          <Card key={f.id}>
            <div className="grid gap-4 lg:grid-cols-[200px_1fr]">
              <ImageField
                label="Opponent logo"
                value={f.opponentLogo}
                onChange={(url) => update(f.id, { opponentLogo: url })}
              />
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Opponent">
                  <TextInput value={f.opponent} onChange={(e) => update(f.id, { opponent: e.target.value })} />
                </Field>
                <Field label="Competition">
                  <TextInput value={f.competition} onChange={(e) => update(f.id, { competition: e.target.value })} />
                </Field>
                <Field label="Status">
                  <Select
                    value={f.status}
                    onChange={(e) => update(f.id, { status: e.target.value as Fixture["status"] })}
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="result">Result</option>
                  </Select>
                </Field>
                <Field label="Date">
                  <TextInput type="date" value={f.date} onChange={(e) => update(f.id, { date: e.target.value })} />
                </Field>
                <Field label="Kick-off time">
                  <TextInput type="time" value={f.time} onChange={(e) => update(f.id, { time: e.target.value })} />
                </Field>
                <Field label="Home / Away">
                  <Select
                    value={f.venue}
                    onChange={(e) => update(f.id, { venue: e.target.value as Fixture["venue"] })}
                  >
                    <option value="Home">Home</option>
                    <option value="Away">Away</option>
                  </Select>
                </Field>
                <Field label="Ground / venue" className="sm:col-span-2 lg:col-span-2">
                  <TextInput value={f.ground} onChange={(e) => update(f.id, { ground: e.target.value })} />
                </Field>
                {f.status === "result" && (
                  <>
                    <Field label="Spartans score">
                      <NumberInput
                        value={f.scoreFor ?? 0}
                        onChange={(e) => update(f.id, { scoreFor: Number(e.target.value) })}
                      />
                    </Field>
                    <Field label="Opponent score">
                      <NumberInput
                        value={f.scoreAgainst ?? 0}
                        onChange={(e) => update(f.id, { scoreAgainst: Number(e.target.value) })}
                      />
                    </Field>
                  </>
                )}
                <Field label="Opponent info" className="sm:col-span-2 lg:col-span-3">
                  <TextArea
                    rows={2}
                    value={f.opponentInfo ?? ""}
                    onChange={(e) => update(f.id, { opponentInfo: e.target.value })}
                  />
                </Field>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Btn variant="danger" onClick={() => remove(f.id)}>
                Delete fixture
              </Btn>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
