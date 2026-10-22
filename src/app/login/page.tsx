"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!password) {
      setError("Please enter the admin password.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };

      if (!res.ok) {
        setError(data.error ?? "Incorrect password. Try again.");
        setLoading(false);
        return;
      }

      const from = new URLSearchParams(window.location.search).get("from");
      router.push(from && from.startsWith("/admin") ? from : "/admin");
      router.refresh();
    } catch {
      setError("Could not reach the server. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-spartan-ink px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-md border border-white/10 bg-spartan-steel p-8"
      >
        <h1 className="font-display text-2xl">SPARTANS ADMIN</h1>
        <p className="mt-1 text-sm text-white/50">Sign in to manage the club website.</p>

        <label
          htmlFor="admin-password"
          className="mt-6 block text-xs uppercase tracking-widest text-white/50"
        >
          Password
        </label>
        <input
          id="admin-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
          autoComplete="current-password"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "login-error" : undefined}
          className="mt-2 w-full rounded-sm border border-white/15 bg-black/40 px-4 py-3 text-sm outline-none focus:border-spartan-red"
          placeholder="Enter admin password"
        />
        {error && (
          <p id="login-error" role="alert" className="mt-3 text-sm text-red-400">
            {error}
          </p>
        )}

        <button type="submit" disabled={loading} className="btn-primary mt-6 w-full">
          {loading ? "Signing in…" : "Sign in"}
        </button>

        {process.env.NODE_ENV !== "production" && (
          <p className="mt-4 text-center text-xs text-white/40">
            Development password: <span className="text-spartan-gold">spartans</span>{" "}
            (set ADMIN_PASSWORD to change)
          </p>
        )}
      </form>
    </div>
  );
}
