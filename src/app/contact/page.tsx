import type { Metadata } from "next";
import { SiteLayout } from "@/components/SiteLayout";
import { ContactForm } from "@/components/ContactForm";
import { readContent } from "@/lib/store";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Contact" };

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ support?: string }>;
}) {
  const { club, info } = await readContent();
  const params = await searchParams;
  return (
    <SiteLayout club={club}>
      <ContactForm club={club} info={info} supportType={params.support} />
    </SiteLayout>
  );
}
