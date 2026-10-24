import seedJson from "../../data/content.json";
import type { Content } from "@/lib/data";
import { defaultLineup } from "@/lib/formations";
import {
  privateStorageConfigured,
  readText,
  runningOnVercel,
  writeText,
} from "@/lib/storage";

const CONTENT_PATH = "data/content.json";

/**
 * The checked-in content is the deployment seed. It is imported statically so
 * Vercel bundles it with the server function: an empty private Blob store then
 * starts with the real site content (including galleries and news), not the
 * small sample content used by the component defaults.
 */
const seedContent = seedJson as unknown as Content;

function merge(saved: Partial<Content>): Content {
  const players = saved.players ?? seedContent.players;
  const settings = { ...seedContent.settings, ...saved.settings };
  return {
    club: { ...seedContent.club, ...saved.club },
    players,
    fixtures: saved.fixtures ?? seedContent.fixtures,
    leagueTable: saved.leagueTable ?? seedContent.leagueTable,
    articles: saved.articles ?? seedContent.articles,
    gallery: saved.gallery ?? seedContent.gallery,
    settings,
    info: saved.info ?? seedContent.info,
    lineup: saved.lineup ?? defaultLineup(players, settings.defaultFormation),
  };
}

export async function readContent(): Promise<Content> {
  let raw: string | null = null;
  try {
    raw = await readText(CONTENT_PATH);
  } catch (error) {
    console.warn(
      "[store] Could not read content:",
      error instanceof Error ? error.message : error,
    );
    return seedContent;
  }

  if (raw === null) {
    // Seed the checked-in content only when there is somewhere durable to
    // write it. On a misconfigured Vercel deployment, keep serving the
    // bundled seed so the public site still works.
    if (privateStorageConfigured() || !runningOnVercel()) {
      try {
        await writeContent(seedContent);
      } catch (error) {
        console.warn(
          "[store] Could not seed content:",
          error instanceof Error ? error.message : error,
        );
      }
    }
    return seedContent;
  }

  try {
    return merge(JSON.parse(raw) as Partial<Content>);
  } catch {
    // Keep the corrupt source for recovery instead of clobbering it.
    return seedContent;
  }
}

export async function writeContent(content: Content): Promise<void> {
  await writeText(CONTENT_PATH, JSON.stringify(content, null, 2), {
    access: "private",
    contentType: "application/json",
  });
}
