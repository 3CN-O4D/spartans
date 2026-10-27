import Link from "next/link";
import { SiteLayout } from "@/components/SiteLayout";
import { Crest } from "@/components/Crest";
import { Countdown } from "@/components/Countdown";
import { MatchRow } from "@/components/MatchCard";
import { NewsCard } from "@/components/NewsCard";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { RatingBadge } from "@/components/RatingBadge";
import { SectionHeading } from "@/components/SectionHeading";
import { readContent } from "@/lib/store";
import { byKickoffDesc, isClubTeam } from "@/lib/format";
import { playerOverall } from "@/lib/ratings";
import type { Fixture } from "@/lib/data";

export const dynamic = "force-dynamic";

function getKickoffMs(f: Fixture) {
  const time = f.time?.trim() || "00:00";
  const when = new Date(`${f.date}T${time}:00+03:00`).getTime();
  return Number.isNaN(when) ? null : when;
}

export default async function HomePage() {
  const { club, articles, fixtures, leagueTable, players } = await readContent();

  const now = Date.now();
  const withTime = fixtures
    .map((f) => ({ fixture: f, ms: getKickoffMs(f) }))
    .filter((x): x is { fixture: Fixture; ms: number } => x.ms !== null)
    .sort((a, b) => a.ms - b.ms);

  // Pick the next match to feature in hero/countdown.
  // If a match started less than 3 hours ago, switch to the next match after it.
  let featuredNext = withTime.find((x) => x.ms > now);
  const recentlyStarted = [...withTime]
    .reverse()
    .find((x) => x.ms <= now && now - x.ms < 3 * 60 * 60 * 1000);
  if (recentlyStarted) {
    const afterRecent = withTime.find((x) => x.ms > recentlyStarted.ms);
    if (afterRecent) {
      featuredNext = afterRecent;
    }
  }
  const next = featuredNext?.fixture ?? null;

  // Build upcoming list for the fixtures section: future matches, or next after a recent match.
  let upcomingFixtures = withTime
    .filter((x) => x.ms > now)
    .map((x) => x.fixture);
  if (recentlyStarted) {
    const afterRecent = withTime
      .filter((x) => x.ms > recentlyStarted.ms)
      .map((x) => x.fixture);
    if (afterRecent.length) {
      upcomingFixtures = afterRecent;
    }
  }

  const results = fixtures
    .filter((f) => {
      const ms = getKickoffMs(f);
      if (ms === null) return f.status === "result";
      // Move past matches (started >= 3 hours ago or explicitly marked result) to results
      if (f.status === "result") return true;
      if (ms <= now - 3 * 60 * 60 * 1000) return true;
      return false;
    })
    .sort(byKickoffDesc);
  const table = [...leagueTable].sort((a, b) => a.pos - b.pos);
  const featured = articles[0];
  const rest = articles.slice(1);
  const squadPreview = [...players].sort((a, b) => a.squadNo - b.squadNo).slice(0, 4);

  return (
    <SiteLayout club={club}>
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-gradient-to-br from-spartan-darkred via-spartan-ink to-black" />
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, rgba(242,193,78,0.35), transparent 45%), radial-gradient(circle at 80% 60%, rgba(200,16,46,0.5), transparent 40%)",
          }}
        />
        {club.logo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src="/brand/spartans-crest-transparent.png"
            alt=""
            aria-hidden
            loading="lazy"
            decoding="async"
            className="pointer-events-none absolute -right-16 top-1/2 hidden w-[560px] -translate-y-1/2 opacity-[0.07] lg:block"
          />
        )}
        <div className="section relative grid items-center gap-10 py-16 lg:grid-cols-[1.15fr_1fr] lg:py-24">
          <div>
            <div className="eyebrow">
              {club.nickname} · Est. {club.founded}
            </div>
            <h1 className="mt-3 font-display text-4xl leading-[0.95] sm:text-5xl lg:text-6xl">
              MORE THAN A CLUB.
              <br />
              <span className="text-spartan-gold">A FAMILY IN {club.town.toUpperCase()}.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-white/75">
              {club.name} gives children across {club.town} a safe, fun and structured place to
              fall in love with football. Train, play, grow — together.
            </p>
            {club.slogan && (
              <p className="mt-4 font-display text-sm uppercase tracking-[0.15em] text-spartan-gold">
                {club.slogan}
              </p>
            )}
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/contact#register" className="btn-primary">
                Register a child
              </Link>
              <Link href="/fixtures" className="btn-ghost">
                Fixtures &amp; results
              </Link>
            </div>

            {next && (
              <div className="mt-9 flex items-center gap-6">
                <div className="hidden sm:block">
                  <Crest className="h-24 w-24" logo={club.logo} />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-widest text-white/50">
                    Next match in
                  </div>
                  <div className="mt-2">
                    <Countdown date={next.date} time={next.time} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {next && (
            <div className="card bg-black/50 p-6 backdrop-blur">
              <div className="eyebrow">Next up</div>
              <div className="mt-1 font-display text-xl">{next.competition}</div>
              <div className="mt-5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Crest className="h-12 w-12" logo={club.logo} />
                  <span className="font-display">{club.name}</span>
                </div>
                <span className="font-display text-white/50">VS</span>
                <div className="flex items-center gap-3">
                  <span className="text-right font-display">{next.opponent}</span>
                  {next.opponentLogo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={next.opponentLogo}
                      alt=""
                      width={48}
                      height={48}
                      loading="lazy"
                      decoding="async"
                      className="h-12 w-12 rounded-sm object-cover"
                    />
                  ) : (
                    <div className="grid h-12 w-12 place-items-center rounded-sm bg-white/10 font-display text-sm">
                      {next.opponent.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3 border-t border-white/10 pt-5 text-sm text-white/70">
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-white/40">Date</div>
                  {next.date}
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-white/40">
                    Kick-off
                  </div>
                  {next.time}
                </div>
                <div className="col-span-2">
                  <div className="text-[10px] uppercase tracking-widest text-white/40">Venue</div>
                  {next.ground}
                </div>
              </div>
              <Link href="/fixtures" className="btn-primary mt-6 w-full">
                Match centre
              </Link>
            </div>
          )}
        </div>
      </section>

      {featured && (
        <section className="section py-16">
          <SectionHeading
            eyebrow="From the club"
            title="Latest news"
            href="/news"
            linkLabel="All news"
          />
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <NewsCard article={featured} featured />
            <div className="grid gap-6 sm:grid-cols-2">
              {rest.slice(0, 2).map((a) => (
                <NewsCard key={a.slug} article={a} />
              ))}
            </div>
          </div>
          {rest.length > 2 && (
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {rest.slice(2, 5).map((a) => (
                <NewsCard key={a.slug} article={a} />
              ))}
            </div>
          )}
        </section>
      )}

      <section className="border-y border-white/10 bg-spartan-steel">
        <div className="section py-16">
          <SectionHeading
            eyebrow="Match centre"
            title="Fixtures & results"
            href="/fixtures"
            linkLabel="Full schedule"
          />
          <div className="mt-8 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
            <div>
              <h3 className="font-display text-sm uppercase tracking-widest text-spartan-gold">
                Upcoming
              </h3>
              <div className="mt-4">
                {upcomingFixtures.length ? (
                  upcomingFixtures.map((f) => <MatchRow key={f.id} fixture={f} />)
                ) : (
                  <p className="text-sm text-white/40">No upcoming fixtures.</p>
                )}
              </div>
              <h3 className="mt-8 font-display text-sm uppercase tracking-widest text-spartan-gold">
                Recent results
              </h3>
              <div className="mt-4">
                {results.length ? (
                  results.map((f) => <MatchRow key={f.id} fixture={f} />)
                ) : (
                  <p className="text-sm text-white/40">No results yet.</p>
                )}
              </div>
            </div>
            <div id="table">
              <h3 className="font-display text-sm uppercase tracking-widest text-spartan-gold">
                League table
              </h3>
              <div className="card mt-4 overflow-hidden">
                <table className="w-full text-sm">
                  <caption className="sr-only">
                    {club.town} youth league standings
                  </caption>
                  <thead className="bg-black/40 text-left text-[11px] uppercase tracking-wider text-white/50">
                    <tr>
                      <th scope="col" className="px-3 py-2">#</th>
                      <th scope="col" className="px-3 py-2">Team</th>
                      <th scope="col" className="px-2 py-2 text-center">P</th>
                      <th scope="col" className="px-2 py-2 text-center">GD</th>
                      <th scope="col" className="px-3 py-2 text-center">Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {table.map((row) => {
                      const isUs = isClubTeam(row.team, club.name);
                      return (
                        <tr
                          key={row.team}
                          className={`border-t border-white/10 ${isUs ? "bg-spartan-red/20" : ""}`}
                        >
                          <td className="px-3 py-2 text-white/60">{row.pos}</td>
                          <td className="px-3 py-2 font-semibold">{row.team}</td>
                          <td className="px-2 py-2 text-center text-white/60">{row.played}</td>
                          <td className="px-2 py-2 text-center text-white/60">
                            {row.gd > 0 ? `+${row.gd}` : row.gd}
                          </td>
                          <td className="px-3 py-2 text-center font-display">{row.points}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section py-16">
        <SectionHeading
          eyebrow="The squad"
          title="Meet the players"
          href="/squad"
          linkLabel="Full squad"
        />
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {squadPreview.map((p) => (
            <div key={p.id} className="card p-5 text-center">
              <PlayerAvatar player={p} className="mx-auto h-20 w-20" />
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <div className="font-display text-lg">{p.name}</div>
                <RatingBadge value={playerOverall(p)} />
              </div>
              <div className="text-xs uppercase tracking-widest text-spartan-gold">
                {p.position}
              </div>
              <div className="mt-2 text-sm text-white/60">#{p.jerseyNo} · Age {p.age}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-white/10 bg-gradient-to-r from-spartan-darkred to-spartan-ink">
        <div className="section flex flex-col items-center gap-6 py-14 text-center">
          <h2 className="max-w-2xl font-display text-3xl leading-tight sm:text-4xl">
            EVERY CHILD DESERVES A TEAM
          </h2>
          <p className="max-w-xl text-white/75">
            Registration for the new season is open for children aged {club.ageGroup}. No
            experience needed — just bring a smile and a pair of boots.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/contact#register" className="btn-primary">
              Register a child
            </Link>
            <Link href="/contact#support" className="btn-ghost">
              Support the club
            </Link>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
