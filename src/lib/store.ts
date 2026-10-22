import { defaultContent, type Content } from "@/lib/data";
import { defaultLineup } from "@/lib/formations";
import {
  privateStorageConfigured,
  readText,
  runningOnVercel,
  writeText,
} from "@/lib/storage";

const CONTENT_PATH = "data/content.json";

function merge(saved: Partial<Content>): Content {
  const players = saved.players ?? defaultContent.players;
  const settings = { ...defaultContent.settings, ...saved.settings };
  return {
    club: { ...defaultContent.club, ...saved.club },
    players,
    fixtures: saved.fixtures ?? defaultContent.fixtures,
    leagueTable: saved.leagueTable ?? defaultContent.leagueTable,
    articles: saved.articles ?? defaultContent.articles,
    gallery: saved.gallery ?? defaultContent.gallery,
    settings,
    info: saved.info ?? defaultContent.info,
    lineup: saved.lineup ?? defaultLineup(players, settings.defaultFormation),
  };
}

export async function readContent(): Promise<Content> {
  let raw: string | null = null;
  try {
    raw = await readText(CONTENT_PATH, "private");
  } catch (error) {
    console.warn(
      "[store] Could not read content:",
      error instanceof Error ? error.message : error,
    );
    return defaultContent;
  }

  if (raw === null) {
    // Seed defaults only when there is somewhere durable to write them. On a
    // misconfigured Vercel deployment, keep serving the bundled defaults.
    if (privateStorageConfigured() || !runningOnVercel()) {
      try {
        await writeContent(defaultContent);
      } catch (error) {
        console.warn(
          "[store] Could not seed content:",
          error instanceof Error ? error.message : error,
        );
      }
    }
    return defaultContent;
  }

  try {
    return merge(JSON.parse(raw) as Partial<Content>);
  } catch {
    // Keep the corrupt source for recovery instead of clobbering it.
    return defaultContent;
  }
}

export async function writeContent(content: Content): Promise<void> {
  await writeText(CONTENT_PATH, JSON.stringify(content, null, 2), {
    access: "private",
    contentType: "application/json",
  });
}
