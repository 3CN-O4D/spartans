import type { Metadata } from "next";
import { SiteLayout } from "@/components/SiteLayout";
import { PageHero } from "@/components/PageHero";
import { MatchCard, MatchRow } from "@/components/MatchCard";
import { readContent } from "@/lib/store";
import { byKickoff, byKickoffDesc, isClubTeam } from "@/lib/format";
import type { Fixture } from "@/lib/data";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Fixtures & Results" };

function getKickoffMs(f: Fixture) {
  const time = f.time?.trim() || "00:00";
  const when = new Date(`${f.date}T${time}:00+03:00`).getTime();
  return Number.isNaN(when) ? null : when;
}

export default async function FixturesPage() {
  const { club, fixtures, leagueTable } = await readContent();
  const now = Date.now();

  const withTime = fixtures
    .map((f) => ({ fixture: f, ms: getKickoffMs(f) }))
    .filter((x): x is { fixture: Fixture; ms: number } => x.ms !== null)
    .sort((a, b) => a.ms - b.ms);

  // Find the most recently started match within last 3 hours
  const recentlyStarted = [...withTime]
    .reverse()
    .find((x) => x.ms <= now && now - x.ms < 3 * 60 * 60 * 1000);

  // Upcoming = future matches; if a match just started (within 3h), show matches after it
  let upcomingList = withTime.filter((x) => x.ms > now).map((x) => x.fixture);
  if (recentlyStarted) {
    const after = withTime.filter((x) => x.ms > recentlyStarted.ms).map((x) => x.fixture);
    if (after.length) upcomingList = after;
  }

  // Results = past/completed (explicitly marked result, or started >= 3h ago)
  const results = fixtures
    .filter((f) => {
      const ms = getKickoffMs(f);
      if (ms === null) return f.status === "result";
      if (f.status === "result") return true;
      if (ms <= now - 3 * 60 * 60 * 1000) return true;
      return false;
    })
    .sort(byKickoffDesc);

  const upcoming = upcomingList.sort(byKickoff);
  const table = [...leagueTable].sort((a, b) => a.pos - b.pos);

  return (
    <SiteLayout club={club}>
      <PageHero
        eyebrow="Match centre"
        title="Fixtures & Results"
        subtitle={`Follow every match for ${club.name} in the ${club.town} youth leagues and cups.`}
      />

      <section className="section py-14">
        <h2 className="font-display text-xl uppercase text-spartan-gold">Upcoming fixtures</h2>
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {upcoming.length ? (
            upcoming.map((f) => (
              <MatchCard key={f.id} fixture={f} clubName={club.name} clubLogo={club.logo} />
            ))
          ) : (
            <p className="text-sm text-white/40">No upcoming fixtures scheduled.</p>
          )}
        </div>

        <h2 className="mt-14 font-display text-xl uppercase text-spartan-gold">Recent results</h2>
        <div className="card mt-6 p-2 sm:p-4">
          {results.length ? (
            results.map((f) => <MatchRow key={f.id} fixture={f} />)
          ) : (
            <p className="p-4 text-sm text-white/40">No results yet.</p>
          )}
        </div>
      </section>

      <section id="table" className="border-y border-white/10 bg-spartan-steel">
        <div className="section py-14">
          <h2 className="font-display text-xl uppercase text-spartan-gold">League table</h2>
          <p className="mt-2 text-sm text-white/60">
            {club.town} youth league · current standings
          </p>
          <div className="card mt-6 overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <caption className="sr-only">
                {club.town} youth league standings
              </caption>
              <thead className="bg-black/40 text-left text-[11px] uppercase tracking-wider text-white/50">
                <tr>
                  <th scope="col" className="px-3 py-3">#</th>
                  <th scope="col" className="px-3 py-3">Team</th>
                  <th scope="col" className="px-2 py-3 text-center">P</th>
                  <th scope="col" className="px-2 py-3 text-center">W</th>
                  <th scope="col" className="px-2 py-3 text-center">D</th>
                  <th scope="col" className="px-2 py-3 text-center">L</th>
                  <th scope="col" className="px-2 py-3 text-center">GD</th>
                  <th scope="col" className="px-3 py-3 text-center">Pts</th>
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
                      <td className="px-3 py-3 text-white/60">
                        <span
                          className={`mr-2 inline-block h-1.5 w-1.5 rounded-full ${
                            row.pos <= 2 ? "bg-emerald-400" : "bg-transparent"
                          }`}
                        />
                        {row.pos}
                      </td>
                      <td className="px-3 py-3 font-semibold">
                        <span className="inline-flex items-center gap-2">
                          {row.logo && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={row.logo}
                              alt=""
                              width={20}
                              height={20}
                              loading="lazy"
                              decoding="async"
                              className="h-5 w-5 rounded-sm object-cover"
                            />
                          )}
                          {row.team}
                        </span>
                      </td>
                      <td className="px-2 py-3 text-center text-white/60">{row.played}</td>
                      <td className="px-2 py-3 text-center text-white/60">{row.won}</td>
                      <td className="px-2 py-3 text-center text-white/60">{row.drawn}</td>
                      <td className="px-2 py-3 text-center text-white/60">{row.lost}</td>
                      <td className="px-2 py-3 text-center text-white/60">
                        {row.gd > 0 ? `+${row.gd}` : row.gd}
                      </td>
                      <td className="px-3 py-3 text-center font-display">{row.points}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-white/40">
            Green dots indicate qualification places.
          </p>
        </div>
      </section>
    </SiteLayout>
  );
}
