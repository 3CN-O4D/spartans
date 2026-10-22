import type { Metadata } from "next";
import Link from "next/link";
import { SiteLayout } from "@/components/SiteLayout";
import { PageHero } from "@/components/PageHero";
import { LineupBoard } from "@/components/LineupBoard";
import { readContent } from "@/lib/store";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Lineup" };

export default async function LineupPage() {
  const { club, players, settings, lineup } = await readContent();

  return (
    <SiteLayout club={club}>
      <PageHero
        eyebrow="Matchday XI"
        title="The Lineup"
        subtitle={`${club.name}'s matchday shape — and a sandbox where you can try your own XI.`}
      />
      <section className="section py-10">
        <LineupBoard
          players={players}
          lineup={lineup}
          defaultFormation={settings.defaultFormation}
          clubName={club.name}
        />
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <p className="text-xs text-white/40">
            The coach&apos;s saved XI is shown first. Your sandbox changes stay on this screen and
            are never saved.
          </p>
          <Link
            href="/admin/lineup"
            className="text-xs font-bold uppercase tracking-widest text-white/30 hover:text-spartan-gold"
          >
            Staff sign-in →
          </Link>
        </div>
      </section>
    </SiteLayout>
  );
}
