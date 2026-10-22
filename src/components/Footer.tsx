import Link from "next/link";
import { Crest } from "@/components/Crest";
import type { Club } from "@/lib/data";

const columns = [
  {
    title: "The Club",
    links: [
      { href: "/about", label: "About Spartans" },
      { href: "/squad", label: "Squad" },
      { href: "/news", label: "News" },
      { href: "/gallery", label: "Gallery" },
    ],
  },
  {
    title: "Football",
    links: [
      { href: "/fixtures", label: "Fixtures & Results" },
      { href: "/fixtures#table", label: "League Table" },
      { href: "/about#pathway", label: "Player Pathway" },
      { href: "/about#coaches", label: "Coaches" },
    ],
  },
  {
    title: "Get Involved",
    links: [
      { href: "/contact", label: "Contact Us" },
      { href: "/contact#register", label: "Register a Child" },
      { href: "/contact#support", label: "Support the Club" },
      { href: "/contact#support", label: "Volunteer" },
    ],
  },
];

function telHref(number: string) {
  return `tel:${number.replace(/[^\d+]/g, "")}`;
}

export function SiteFooter({ club }: { club: Club }) {
  const phones = club.phones?.length ? club.phones : [club.phone];

  return (
    <footer className="border-t border-white/10 bg-spartan-steel">
      <div className="section grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-3">
            <Crest className="h-14 w-14" logo={club.logo} alt={`${club.name} crest`} />
            <div>
              <div className="font-display text-lg">{club.name}</div>
              <div className="text-xs uppercase tracking-[0.3em] text-spartan-gold">
                {club.motto}
              </div>
            </div>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/60">
            A community youth football academy in {club.town}, {club.country}, giving children aged{" "}
            {club.ageGroup} a safe, fun and structured place to play the game they love.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            {club.facebook && (
              <a
                href={`https://www.facebook.com/search/top?q=${encodeURIComponent(club.facebook)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 items-center rounded-sm border border-white/15 px-3 text-xs font-semibold uppercase tracking-wide text-white/70 hover:border-white hover:text-white"
              >
                Facebook
              </a>
            )}
            {club.instagram && (
              <a
                href={`https://instagram.com/${club.instagram.replace(/^@/, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 items-center rounded-sm border border-white/15 px-3 text-xs font-semibold uppercase tracking-wide text-white/70 hover:border-white hover:text-white"
              >
                Instagram
              </a>
            )}
          </div>
        </div>

        {columns.map((col) => (
          <div key={col.title}>
            <div className="font-display text-sm uppercase tracking-wider text-white">
              {col.title}
            </div>
            <ul className="mt-4 space-y-3 text-sm text-white/60">
              {col.links.map((l) => (
                <li key={l.href + l.label}>
                  <Link href={l.href} className="hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-white/10">
        <div className="section flex flex-col gap-3 py-5 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <span>
            © {new Date().getFullYear()} {club.name}. Founded {club.founded}. All rights reserved.
          </span>
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>
              {club.town}, {club.county}
            </span>
            <span aria-hidden="true">·</span>
            <a href={`mailto:${club.email}`} className="hover:text-white">
              {club.email}
            </a>
            {phones.slice(0, 1).map((num) => (
              <span key={num} className="flex items-center gap-2">
                <span aria-hidden="true">·</span>
                <a href={telHref(num)} className="hover:text-white">
                  {num}
                </a>
              </span>
            ))}
          </span>
        </div>
      </div>
    </footer>
  );
}
