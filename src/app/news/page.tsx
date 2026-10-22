import type { Metadata } from "next";
import { SiteLayout } from "@/components/SiteLayout";
import { NewsCard } from "@/components/NewsCard";
import { PageHero } from "@/components/PageHero";
import { readContent } from "@/lib/store";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "News" };

export default async function NewsPage() {
  const { club, articles } = await readContent();
  const [featured, ...rest] = articles;

  return (
    <SiteLayout club={club}>
      <PageHero
        eyebrow="From the club"
        title="News"
        subtitle="Match reports, academy updates and community stories."
      />
      <section className="section py-14">
        {featured ? (
          <>
            <NewsCard article={featured} featured />
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((a) => (
                <NewsCard key={a.slug} article={a} />
              ))}
            </div>
          </>
        ) : (
          <p className="text-white/50">No news published yet.</p>
        )}
      </section>
    </SiteLayout>
  );
}
