import type { Player, Lineup } from "@/lib/data";

export type Pos = Player["position"];

export type SlotDef = {
  key: string;
  label: string;
  pos: Pos;
  x: number;
  y: number;
};

export type Formation = {
  name: string;
  style: string;
  slots: SlotDef[];
};

export type FormationKey =
  | "4-3-3"
  | "4-4-2"
  | "3-5-2"
  | "4-2-3-1"
  | "4-1-4-1"
  | "4-1-2-1-2"
  | "4-5-1"
  | "3-4-3"
  | "3-4-2-1"
  | "5-3-2"
  | "5-4-1"
  | "4-2-4";

export const formations: Record<FormationKey, Formation> = {
  "4-3-3": {
    name: "4-3-3",
    style: "High press · wing play",
    slots: [
      { key: "gk", label: "GK", pos: "Goalkeeper", x: 50, y: 92 },
      { key: "lb", label: "LB", pos: "Defender", x: 14, y: 74 },
      { key: "lcb", label: "CB", pos: "Defender", x: 37, y: 79 },
      { key: "rcb", label: "CB", pos: "Defender", x: 63, y: 79 },
      { key: "rb", label: "RB", pos: "Defender", x: 86, y: 74 },
      { key: "lcm", label: "CM", pos: "Midfielder", x: 25, y: 53 },
      { key: "cm", label: "CM", pos: "Midfielder", x: 50, y: 58 },
      { key: "rcm", label: "CM", pos: "Midfielder", x: 75, y: 53 },
      { key: "lw", label: "LW", pos: "Forward", x: 15, y: 28 },
      { key: "st", label: "ST", pos: "Forward", x: 50, y: 22 },
      { key: "rw", label: "RW", pos: "Forward", x: 85, y: 28 },
    ],
  },
  "4-4-2": {
    name: "4-4-2",
    style: "Balanced · classic width",
    slots: [
      { key: "gk", label: "GK", pos: "Goalkeeper", x: 50, y: 92 },
      { key: "lb", label: "LB", pos: "Defender", x: 12, y: 76 },
      { key: "lcb", label: "CB", pos: "Defender", x: 37, y: 80 },
      { key: "rcb", label: "CB", pos: "Defender", x: 63, y: 80 },
      { key: "rb", label: "RB", pos: "Defender", x: 88, y: 76 },
      { key: "lm", label: "LM", pos: "Midfielder", x: 12, y: 53 },
      { key: "lcm", label: "CM", pos: "Midfielder", x: 38, y: 56 },
      { key: "rcm", label: "CM", pos: "Midfielder", x: 62, y: 56 },
      { key: "rm", label: "RM", pos: "Midfielder", x: 88, y: 53 },
      { key: "lst", label: "ST", pos: "Forward", x: 38, y: 24 },
      { key: "rst", label: "ST", pos: "Forward", x: 62, y: 24 },
    ],
  },
  "3-5-2": {
    name: "3-5-2",
    style: "Wing-backs · overload middle",
    slots: [
      { key: "gk", label: "GK", pos: "Goalkeeper", x: 50, y: 92 },
      { key: "lcb", label: "CB", pos: "Defender", x: 28, y: 79 },
      { key: "cb", label: "CB", pos: "Defender", x: 50, y: 81 },
      { key: "rcb", label: "CB", pos: "Defender", x: 72, y: 79 },
      { key: "lwb", label: "LWB", pos: "Midfielder", x: 10, y: 58 },
      { key: "lcm", label: "CM", pos: "Midfielder", x: 32, y: 58 },
      { key: "dm", label: "DM", pos: "Midfielder", x: 50, y: 63 },
      { key: "rcm", label: "CM", pos: "Midfielder", x: 68, y: 58 },
      { key: "rwb", label: "RWB", pos: "Midfielder", x: 90, y: 58 },
      { key: "lst", label: "ST", pos: "Forward", x: 38, y: 25 },
      { key: "rst", label: "ST", pos: "Forward", x: 62, y: 25 },
    ],
  },
  "4-2-3-1": {
    name: "4-2-3-1",
    style: "Control · attacking mid",
    slots: [
      { key: "gk", label: "GK", pos: "Goalkeeper", x: 50, y: 92 },
      { key: "lb", label: "LB", pos: "Defender", x: 14, y: 77 },
      { key: "lcb", label: "CB", pos: "Defender", x: 37, y: 81 },
      { key: "rcb", label: "CB", pos: "Defender", x: 63, y: 81 },
      { key: "rb", label: "RB", pos: "Defender", x: 86, y: 77 },
      { key: "ldm", label: "DM", pos: "Midfielder", x: 38, y: 63 },
      { key: "rdm", label: "DM", pos: "Midfielder", x: 62, y: 63 },
      { key: "lam", label: "LAM", pos: "Midfielder", x: 18, y: 43 },
      { key: "cam", label: "CAM", pos: "Midfielder", x: 50, y: 45 },
      { key: "ram", label: "RAM", pos: "Midfielder", x: 82, y: 43 },
      { key: "st", label: "ST", pos: "Forward", x: 50, y: 22 },
    ],
  },
  "4-1-4-1": {
    name: "4-1-4-1",
    style: "Solid · single pivot",
    slots: [
      { key: "gk", label: "GK", pos: "Goalkeeper", x: 50, y: 92 },
      { key: "lb", label: "LB", pos: "Defender", x: 14, y: 77 },
      { key: "lcb", label: "CB", pos: "Defender", x: 37, y: 81 },
      { key: "rcb", label: "CB", pos: "Defender", x: 63, y: 81 },
      { key: "rb", label: "RB", pos: "Defender", x: 86, y: 77 },
      { key: "dm", label: "DM", pos: "Midfielder", x: 50, y: 64 },
      { key: "lm", label: "LM", pos: "Midfielder", x: 14, y: 48 },
      { key: "lcm", label: "CM", pos: "Midfielder", x: 38, y: 50 },
      { key: "rcm", label: "CM", pos: "Midfielder", x: 62, y: 50 },
      { key: "rm", label: "RM", pos: "Midfielder", x: 86, y: 48 },
      { key: "st", label: "ST", pos: "Forward", x: 50, y: 22 },
    ],
  },
  "4-1-2-1-2": {
    name: "4-1-2-1-2",
    style: "Narrow diamond",
    slots: [
      { key: "gk", label: "GK", pos: "Goalkeeper", x: 50, y: 92 },
      { key: "lb", label: "LB", pos: "Defender", x: 14, y: 77 },
      { key: "lcb", label: "CB", pos: "Defender", x: 37, y: 81 },
      { key: "rcb", label: "CB", pos: "Defender", x: 63, y: 81 },
      { key: "rb", label: "RB", pos: "Defender", x: 86, y: 77 },
      { key: "dm", label: "DM", pos: "Midfielder", x: 50, y: 66 },
      { key: "lcm", label: "CM", pos: "Midfielder", x: 27, y: 53 },
      { key: "rcm", label: "CM", pos: "Midfielder", x: 73, y: 53 },
      { key: "cam", label: "AM", pos: "Midfielder", x: 50, y: 40 },
      { key: "lst", label: "ST", pos: "Forward", x: 38, y: 22 },
      { key: "rst", label: "ST", pos: "Forward", x: 62, y: 22 },
    ],
  },
  "4-5-1": {
    name: "4-5-1",
    style: "Crowded midfield",
    slots: [
      { key: "gk", label: "GK", pos: "Goalkeeper", x: 50, y: 92 },
      { key: "lb", label: "LB", pos: "Defender", x: 14, y: 77 },
      { key: "lcb", label: "CB", pos: "Defender", x: 37, y: 81 },
      { key: "rcb", label: "CB", pos: "Defender", x: 63, y: 81 },
      { key: "rb", label: "RB", pos: "Defender", x: 86, y: 77 },
      { key: "lm", label: "LM", pos: "Midfielder", x: 12, y: 54 },
      { key: "lcm", label: "CM", pos: "Midfielder", x: 34, y: 56 },
      { key: "cm", label: "CM", pos: "Midfielder", x: 50, y: 60 },
      { key: "rcm", label: "CM", pos: "Midfielder", x: 66, y: 56 },
      { key: "rm", label: "RM", pos: "Midfielder", x: 88, y: 54 },
      { key: "st", label: "ST", pos: "Forward", x: 50, y: 22 },
    ],
  },
  "3-4-3": {
    name: "3-4-3",
    style: "Attacking width",
    slots: [
      { key: "gk", label: "GK", pos: "Goalkeeper", x: 50, y: 92 },
      { key: "lcb", label: "CB", pos: "Defender", x: 30, y: 80 },
      { key: "cb", label: "CB", pos: "Defender", x: 50, y: 82 },
      { key: "rcb", label: "CB", pos: "Defender", x: 70, y: 80 },
      { key: "lm", label: "LM", pos: "Midfielder", x: 12, y: 58 },
      { key: "lcm", label: "CM", pos: "Midfielder", x: 40, y: 58 },
      { key: "rcm", label: "CM", pos: "Midfielder", x: 60, y: 58 },
      { key: "rm", label: "RM", pos: "Midfielder", x: 88, y: 58 },
      { key: "lw", label: "LW", pos: "Forward", x: 18, y: 28 },
      { key: "st", label: "ST", pos: "Forward", x: 50, y: 22 },
      { key: "rw", label: "RW", pos: "Forward", x: 82, y: 28 },
    ],
  },
  "3-4-2-1": {
    name: "3-4-2-1",
    style: "Modern two-tens",
    slots: [
      { key: "gk", label: "GK", pos: "Goalkeeper", x: 50, y: 92 },
      { key: "lcb", label: "CB", pos: "Defender", x: 30, y: 80 },
      { key: "cb", label: "CB", pos: "Defender", x: 50, y: 82 },
      { key: "rcb", label: "CB", pos: "Defender", x: 70, y: 80 },
      { key: "lm", label: "LM", pos: "Midfielder", x: 12, y: 58 },
      { key: "lcm", label: "CM", pos: "Midfielder", x: 40, y: 58 },
      { key: "rcm", label: "CM", pos: "Midfielder", x: 60, y: 58 },
      { key: "rm", label: "RM", pos: "Midfielder", x: 88, y: 58 },
      { key: "lam", label: "AM", pos: "Midfielder", x: 34, y: 40 },
      { key: "ram", label: "AM", pos: "Midfielder", x: 66, y: 40 },
      { key: "st", label: "ST", pos: "Forward", x: 50, y: 22 },
    ],
  },
  "5-3-2": {
    name: "5-3-2",
    style: "Wing-back block",
    slots: [
      { key: "gk", label: "GK", pos: "Goalkeeper", x: 50, y: 92 },
      { key: "lwb", label: "LWB", pos: "Defender", x: 10, y: 72 },
      { key: "lcb", label: "CB", pos: "Defender", x: 30, y: 81 },
      { key: "cb", label: "CB", pos: "Defender", x: 50, y: 83 },
      { key: "rcb", label: "CB", pos: "Defender", x: 70, y: 81 },
      { key: "rwb", label: "RWB", pos: "Defender", x: 90, y: 72 },
      { key: "lcm", label: "CM", pos: "Midfielder", x: 32, y: 56 },
      { key: "cm", label: "CM", pos: "Midfielder", x: 50, y: 58 },
      { key: "rcm", label: "CM", pos: "Midfielder", x: 68, y: 56 },
      { key: "lst", label: "ST", pos: "Forward", x: 38, y: 24 },
      { key: "rst", label: "ST", pos: "Forward", x: 62, y: 24 },
    ],
  },
  "5-4-1": {
    name: "5-4-1",
    style: "Defensive hold",
    slots: [
      { key: "gk", label: "GK", pos: "Goalkeeper", x: 50, y: 92 },
      { key: "lwb", label: "LWB", pos: "Defender", x: 10, y: 72 },
      { key: "lcb", label: "CB", pos: "Defender", x: 30, y: 81 },
      { key: "cb", label: "CB", pos: "Defender", x: 50, y: 83 },
      { key: "rcb", label: "CB", pos: "Defender", x: 70, y: 81 },
      { key: "rwb", label: "RWB", pos: "Defender", x: 90, y: 72 },
      { key: "lm", label: "LM", pos: "Midfielder", x: 14, y: 54 },
      { key: "lcm", label: "CM", pos: "Midfielder", x: 38, y: 56 },
      { key: "rcm", label: "CM", pos: "Midfielder", x: 62, y: 56 },
      { key: "rm", label: "RM", pos: "Midfielder", x: 86, y: 54 },
      { key: "st", label: "ST", pos: "Forward", x: 50, y: 22 },
    ],
  },
  "4-2-4": {
    name: "4-2-4",
    style: "All-out attack",
    slots: [
      { key: "gk", label: "GK", pos: "Goalkeeper", x: 50, y: 92 },
      { key: "lb", label: "LB", pos: "Defender", x: 14, y: 77 },
      { key: "lcb", label: "CB", pos: "Defender", x: 37, y: 81 },
      { key: "rcb", label: "CB", pos: "Defender", x: 63, y: 81 },
      { key: "rb", label: "RB", pos: "Defender", x: 86, y: 77 },
      { key: "lcm", label: "CM", pos: "Midfielder", x: 38, y: 60 },
      { key: "rcm", label: "CM", pos: "Midfielder", x: 62, y: 60 },
      { key: "lw", label: "LW", pos: "Forward", x: 14, y: 32 },
      { key: "lst", label: "ST", pos: "Forward", x: 38, y: 22 },
      { key: "rst", label: "ST", pos: "Forward", x: 62, y: 22 },
      { key: "rw", label: "RW", pos: "Forward", x: 86, y: 32 },
    ],
  },
};

function bySquadNo(a: Player, b: Player) {
  return a.squadNo - b.squadNo;
}

export function autoSplit(squad: Player[], formation: Formation) {
  const pool = [...squad].sort(bySquadNo);
  const used = new Set<string>();
  const starters: Player[] = [];
  for (const slot of formation.slots) {
    const p =
      pool.find((x) => !used.has(x.id) && x.position === slot.pos) ??
      pool.find((x) => !used.has(x.id));
    if (p) {
      used.add(p.id);
      starters.push(p);
    }
  }
  const bench = pool.filter((p) => !used.has(p.id));
  return { starters, bench };
}

export function placedPlayers(
  formation: Formation,
  players: Player[],
): (Player | undefined)[] {
  const remaining = [...players].sort(bySquadNo);
  return formation.slots.map((slot) => {
    let i = remaining.findIndex((p) => p.position === slot.pos);
    if (i === -1) i = 0;
    return remaining.splice(i, 1)[0];
  });
}

export type Stat = { label: string; value: number };

export function playerStats(p: Player): Stat[] {
  let h = 2166136261;
  for (let i = 0; i < p.id.length; i++) {
    h ^= p.id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const rnd = () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    return ((h >>> 13) % 1000) / 1000;
  };
  const base = 58 + Math.round(rnd() * 10);

  if (p.position === "Goalkeeper") {
    const gk = (label: string, auto: number) => ({
      label,
      value: Math.min(99, Math.max(1, p.stats?.[label] ?? auto)),
    });
    return [
      gk("DIV", base + 14),
      gk("HAN", base + 18),
      gk("KIC", base + 8),
      gk("REF", base + 16),
      gk("SPD", base + 4),
      gk("POS", base + 12),
    ];
  }
  const bias: Record<Pos, Partial<Record<string, number>>> = {
    Goalkeeper: {},
    Defender: { PAC: -6, SHO: -14, PAS: -2, DRI: -8, DEF: 18, PHY: 14 },
    Midfielder: { PAC: 2, SHO: 2, PAS: 16, DRI: 10, DEF: 4, PHY: 4 },
    Forward: { PAC: 16, SHO: 16, PAS: 4, DRI: 14, DEF: -16, PHY: 0 },
  };
  const b = bias[p.position];
  const mk = (label: string) => ({
    label,
    value: Math.min(
      99,
      Math.max(1, p.stats?.[label] ?? Math.min(97, Math.max(45, base + 12 + (b[label] ?? 0) + Math.round(rnd() * 8)))),
    ),
  });
  return [mk("PAC"), mk("SHO"), mk("PAS"), mk("DRI"), mk("DEF"), mk("PHY")];
}

export function overall(p: Player) {
  const s = playerStats(p);
  return Math.round(s.reduce((a, x) => a + x.value, 0) / s.length);
}

export function isValidFormation(key: string): key is FormationKey {
  return key in formations;
}

export function defaultLineup(players: Player[], formationKey: string): Lineup {
  const key = isValidFormation(formationKey) ? formationKey : (Object.keys(formations)[0] as FormationKey);
  const { starters } = autoSplit(players, formations[key]);
  return {
    formation: key,
    slots: formations[key].slots.map((_, i) => starters[i]?.id ?? null),
  };
}

export type ResolvedLineup = {
  formationKey: FormationKey;
  placed: (Player | undefined)[];
  bench: Player[];
};

export function resolveLineup(
  players: Player[],
  lineup: Lineup | undefined,
  defaultFormation: string,
): ResolvedLineup {
  const byId = new Map(players.map((p) => [p.id, p] as const));

  if (lineup && isValidFormation(lineup.formation)) {
    const formation = formations[lineup.formation];
    const placed = formation.slots.map((_, i) => {
      const id = lineup.slots[i];
      return id ? byId.get(id) : undefined;
    });
    const used = new Set(lineup.slots.filter((x): x is string => !!x));
    const bench = [...players]
      .sort((a, b) => a.squadNo - b.squadNo)
      .filter((p) => !used.has(p.id));
    return { formationKey: lineup.formation, placed, bench };
  }

  const key = isValidFormation(defaultFormation)
    ? defaultFormation
    : (Object.keys(formations)[0] as FormationKey);
  const { starters, bench } = autoSplit(players, formations[key]);
  return { formationKey: key, placed: starters, bench };
}
