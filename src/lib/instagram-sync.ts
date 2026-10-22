import { createHash } from "node:crypto";
import type { Article, Content, GalleryItem } from "@/lib/data";
import { readContent, writeContent } from "@/lib/store";
import {
  deleteObject,
  publicUrl,
  readText,
  writeBinary,
  writeText,
} from "@/lib/storage";

/**
 * Instagram -> website sync.
 *
 * Data sources, in order:
 *   1. Official Instagram Graph API, when INSTAGRAM_ACCESS_TOKEN is configured.
 *   2. The public profile HTML, using a crawler user agent. No login or key.
 *
 * Copy writing, in order:
 *   1. An OpenAI-compatible chat endpoint, when AI_API_KEY is configured.
 *   2. A local deterministic caption-to-blog writer. No API key required.
 *
 * The worker reads and writes through the storage layer, so it works both on a
 * local disk and on Vercel Blob without changing its behaviour.
 */

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const LOCK_STALE_MS = 15 * 60 * 1000;

const STATE_PATH = "data/instagram-sync.json";
const LOCK_PATH = "data/instagram-sync.lock";

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";
const CRAWLER_UA = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";

const CATEGORIES = ["Match Report", "Club News", "Academy", "Community"] as const;
type Category = (typeof CATEGORIES)[number];

const TINTS = [
  "from-spartan-red to-spartan-ink",
  "from-emerald-700 to-spartan-ink",
  "from-spartan-gold/70 to-spartan-darkred",
  "from-sky-700 to-spartan-ink",
  "from-purple-700 to-spartan-ink",
];

export type SyncMode = "auto" | "manual" | "cron";

export type SyncResult = {
  ok: boolean;
  skipped?: boolean;
  reason?: string;
  imported?: number;
  ai?: boolean;
  dryRun?: boolean;
  posts?: Array<{ shortcode: string; title?: string; date: string }>;
  errors?: string[];
  error?: string;
};

type SyncState = {
  lastAttempt?: string;
  lastSuccess?: string;
  seen: string[];
  lastError?: string | null;
};

type InstagramPost = {
  shortcode: string;
  caption: string;
  imageUrl: string;
  link: string;
  mediaType: string;
  isoDate: string;
  displayDate: string;
  sortTime: number;
};

type Draft = {
  title: string;
  excerpt: string;
  category: Category;
  body: string[];
  galleryCaption: string;
  readMins: number;
};

class AiHttpError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function maxPosts(): number {
  const raw = Number(process.env.INSTAGRAM_MAX_POSTS_PER_RUN ?? "2");
  if (!Number.isFinite(raw)) return 2;
  return Math.min(5, Math.max(1, Math.floor(raw)));
}

function instagramUsername(): string {
  return (process.env.INSTAGRAM_USERNAME?.trim() || "spartanssocceracademy").replace(/^@/, "");
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

function dateFromPk(pk: string): Date {
  try {
    const raw = BigInt(pk);
    const milliseconds = Number((raw >> BigInt(23)) + BigInt(1314220021721));
    const date = new Date(milliseconds);
    if (!Number.isNaN(date.getTime())) return date;
  } catch {
    // Fall through to the current date.
  }
  return new Date();
}

function shortcodeFromPk(pk: string): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
  let value: bigint;
  try {
    value = BigInt(pk);
  } catch {
    return "";
  }
  let out = "";
  while (value > BigInt(0)) {
    out = alphabet[Number(value & BigInt(63))] + out;
    value >>= BigInt(6);
  }
  return out;
}

function shortcodeFromLink(link: string): string {
  const match = link.match(/\/p\/([^/?#]+)/);
  return match?.[1] ?? "";
}

function pickImageUrl(media: Record<string, unknown>): string {
  const versions = isRecord(media.image_versions2) ? media.image_versions2 : null;
  const candidates = versions
    ? asArray(versions.candidates)
        .filter(isRecord)
        .map((candidate) => ({
          url: str(candidate.url),
          width: typeof candidate.width === "number" ? candidate.width : 0,
        }))
        .filter((candidate) => candidate.url)
    : [];

  candidates.sort((a, b) => Math.abs(a.width - 1080) - Math.abs(b.width - 1080));
  return candidates[0]?.url ?? str(media.display_url);
}

function captionText(node: Record<string, unknown>): string {
  const caption = node.caption;
  if (isRecord(caption) && typeof caption.text === "string") return caption.text.trim();
  if (typeof caption === "string") return caption.trim();

  const edge = isRecord(node.edge_media_to_caption) ? node.edge_media_to_caption : null;
  const first = edge ? asArray(edge.edges)[0] : null;
  if (isRecord(first) && isRecord(first.node)) return str(first.node.text).trim();
  return "";
}

function postFromTimelineNode(node: Record<string, unknown>): InstagramPost | null {
  const pkRaw = node.pk;
  const pk =
    typeof pkRaw === "string" || typeof pkRaw === "number" ? String(pkRaw) : "";
  let shortcode = pk ? shortcodeFromPk(pk) : "";
  if (!shortcode) shortcode = shortcodeFromLink(str(node.seo_canonical_url));
  if (!shortcode) return null;

  const carousel = asArray(node.carousel_media).filter(isRecord);
  const firstCarousel = carousel[0] ?? null;
  const media = firstCarousel ?? node;
  const imageUrl = pickImageUrl(media) || pickImageUrl(node);
  if (!imageUrl) return null;

  const date = pk ? dateFromPk(pk) : new Date();
  const link = str(node.seo_canonical_url) || `https://www.instagram.com/p/${shortcode}/`;

  return {
    shortcode,
    caption: captionText(node).slice(0, 5000),
    imageUrl,
    link,
    mediaType: str(node.__typename) || "image",
    isoDate: date.toISOString().slice(0, 10),
    displayDate: displayDate(date),
    sortTime: date.getTime(),
  };
}

function findTimeline(value: unknown): Record<string, unknown> | null {
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findTimeline(item);
      if (found) return found;
    }
    return null;
  }
  if (!isRecord(value)) return null;

  for (const [key, child] of Object.entries(value)) {
    if (key.endsWith("timeline_connection") && isRecord(child)) return child;
  }
  for (const child of Object.values(value)) {
    const found = findTimeline(child);
    if (found) return found;
  }
  return null;
}

function extractPostsFromHtml(html: string): InstagramPost[] {
  const scripts = html.matchAll(/<script[^>]*data-sjs[^>]*>([\s\S]*?)<\/script>/g);
  for (const match of scripts) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(match[1]);
    } catch {
      continue;
    }

    const timeline = findTimeline(parsed);
    if (!timeline) continue;
    const edges = asArray(timeline.edges);
    const posts: InstagramPost[] = [];
    const seen = new Set<string>();

    for (const edge of edges) {
      if (!isRecord(edge) || !isRecord(edge.node)) continue;
      const post = postFromTimelineNode(edge.node);
      if (!post || seen.has(post.shortcode)) continue;
      seen.add(post.shortcode);
      posts.push(post);
    }

    if (posts.length) return posts.sort((a, b) => b.sortTime - a.sortTime);
  }
  return [];
}

async function fetchPublicPosts(): Promise<InstagramPost[]> {
  const username = instagramUsername();
  const response = await fetch(`https://www.instagram.com/${encodeURIComponent(username)}/`, {
    headers: {
      "User-Agent": CRAWLER_UA,
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Cache-Control": "no-cache",
    },
    cache: "no-store",
    redirect: "follow",
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    throw new Error(`Instagram profile returned ${response.status}`);
  }

  const html = await response.text();
  const posts = extractPostsFromHtml(html);
  if (!posts.length) {
    throw new Error(
      "Instagram did not expose any posts in the public profile page. Try again later or configure the Graph API.",
    );
  }
  return posts;
}

async function fetchGraphPosts(): Promise<InstagramPost[]> {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN?.trim();
  if (!token) return [];

  const userId = process.env.INSTAGRAM_USER_ID?.trim() || "me";
  const url = new URL(`https://graph.facebook.com/v21.0/${userId}/media`);
  url.searchParams.set("fields", "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,children{media_url,thumbnail_url}");
  url.searchParams.set("limit", "25");
  url.searchParams.set("access_token", token);

  const response = await fetch(url, {
    cache: "no-store",
    signal: AbortSignal.timeout(25_000),
  });
  if (!response.ok) {
    throw new Error(`Instagram Graph API returned ${response.status}`);
  }

  const data = (await response.json()) as unknown;
  const rows = isRecord(data) ? asArray(data.data) : [];
  const posts: InstagramPost[] = [];
  const seen = new Set<string>();

  for (const row of rows) {
    if (!isRecord(row)) continue;
    const permalink = str(row.permalink);
    const mediaId = str(row.id);
    let shortcode = shortcodeFromLink(permalink) || shortcodeFromPk(mediaId);
    if (!shortcode) continue;

    const mediaType = str(row.media_type);
    const children = isRecord(row.children) ? asArray(row.children.data).filter(isRecord) : [];
    const firstChild = children[0] ?? null;
    const imageUrl =
      mediaType === "VIDEO"
        ? str(row.thumbnail_url)
        : mediaType === "CAROUSEL_ALBUM" && firstChild
          ? str(firstChild.thumbnail_url) || str(firstChild.media_url)
          : str(row.media_url);
    if (!imageUrl) continue;

    const date = new Date(str(row.timestamp));
    if (Number.isNaN(date.getTime())) continue;

    const link = permalink || `https://www.instagram.com/p/${shortcode}/`;
    shortcode = shortcodeFromLink(link) || shortcode;
    if (seen.has(shortcode)) continue;
    seen.add(shortcode);

    posts.push({
      shortcode,
      caption: str(row.caption).trim().slice(0, 5000),
      imageUrl,
      link,
      mediaType: mediaType || "image",
      isoDate: date.toISOString().slice(0, 10),
      displayDate: displayDate(date),
      sortTime: date.getTime(),
    });
  }

  return posts.sort((a, b) => b.sortTime - a.sortTime);
}

async function fetchPosts(): Promise<InstagramPost[]> {
  if (process.env.INSTAGRAM_ACCESS_TOKEN?.trim()) {
    try {
      const graph = await fetchGraphPosts();
      if (graph.length) return graph;
    } catch (error) {
      console.warn(
        "[instagram-sync] Graph API failed, falling back to the public profile:",
        error instanceof Error ? error.message : error,
      );
    }
  }
  return fetchPublicPosts();
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
      .replace(/#[\p{L}\p{N}_]+/gu, "")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

function firstSentence(input: string): string {
  const match = input.match(/^(.{8,90}?[.!?])(?:\s|$)/);
  return (match?.[1] ?? input).slice(0, 90).trim();
}

function cleanTitle(input: string): string {
  return stripEmoji(
    input
      .replace(/[#*_`>]/g, "")
      .replace(/^["'“”‘’\s]+|["'“”‘’\s]+$/g, "")
      .replace(/\s+/g, " ")
      .trim(),
  )
    .slice(0, 90)
    .trim();
}

function genericTitle(category: Category): string {
  switch (category) {
    case "Match Report":
      return "Matchday with Spartans FC";
    case "Academy":
      return "Inside the Spartans training ground";
    case "Community":
      return "Spartans in the community";
    default:
      return "News from Spartans Soccer Academy";
  }
}

function openingFor(category: Category, caption: string): string {
  if (caption.length >= 60) return caption.slice(0, 700);

  const intro =
    category === "Match Report"
      ? "The Spartans squad was back in action in Eldoret, adding another matchday to a season of growth and learning."
      : category === "Academy"
        ? "The Spartans coaching team was back on the grass, working with the next generation of players at the academy's Eldoret training ground."
        : category === "Community"
          ? "Spartans Soccer Academy was out in the community again, sharing the game with families and young people in Eldoret."
          : "There was another moment to celebrate at Spartans Soccer Academy as the club continued to build its football family in Eldoret.";

  return caption ? `${intro} The club's latest update: “${caption}.”` : intro;
}

function categoryFor(caption: string): Category {
  if (/match|fixture|result|goal|cup|win|draw|lose|semi|final|derby/i.test(caption)) {
    return "Match Report";
  }
  if (/training|academy|coach|session|trial|development|drill/i.test(caption)) {
    return "Academy";
  }
  if (/community|school|visit|support|family|holiday|outreach/i.test(caption)) {
    return "Community";
  }
  return "Club News";
}

function readingMinutes(paragraphs: string[]): number {
  const words = paragraphs.join(" ").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

function fallbackDraft(post: InstagramPost): Draft {
  const clean = cleanCaption(post.caption);
  const source = firstSentence(clean);
  const category = categoryFor(post.caption);
  const title =
    source.length >= 18 ? cleanTitle(source) || genericTitle(category) : genericTitle(category);
  const body = [
    openingFor(category, clean),
    "At Spartans Soccer Academy, every session and matchday is a chance for young players to learn, grow and enjoy the game. The club's values — teamwork, discipline and family — are part of everything we do.",
    "Thank you to the coaches, families and supporters who make it all possible. Follow @spartanssocceracademy on Instagram for more moments from the academy.",
  ];
  const excerpt = clean
    ? clean.length > 190
      ? `${clean.slice(0, 187).trimEnd()}…`
      : clean.length >= 60
        ? clean
        : `${clean} — news from Spartans Soccer Academy in Eldoret.`
    : "Another moment from the Spartans journey in Eldoret.";
  const galleryCaption = clean
    ? clean.length < 24
      ? `${clean} — Spartans Soccer Academy in Eldoret.`
      : clean.slice(0, 320)
    : title;

  return {
    title,
    excerpt,
    category,
    body,
    galleryCaption,
    readMins: readingMinutes(body),
  };
}

function aiSystemPrompt() {
  return [
    "You are the club media editor for Spartans Soccer Academy, a youth football academy in Eldoret, Kenya.",
    "Write warm, professional, family-friendly club news in British English.",
    "Use only facts that appear in the Instagram caption. Never invent scores, opponents, player names, ages, dates, quotes, injuries or results.",
    "If the caption is short, write about the moment, the academy's values and player development in general terms.",
    "Do not name or identify children unless the caption does.",
    "Do not use emojis, hashtags or markdown.",
    "Return one JSON object and nothing else.",
  ].join(" ");
}

function aiUserPrompt(post: InstagramPost) {
  return [
    "Instagram caption:",
    '"""',
    post.caption || "(no caption)",
    '"""',
    "",
    `Post date: ${post.displayDate}`,
    `Post link: ${post.link}`,
    "",
    "Return JSON with exactly this shape:",
    '{"title":"...","excerpt":"...","category":"Match Report|Club News|Academy|Community","body":["paragraph 1","paragraph 2","paragraph 3"],"galleryCaption":"..."}',
    "",
    "Requirements: title at most 80 characters; excerpt at most 180 characters; 3 or 4 body paragraphs of 40-90 words each; galleryCaption 1-2 sentences.",
  ].join("\n");
}

async function callAi(post: InstagramPost, withJsonFormat: boolean): Promise<string> {
  const apiKey = process.env.AI_API_KEY?.trim();
  if (!apiKey) throw new Error("No AI key");

  const baseUrl = (process.env.AI_BASE_URL?.trim() || "https://api.openai.com/v1").replace(
    /\/+$/,
    "",
  );
  const model = process.env.AI_MODEL?.trim() || "gpt-4o-mini";
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };
  if (baseUrl.includes("openrouter.ai")) {
    headers["HTTP-Referer"] = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    headers["X-Title"] = "Spartans FC";
  }

  const payload: Record<string, unknown> = {
    model,
    messages: [
      { role: "system", content: aiSystemPrompt() },
      { role: "user", content: aiUserPrompt(post) },
    ],
    temperature: 0.6,
    max_tokens: 900,
  };
  if (withJsonFormat) payload.response_format = { type: "json_object" };

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  });

  if (!response.ok) {
    throw new AiHttpError(`AI endpoint returned ${response.status}`, response.status);
  }

  const data = (await response.json()) as unknown;
  const choices = isRecord(data) ? asArray(data.choices) : [];
  const first = isRecord(choices[0]) ? choices[0] : null;
  const message = first && isRecord(first.message) ? first.message : null;
  const text = message ? str(message.content).trim() : "";
  if (!text) throw new Error("AI returned an empty response");
  return text;
}

function parseAiDraft(text: string, fallback: Draft): Draft | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
  if (!isRecord(parsed)) return null;

  const title = cleanTitle(str(parsed.title));
  const excerpt = str(parsed.excerpt).trim().slice(0, 240);
  const categoryRaw = str(parsed.category);
  const category = CATEGORIES.includes(categoryRaw as Category)
    ? (categoryRaw as Category)
    : fallback.category;
  const body = asArray(parsed.body)
    .map((paragraph) => (typeof paragraph === "string" ? paragraph.trim() : ""))
    .filter(Boolean)
    .slice(0, 5);
  const galleryCaption = str(parsed.galleryCaption).trim().slice(0, 320);

  if (!title || !excerpt || body.length < 2) return null;

  return {
    title,
    excerpt,
    category,
    body,
    galleryCaption: galleryCaption || excerpt,
    readMins: readingMinutes(body),
  };
}

async function generateDraft(post: InstagramPost): Promise<{ draft: Draft; ai: boolean }> {
  const fallback = fallbackDraft(post);
  if (!process.env.AI_API_KEY?.trim()) return { draft: fallback, ai: false };

  let text = "";
  try {
    text = await callAi(post, true);
  } catch (error) {
    const status = error instanceof AiHttpError ? error.status : 0;
    if (status === 400 || status === 422) {
      try {
        text = await callAi(post, false);
      } catch (retryError) {
        console.warn(
          "[instagram-sync] AI writer failed, using local template:",
          retryError instanceof Error ? retryError.message : retryError,
        );
        return { draft: fallback, ai: false };
      }
    } else {
      console.warn(
        "[instagram-sync] AI writer failed, using local template:",
        error instanceof Error ? error.message : error,
      );
      return { draft: fallback, ai: false };
    }
  }

  const draft = parseAiDraft(text, fallback);
  return draft ? { draft, ai: true } : { draft: fallback, ai: false };
}

function safeShortcode(shortcode: string): string {
  const safe = shortcode.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 32);
  return safe || createHash("sha1").update(shortcode).digest("hex").slice(0, 16);
}

function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

function tintFor(shortcode: string): string {
  let hash = 0;
  for (let i = 0; i < shortcode.length; i += 1) {
    hash = (hash * 31 + shortcode.charCodeAt(i)) >>> 0;
  }
  return TINTS[hash % TINTS.length];
}

async function savePostImage(url: string, shortcode: string): Promise<string> {
  const pathname = `gallery/ig-${safeShortcode(shortcode)}.jpg`;
  const existing = await publicUrl(pathname);
  if (existing) return existing;

  const response = await fetch(url, {
    headers: {
      "User-Agent": BROWSER_UA,
      Accept: "image/avif,image/webp,image/jpeg,image/*",
      Referer: "https://www.instagram.com/",
    },
    cache: "no-store",
    redirect: "follow",
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`image download returned ${response.status}`);

  const contentType = response.headers.get("content-type") || "";
  if (contentType && !contentType.startsWith("image/")) {
    throw new Error(`image download returned ${contentType}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  if (!buffer.length) throw new Error("image download was empty");
  if (buffer.length > MAX_IMAGE_BYTES) throw new Error("image is larger than 8 MB");
  // Instagram CDN image candidates are JPEG. Reject anything else rather than
  // writing a mislabelled file into the public gallery.
  if (!(buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff)) {
    throw new Error("image was not a JPEG");
  }

  return writeBinary(pathname, buffer, "image/jpeg");
}

function buildArticle(
  post: InstagramPost,
  draft: Draft,
  imagePath: string,
  existingSlugs: Set<string>,
): Article {
  const base = `${slugify(draft.title) || "instagram-post"}-${post.shortcode.toLowerCase()}`;
  let slug = base;
  let suffix = 2;
  while (existingSlugs.has(slug)) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }

  return {
    slug,
    title: draft.title,
    category: draft.category,
    date: post.isoDate,
    readMins: draft.readMins,
    excerpt: draft.excerpt,
    body: draft.body,
    author: "Spartans Media",
    coverImage: imagePath,
  };
}

function buildGalleryItem(post: InstagramPost, draft: Draft, imagePath: string): GalleryItem {
  return {
    id: `ig-${post.shortcode}`,
    title: draft.title,
    image: imagePath,
    tint: tintFor(post.shortcode),
    caption: draft.galleryCaption,
    date: post.displayDate,
    credit: "Spartans Soccer Academy / Instagram",
    link: post.link,
  };
}

async function readState(): Promise<SyncState> {
  const raw = await readText(STATE_PATH, "private").catch(() => null);
  let parsed: Partial<SyncState> | null = null;
  if (raw) {
    try {
      parsed = JSON.parse(raw) as Partial<SyncState>;
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

async function writeState(state: SyncState): Promise<void> {
  await writeText(STATE_PATH, `${JSON.stringify(state, null, 2)}\n`, {
    access: "private",
    contentType: "application/json",
  });
}

async function acquireLock(): Promise<() => Promise<void>> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const existing = await readText(LOCK_PATH, "private").catch(() => null);
    if (existing) {
      const stamp = existing.trim().split(/\s+/).pop() ?? "";
      const started = Date.parse(stamp);
      if (Number.isFinite(started) && Date.now() - started > LOCK_STALE_MS) {
        await deleteObject(LOCK_PATH);
      } else {
        throw new Error("Instagram sync is already running");
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
      // Another instance won the race. Re-read once; a fresh lock means the
      // other run is active, while a stale one is cleaned up on the next loop.
    }
  }
  throw new Error("Instagram sync is already running");
}

function existingShortcodes(content: Content, state: SyncState): Set<string> {
  const seen = new Set(state.seen);
  const addFromLink = (link: string | undefined) => {
    if (!link) return;
    const shortcode = shortcodeFromLink(link);
    if (shortcode) seen.add(shortcode);
  };
  const addFromImage = (image: string | undefined) => {
    if (!image) return;
    const match = image.match(/\/ig-([A-Za-z0-9_-]+)\./);
    if (match) seen.add(match[1]);
  };

  for (const item of content.gallery) {
    if (item.id.startsWith("ig-")) {
      const shortcode = item.id.slice(3);
      if (/^[A-Za-z0-9_-]{8,}$/.test(shortcode)) seen.add(shortcode);
    }
    addFromLink(item.link);
    addFromImage(item.image);
  }
  for (const article of content.articles) {
    addFromImage(article.coverImage);
  }

  return seen;
}

export async function syncInstagram(options: {
  mode: SyncMode;
  force?: boolean;
  dryRun?: boolean;
}): Promise<SyncResult> {
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

    const fetched = await fetchPosts();
    const known = existingShortcodes(content, state);
    const unseen = fetched.filter((post) => !known.has(post.shortcode));
    const selected = unseen.slice(0, maxPosts());

    if (isDryRun) {
      return {
        ok: true,
        dryRun: true,
        imported: 0,
        posts: selected.map((post) => ({
          shortcode: post.shortcode,
          title: cleanCaption(post.caption).slice(0, 80) || undefined,
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
        seen: Array.from(new Set([...known, ...fetched.map((post) => post.shortcode)])),
      });
      return { ok: true, imported: 0, posts: [] };
    }

    const newArticles: Article[] = [];
    const newGallery: GalleryItem[] = [];
    const importedShortcodes: string[] = [];
    const errors: string[] = [];
    const existingSlugs = new Set(content.articles.map((article) => article.slug));
    let usedAi = false;

    for (const post of selected) {
      try {
        const imagePath = await savePostImage(post.imageUrl, post.shortcode);

        const { draft, ai } = await generateDraft(post);
        usedAi = usedAi || ai;

        const article = buildArticle(post, draft, imagePath, existingSlugs);
        existingSlugs.add(article.slug);
        newArticles.push(article);
        newGallery.push(buildGalleryItem(post, draft, imagePath));
        importedShortcodes.push(post.shortcode);
      } catch (error) {
        errors.push(
          `${post.shortcode}: ${error instanceof Error ? error.message : "unknown error"}`,
        );
      }
    }

    if (newArticles.length) {
      // Insert by post date while preserving the editor's order for older
      // entries. This keeps the landing-page feature chronological.
      for (const article of [...newArticles].sort((a, b) => b.date.localeCompare(a.date))) {
        const index = content.articles.findIndex((existing) => existing.date < article.date);
        if (index === -1) content.articles.push(article);
        else content.articles.splice(index, 0, article);
      }
      content.gallery = [...newGallery, ...content.gallery];
      await writeContent(content);
    }

    const finishedAt = new Date().toISOString();
    await writeState({
      ...state,
      lastAttempt: startedAt,
      lastSuccess: newArticles.length ? finishedAt : state.lastSuccess,
      lastError: errors.length ? errors.join("; ") : null,
      seen: Array.from(
        new Set([
          ...state.seen,
          ...importedShortcodes,
          ...fetched
            .filter((post) => known.has(post.shortcode))
            .map((post) => post.shortcode),
        ]),
      ),
    });

    return {
      ok: newArticles.length > 0 || errors.length === 0,
      imported: newArticles.length,
      ai: usedAi,
      posts: newArticles.map((article, index) => ({
        shortcode: importedShortcodes[index],
        title: article.title,
        date: article.date,
      })),
      errors,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Instagram sync failed";
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
