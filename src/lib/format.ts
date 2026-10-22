function parse(iso: string) {
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function fixtureLabel(iso: string) {
  const d = parse(iso);
  if (!d) return iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function shortDate(iso: string) {
  const d = parse(iso);
  if (!d) return iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

type Kickoff = { date: string; time: string };

function kickoffValue({ date, time }: Kickoff) {
  const d = parse(date);
  if (!d) return Number.MAX_SAFE_INTEGER;
  const [h = 0, m = 0] = (time || "00:00").split(":").map(Number);
  return d.getTime() + (h * 60 + m) * 60000;
}

/** Soonest kick-off first. Unscheduled/invalid dates sort last. */
export function byKickoff(a: Kickoff, b: Kickoff) {
  return kickoffValue(a) - kickoffValue(b);
}

/** Most recent kick-off first. */
export function byKickoffDesc(a: Kickoff, b: Kickoff) {
  return kickoffValue(b) - kickoffValue(a);
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** True when a league-table row refers to this club. */
export function isClubTeam(team: string, clubName: string) {
  const candidate = normalize(team);
  if (!candidate) return false;
  if (candidate === normalize(clubName)) return true;
  // Tolerate abbreviated names such as "Spartans FC" vs "Spartans Soccer Academy".
  const firstWord = normalize(clubName.split(/\s+/)[0] ?? "");
  return firstWord.length >= 4 && candidate.includes(firstWord);
}
