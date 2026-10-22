import type { Metadata } from "next";
import Link from "next/link";
import { SiteLayout } from "@/components/SiteLayout";
import { PageHero } from "@/components/PageHero";
import { SectionHeading } from "@/components/SectionHeading";
import { readContent } from "@/lib/store";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "About" };

const values = [
  {
    title: "Belonging",
    text: "Every child is welcome. No trials fee, no barriers — just a place on the team and a family in the stands.",
  },
  {
    title: "Development",
    text: "We coach the person first and the player second, building confidence, discipline and teamwork.",
  },
  {
    title: "Community",
    text: "We are proud of Eldoret and give back through free sessions and school holiday programmes.",
  },
  {
    title: "Safety",
    text: "Safeguarding-trained coaches, first-aid cover at every session and a strict child-protection policy.",
  },
];

const pathway = [
  { stage: "Under 7 – Under 9", label: "Foundation", detail: "Fun-first sessions, ball mastery and small-sided games." },
  { stage: "Under 10 – Under 12", label: "Development", detail: "Position-specific coaching and entry into league football." },
  { stage: "Under 13 – Under 15", label: "Performance", detail: "Structured training, strength work and county trials." },
  { stage: "Post-15", label: "Next Step", detail: "Support with school teams, colleges and county select squads." },
];

const coaches = [
  { name: "Head Coach · Daniel Otieno", role: "UEFA/CAF pathway coaching, 10+ years with youth teams in the Rift Valley." },
  { name: "Youth Coach · Mary Wanjala", role: "Safeguarding lead and head of the girls' development programme." },
  { name: "Goalkeeping Coach · Peter Kamau", role: "Specialist keeper sessions for all age groups." },
];

export default async function AboutPage() {
  const { club } = await readContent();
  return (
    <SiteLayout club={club}>
      <PageHero
        eyebrow="Our story"
        title="About the club"
        subtitle={`Founded in ${club.founded}, ${club.name} exists to give the children of ${club.town} a place to play, grow and belong.`}
      />

      <section className="section py-14">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-2xl uppercase">Who we are</h2>
            <div className="mt-4 space-y-4 text-white/70">
              <p>
                {club.name} — nicknamed {club.nickname} — is a community youth football club
                based in {club.town}, {club.county}. We run teams from {club.ageGroup} for boys
                and girls, all under one crest.
              </p>
              <p>
                We believe football is one of the best tools we have for helping young people
                grow. Our coaches focus on character as much as technique, and we work closely
                with families and local schools to support every player on and off the pitch.
              </p>
              <p>
                Home matches are played at {club.ground}, where the whole community comes
                together to cheer on the next generation.
              </p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { k: club.founded, v: "Year founded" },
              { k: `${club.ageGroup}`, v: "Age groups" },
              { k: club.town, v: "Home town" },
              { k: "100%", v: "Community run" },
            ].map((s) => (
              <div key={s.v} className="card p-6">
                <div className="font-display text-3xl text-spartan-gold">{s.k}</div>
                <div className="mt-1 text-sm uppercase tracking-widest text-white/50">
                  {s.v}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-spartan-steel">
        <div className="section py-14">
          <SectionHeading eyebrow="What drives us" title="Our values" />
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v) => (
              <div key={v.title} className="card p-6">
                <div className="font-display text-lg text-spartan-gold">{v.title}</div>
                <p className="mt-3 text-sm leading-relaxed text-white/60">{v.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pathway" className="section py-14">
        <SectionHeading eyebrow="From first kick to first team" title="Player pathway" />
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {pathway.map((p, i) => (
            <div key={p.stage} className="card p-6">
              <div className="font-display text-sm text-white/40">
                STEP {String(i + 1).padStart(2, "0")}
              </div>
              <div className="mt-2 text-xs uppercase tracking-widest text-spartan-gold">
                {p.label}
              </div>
              <div className="mt-1 font-display text-lg">{p.stage}</div>
              <p className="mt-3 text-sm leading-relaxed text-white/60">{p.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="coaches" className="border-t border-white/10 bg-black/30">
        <div className="section py-14">
          <SectionHeading eyebrow="The people" title="Our coaching team" />
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {coaches.map((c) => (
              <div key={c.name} className="card p-6">
                <div className="font-display text-lg">{c.name}</div>
                <p className="mt-3 text-sm leading-relaxed text-white/60">{c.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="support" className="border-t border-white/10 bg-gradient-to-r from-spartan-darkred to-spartan-ink">
        <div className="section grid gap-8 py-14 lg:grid-cols-2 lg:items-center">
          <div>
            <div className="eyebrow">Support the club</div>
            <h2 className="mt-2 font-display text-3xl uppercase">Help us grow</h2>
            <p className="mt-4 text-white/75">
              As a community club, we rely on the generosity of local businesses and families.
              Your support helps cover kit, balls, first aid, and pitch hire for children who
              would otherwise miss out.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { t: "Sponsor a kit", d: "Put your business name on a team's shirt.", type: "Sponsor a kit" },
              { t: "Donate equipment", d: "Boots, balls, bibs and training gear.", type: "Donate equipment" },
              { t: "Volunteer", d: "Coach, drive, cook or help on matchdays.", type: "Volunteer" },
              { t: "Partner with us", d: "Schools and businesses working with young people.", type: "Partner with us" },
            ].map((s) => (
              <Link
                key={s.t}
                href={`/contact?support=${encodeURIComponent(s.type)}#support`}
                className="card group bg-black/40 p-5 transition hover:border-spartan-gold/60 hover:bg-black/60"
              >
                <div className="font-display text-base">{s.t}</div>
                <p className="mt-2 text-sm text-white/60">{s.d}</p>
                <span className="mt-3 inline-block text-[10px] font-bold uppercase tracking-widest text-spartan-gold opacity-80 transition group-hover:opacity-100">
                  Get involved →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
