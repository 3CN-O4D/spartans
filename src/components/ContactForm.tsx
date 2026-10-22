"use client";

import { useId, useState } from "react";
import { PageHero } from "@/components/PageHero";
import { SupportForm } from "@/components/SupportForm";
import type { Club, Info } from "@/lib/data";

const AGE_GROUPS = ["Under 7", "Under 9", "Under 11", "Under 13", "Under 15"] as const;

type Status = "idle" | "sending" | "sent" | "error";

function telHref(number: string) {
  return `tel:${number.replace(/[^\d+]/g, "")}`;
}

export function ContactForm({
  club,
  info,
  supportType,
}: {
  club: Club;
  info: Info;
  supportType?: string;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const formId = useId();

  const phones = club.phones?.length ? club.phones : [club.phone];

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setStatus("sending");
    setError("");

    try {
      const payload = Object.fromEntries(new FormData(form).entries());
      const res = await fetch("/api/contact", {
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
    <>
      <PageHero
        eyebrow="Get in touch"
        title="Contact & Registration"
        subtitle="Register a child, volunteer, sponsor or simply say hello — we would love to hear from you."
      />

      <section className="section py-14">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr]">
          <div className="space-y-6">
            <div className="card p-6">
              <div className="eyebrow">Where we train</div>
              <div className="mt-2 font-display text-lg">{club.ground}</div>
              <p className="mt-1 text-sm text-white/60">
                {club.town}, {club.county}, {club.country}
              </p>
            </div>
            <div className="card p-6">
              <div className="eyebrow">Call or email</div>
              <div className="mt-2 space-y-1 text-sm">
                {phones.map((num) => (
                  <a key={num} href={telHref(num)} className="block hover:text-white">
                    {num}
                  </a>
                ))}
                <a href={`mailto:${club.email}`} className="block hover:text-white">
                  {club.email}
                </a>
              </div>
            </div>
            <div className="card p-6">
              <div className="eyebrow">Training times</div>
              <ul className="mt-3 space-y-2 text-sm text-white/70">
                {info.training.map((t) => (
                  <li key={t.label} className="flex justify-between gap-4">
                    <span>{t.label}</span>
                    <span className="text-right text-white/90">{t.value}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="card p-6">
              <div className="eyebrow">Fees &amp; registration</div>
              <ul className="mt-3 space-y-2 text-sm text-white/70">
                {info.fees.map((f) => (
                  <li key={f.label} className="flex justify-between gap-4">
                    <span>{f.label}</span>
                    <span className="text-right font-semibold text-white/90">{f.value}</span>
                  </li>
                ))}
              </ul>
            </div>
            {info.tournament?.title && (
              <div className="card border-spartan-gold/40 bg-gradient-to-br from-spartan-darkred to-spartan-ink p-6">
                <div className="eyebrow">Upcoming trip</div>
                <div className="mt-2 font-display text-lg">{info.tournament.title}</div>
                <div className="mt-1 text-sm text-white/80">
                  {info.tournament.dates} · {info.tournament.cost}
                </div>
                {info.tournament.note && (
                  <div className="mt-1 text-xs text-white/60">{info.tournament.note}</div>
                )}
              </div>
            )}
          </div>

          <div id="register" className="card p-6 sm:p-8">
            <h2 className="font-display text-2xl uppercase">Register a child</h2>
            <p className="mt-2 text-sm text-white/60">
              Fill in the form and a member of our team will be in touch within a few days.
            </p>

            {status === "sent" ? (
              <div className="mt-8 rounded-sm border border-emerald-500/40 bg-emerald-500/10 p-6 text-center">
                <div className="font-display text-xl text-emerald-300">Thank you!</div>
                <p className="mt-2 text-sm text-white/70">
                  Your registration has been received. We will contact you on the number you
                  provided within a few days.
                </p>
                <button
                  type="button"
                  onClick={() => setStatus("idle")}
                  className="btn-ghost mt-5"
                >
                  Register another child
                </button>
              </div>
            ) : (
              <form className="mt-8 grid gap-5 sm:grid-cols-2" onSubmit={submit}>
                {/* Honeypot: hidden from humans, filled by bots. */}
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

                <Field id={`${formId}-child`} label="Child's full name" name="childName" required />
                <div>
                  <label
                    htmlFor={`${formId}-age`}
                    className="mb-2 block text-xs uppercase tracking-widest text-white/50"
                  >
                    Age group
                  </label>
                  <select
                    id={`${formId}-age`}
                    name="ageGroup"
                    required
                    defaultValue={AGE_GROUPS[0]}
                    className="w-full rounded-sm border border-white/15 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-spartan-red"
                  >
                    {AGE_GROUPS.map((group) => (
                      <option key={group} value={group}>
                        {group}
                      </option>
                    ))}
                  </select>
                </div>
                <Field
                  id={`${formId}-guardian`}
                  label="Parent / guardian name"
                  name="guardian"
                  autoComplete="name"
                  required
                />
                <Field
                  id={`${formId}-phone`}
                  label="Phone number"
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  required
                />
                <Field
                  id={`${formId}-email`}
                  label="Email (optional)"
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  className="sm:col-span-2"
                />
                <div className="sm:col-span-2">
                  <label
                    htmlFor={`${formId}-notes`}
                    className="mb-2 block text-xs uppercase tracking-widest text-white/50"
                  >
                    Anything we should know?
                  </label>
                  <textarea
                    id={`${formId}-notes`}
                    name="notes"
                    rows={4}
                    maxLength={2000}
                    className="w-full rounded-sm border border-white/15 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-spartan-red"
                    placeholder="Experience, medical needs, preferred position..."
                  />
                </div>

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
                    {status === "sending" ? "Sending…" : "Submit registration"}
                  </button>
                  <span className="text-xs text-white/40">
                    A parent or guardian must complete this form.
                  </span>
                </div>
              </form>
            )}

            <div id="volunteer" className="mt-10 border-t border-white/10 pt-6">
              <div className="eyebrow">Volunteer or sponsor</div>
              <p className="mt-2 text-sm text-white/60">
                Want to help on matchdays or sponsor the club? Email us at{" "}
                <a href={`mailto:${club.email}`} className="text-spartan-gold hover:text-white">
                  {club.email}
                </a>{" "}
                or use the{" "}
                <a href="#support" className="text-spartan-gold hover:text-white">
                  support form below
                </a>
                .
              </p>
            </div>
          </div>
        </div>

        <SupportForm club={club} initialType={supportType} />
      </section>
    </>
  );
}

function Field({
  id,
  label,
  name,
  type = "text",
  required = false,
  className = "",
  inputMode,
  autoComplete,
}: {
  id: string;
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  className?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  autoComplete?: string;
}) {
  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="mb-2 block text-xs uppercase tracking-widest text-white/50"
      >
        {label}
        {required && <span className="ml-1 text-spartan-gold">*</span>}
      </label>
      <input
        id={id}
        type={type}
        name={name}
        required={required}
        inputMode={inputMode}
        autoComplete={autoComplete}
        maxLength={name === "notes" ? 2000 : 120}
        className="w-full rounded-sm border border-white/15 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-spartan-red"
      />
    </div>
  );
}
