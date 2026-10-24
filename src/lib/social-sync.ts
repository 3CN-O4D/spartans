import { deleteObject, readText, writeText } from "@/lib/storage";
import { syncInstagram, type SyncMode, type SyncResult } from "@/lib/instagram-sync";
import { syncTikTok, type TikTokSyncResult } from "@/lib/tiktok-sync";

export type SocialSyncResult = {
  ok: boolean;
  skipped?: boolean;
  reason?: string;
  imported?: number;
  dryRun?: boolean;
  posts?: Array<{
    shortcode: string;
    title?: string;
    date: string;
    source?: "instagram" | "tiktok";
  }>;
  errors?: string[];
  error?: string;
  instagram?: SyncResult;
  tiktok?: TikTokSyncResult;
};

const LOCK_PATH = "data/social-sync.lock";
const LOCK_STALE_MS = 15 * 60 * 1000;

async function acquireLock(): Promise<() => Promise<void>> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const existing = await readText(LOCK_PATH).catch(() => null);
    if (existing) {
      const stamp = existing.trim().split(/\s+/).pop() ?? "";
      const started = Date.parse(stamp);
      if (Number.isFinite(started) && Date.now() - started > LOCK_STALE_MS) {
        await deleteObject(LOCK_PATH);
      } else {
        throw new Error("Social sync is already running");
      }
    }

    try {
      await writeText(LOCK_PATH, `${process.pid} ${new Date().toISOString()}`, {
        access: "private",
        contentType: "text/plain; charset=utf-8",
        allowOverwrite: false,
      });
      return async () => {
        await deleteObject(LOCK_PATH).catch(() => undefined);
      };
    } catch {
      // Another request won the race.
    }
  }
  throw new Error("Social sync is already running");
}

export async function syncSocials(options: {
  mode: SyncMode;
  force?: boolean;
  dryRun?: boolean;
  source?: "all" | "instagram" | "tiktok";
  clearLocks?: boolean;
}): Promise<SocialSyncResult> {
  if (options.clearLocks) {
    await Promise.all([
      deleteObject(LOCK_PATH).catch(() => undefined),
      deleteObject("data/instagram-sync.lock").catch(() => undefined),
      deleteObject("data/tiktok-sync.lock").catch(() => undefined),
    ]);
  }

  let release: (() => Promise<void>) | null = null;
  try {
    release = await acquireLock();
  } catch (error) {
    const message = error instanceof Error ? error.message : "sync already running";
    if (message.toLowerCase().includes("already running")) {
      return {
        ok: true,
        skipped: true,
        reason: "sync already running",
        error: "A sync is already in progress. Use clearLocks=1 to clear a stale lock.",
      };
    }
    return { ok: false, error: message };
  }

  try {
    const source = options.source ?? "all";
    const runInstagram = source === "all" || source === "instagram";
    const runTikTok = source === "all" || source === "tiktok";

    // Run sequentially: both workers read-modify-write the same content file,
    // so running them in parallel could lose one set of imports.
    const instagram = runInstagram ? await syncInstagram(options) : null;
    const tiktok = runTikTok
      ? await syncTikTok({ mode: options.mode, force: options.force, dryRun: options.dryRun })
      : null;

    const imported = (instagram?.imported ?? 0) + (tiktok?.imported ?? 0);
    const errors = [...(instagram?.errors ?? []), ...(tiktok?.errors ?? [])];
    const skipped = Boolean(
      (!instagram || instagram.skipped) && (!tiktok || tiktok.skipped),
    );
    const reasons = [instagram?.reason, tiktok?.reason].filter(
      (reason): reason is string => Boolean(reason),
    );

    const posts = [
      ...(instagram?.posts ?? []).map((post) => ({ ...post, source: "instagram" as const })),
      ...(tiktok?.posts ?? []).map((post) => ({ ...post, source: "tiktok" as const })),
    ];

    // OK if at least one source succeeded or was skipped. Only fail if every
    // source that was asked to run errored out.
    const results = [instagram, tiktok].filter(Boolean);
    const ok = results.length > 0 && results.some((r) => r?.ok !== false);
    return {
      ok,
      skipped: skipped && imported === 0,
      reason: reasons.length ? Array.from(new Set(reasons)).join("; ") : undefined,
      imported,
      dryRun: options.dryRun,
      posts,
      errors,
      error: ok
        ? undefined
        : errors.join("; ") || instagram?.error || tiktok?.error || "Social sync failed",
      instagram: instagram ?? undefined,
      tiktok: tiktok ?? undefined,
    };
  } finally {
    if (release) await release();
  }
}
