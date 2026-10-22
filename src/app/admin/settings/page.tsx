"use client";

import { useAdmin } from "@/components/admin/AdminProvider";
import { Card, Field, ImageField, ListField, TextInput } from "@/components/admin/ui";
import { formations, type FormationKey } from "@/lib/formations";
import type { Club } from "@/lib/data";

export default function AdminSettings() {
  const { content, setContent, loading } = useAdmin();
  if (loading || !content) return <p className="text-white/50">Loading…</p>;

  const club = content.club;
  const settings = content.settings;
  const allKeys = Object.keys(formations) as FormationKey[];

  function setClub(patch: Partial<Club>) {
    setContent((c) => (c ? { ...c, club: { ...c.club, ...patch } } : c));
  }

  function toggleFormation(key: string, on: boolean) {
    setContent((c) => {
      if (!c) return c;
      const set = new Set(c.settings.enabledFormations);
      if (on) set.add(key);
      else set.delete(key);
      const enabled: string[] = allKeys.filter((k) => set.has(k));
      const defaultFormation = enabled.includes(c.settings.defaultFormation)
        ? c.settings.defaultFormation
        : enabled[0] ?? c.settings.defaultFormation;
      return { ...c, settings: { ...c.settings, enabledFormations: enabled, defaultFormation } };
    });
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl uppercase">Settings</h1>

      <Card title="Club information">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Club name">
            <TextInput value={club.name} onChange={(e) => setClub({ name: e.target.value })} />
          </Field>
          <Field label="Nickname">
            <TextInput value={club.nickname} onChange={(e) => setClub({ nickname: e.target.value })} />
          </Field>
          <Field label="Motto">
            <TextInput value={club.motto} onChange={(e) => setClub({ motto: e.target.value })} />
          </Field>
          <Field label="Slogan">
            <TextInput
              value={club.slogan ?? ""}
              onChange={(e) => setClub({ slogan: e.target.value })}
            />
          </Field>
          <Field label="Founded">
            <TextInput
              type="number"
              value={club.founded}
              onChange={(e) => setClub({ founded: Number(e.target.value) })}
            />
          </Field>
          <Field label="Town">
            <TextInput value={club.town} onChange={(e) => setClub({ town: e.target.value })} />
          </Field>
          <Field label="County">
            <TextInput value={club.county} onChange={(e) => setClub({ county: e.target.value })} />
          </Field>
          <Field label="Country">
            <TextInput value={club.country} onChange={(e) => setClub({ country: e.target.value })} />
          </Field>
          <Field label="Home ground">
            <TextInput value={club.ground} onChange={(e) => setClub({ ground: e.target.value })} />
          </Field>
          <Field label="Phone (primary)">
            <TextInput value={club.phone} onChange={(e) => setClub({ phone: e.target.value })} />
          </Field>
          <ListField
            label="All phone numbers (comma separated)"
            value={club.phones ?? [club.phone]}
            onChange={(phones) => setClub({ phones })}
            placeholder="0720874395, 0722469659"
          />
          <Field label="Email">
            <TextInput value={club.email} onChange={(e) => setClub({ email: e.target.value })} />
          </Field>
          <Field label="Age groups">
            <TextInput value={club.ageGroup} onChange={(e) => setClub({ ageGroup: e.target.value })} />
          </Field>
          <ImageField
            label="Club crest / logo (optional)"
            value={club.logo}
            onChange={(url) => setClub({ logo: url })}
          />
          <Field label="Facebook (page name)">
            <TextInput
              value={club.facebook ?? ""}
              onChange={(e) => setClub({ facebook: e.target.value })}
            />
          </Field>
          <Field label="Instagram (handle)">
            <TextInput
              value={club.instagram ?? ""}
              onChange={(e) => setClub({ instagram: e.target.value })}
            />
          </Field>
          <Field label="TikTok (handle, admin-only link)">
            <TextInput
              value={club.tiktok ?? ""}
              placeholder="@spartanssocceraca"
              onChange={(e) => setClub({ tiktok: e.target.value })}
            />
          </Field>
        </div>
      </Card>

      <Card title="Formations">
        <p className="mb-4 text-sm text-white/50">
          Choose which formations appear in the Lineup Builder, and the default one.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {allKeys.map((k) => {
            const on = settings.enabledFormations.includes(k);
            return (
              <label
                key={k}
                className={`flex cursor-pointer items-center gap-3 rounded-sm border p-4 ${
                  on ? "border-spartan-gold bg-spartan-gold/10" : "border-white/15"
                }`}
              >
                <input
                  type="checkbox"
                  checked={on}
                  onChange={(e) => toggleFormation(k, e.target.checked)}
                  className="h-4 w-4 accent-spartan-red"
                />
                <div>
                  <div className="font-display text-lg">{k}</div>
                  <div className="text-xs text-white/50">{formations[k].style}</div>
                </div>
              </label>
            );
          })}
        </div>
        <Field label="Default formation" className="mt-4 max-w-xs">
          <select
            value={settings.defaultFormation}
            onChange={(e) =>
              setContent((c) =>
                c ? { ...c, settings: { ...c.settings, defaultFormation: e.target.value } } : c,
              )
            }
            className="w-full rounded-sm border border-white/15 bg-black/40 px-3 py-2 text-sm outline-none focus:border-spartan-red"
          >
            {settings.enabledFormations.map((k) => (
              <option key={k}>{k}</option>
            ))}
          </select>
        </Field>
      </Card>
    </div>
  );
}
