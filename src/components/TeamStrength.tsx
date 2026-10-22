import type { Strength } from "@/lib/ratings";

const bars = {
  overall: "bg-spartan-gold",
  attack: "bg-spartan-red",
  midfield: "bg-emerald-400",
  defence: "bg-sky-400",
};

function StrengthBar({
  label,
  value,
  bar,
}: {
  label: string;
  value: number;
  bar: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="font-bold uppercase tracking-widest text-white/50">{label}</span>
        <span className="font-display text-sm text-white">{value || "—"}</span>
      </div>
      <div
        className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/10"
        role="progressbar"
        aria-label={`${label} strength`}
        aria-valuemin={0}
        aria-valuemax={99}
        aria-valuenow={value}
      >
        <div
          className={`h-full rounded-full ${bar} transition-[width] duration-700`}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  );
}

/** Four compact rating tiles for the top of the lineup page. */
export function StrengthStrip({ strength }: { strength: Strength }) {
  const items = [
    { label: "Overall", value: strength.overall, bar: bars.overall },
    { label: "Attack", value: strength.attack, bar: bars.attack },
    { label: "Midfield", value: strength.midfield, bar: bars.midfield },
    { label: "Defence", value: strength.defence, bar: bars.defence },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-sm border border-white/10 bg-spartan-steel p-4"
        >
          <div className="text-[10px] font-bold uppercase tracking-widest text-white/40">
            {item.label}
          </div>
          <div className="mt-1 font-display text-3xl leading-none text-white">
            {item.value || "—"}
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className={`h-full rounded-full ${item.bar}`}
              style={{ width: `${Math.min(100, Math.max(0, item.value))}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Larger strength panel used on the squad page. */
export function TeamStrengthPanel({
  title,
  subtitle,
  strength,
  note,
}: {
  title: string;
  subtitle?: string;
  strength: Strength;
  note?: string;
}) {
  return (
    <div className="card p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="eyebrow">{title}</div>
          {subtitle && <p className="mt-2 text-sm text-white/50">{subtitle}</p>}
        </div>
        <div className="text-right">
          <div className="font-display text-5xl leading-none text-spartan-gold">
            {strength.overall || "—"}
          </div>
          <div className="mt-1 text-[10px] font-bold uppercase tracking-widest text-white/40">
            Overall
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <StrengthBar label="Attack" value={strength.attack} bar={bars.attack} />
        <StrengthBar label="Midfield" value={strength.midfield} bar={bars.midfield} />
        <StrengthBar label="Defence" value={strength.defence} bar={bars.defence} />
      </div>

      {note && <p className="mt-5 border-t border-white/10 pt-4 text-xs leading-relaxed text-white/40">{note}</p>}
    </div>
  );
}
