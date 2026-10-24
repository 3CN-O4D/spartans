"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { Content } from "@/lib/data";

type Toast = { kind: "ok" | "err"; msg: string } | null;

type Ctx = {
  content: Content | null;
  setContent: React.Dispatch<React.SetStateAction<Content | null>>;
  loading: boolean;
  saving: boolean;
  toast: Toast;
  save: () => Promise<void>;
  upload: (file: File) => Promise<string | null>;
  reload: () => Promise<void>;
  notify: (kind: "ok" | "err", msg: string) => void;
};

const AdminContext = createContext<Ctx | null>(null);

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used inside AdminProvider");
  return ctx;
}

function goToLogin() {
  if (typeof window !== "undefined") window.location.assign("/login");
}

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [content, setContent] = useState<Content | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<Toast>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const notify = useCallback((kind: "ok" | "err", msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ kind, msg });
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }, []);

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    [],
  );

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/content", { cache: "no-store" });
      if (res.status === 401) {
        goToLogin();
        return;
      }
      if (!res.ok) throw new Error("Request failed");
      const data = (await res.json()) as Content;
      setContent(data);
    } catch {
      notify("err", "Could not load content");
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const save = useCallback(async () => {
    if (!content) return;
    setSaving(true);
    try {
      const res = await fetch("/api/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(content),
      });

      if (res.status === 401) {
        goToLogin();
        return;
      }

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        notify("err", data.error ?? "Save failed");
        return;
      }

      notify("ok", "Changes saved");
    } catch {
      notify("err", "Save failed — check your connection");
    } finally {
      setSaving(false);
    }
  }, [content, notify]);

  const upload = useCallback(
    async (file: File) => {
      const safe = (() => {
        const base = file.name.replace(/[^a-z0-9._-]/gi, "-").slice(-80);
        if (!base) return "file.mp4";
        if (/\.(jpg|jpeg|png|webp|gif|avif|bmp|mp4|webm|mov|mkv)$/i.test(base)) {
          return base.replace(/\.jpeg$/i, ".jpg");
        }
        const ext = {
          "image/jpeg": ".jpg",
          "image/png": ".png",
          "image/webp": ".webp",
          "image/gif": ".gif",
          "image/avif": ".avif",
          "image/bmp": ".bmp",
          "video/mp4": ".mp4",
          "video/webm": ".webm",
          "video/quicktime": ".mov",
          "video/x-matroska": ".mkv",
        }[file.type] ?? ".jpg";
        return `${base}${ext}`;
      })();

      // Production: ask the server for a short-lived R2 presigned PUT URL,
      // then upload straight from the browser to Cloudflare R2. This avoids
      // the 4.5 MB serverless request-body limit for phone photos.
      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pathname: `uploads/${Date.now()}-${safe}`,
            contentType: file.type,
          }),
        });

        if (res.status === 401) {
          goToLogin();
          return null;
        }

        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as { error?: string };
          notify("err", data.error ?? "Upload failed");
          return null;
        }

        const { uploadUrl, publicUrl: finalUrl } = (await res.json()) as {
          uploadUrl: string;
          publicUrl: string;
        };

        await fetch(uploadUrl, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type },
        });

        notify("ok", "Image uploaded");
        return finalUrl;
      } catch {
        // R2 may not be configured (local development), so fall back to the
        // multipart route. The route also rejects unsafe types and sizes.
      }

      const fd = new FormData();
      fd.append("file", file);
      try {
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };

        if (res.status === 401) {
          goToLogin();
          return null;
        }
        if (res.ok && data.url) {
          notify("ok", "Image uploaded");
          return data.url;
        }
        notify("err", data.error ?? "Upload failed");
        return null;
      } catch {
        notify("err", "Upload failed");
        return null;
      }
    },
    [notify],
  );

  return (
    <AdminContext.Provider
      value={{ content, setContent, loading, saving, toast, save, upload, reload, notify }}
    >
      {children}
    </AdminContext.Provider>
  );
}
