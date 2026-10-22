"use client";

import { useState } from "react";
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
import type { Article } from "@/lib/data";

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

const blank = (): Article => ({
  slug: "",
  title: "",
  category: "Club News",
  date: new Date().toISOString().slice(0, 10),
  readMins: 2,
  excerpt: "",
  body: [""],
  author: "Club Media",
});

export default function AdminNews() {
  const { content, setContent, loading } = useAdmin();
  const [editing, setEditing] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");

  if (loading || !content) return <p className="text-white/50">Loading…</p>;
  const articles = content.articles;

  function update(slug: string, patch: Partial<Article>) {
    setContent((c) =>
      c ? { ...c, articles: c.articles.map((a) => (a.slug === slug ? { ...a, ...patch } : a)) } : c,
    );
  }

  function add() {
    const a = blank();
    a.slug = `draft-${Date.now()}`;
    setContent((c) => (c ? { ...c, articles: [a, ...c.articles] } : c));
    setEditing(a.slug);
  }

  function remove(slug: string) {
    if (!confirm("Delete this article?")) return;
    setContent((c) => (c ? { ...c, articles: c.articles.filter((a) => a.slug !== slug) } : c));
    if (editing === slug) setEditing(null);
  }

  function move(slug: string, dir: -1 | 1) {
    setContent((c) => {
      if (!c) return c;
      const list = [...c.articles];
      const i = list.findIndex((a) => a.slug === slug);
      const j = i + dir;
      if (j < 0 || j >= list.length) return c;
      [list[i], list[j]] = [list[j], list[i]];
      return { ...c, articles: list };
    });
  }

  async function syncSocials() {
    const proceed = window.confirm(
      "Sync Instagram and TikTok now? Save any unsaved edits first — the page will reload if new posts are imported.",
    );
    if (!proceed) return;

    setSyncing(true);
    setSyncMessage("");
    try {
      const res = await fetch("/api/instagram/sync?force=1", { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as {
        imported?: number;
        skipped?: boolean;
        reason?: string;
        error?: string;
        instagram?: { imported?: number };
        tiktok?: { imported?: number };
      };

      if (!res.ok) {
        setSyncMessage(data.error ?? "Sync failed. Check the server logs.");
        return;
      }
      if (data.skipped) {
        setSyncMessage(data.reason ?? "Social accounts were checked recently.");
        return;
      }
      if (data.imported) {
        const instagram = data.instagram?.imported ?? 0;
        const tiktok = data.tiktok?.imported ?? 0;
        setSyncMessage(
          `Imported ${data.imported} new ${
            data.imported === 1 ? "post" : "posts"
          } (Instagram: ${instagram}, TikTok: ${tiktok}). Reloading…`,
        );
        window.setTimeout(() => window.location.reload(), 900);
        return;
      }
      setSyncMessage("No new Instagram or TikTok posts found.");
    } catch {
      setSyncMessage("Network error while checking social accounts.");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl uppercase">News &amp; Blog</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Btn onClick={() => void syncSocials()} disabled={syncing}>
            {syncing ? "Checking socials…" : "Sync socials"}
          </Btn>
          <Btn variant="primary" onClick={add}>
            + New article
          </Btn>
        </div>
      </div>

      {syncMessage && (
        <p
          role="status"
          aria-live="polite"
          className="rounded-sm border border-white/10 bg-spartan-steel px-4 py-3 text-sm text-white/70"
        >
          {syncMessage}
        </p>
      )}

      {articles.length === 0 && <EmptyState>No articles yet. Create your first one.</EmptyState>}

      <div className="space-y-3">
        {articles.map((a, i) => {
          const open = editing === a.slug;
          return (
            <Card key={a.slug}>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex flex-col gap-1">
                  <Btn onClick={() => move(a.slug, -1)} disabled={i === 0}>
                    ↑
                  </Btn>
                  <Btn onClick={() => move(a.slug, 1)} disabled={i === articles.length - 1}>
                    ↓
                  </Btn>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-display text-lg">
                    {a.title || "(untitled)"}
                  </div>
                  <div className="text-xs text-white/50">
                    {a.category} · {a.date} · /{a.slug}
                  </div>
                </div>
                <Btn onClick={() => setEditing(open ? null : a.slug)}>
                  {open ? "Close" : "Edit"}
                </Btn>
                <Btn variant="danger" onClick={() => remove(a.slug)}>
                  Delete
                </Btn>
              </div>

              {open && (
                <div className="mt-5 grid gap-4 border-t border-white/10 pt-5 lg:grid-cols-2">
                  <Field label="Title">
                    <TextInput
                      value={a.title}
                      onChange={(e) => {
                        const title = e.target.value;
                        update(a.slug, {
                          title,
                          slug: a.slug.startsWith("draft-") ? slugify(title) || a.slug : a.slug,
                        });
                      }}
                    />
                  </Field>
                  <Field label="Slug (URL)">
                    <TextInput value={a.slug} onChange={(e) => update(a.slug, { slug: e.target.value })} />
                  </Field>
                  <Field label="Category">
                    <TextInput value={a.category} onChange={(e) => update(a.slug, { category: e.target.value })} />
                  </Field>
                  <Field label="Author">
                    <TextInput value={a.author} onChange={(e) => update(a.slug, { author: e.target.value })} />
                  </Field>
                  <Field label="Date">
                    <TextInput type="date" value={a.date} onChange={(e) => update(a.slug, { date: e.target.value })} />
                  </Field>
                  <Field label="Read time (mins)">
                    <TextInput
                      type="number"
                      value={a.readMins}
                      onChange={(e) => update(a.slug, { readMins: Number(e.target.value) })}
                    />
                  </Field>
                  <div className="lg:col-span-2">
                    <ImageField
                      label="Cover image"
                      value={a.coverImage}
                      aspect="aspect-video"
                      onChange={(url) => update(a.slug, { coverImage: url })}
                    />
                  </div>
                  <Field label="Excerpt / summary" className="lg:col-span-2">
                    <TextArea
                      rows={2}
                      value={a.excerpt}
                      onChange={(e) => update(a.slug, { excerpt: e.target.value })}
                    />
                  </Field>
                  <div className="lg:col-span-2">
                    <Field label="Body (leave a blank line between paragraphs)">
                      <TextArea
                        rows={10}
                        value={a.body.join("\n\n")}
                        onChange={(e) =>
                          update(a.slug, {
                            body: e.target.value.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean),
                          })
                        }
                      />
                    </Field>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
