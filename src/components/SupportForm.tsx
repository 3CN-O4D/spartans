"use client";

import { useId, useState } from "react";
import type { Club } from "@/lib/data";

const SUPPORT_TYPES = [
  "Sponsor a kit",
  "Donate equipment",
  "Volunteer",
  "Partner with us",
  "Something else",
] as const;

type Status = "idle" | "sending" | "sent" | "error";

export function SupportForm({ club, initialType }: { club: Club; initialType?: string }) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const formId = useId();
  const defaultType = SUPPORT_TYPES.includes(initialType as (typeof SUPPORT_TYPES)[number])
    ? (initialType as (typeof SUPPORT_TYPES)[number])
    : SUPPORT_TYPES[0];

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setStatus("sending");
    setError("");

    try {
      const payload = Object.fromEntries(new FormData(form).entries());
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };

      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setStatus("error");
        return;
      }

      form.reset();
      setStatus("sent");
    } catch {
      setError("Network error. Please check your connection and try again.");
      setStatus("error");
    }
  }

  return (
    <section id="support" className="mt-14 scroll-mt-24 border-t border-white/10 pt-12">
      <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <div className="eyebrow">Support the club</div>
          <h2 className="mt-2 font-display text-2xl uppercase">Help us grow</h2>
          <p className="mt-4 text-sm leading-relaxed text-white/60">
            As a community club, we rely on local businesses and families. Sponsor a kit, donate
            equipment, volunteer on matchdays, or partner with us — every contribution helps a child
            in Eldoret stay in the game.
          </p>
          <div className="mt-6 space-y-2 text-sm">
            <a
              href={`mailto:${club.email}?subject=${encodeURIComponent("Supporting Spartans Soccer Academy")}`}
              className="block text-spartan-gold hover:text-white"
            >
              {club.email}
            </a>
            <a
              href={`tel:${club.phone.replace(/[^\d+]/g, "")}`}
              className="block text-white/70 hover:text-white"
            >
              {club.phone}
            </a>
          </div>
          <p className="mt-6 text-xs leading-relaxed text-white/40">
            Prefer email? Use the address above and tell us how you would like to help. We will reply
            within a few days.
          </p>
        </div>

        <div className="card p-6 sm:p-8">
          {status === "sent" ? (
            <div
              role="status"
              className="rounded-sm border border-emerald-500/40 bg-emerald-500/10 p-6 text-center"
            >
              <div className="font-display text-xl text-emerald-300">Thank you!</div>
              <p className="mt-2 text-sm text-white/70">
                Your support message has been received. A member of the club will be in touch.
              </p>
              <button
                type="button"
                onClick={() => setStatus("idle")}
                className="btn-ghost mt-5"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form className="grid gap-5 sm:grid-cols-2" onSubmit={submit}>
              <div className="absolute -left-[9999px]" aria-hidden="true">
                <label htmlFor={`${formId}-website`}>Website</label>
                <input
                  id={`${formId}-website`}
                  name="website"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>

              <label className="block">
                <span className="mb-2 block text-xs uppercase tracking-widest text-white/50">
                  Your name <span className="text-spartan-gold">*</span>
                </span>
                <input
                  name="name"
                  required
                  maxLength={80}
                  autoComplete="name"
                  className="w-full rounded-sm border border-white/15 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-spartan-red"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs uppercase tracking-widest text-white/50">
                  Email <span className="text-spartan-gold">*</span>
                </span>
                <input
                  name="email"
                  type="email"
                  required
                  maxLength={120}
                  autoComplete="email"
                  className="w-full rounded-sm border border-white/15 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-spartan-red"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs uppercase tracking-widest text-white/50">
                  Phone (optional)
                </span>
                <input
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  maxLength={30}
                  autoComplete="tel"
                  className="w-full rounded-sm border border-white/15 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-spartan-red"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs uppercase tracking-widest text-white/50">
                  How can you help? <span className="text-spartan-gold">*</span>
                </span>
                <select
                  name="type"
                  required
                  defaultValue={defaultType}
                  className="w-full rounded-sm border border-white/15 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-spartan-red"
                >
                  {SUPPORT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block sm:col-span-2">
                <span className="mb-2 block text-xs uppercase tracking-widest text-white/50">
                  Message <span className="text-spartan-gold">*</span>
                </span>
                <textarea
                  name="message"
                  required
                  rows={4}
                  maxLength={1500}
                  className="w-full rounded-sm border border-white/15 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-spartan-red"
                  placeholder="Tell us what you have in mind, and the best way to reach you."
                />
              </label>

              {status === "error" && error && (
                <p
                  role="alert"
                  className="rounded-sm border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200 sm:col-span-2"
                >
                  {error}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
                <button
                  type="submit"
                  disabled={status === "sending"}
                  className="btn-primary disabled:opacity-60"
                >
                  {status === "sending" ? "Sending…" : "Send support message"}
                </button>
                <span className="text-xs text-white/40">
                  No payment is taken here. We will discuss the next step with you.
                </span>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
