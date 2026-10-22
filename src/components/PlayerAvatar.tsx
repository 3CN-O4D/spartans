import type { Player } from "@/lib/data";

const accent: Record<Player["position"], { from: string; to: string; ring: string }> = {
  Goalkeeper: { from: "#f2c14e", to: "#b8860b", ring: "#f2c14e" },
  Defender: { from: "#2f6fed", to: "#173a86", ring: "#6fa8ff" },
  Midfielder: { from: "#18a558", to: "#0b6b37", ring: "#5ce29a" },
  Forward: { from: "#e01839", to: "#8a0b1f", ring: "#ff6b81" },
};

export function PlayerAvatar({
  player,
  className = "h-14 w-14",
}: {
  player: Player;
  className?: string;
}) {
  const a = accent[player.position];
  return (
    <div className={`relative overflow-hidden rounded-full ${className}`}>
      <div
        className="absolute inset-0"
        style={{ backgroundImage: `linear-gradient(150deg, ${a.from}, ${a.to})` }}
      />
      {player.photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={player.photo} alt="" className="absolute inset-0 h-full w-full object-cover object-top" />
      ) : (
        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
          <path
            d="M50 12 L80 22 L71 37 L64 33 L64 90 L36 90 L36 33 L29 37 L20 22 Z"
            fill="rgba(255,255,255,0.22)"
            stroke="rgba(255,255,255,0.55)"
            strokeWidth="2.5"
          />
          <path d="M42 13 L50 24 L58 13" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="3" />
          <text
            x="50"
            y="66"
            textAnchor="middle"
            fontFamily="Arial Black, system-ui, sans-serif"
            fontSize="30"
            fontWeight="900"
            fill="#ffffff"
          >
            {player.jerseyNo}
          </text>
        </svg>
      )}
    </div>
  );
}

export function ringColor(player: Player) {
  return accent[player.position].ring;
}
