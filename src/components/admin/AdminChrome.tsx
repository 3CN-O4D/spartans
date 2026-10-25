"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAdmin } from "@/components/admin/AdminProvider";
import { CrestWordmark } from "@/components/Crest";

const nav = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/submissions", label: "Submissions" },
  { href: "/admin/news", label: "News & Blog" },
  { href: "/admin/gallery", label: "Gallery" },
  { href: "/admin/squad", label: "Squad" },
  { href: "/admin/lineup", label: "Lineup" },
  { href: "/admin/fixtures", label: "Fixtures" },
  { href: "/admin/table", label: "League Table" },
  { href: "/admin/info", label: "Fees" },
  { href: "/admin/settings", label: "Settings" },
];

export function AdminChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { save, saving, toast, content } = useAdmin();

  async function logout() {
    try {
      await fetch("/api/logout", { method: "POST" });
    } finally {
      router.push("/login");
      router.refresh();
    }
  }

  const tiktokHandle = (content?.club.tiktok || "@spartanssocceraca").replace(/^@/, "");
  const tiktokUrl = `https://www.tiktok.com/@${tiktokHandle}`;

  return (
    <div className="min-h-screen bg-spartan-ink text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-spartan-steel/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-4 px-4">
          <Link href="/admin" className="shrink-0">
            <CrestWordmark
              name={content?.club.name}
              town={content?.club.town}
              logo={content?.club.logo}
            />
          </Link>
          <span className="hidden rounded-sm bg-spartan-red px-2 py-1 text-[10px] font-bold uppercase tracking-widest sm:inline">
            Admin
          </span>

          <div className="ml-auto flex items-center gap-3">
            <a
              href={tiktokUrl}
              target="_blank"
              rel="noopener noreferrer"
              title={`@${tiktokHandle} on TikTok`}
              aria-label="Spartans Soccer Academy on TikTok (opens in a new tab)"
              className="hidden items-center gap-2 rounded-sm border border-white/15 px-3 py-2 text-xs font-bold uppercase tracking-widest text-white/60 transition hover:border-spartan-gold hover:text-spartan-gold md:inline-flex"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                <path d="M16.5 3c.3 2.1 1.5 3.8 3.5 4.6V10c-1.3 0-2.5-.4-3.5-1.1v6.3c0 3.2-2.6 5.8-5.8 5.8S4.9 18.4 4.9 15.2s2.6-5.8 5.8-5.8c.3 0 .6 0 .9.1v2.9c-.3-.1-.6-.2-.9-.2-1.6 0-2.9 1.3-2.9 2.9s1.3 2.9 2.9 2.9 2.9-1.3 2.9-2.9V3h2.9z" />
              </svg>
              TikTok
            </a>
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden text-xs font-bold uppercase tracking-widest text-white/60 hover:text-white sm:inline"
            >
              View site ↗
            </Link>
            <button
              onClick={() => void save()}
              disabled={saving || !content}
              className="btn-primary disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
            <button
              onClick={() => void logout()}
              className="rounded-sm border border-white/20 px-3 py-2 text-xs font-bold uppercase tracking-widest text-white/70 hover:border-white hover:text-white"
            >
              Log out
            </button>
          </div>
        </div>

        <nav className="mx-auto flex max-w-[1400px] gap-1 overflow-x-auto px-4 pb-2">
          {nav.map((item) => {
            const active =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`whitespace-nowrap rounded-sm px-3 py-2 text-xs font-bold uppercase tracking-wide transition ${
                  active ? "bg-white/10 text-spartan-gold" : "text-white/60 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="mx-auto max-w-[1400px] px-4 py-8">{children}</main>

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-6 right-6 z-50 animate-pop rounded-sm px-5 py-3 text-sm font-semibold shadow-lg ${
            toast.kind === "ok" ? "bg-emerald-600" : "bg-red-600"
          }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}
