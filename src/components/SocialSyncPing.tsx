"use client";

import { useEffect } from "react";

/**
 * Once-a-day, non-blocking social sync trigger (Instagram + TikTok).
 *
 * The server enforces the real 24-hour gate and a process lock; this browser
 * gate simply avoids sending a request on every page view. The request is
 * deliberately not awaited and is not aborted on unmount, so a visitor can
 * navigate away while the workers finish.
 */
export function SocialSyncPing({ enabled }: { enabled: boolean }) {
  useEffect(() => {
    if (!enabled) return;

    const key = "spartans:social-sync-ping";
    try {
      const last = Number(window.localStorage.getItem(key) || 0);
      if (Date.now() - last < 12 * 60 * 60 * 1000) return;
      window.localStorage.setItem(key, String(Date.now()));
    } catch {
      // Private browsing can block localStorage. The server gate still applies.
    }

    void fetch("/api/instagram/sync?mode=auto", {
      method: "POST",
      cache: "no-store",
      keepalive: true,
    }).catch(() => undefined);
  }, [enabled]);

  return null;
}
