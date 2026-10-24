import { createHash } from "node:crypto";
import type { Content, GalleryItem } from "@/lib/data";
import { readContent, writeContent } from "@/lib/store";
import {
  deleteObject,
  publicUrl,
  readText,
  writeBinary,
  writeText,
} from "@/lib/storage";

/**
 * TikTok -> website sync.
 *
 * TikTok's public profile page is protected by a bot challenge, but the
 * official embed page is publicly readable and includes a JSON video list.
 * No login, token or API key is needed.
 *
 * New posts are added to the gallery. Video files are self-hosted so the
 * public site never loads TikTok's third-party scripts or links.
 */

const DAY_MS = 24 * 60 * 60 * 1000;
const LOCK_STALE_MS = 15 * 60 * 1000;
const MAX_VIDEO_BYTES = 60 * 1024 * 1024;
const MAX_COVER_BYTES = 12 * 1024 * 1024;

const STATE_PATH = "data/tiktok-sync.json";
const LOCK_PATH = "data/tiktok-sync.lock";

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

const TINTS = [
  "from-spartan-red to-spartan-ink",
  "from-emerald-700 to-spartan-ink",
  "from-spartan-gold/70 to-spartan-darkred",
  "from-sky-700 to-spartan-ink",
  "from-purple-700 to-spartan-ink",
];

export type TikTokMode = "auto" | "manual" | "cron";

export type TikTokSyncResult = {
  ok: boolean;
  skipped?: boolean;
  reason?: string;
  imported?: number;
  dryRun?: boolean;
  posts?: Array<{ shortcode: string; title?: string; date: string }>;
  errors?: string[];
  error?: string;
};

type TikTokState = {
  lastAttempt?: string;
  lastSuccess?: string;
  seen: string[];
  lastError?: string | null;
};

type TikTokPost = {
  id: string;
  caption: string;
  coverUrl: string;
  videoUrl: string;
  date: Date;
  isoDate: string;
  displayDate: string;
};

type Assets = {
  image: string;
  video?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function tiktokUsername(): string {
  return (process.env.TIKTOK_USERNAME?.trim() || "spartanssocceraca").replace(/^@/, "");
}

function maxPosts(): number {
  const raw = Number(process.env.TIKTOK_MAX_POSTS_PER_RUN ?? "2");
  if (!Number.isFinite(raw)) return 2;
  return Math.min(12, Math.max(1, Math.floor(raw)));
}

function displayDate(date: Date): string {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${String(date.getUTCDate()).padStart(2, "0")} ${months[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

function dateFromId(id: string): Date {
  try {
    const seconds = Number(BigInt(id) >> BigInt(32));
    const date = new Date(seconds * 1000);
    if (!Number.isNaN(date.getTime())) return date;
  } catch {
    // Fall back to today for an unexpected id.
  }
  return new Date();
}

function stripEmoji(input: string): string {
  return input
    .replace(
      /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0E}\u{FE0F}\u{200D}\u{20E3}\u{1F3FB}-\u{1F3FF}]/gu,
      "",
    )
    .replace(/\s+/g, " ")
    .trim();
}

function cleanCaption(input: string): string {
  return stripEmoji(
    input
      .replace(/https?:\/\/\S+/g, "")
      .replace(/[#@][\p{L}\p{N}_]+/gu, "")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

function titleFor(post: TikTokPost): string {
  const curated: Record<string, string> = {
    "7698293130851880210": "Back on the grass",
    "7696583631464107271": "The road to Arusha",
    "7695471155666373895": "Ready for the session",
    "7694717202917870855": "Arusha 2026: the challenge",
    "7694714098092690696": "Together before kick-off",
    "7694711692676058386": "Chipkizi Cup 2026",
    "7693631466944728328": "New kits, same badge",
    "7693617088644123911": "The next generation",
    "7693504003484798216": "The coach's eye",
    "7693501325031591186": "Chasing every ball",
  };
  if (curated[post.id]) return curated[post.id];

  const clean = cleanCaption(post.caption);
  if (clean.length >= 18) {
    const sentence = clean.match(/^(.{8,90}?[.!?])(?:\s|$)/)?.[1] ?? clean;
    return sentence.slice(0, 90).trim();
  }
  if (/match|goal|cup|fixture|result/i.test(post.caption)) return "Matchday with the Spartans";
  if (/train|session|drill|academy|coach/i.test(post.caption)) return "Back on the training ground";
  return "A moment with the Spartans";
}

function descriptionFor(post: TikTokPost): string {
  const curated: Record<string, string> = {
    "7698293130851880210":
      "A training-ground montage from the Spartans academy: quick feet, brave running and the everyday work behind every matchday.",
    "7696583631464107271":
      "The academy shares the details of the 17th Chipkizi Cup in Arusha, Tanzania, as the Spartans prepare for a five-day adventure.",
    "7695471155666373895":
      "The squad gathers at Eldoret Premier School before another session, ready to learn and compete together.",
    "7694717202917870855":
      "Arusha, Tanzania, 7-13 December 2026. The Chipkizi Cup is the next big challenge for the Spartans.",
    "7694714098092690696":
      "Coaches and players come together before kick-off. One team, one dream, one family.",
    "7694711692676058386":
      "The 17th Chipkizi Cup takes the Spartans to Arusha, Tanzania, for five days of youth football.",
    "7693631466944728328":
      "The Spartans kit, ready for the next chapter. The badge carries the academy's values wherever the team goes.",
    "7693617088644123911":
      "The next generation lines up at training. Every session is a chance to grow, on and off the pitch.",
    "7693504003484798216":
      "A focused moment on the touchline as the Spartans staff watch the next generation train.",
    "7693501325031591186":
      "Matchday energy from the Spartans academy: pressing, competing and playing with courage.",
  };
  if (curated[post.id]) return curated[post.id];

  const clean = cleanCaption(post.caption);
  if (clean.length >= 20) return clean.slice(0, 320);
  return `Official club clip from ${post.displayDate} at Spartans Soccer Academy in Eldoret.`;
}

function tintFor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return TINTS[hash % TINTS.length];
}

function safeId(id: string): string {
  const safe = id.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 32);
  return safe || createHash("sha1").update(id).digest("hex").slice(0, 16);
}

function isJpeg(buffer: Buffer): boolean {
  return buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
}

function isMp4(buffer: Buffer): boolean {
  return buffer.length > 12 && buffer.subarray(4, 8).toString("ascii") === "ftyp";
}

async function fetchTikTokPosts(): Promise<TikTokPost[]> {
  const username = tiktokUsername();
  const response = await fetch(`https://www.tiktok.com/embed/@${encodeURIComponent(username)}`, {
    headers: {
      "User-Agent": BROWSER_UA,
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Cache-Control": "no-cache",
    },
    cache: "no-store",
    redirect: "follow",
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    throw new Error(`TikTok embed returned ${response.status}`);
  }

  const html = await response.text();
  const match = html.match(
    /<script[^>]*id="__FRONTITY_CONNECT_STATE__"[^>]*>([\s\S]*?)<\/script>/,
  );
  if (!match) {
    throw new Error("TikTok did not expose its public video list. Try again later.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(match[1]);
  } catch {
    throw new Error("TikTok returned an unreadable video list.");
  }

  const source = isRecord(parsed) && isRecord(parsed.source) ? parsed.source : null;
  const data = source && isRecord(source.data) ? source.data : null;
  if (!data) throw new Error("TikTok returned an unexpected response.");

  const key = Object.keys(data).find((candidate) =>
    candidate.toLowerCase().includes(`/embed/@${username.toLowerCase()}`),
  );
  const entry = key ? data[key] : null;
  const list = isRecord(entry) ? entry.videoList : null;
  if (!Array.isArray(list)) {
    throw new Error("TikTok did not expose any videos in the public embed.");
  }

  const posts: TikTokPost[] = [];
  const seen = new Set<string>();
  for (const raw of list) {
    if (!isRecord(raw)) continue;
    if (raw.privateItem === true) continue;

    const id = str(raw.id);
    if (!id || seen.has(id)) continue;

    const coverUrl = str(raw.originCoverUrl) || str(raw.coverUrl);
    const videoUrl = str(raw.playAddr);
    if (!coverUrl && !videoUrl) continue;

    const date = dateFromId(id);
    seen.add(id);
    posts.push({
      id,
      caption: str(raw.desc).slice(0, 5000),
      coverUrl,
      videoUrl,
      date,
      isoDate: date.toISOString().slice(0, 10),
      displayDate: displayDate(date),
    });
  }

  return posts.sort((a, b) => b.date.getTime() - a.date.getTime());
}

async function saveAsset(
  url: string,
  pathname: string,
  contentType: string,
  maxBytes: number,
  validate: (buffer: Buffer) => boolean,
  label: string,
): Promise<string> {
  const existing = await publicUrl(pathname);
  if (existing) return existing;

  const response = await fetch(url, {
    headers: {
      "User-Agent": BROWSER_UA,
      Accept: contentType.startsWith("video/") ? "video/mp4,video/*;q=0.9,*/*;q=0.8" : "image/*",
      Referer: "https://www.tiktok.com/",
    },
    cache: "no-store",
    redirect: "follow",
    signal: AbortSignal.timeout(90_000),
  });
  if (!response.ok) throw new Error(`${label} download returned ${response.status}`);

  const buffer = Buffer.from(await response.arrayBuffer());
  if (!buffer.length) throw new Error(`${label} download was empty`);
  if (buffer.length > maxBytes) {
    throw new Error(`${label} is larger than ${Math.round(maxBytes / 1024 / 1024)} MB`);
  }
  if (!validate(buffer)) throw new Error(`${label} was not a valid ${contentType}`);

  return writeBinary(pathname, buffer, contentType);
}

async function saveAssets(post: TikTokPost): Promise<Assets> {
  const id = safeId(post.id);
  if (!post.coverUrl) {
    throw new Error("post has no cover image");
  }

  const image = await saveAsset(
    post.coverUrl,
    `gallery/tiktok-${id}.jpg`,
    "image/jpeg",
    MAX_COVER_BYTES,
    isJpeg,
    "cover image",
  );

  if (!post.videoUrl) return { image };

  const video = await saveAsset(
    post.videoUrl,
    `videos/tiktok-${id}.mp4`,
    "video/mp4",
    MAX_VIDEO_BYTES,
    isMp4,
    "video",
  );
  return { image, video };
}

function galleryItemFor(post: TikTokPost, assets: Assets): GalleryItem {
  return {
    id: `tiktok-${post.id}`,
    title: titleFor(post),
    image: assets.image,
    video: assets.video,
    tint: tintFor(post.id),
    caption: descriptionFor(post),
    date: post.displayDate,
    credit: "Spartans Soccer Academy",
  };
}

async function readState(): Promise<TikTokState> {
  const raw = await readText(STATE_PATH).catch(() => null);
  let parsed: Partial<TikTokState> | null = null;
  if (raw) {
    try {
      parsed = JSON.parse(raw) as Partial<TikTokState>;
    } catch {
      parsed = null;
    }
  }
  return {
    lastAttempt: typeof parsed?.lastAttempt === "string" ? parsed.lastAttempt : undefined,
    lastSuccess: typeof parsed?.lastSuccess === "string" ? parsed.lastSuccess : undefined,
    seen: Array.isArray(parsed?.seen)
      ? parsed.seen.filter((value): value is string => typeof value === "string")
      : [],
    lastError: typeof parsed?.lastError === "string" ? parsed.lastError : null,
  };
}

async function writeState(state: TikTokState): Promise<void> {
  await writeText(STATE_PATH, `${JSON.stringify(state, null, 2)}\n`, {
    access: "private",
    contentType: "application/json",
  });
}

async function acquireLock(): Promise<() => Promise<void>> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const existing = await readText(LOCK_PATH).catch(() => null);
    if (existing) {
      const stamp = existing.trim().split(/\s+/).pop() ?? "";
      const started = Date.parse(stamp);
      if (Number.isFinite(started) && Date.now() - started > LOCK_STALE_MS) {
        await deleteObject(LOCK_PATH);
      } else {
        throw new Error("TikTok sync is already running");
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
      // Another instance won the race; re-read or report it as running.
    }
  }
  throw new Error("TikTok sync is already running");
}

function existingIds(content: Content, state: TikTokState): Set<string> {
  const seen = new Set(state.seen);
  for (const item of content.gallery) {
    if (item.id.startsWith("tiktok-")) {
      const id = item.id.slice("tiktok-".length);
      if (/^[0-9]{8,}$/.test(id)) seen.add(id);
    }
    const videoMatch = item.video?.match(/\/tiktok-([0-9]+)\.mp4/);
    if (videoMatch) seen.add(videoMatch[1]);
    const imageMatch = item.image?.match(/\/tiktok-([0-9]+)\.jpg/);
    if (imageMatch) seen.add(imageMatch[1]);
  }
  return seen;
}

export async function syncTikTok(options: {
  mode: TikTokMode;
  force?: boolean;
  dryRun?: boolean;
}): Promise<TikTokSyncResult> {
  const state = await readState();
  const isDryRun = Boolean(options.dryRun);

  if (options.mode === "auto" && !options.force && !isDryRun && state.lastAttempt) {
    const elapsed = Date.now() - Date.parse(state.lastAttempt);
    if (Number.isFinite(elapsed) && elapsed < DAY_MS) {
      return { ok: true, skipped: true, reason: "checked within the last 24 hours" };
    }
  }

  let release: (() => Promise<void>) | null = null;
  try {
    release = await acquireLock();
    const content = await readContent();
    const startedAt = new Date().toISOString();

    if (!isDryRun) {
      await writeState({ ...state, lastAttempt: startedAt, lastError: null });
    }

    const fetched = await fetchTikTokPosts();
    const known = existingIds(content, state);
    const unseen = fetched.filter((post) => !known.has(post.id));
    const selected = unseen.slice(0, maxPosts());

    if (isDryRun) {
      return {
        ok: true,
        dryRun: true,
        imported: 0,
        posts: selected.map((post) => ({
          shortcode: post.id,
          title: titleFor(post),
          date: post.displayDate,
        })),
      };
    }

    if (!selected.length) {
      await writeState({
        ...state,
        lastAttempt: startedAt,
        lastSuccess: startedAt,
        lastError: null,
        seen: Array.from(new Set([...known, ...fetched.map((post) => post.id)])),
      });
      return { ok: true, imported: 0, posts: [] };
    }

    const newGallery: GalleryItem[] = [];
    const importedIds: string[] = [];
    const errors: string[] = [];

    for (const post of selected) {
      try {
        const assets = await saveAssets(post);
        newGallery.push(galleryItemFor(post, assets));
        importedIds.push(post.id);
      } catch (error) {
        errors.push(`${post.id}: ${error instanceof Error ? error.message : "unknown error"}`);
      }
    }

    if (newGallery.length) {
      // Keep the editor's order for existing photos and put new social posts
      // at the front, newest first.
      content.gallery = [...newGallery, ...content.gallery];
      await writeContent(content);
    }

    const finishedAt = new Date().toISOString();
    await writeState({
      ...state,
      lastAttempt: startedAt,
      lastSuccess: newGallery.length ? finishedAt : state.lastSuccess,
      lastError: errors.length ? errors.join("; ") : null,
      seen: Array.from(
        new Set([
          ...state.seen,
          ...importedIds,
          ...fetched
            .filter((post) => known.has(post.id))
            .map((post) => post.id),
        ]),
      ),
    });

    return {
      ok: newGallery.length > 0 || errors.length === 0,
      imported: newGallery.length,
      posts: newGallery.map((item, index) => ({
        shortcode: importedIds[index],
        title: item.title,
        date: item.date ?? "",
      })),
      errors,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "TikTok sync failed";
    if (message.includes("already running")) {
      return { ok: true, skipped: true, reason: "sync already running" };
    }
    try {
      await writeState({
        ...state,
        lastAttempt: new Date().toISOString(),
        lastError: message,
      });
    } catch {
      // The original error is more useful than a failed state write.
    }
    return { ok: false, error: message };
  } finally {
    if (release) await release();
  }
}
