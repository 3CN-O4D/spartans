"use client";

import { useEffect, useRef, useState } from "react";
import { useAdmin } from "@/components/admin/AdminProvider";

export function Card({
  title,
  actions,
  children,
}: {
  title?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-md border border-white/10 bg-spartan-steel p-5">
      {(title || actions) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && (
            <h2 className="font-display text-lg uppercase tracking-wide">{title}</h2>
          )}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-white/50">
      {children}
    </label>
  );
}

const inputCls =
  "w-full rounded-sm border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-spartan-red";

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputCls} ${props.className ?? ""}`} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${inputCls} ${props.className ?? ""}`} />;
}

export function NumberInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input type="number" {...props} className={`${inputCls} ${props.className ?? ""}`} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${inputCls} ${props.className ?? ""}`} />;
}

export function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

/**
 * Comma-separated list editor. Keeps the raw text in local state while typing
 * so the cursor does not jump, while still pushing every keystroke into the
 * parent so a subsequent "Save" never writes stale data.
 */
export function ListField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}) {
  const [text, setText] = useState(value.join(", "));
  const lastEmitted = useRef(value.join(", "));

  useEffect(() => {
    const joined = value.join(", ");
    // Only resync when the value changed from outside this field.
    if (joined !== lastEmitted.current) {
      lastEmitted.current = joined;
      setText(joined);
    }
  }, [value]);

  function change(next: string) {
    setText(next);
    const parsed = next
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    lastEmitted.current = parsed.join(", ");
    onChange(parsed);
  }

  return (
    <Field label={label}>
      <TextInput
        value={text}
        placeholder={placeholder}
        onChange={(e) => change(e.target.value)}
      />
    </Field>
  );
}

export function Btn({
  variant = "ghost",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger" }) {
  const base =
    "inline-flex items-center justify-center gap-1.5 rounded-sm px-3 py-2 text-xs font-bold uppercase tracking-wide transition disabled:opacity-50";
  const styles = {
    primary: "bg-spartan-red text-white hover:bg-spartan-darkred",
    ghost: "border border-white/20 text-white/80 hover:border-white hover:text-white",
    danger: "border border-red-500/50 text-red-300 hover:bg-red-500/10",
  }[variant];
  return <button {...props} className={`${base} ${styles} ${className}`} />;
}

export function ImageField({
  label,
  value,
  onChange,
  aspect = "aspect-square",
}: {
  label: string;
  value?: string;
  onChange: (url: string) => void;
  aspect?: string;
}) {
  const { upload, importFromUrl } = useAdmin();
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [link, setLink] = useState("");
  const [importing, setImporting] = useState(false);

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    const url = await upload(file);
    setBusy(false);
    if (url) onChange(url);
    if (ref.current) ref.current.value = "";
  }

  function toggleLink() {
    if (!linkOpen) setLink(value ?? "");
    setLinkOpen((open) => !open);
  }

  // Copy an external image or video into our own storage.
  async function importLink() {
    const url = link.trim();
    if (!url) return;
    setImporting(true);
    const stored = await importFromUrl(url);
    setImporting(false);
    if (stored) {
      onChange(stored);
      setLink("");
      setLinkOpen(false);
    }
  }

  // Point straight at the external URL without copying it.
  function useLinkDirectly() {
    const url = link.trim();
    if (!url) return;
    onChange(url);
    setLink("");
    setLinkOpen(false);
  }

  return (
    <div>
      <Label>{label}</Label>
      <div className="flex items-start gap-3">
        <div
          className={`${aspect} w-20 shrink-0 overflow-hidden rounded-sm border border-white/15 bg-black/40`}
        >
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full w-full place-items-center text-[10px] text-white/30">
              No image
            </div>
          )}
        </div>
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <Btn onClick={() => ref.current?.click()} disabled={busy}>
              {busy ? "Uploading…" : value ? "Replace" : "Upload"}
            </Btn>
            <Btn onClick={toggleLink} disabled={busy || importing}>
              {importing ? "Importing…" : "Import link"}
            </Btn>
            {value && (
              <Btn variant="danger" onClick={() => onChange("")}>
                Remove
              </Btn>
            )}
          </div>
          {linkOpen && (
            <div className="flex flex-col gap-2 rounded-sm border border-white/10 bg-black/30 p-2">
              <TextInput
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://… direct image or video link"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void importLink();
                  }
                }}
              />
              <div className="flex flex-wrap gap-2">
                <Btn
                  variant="primary"
                  onClick={() => void importLink()}
                  disabled={importing || !link.trim()}
                >
                  {importing ? "Importing…" : "Copy to storage"}
                </Btn>
                <Btn onClick={useLinkDirectly} disabled={!link.trim()}>
                  Use link as-is
                </Btn>
              </div>
              <p className="text-[10px] text-white/40">
                Paste a direct image or video URL (Terabox, Google Photos, Drive or any
                host). &quot;Copy to storage&quot; saves it to our media library so the
                link can&apos;t expire.
              </p>
            </div>
          )}
          <input
            ref={ref}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={(e) => void pick(e)}
          />
        </div>
      </div>
    </div>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-sm border border-dashed border-white/15 p-8 text-center text-sm text-white/40">
      {children}
    </div>
  );
}
