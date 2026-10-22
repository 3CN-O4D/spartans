import Link from "next/link";
import { Crest } from "@/components/Crest";
import { fixtureLabel } from "@/lib/format";
import type { Fixture } from "@/lib/data";

export function MatchCard({
  fixture,
  clubName = "Spartans",
  clubLogo,
}: {
  fixture: Fixture;
  clubName?: string;
  clubLogo?: string;
}) {
  const atHome = fixture.venue === "Home";

  const home = atHome
    ? { name: clubName, logo: clubLogo, isUs: true }
    : { name: fixture.opponent, logo: fixture.opponentLogo, isUs: false };
  const away = atHome
    ? { name: fixture.opponent, logo: fixture.opponentLogo, isUs: false }
    : { name: clubName, logo: clubLogo, isUs: true };

  const hasResult = fixture.status === "result";
  const homeScore = (atHome ? fixture.scoreFor : fixture.scoreAgainst) ?? 0;
  const awayScore = (atHome ? fixture.scoreAgainst : fixture.scoreFor) ?? 0;

  function Side({ team, align }: { team: typeof home; align: "left" | "right" }) {
    return (
      <div
        className={`flex min-w-0 items-center gap-3 ${
          align === "right" ? "flex-row-reverse text-right" : ""
        }`}
      >
        {team.isUs ? (
          <Crest className="h-10 w-10 shrink-0 crest-mask" logo={team.logo} />
        ) : team.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={team.logo}
            alt=""
            width={40}
            height={40}
            loading="lazy"
            decoding="async"
            className="h-10 w-10 shrink-0 rounded-sm object-cover"
          />
        ) : (
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-sm bg-white/10 font-display text-sm">
            {team.name.slice(0, 2).toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <div className="truncate font-display text-base leading-tight">{team.name}</div>
          <div className="text-[11px] uppercase tracking-widest text-white/50">
            {team.isUs ? (atHome ? "Home" : "Away") : atHome ? "Away" : "Home"}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between text-xs uppercase tracking-wide text-spartan-gold">
        <span className="truncate">{fixture.competition}</span>
        <span className="ml-3 shrink-0 rounded-sm bg-white/10 px-2 py-0.5 text-white/80">
          {fixture.venue}
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <Side team={home} align="left" />

        <div className="shrink-0 px-2 text-center">
          {hasResult ? (
            <div className="font-display text-2xl tabular-nums">
              {homeScore} – {awayScore}
            </div>
          ) : (
            <div className="font-display text-lg text-white/70">{fixture.time}</div>
          )}
          <div className="text-[10px] uppercase tracking-widest text-white/40">
            {hasResult ? "Full time" : "Kick-off"}
          </div>
        </div>

        <Side team={away} align="right" />
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/10 pt-4 text-xs text-white/60">
        <span className="shrink-0">{fixtureLabel(fixture.date)}</span>
        <span className="truncate text-right">{fixture.ground}</span>
      </div>
    </div>
  );
}

export function MatchRow({ fixture }: { fixture: Fixture }) {
  const outcome =
    fixture.status === "result" &&
    typeof fixture.scoreFor === "number" &&
    typeof fixture.scoreAgainst === "number"
      ? fixture.scoreFor > fixture.scoreAgainst
        ? { label: "W", className: "bg-emerald-500/20 text-emerald-300" }
        : fixture.scoreFor < fixture.scoreAgainst
          ? { label: "L", className: "bg-red-500/20 text-red-300" }
          : { label: "D", className: "bg-white/15 text-white/70" }
      : null;

  return (
    <Link
      href="/fixtures"
      className="flex items-center justify-between gap-4 border-b border-white/10 px-1 py-4 transition hover:bg-white/5"
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold">{fixture.opponent}</span>
          {outcome && (
            <span
              className={`grid h-5 w-5 shrink-0 place-items-center rounded-sm text-[10px] font-bold ${outcome.className}`}
              title={
                outcome.label === "W" ? "Win" : outcome.label === "L" ? "Loss" : "Draw"
              }
            >
              {outcome.label}
            </span>
          )}
        </div>
        <div className="text-xs text-white/50">
          {fixture.competition} · {fixture.venue}
        </div>
      </div>
      <div className="text-right">
        {fixture.status === "result" ? (
          <div className="font-display text-lg tabular-nums">
            {fixture.scoreFor}–{fixture.scoreAgainst}
          </div>
        ) : (
          <div className="font-display text-sm">{fixture.time}</div>
        )}
        <div className="text-[10px] uppercase tracking-widest text-white/40">
          {fixtureLabel(fixture.date)}
        </div>
      </div>
    </Link>
  );
}
