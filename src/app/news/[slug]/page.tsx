import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteLayout } from "@/components/SiteLayout";
import { NewsCard } from "@/components/NewsCard";
import { formatDate } from "@/lib/data";
import { readContent } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { articles } = await readContent();
  const article = articles.find((a) => a.slug === slug);
  if (!article) return { title: "News" };

  return {
    title: article.title,
    description: article.excerpt,
    alternates: { canonical: `/news/${article.slug}` },
    openGraph: {
      type: "article",
      title: article.title,
      description: article.excerpt,
      publishedTime: article.date,
      authors: [article.author],
      images: article.coverImage ? [article.coverImage] : undefined,
    },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { club, articles } = await readContent();
  const article = articles.find((a) => a.slug === slug);
  if (!article) notFound();

  const related = articles.filter((a) => a.slug !== article.slug).slice(0, 3);

  return (
    <SiteLayout club={club}>
      <article>
        <div className="relative h-64 w-full overflow-hidden border-b border-white/10 bg-gradient-to-br from-spartan-red via-spartan-darkred to-spartan-ink">
          {article.coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={article.coverImage}
              alt=""
              loading="eager"
              decoding="async"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:18px_18px]" />
          )}
        </div>
        <div className="section max-w-3xl py-12">
          <div className="text-xs uppercase tracking-widest text-spartan-gold">
            {article.category}
          </div>
          <h1 className="mt-3 font-display text-3xl uppercase leading-tight sm:text-4xl">
            {article.title}
          </h1>
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm text-white/50">
            <span>{formatDate(article.date)}</span>
            <span>· {article.author}</span>
            <span>· {article.readMins} min read</span>
          </div>

          <div className="mt-8 space-y-5 text-lg leading-relaxed text-white/80">
            {article.body.map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap gap-3 border-t border-white/10 pt-8">
            <Link href="/news" className="btn-ghost">
              ← Back to news
            </Link>
            <Link href="/contact#register" className="btn-primary">
              Join the club
            </Link>
          </div>
        </div>
      </article>

      {related.length > 0 && (
        <section className="border-t border-white/10 bg-spartan-steel">
          <div className="section py-14">
            <h2 className="font-display text-xl uppercase">More news</h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((a) => (
                <NewsCard key={a.slug} article={a} />
              ))}
            </div>
          </div>
        </section>
      )}
    </SiteLayout>
  );
}
