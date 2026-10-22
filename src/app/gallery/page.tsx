import type { Metadata } from "next";
import Link from "next/link";
import { SiteLayout } from "@/components/SiteLayout";
import { PageHero } from "@/components/PageHero";
import { GalleryGrid } from "@/components/GalleryGrid";
import { readContent } from "@/lib/store";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Gallery" };

export default async function GalleryPage() {
  const { club, gallery } = await readContent();
  const instagram = club.instagram?.replace(/^@/, "");

  return (
    <SiteLayout club={club}>
      <PageHero
        eyebrow="Club life"
        title="Gallery"
        subtitle={`Photos and videos from matchdays, training and community events in ${club.town}.`}
      />
      <section className="section py-14">
        <GalleryGrid items={gallery} />

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6">
          <p className="max-w-xl text-sm leading-relaxed text-white/50">
            Got a photo from a matchday or training session? Send it to the club and we will add it
            to the story.
            {instagram && (
              <>
                {" "}
                You can also tag{" "}
                <a
                  href={`https://instagram.com/${instagram}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-spartan-gold hover:text-white"
                >
                  @{instagram}
                </a>{" "}
                on Instagram.
              </>
            )}
          </p>
          <Link href="/contact" className="btn-ghost">
            Share a photo
          </Link>
        </div>
      </section>
    </SiteLayout>
  );
}
