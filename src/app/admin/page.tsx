"use client";

import Link from "next/link";
import { useAdmin } from "@/components/admin/AdminProvider";
import { Card } from "@/components/admin/ui";

export default function AdminDashboard() {
  const { content, loading } = useAdmin();

  if (loading || !content) {
    return <p className="text-white/50">Loading…</p>;
  }

  const stats = [
    { label: "News articles", value: content.articles.length, href: "/admin/news" },
    { label: "Gallery items", value: content.gallery.length, href: "/admin/gallery" },
    { label: "Squad players", value: content.players.length, href: "/admin/squad" },
    { label: "Fixtures", value: content.fixtures.length, href: "/admin/fixtures" },
    { label: "Upcoming", value: content.fixtures.filter((f) => f.status === "upcoming").length, href: "/admin/fixtures" },
    { label: "Results", value: content.fixtures.filter((f) => f.status === "result").length, href: "/admin/fixtures" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl uppercase">Dashboard</h1>
        <p className="mt-1 text-white/50">
          Manage everything on the {content.club.name} website. Remember to press{" "}
          <span className="text-spartan-gold">Save changes</span> after editing.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => (
          <Link key={s.label} href={s.href}>
            <Card>
              <div className="font-display text-4xl text-spartan-gold">{s.value}</div>
              <div className="mt-1 text-xs uppercase tracking-widest text-white/50">
                {s.label}
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Quick actions">
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              { href: "/admin/news", label: "Write a blog post" },
              { href: "/admin/gallery", label: "Add gallery photos" },
              { href: "/admin/fixtures", label: "Add a fixture" },
              { href: "/admin/squad", label: "Update the squad" },
              { href: "/admin/table", label: "Update league table" },
              { href: "/admin/settings", label: "Club settings" },
            ].map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className="rounded-sm border border-white/10 px-4 py-3 text-sm text-white/80 hover:border-spartan-red hover:text-white"
              >
                {a.label} →
              </Link>
            ))}
          </div>
        </Card>

        <Card title="Next match">
          {content.fixtures.filter((f) => f.status === "upcoming")[0] ? (
            (() => {
              const f = content.fixtures.filter((x) => x.status === "upcoming")[0];
              return (
                <div className="text-sm">
                  <div className="font-display text-xl">vs {f.opponent}</div>
                  <div className="mt-1 text-white/50">
                    {f.competition} · {f.date} {f.time}
                  </div>
                  <div className="mt-1 text-white/50">{f.ground}</div>
                </div>
              );
            })()
          ) : (
            <p className="text-sm text-white/40">No upcoming fixtures set.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
