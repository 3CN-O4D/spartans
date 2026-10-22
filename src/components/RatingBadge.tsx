export function ratingTone(value: number) {
  if (value >= 80) return "bg-spartan-gold text-black";
  if (value >= 72) return "bg-emerald-400 text-black";
  if (value >= 64) return "bg-sky-400 text-black";
  return "bg-white/15 text-white";
}

export function RatingBadge({
  value,
  compact = false,
  className = "",
}: {
  value: number;
  compact?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-sm font-display font-bold leading-none ${ratingTone(
        value,
      )} ${
        compact ? "h-5 min-w-5 px-1 text-[10px]" : "px-2 py-1 text-xs"
      } ${className}`}
      aria-label={`Overall rating ${value} out of 99`}
      title={`Overall ${value}`}
    >
      {compact ? value : `OVR ${value}`}
    </span>
  );
}
