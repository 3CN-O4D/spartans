import Link from "next/link";
import { SiteLayout } from "@/components/SiteLayout";
import { readContent } from "@/lib/store";

export default async function NotFound() {
  const { club } = await readContent();

  return (
    <SiteLayout club={club}>
      <section className="section grid min-h-[60vh] place-items-center py-16 text-center">
        <div className="max-w-lg">
          <div className="eyebrow">404 · Off target</div>
          <h1 className="mt-3 font-display text-5xl uppercase leading-none sm:text-6xl">
            Page not found
          </h1>
          <p className="mt-4 text-white/60">
            The page you are looking for has been moved, deleted, or never existed.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/" className="btn-primary">
              Back to home
            </Link>
            <Link href="/news" className="btn-ghost">
              Read the news
            </Link>
            <Link href="/contact" className="btn-ghost">
              Contact us
            </Link>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
