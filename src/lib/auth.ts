export const ADMIN_COOKIE = "spartans_admin";

const DEV_PASSWORD = "spartans";
const TOKEN_SALT = "spartans-admin-v1";

/**
 * Returns the configured admin password.
 *
 * In development we fall back to a well-known password so the CMS works out
 * of the box. In production an explicit ADMIN_PASSWORD is required — falling
 * back to a public default there would hand the CMS to anyone.
 */
export function adminPassword(): string {
  const configured = process.env.ADMIN_PASSWORD?.trim();
  if (configured) return configured;
  if (process.env.NODE_ENV === "production") return "";
  return DEV_PASSWORD;
}

/** True when an admin password is available, i.e. login is possible. */
export function isAdminConfigured(): boolean {
  return adminPassword().length > 0;
}

/**
 * Opaque session token derived from the password. The password itself is never
 * stored in the cookie, so a leaked cookie does not reveal it.
 */
export async function adminToken(): Promise<string> {
  const password = adminPassword();
  if (!password) return "";
  const bytes = new TextEncoder().encode(`${TOKEN_SALT}:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Constant-time string comparison to avoid leaking length/content via timing. */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/** Validates a session cookie value. */
export async function isValidSession(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const expected = await adminToken();
  if (!expected) return false;
  return timingSafeEqual(token, expected);
}
