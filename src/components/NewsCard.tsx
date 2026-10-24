import Link from "next/link";
import { Crest } from "@/components/Crest";
import { formatDate } from "@/lib/data";
import type { Article } from "@/lib/data";

export function NewsCard({ article, featured = false }: { article: Article; featured?: boolean }) {
  return (
    <Link
      href={`/news/${article.slug}`}
      className="card group flex flex-col transition hover:border-spartan-red/70"
    >
      <div
        className={`relative overflow-hidden bg-gradient-to-br from-spartan-red to-spartan-ink ${
          featured ? "aspect-[16/10]" : "aspect-[16/9]"
        }`}
      >
        {article.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={article.coverImage}
            alt={article.title}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="absolute inset-0">
            <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:16px_16px]" />
            <Crest
              logo="/brand/spartans-crest-transparent.png"
              className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 opacity-30"
            />
            <span className="absolute bottom-4 left-4 text-[10px] font-bold uppercase tracking-[0.3em] text-white/40">
              Spartans Soccer Academy
            </span>
          </div>
        )}
        <span className="absolute left-4 top-4 rounded-sm bg-black/70 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-spartan-gold">
          {article.category}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="text-xs text-white/50">
          {formatDate(article.date)} · {article.readMins} min read
        </div>
        <h3
          className={`mt-2 font-display uppercase leading-snug transition group-hover:text-spartan-gold ${
            featured ? "text-2xl" : "text-lg"
          }`}
        >
          {article.title}
        </h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-white/60">{article.excerpt}</p>
        <span className="mt-4 text-xs font-bold uppercase tracking-widest text-spartan-gold">
          Read more →
        </span>
      </div>
    </Link>
  );
}
