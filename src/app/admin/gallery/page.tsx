"use client";

import { useRef, useState } from "react";
import { useAdmin } from "@/components/admin/AdminProvider";
import {
  Btn,
  Card,
  EmptyState,
  Field,
  ImageField,
  TextArea,
  TextInput,
} from "@/components/admin/ui";
import type { GalleryItem } from "@/lib/data";

const tints = [
  "from-spartan-red to-spartan-ink",
  "from-spartan-gold to-spartan-red",
  "from-sky-700 to-spartan-ink",
  "from-emerald-600 to-spartan-ink",
  "from-violet-700 to-spartan-ink",
  "from-rose-500 to-spartan-darkred",
];

export default function AdminGallery() {
  const { content, setContent, upload, loading } = useAdmin();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(24);

  if (loading || !content) return <p className="text-white/50">Loading…</p>;

  const items = content.gallery;
  const needle = query.trim().toLowerCase();
  const filtered = needle
    ? items.filter(
        (g) =>
          g.title.toLowerCase().includes(needle) ||
          g.id.toLowerCase().includes(needle) ||
          (g.date ?? "").toLowerCase().includes(needle),
      )
    : items;
  const shown = filtered.slice(0, limit);

  function update(id: string, patch: Partial<GalleryItem>) {
    setContent((c) =>
      c ? { ...c, gallery: c.gallery.map((g) => (g.id === id ? { ...g, ...patch } : g)) } : c,
    );
  }

  function remove(id: string) {
    if (!confirm("Remove this gallery item?")) return;
    setContent((c) => (c ? { ...c, gallery: c.gallery.filter((g) => g.id !== id) } : c));
  }

  function move(id: string, dir: -1 | 1) {
    setContent((c) => {
      if (!c) return c;
      const list = [...c.gallery];
      const i = list.findIndex((g) => g.id === id);
      const j = i + dir;
      if (j < 0 || j >= list.length) return c;
      [list[i], list[j]] = [list[j], list[i]];
      return { ...c, gallery: list };
    });
  }

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setBusy(true);
    const uploaded: GalleryItem[] = [];
    for (const file of files) {
      const url = await upload(file);
      if (url) {
        uploaded.push({
          id: `g-${Date.now()}-${Math.round(Math.random() * 1e6)}`,
          title: file.name.replace(/\.[^.]+$/, ""),
          image: url,
          tint: tints[Math.floor(Math.random() * tints.length)],
        });
      }
    }
    setBusy(false);
    if (uploaded.length) setContent((c) => (c ? { ...c, gallery: [...uploaded, ...c.gallery] } : c));
    if (fileRef.current) fileRef.current.value = "";
  }

  function addEmpty() {
    setContent((c) =>
      c
        ? {
            ...c,
            gallery: [
              { id: `g-${Date.now()}`, title: "New photo", tint: tints[0] },
              ...c.gallery,
            ],
          }
        : c,
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl uppercase">Gallery</h1>
        <div className="flex gap-2">
          <Btn onClick={addEmpty}>+ Blank tile</Btn>
          <Btn variant="primary" onClick={() => fileRef.current?.click()} disabled={busy}>
            {busy ? "Uploading…" : "+ Upload photos"}
          </Btn>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            multiple
            className="hidden"
            onChange={(e) => void onUpload(e)}
          />
        </div>
      </div>

      {items.length === 0 && (
        <EmptyState>No photos yet. Upload some images to build the gallery.</EmptyState>
      )}

      {items.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-[220px] flex-1">
            <TextInput
              value={query}
              placeholder={`Search ${items.length} gallery items by title, date or id…`}
              onChange={(e) => {
                setQuery(e.target.value);
                setLimit(24);
              }}
            />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-white/40">
            {filtered.length} shown
          </span>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((g) => {
          const i = items.findIndex((item) => item.id === g.id);
          return (
          <Card key={g.id}>
            <div className={`relative aspect-video w-full overflow-hidden rounded-sm bg-gradient-to-br ${g.tint}`}>
              {g.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={g.image} alt="" className="h-full w-full object-cover" />
              )}
              {g.video && (
                <span className="absolute left-2 top-2 rounded-sm bg-black/70 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
                  Video
                </span>
              )}
            </div>
            <div className="mt-3 space-y-3">
              <ImageField
                label="Image / video poster"
                value={g.image}
                aspect="aspect-video"
                onChange={(url) => update(g.id, { image: url })}
              />
              <Field label="Title">
                <TextInput value={g.title} onChange={(e) => update(g.id, { title: e.target.value })} />
              </Field>
              <Field label="Story / caption">
                <TextArea
                  rows={3}
                  value={g.caption ?? ""}
                  placeholder="Tell the story behind the photo — who, where, what happened."
                  onChange={(e) => update(g.id, { caption: e.target.value })}
                />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Date / matchday">
                  <TextInput
                    value={g.date ?? ""}
                    placeholder="e.g. 12 Oct 2026"
                    onChange={(e) => update(g.id, { date: e.target.value })}
                  />
                </Field>
                <Field label="Photo credit">
                  <TextInput
                    value={g.credit ?? ""}
                    placeholder="e.g. Club media"
                    onChange={(e) => update(g.id, { credit: e.target.value })}
                  />
                </Field>
              </div>
              <Field label="Video file / URL (optional)">
                <TextInput
                  value={g.video ?? ""}
                  placeholder="/videos/clip.mp4"
                  onChange={(e) => update(g.id, { video: e.target.value })}
                />
              </Field>
              <Field label="Post link (optional)">
                <TextInput
                  value={g.link ?? ""}
                  placeholder="https://www.instagram.com/p/…"
                  onChange={(e) => update(g.id, { link: e.target.value })}
                />
              </Field>
              <Field label="Placeholder tint (if no image)">
                <TextInput
                  value={g.tint}
                  onChange={(e) => update(g.id, { tint: e.target.value })}
                />
              </Field>
              <div className="flex items-center gap-2">
                <Btn onClick={() => move(g.id, -1)} disabled={i === 0}>
                  ↑ Up
                </Btn>
                <Btn onClick={() => move(g.id, 1)} disabled={i === items.length - 1}>
                  ↓ Down
                </Btn>
                <Btn variant="danger" className="ml-auto" onClick={() => remove(g.id)}>
                  Remove
                </Btn>
              </div>
            </div>
          </Card>
          );
        })}
      </div>

      {filtered.length > shown.length && (
        <div className="flex justify-center">
          <Btn onClick={() => setLimit((count) => count + 24)}>
            Show more ({filtered.length - shown.length} left)
          </Btn>
        </div>
      )}
    </div>
  );
}
