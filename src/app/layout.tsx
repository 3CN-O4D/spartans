import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { readContent } from "@/lib/store";
import type { Club } from "@/lib/data";
import { siteUrl } from "@/lib/site";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "dark",
  themeColor: "#0b0b0d",
};

export async function generateMetadata(): Promise<Metadata> {
  let club: Club;
  try {
    ({ club } = await readContent());
  } catch {
    // Fall back to static defaults if content cannot be read.
    club = (await import("@/lib/data")).club;
  }

  const title = `${club.name} · Youth Football in ${club.town}`;
  const description = `Official website of ${club.name}, a community youth football academy in ${club.town}, ${club.country}. News, fixtures, squad and how to join.`;

  return {
    metadataBase: new URL(siteUrl()),
    title: { default: title, template: `%s · ${club.name}` },
    description,
    applicationName: club.name,
    keywords: [
      club.name,
      "Spartans Soccer Academy",
      `${club.town} football`,
      "youth football Kenya",
      club.county,
      "kids football club",
    ],
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      siteName: club.name,
      title,
      description,
      url: "/",
      locale: "en_KE",
      images: club.logo ? [{ url: club.logo, alt: `${club.name} crest` }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: club.logo ? [club.logo] : undefined,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large" },
    },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-sm focus:bg-spartan-red focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-white"
        >
          Skip to content
        </a>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
