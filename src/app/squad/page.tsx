import type { Metadata } from "next";
import Link from "next/link";
import { SiteLayout } from "@/components/SiteLayout";
import { PageHero } from "@/components/PageHero";
import { RatingBadge } from "@/components/RatingBadge";
import { PlayerPhoto } from "@/components/PlayerPhoto";
import { TeamStrengthPanel } from "@/components/TeamStrength";
import { readContent } from "@/lib/store";
import { playerOverall, teamStrength, topStats } from "@/lib/ratings";
import type { Player } from "@/lib/data";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Squad" };

const groups: Array<{ title: string; position: Player["position"] }> = [
  { title: "Goalkeepers", position: "Goalkeeper" },
  { title: "Defenders", position: "Defender" },
  { title: "Midfielders", position: "Midfielder" },
  { title: "Forwards", position: "Forward" },
];

const cardTint: Record<Player["position"], string> = {
  Goalkeeper: "from-amber-500/25 to-spartan-ink",
  Defender: "from-sky-600/25 to-spartan-ink",
  Midfielder: "from-emerald-600/25 to-spartan-ink",
  Forward: "from-spartan-red/35 to-spartan-ink",
};

export default async function SquadPage() {
  const { club, players } = await readContent();
  const strength = teamStrength(players);

  return (
    <SiteLayout club={club}>
      <PageHero
        eyebrow="First team & academy"
        title="The Squad"
        subtitle={`Meet the ${club.name} players representing ${club.town} with pride this season.`}
      />

      <section className="section pt-10">
        <div className="grid gap-6 lg:grid-cols-[1.25fr_1fr]">
          <TeamStrengthPanel
            title="Squad strength"
            subtitle={`${players.length} players rated across the academy`}
            strength={strength}
            note="Ratings are built from each player's six attributes. Coaches can override any attribute in the admin panel and these numbers update automatically."
          />
          <div className="card flex flex-col justify-center p-6">
            <div className="eyebrow">How ratings work</div>
            <p className="mt-3 text-sm leading-relaxed text-white/60">
              Every player is rated out of 99 from six attributes. The team line is the average of
              the group: <span className="text-white">attack</span> from the forwards,{" "}
              <span className="text-white">midfield</span> from the midfielders, and{" "}
              <span className="text-white">defence</span> from the defenders and goalkeeper.
            </p>
            <div className="mt-5 flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-widest text-white/40">
              <span className="rounded-sm border border-white/10 px-2 py-1">Attack</span>
              <span className="rounded-sm border border-white/10 px-2 py-1">Midfield</span>
              <span className="rounded-sm border border-white/10 px-2 py-1">Defence</span>
              <span className="rounded-sm border border-white/10 px-2 py-1">Overall</span>
            </div>
            <Link href="/lineup" className="mt-5 text-xs font-bold uppercase tracking-widest text-spartan-gold hover:text-white">
              See the starting XI →
            </Link>
          </div>
        </div>
      </section>

      <section className="section py-14">
        <div className="space-y-14">
          {groups.map((group) => {
            const list = players
              .filter((p) => p.position === group.position)
              .sort((a, b) => a.squadNo - b.squadNo);
            if (!list.length) return null;
            return (
              <div key={group.title}>
                <h2 className="font-display text-xl uppercase text-spartan-gold">
                  {group.title} <span className="text-sm text-white/30">({list.length})</span>
                </h2>
                <div className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {list.map((p) => (
                    <article key={p.id} className="card group flex flex-col">
                      <div className={`relative aspect-[4/5] overflow-hidden bg-gradient-to-br ${cardTint[p.position]}`}>
                        <PlayerPhoto player={p} />
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/90 via-black/45 to-transparent" />
                        <div className="absolute left-3 top-3 rounded-sm bg-black/60 px-2 py-1 font-display text-xs text-white">
                          #{p.jerseyNo}
                        </div>
                        <div className="absolute right-3 top-3">
                          <RatingBadge value={playerOverall(p)} />
                        </div>
                        <div className="absolute inset-x-0 bottom-0 p-4">
                          <h3 className="font-display text-lg leading-tight">{p.name}</h3>
                          <div className="mt-1 text-[10px] font-bold uppercase tracking-widest text-spartan-gold">
                            {p.position} · Age {p.age}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-1 flex-col p-4">
                        <p className="text-sm leading-relaxed text-white/60">{p.bio}</p>
                        <div className="mt-4 grid grid-cols-3 gap-2">
                          {topStats(p).map((stat) => (
                            <div
                              key={stat.label}
                              className="rounded-sm border border-white/10 bg-black/20 px-2 py-1.5 text-center"
                            >
                              <div className="text-[9px] font-bold uppercase tracking-widest text-white/40">
                                {stat.label}
                              </div>
                              <div className="font-display text-sm text-white">{stat.value}</div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-auto pt-3 text-[11px] uppercase tracking-widest text-white/30">
                          {p.hometown}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="border-t border-white/10 bg-spartan-steel">
        <div className="section py-12 text-center">
          <h2 className="font-display text-2xl uppercase">Want to join the squad?</h2>
          <p className="mx-auto mt-3 max-w-xl text-white/60">
            We hold open trials for children aged {club.ageGroup} at the start of every season.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/contact#register" className="btn-primary">
              Register for trials
            </Link>
            <Link href="/lineup" className="btn-ghost">
              View the lineup
            </Link>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
