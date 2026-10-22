"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { upload as uploadToBlob } from "@vercel/blob/client";
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
      const safe = file.name.replace(/[^a-z0-9._-]/gi, "-").slice(-80) || "image.jpg";

      // Production: upload straight from the browser to Vercel Blob. This
      // avoids the 4.5 MB serverless request-body limit for phone photos.
      try {
        const blob = await uploadToBlob(`uploads/${Date.now()}-${safe}`, file, {
          access: "public",
          handleUploadUrl: "/api/upload",
          contentType: file.type || undefined,
        });
        notify("ok", "Image uploaded");
        return blob.url;
      } catch {
        // Blob may not be configured (local development), so fall back to the
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
