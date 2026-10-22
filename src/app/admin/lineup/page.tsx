"use client";

import { LineupEditor } from "@/components/admin/LineupEditor";
import { useAdmin } from "@/components/admin/AdminProvider";

export default function AdminLineupPage() {
  const { loading, content } = useAdmin();
  if (loading || !content) return <p className="text-white/50">Loading…</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl uppercase">Lineup &amp; Formation</h1>
        <p className="mt-1 text-sm text-white/50">
          Drag players to build the starting eleven. Squad number controls who is auto-selected;
          jersey number is what shows on the kit.
        </p>
      </div>
      <LineupEditor />
    </div>
  );
}
