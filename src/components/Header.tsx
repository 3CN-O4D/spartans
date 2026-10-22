"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { CrestWordmark } from "@/components/Crest";
import type { Club } from "@/lib/data";

const nav = [
  { href: "/", label: "Home" },
  { href: "/news", label: "News" },
  { href: "/fixtures", label: "Fixtures" },
  { href: "/squad", label: "Squad" },
  { href: "/lineup", label: "Lineup" },
  { href: "/gallery", label: "Gallery" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

function telHref(number: string) {
  return `tel:${number.replace(/[^\d+]/g, "")}`;
}

export function ClubHeader({ club }: { club: Club }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close the mobile menu whenever the route changes.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Allow Escape to close the mobile menu.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const phones = club.phones?.length ? club.phones : [club.phone];

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-spartan-ink/95 backdrop-blur">
      <div className="hidden border-b border-white/10 bg-spartan-steel text-xs text-white/70 md:block">
        <div className="section flex h-9 items-center justify-between">
          <span>
            {club.ground} · {club.town}, {club.country}
          </span>
          <div className="flex items-center gap-4">
            <span className="hidden lg:inline">
              {phones.map((num, i) => (
                <span key={num}>
                  {i > 0 && <span className="mx-1 text-white/30">/</span>}
                  <a href={telHref(num)} className="hover:text-white">
                    {num}
                  </a>
                </span>
              ))}
            </span>
            <a href={`mailto:${club.email}`} className="hover:text-white">
              {club.email}
            </a>
          </div>
        </div>
      </div>

      <div className="section flex h-16 items-center justify-between gap-4">
        <Link href="/" aria-label={`${club.name} home`} className="shrink-0">
          <CrestWordmark logo={club.logo} name={club.name} town={club.town} />
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          {nav.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-sm px-3 py-2 text-sm font-semibold uppercase tracking-wide transition ${
                  active ? "text-spartan-gold" : "text-white/80 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/contact#register" className="btn-primary hidden sm:inline-flex">
            Join the club
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-sm border border-white/20 lg:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-nav"
          >
            <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
            <span className="space-y-1.5" aria-hidden="true">
              <span className="block h-0.5 w-6 bg-white" />
              <span className="block h-0.5 w-6 bg-white" />
              <span className="block h-0.5 w-6 bg-white" />
            </span>
          </button>
        </div>
      </div>

      {open && (
        <nav
          id="mobile-nav"
          aria-label="Mobile"
          className="border-t border-white/10 bg-spartan-steel lg:hidden"
        >
          <div className="section grid grid-cols-2 gap-1 py-3">
            {nav.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={`rounded-sm px-3 py-3 text-sm font-semibold uppercase tracking-wide ${
                    active ? "text-spartan-gold" : "text-white/80"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            <Link
              href="/contact#register"
              onClick={() => setOpen(false)}
              className="col-span-2 mt-1 rounded-sm bg-spartan-red px-3 py-3 text-center text-sm font-semibold uppercase tracking-wide text-white"
            >
              Join the club
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
