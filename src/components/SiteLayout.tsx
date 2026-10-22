import { ClubHeader } from "@/components/Header";
import { SiteFooter } from "@/components/Footer";
import { SocialSyncPing } from "@/components/SocialSyncPing";
import type { Club } from "@/lib/data";

export function SiteLayout({ club, children }: { club: Club; children: React.ReactNode }) {
  const instagramSyncEnabled =
    process.env.INSTAGRAM_SYNC_ENABLED === "true" &&
    process.env.INSTAGRAM_SYNC_PUBLIC === "true";

  return (
    <div className="flex min-h-screen flex-col">
      <ClubHeader club={club} />
      <SocialSyncPing enabled={instagramSyncEnabled} />
      <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
        {children}
      </main>
      <SiteFooter club={club} />
    </div>
  );
}
