import type { Player } from "@/lib/data";
import { overall, playerStats } from "@/lib/formations";

export type Strength = {
  overall: number;
  attack: number;
  midfield: number;
  defence: number;
  count: number;
};

/** Overall rating for one player (0–99). */
export function playerOverall(player: Player) {
  return overall(player);
}

function average(values: number[]) {
  if (!values.length) return 0;
  return Math.round(values.reduce((total, value) => total + value, 0) / values.length);
}

/**
 * Team ratings for a group of players (the full squad or the starting XI).
 * Attack = forwards, midfield = midfielders, defence = defenders + keeper.
 */
export function teamStrength(players: Player[]): Strength {
  const rated = players.map((player) => ({
    position: player.position,
    rating: playerOverall(player),
  }));

  const byPosition = (positions: Player["position"][]) =>
    average(rated.filter((row) => positions.includes(row.position)).map((row) => row.rating));

  return {
    overall: average(rated.map((row) => row.rating)),
    attack: byPosition(["Forward"]),
    midfield: byPosition(["Midfielder"]),
    defence: byPosition(["Defender", "Goalkeeper"]),
    count: rated.length,
  };
}

/**
 * Three headline attributes for a player card. Goalkeepers get keeper
 * attributes; outfield players get the attributes that matter most for
 * their position.
 */
export function topStats(player: Player) {
  const labels =
    player.position === "Goalkeeper"
      ? ["DIV", "HAN", "REF"]
      : player.position === "Defender"
        ? ["DEF", "PHY", "PAC"]
        : player.position === "Midfielder"
          ? ["PAS", "DRI", "PAC"]
          : ["SHO", "PAC", "DRI"];

  const stats = playerStats(player);
  return labels
    .map((label) => stats.find((stat) => stat.label === label))
    .filter((stat): stat is { label: string; value: number } => Boolean(stat));
}
