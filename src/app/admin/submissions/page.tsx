"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/admin/ui";

type Submission = Record<string, unknown>;

export default function AdminSubmissions() {
  const [tab, setTab] = useState<"registration" | "support">("registration");
  const [registrations, setRegistrations] = useState<Submission[]>([]);
  const [support, setSupport] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [rRes, sRes] = await Promise.all([
          fetch("/api/admin/submissions?kind=registration&limit=100", { cache: "no-store" }),
          fetch("/api/admin/submissions?kind=support&limit=100", { cache: "no-store" }),
        ]);
        if (rRes.ok) {
          const r = await rRes.json();
          setRegistrations(r.submissions || []);
        }
        if (sRes.ok) {
          const s = await sRes.json();
          setSupport(s.submissions || []);
        }
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const items = tab === "registration" ? registrations : support;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl uppercase">Form Submissions</h1>
        <p className="mt-1 text-sm text-white/50">
          Registrations and support messages submitted from the website.
        </p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setTab("registration")}
          className={`rounded-sm px-4 py-2 text-xs font-bold uppercase tracking-wide ${
            tab === "registration"
              ? "bg-spartan-red text-white"
              : "border border-white/20 text-white/70 hover:text-white"
          }`}
        >
          Registrations ({registrations.length})
        </button>
        <button
          onClick={() => setTab("support")}
          className={`rounded-sm px-4 py-2 text-xs font-bold uppercase tracking-wide ${
            tab === "support"
              ? "bg-spartan-red text-white"
              : "border border-white/20 text-white/70 hover:text-white"
          }`}
        >
          Support ({support.length})
        </button>
      </div>

      {loading && <p className="text-white/50">Loading…</p>}
      {!loading && items.length === 0 && (
        <Card>
          <p className="text-sm text-white/40">No submissions yet.</p>
        </Card>
      )}

      <div className="space-y-4">
        {items.map((item, idx) => (
          <Card key={(item.id as string) || idx}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="font-display text-lg">
                  {tab === "registration"
                    ? (item.childName as string)
                    : (item.name as string)}
                </div>
                <div className="mt-1 text-xs text-white/50">
                  {item.createdAt ? new Date(item.createdAt as string).toLocaleString() : ""}
                </div>
              </div>
              {tab === "registration" && (
                <span className="rounded-sm bg-spartan-gold/20 px-2 py-1 text-xs font-bold text-spartan-gold">
                  {item.ageGroup as string}
                </span>
              )}
              {tab === "support" && (
                <span className="rounded-sm bg-white/10 px-2 py-1 text-xs font-bold text-white/70">
                  {item.type as string}
                </span>
              )}
            </div>

            <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
              {tab === "registration" ? (
                <>
                  <div>
                    <span className="text-white/40">Guardian:</span>{" "}
                    <span className="text-white/80">{item.guardian as string}</span>
                  </div>
                  <div>
                    <span className="text-white/40">Phone:</span>{" "}
                    <a href={`tel:${item.phone}`} className="text-white/80 hover:text-white">
                      {item.phone as string}
                    </a>
                  </div>
                  {item.email ? (
                    <div className="sm:col-span-2">
                      <span className="text-white/40">Email:</span>{" "}
                      <a href={`mailto:${item.email}`} className="text-white/80 hover:text-white">
                        {item.email as string}
                      </a>
                    </div>
                  ) : null}
                  {item.notes ? (
                    <div className="sm:col-span-2">
                      <div className="text-white/40">Notes:</div>
                      <div className="mt-1 whitespace-pre-wrap text-white/70">{item.notes as string}</div>
                    </div>
                  ) : null}
                </>
              ) : (
                <>
                  <div>
                    <span className="text-white/40">Email:</span>{" "}
                    <a href={`mailto:${item.email}`} className="text-white/80 hover:text-white">
                      {item.email as string}
                    </a>
                  </div>
                  {item.phone ? (
                    <div>
                      <span className="text-white/40">Phone:</span>{" "}
                      <a href={`tel:${item.phone}`} className="text-white/80 hover:text-white">
                        {item.phone as string}
                      </a>
                    </div>
                  ) : null}
                  <div className="sm:col-span-2">
                    <div className="text-white/40">Message:</div>
                    <div className="mt-1 whitespace-pre-wrap text-white/70">{item.message as string}</div>
                  </div>
                </>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
