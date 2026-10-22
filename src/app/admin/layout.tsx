import type { Metadata } from "next";
import { AdminProvider } from "@/components/admin/AdminProvider";
import { AdminChrome } from "@/components/admin/AdminChrome";

// The admin area must never be indexed by search engines.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminProvider>
      <AdminChrome>{children}</AdminChrome>
    </AdminProvider>
  );
}
