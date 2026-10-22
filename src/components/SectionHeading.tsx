import Link from "next/link";

export function SectionHeading({
  eyebrow,
  title,
  href,
  linkLabel,
}: {
  eyebrow: string;
  title: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-4">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h2 className="mt-2 font-display text-2xl uppercase sm:text-3xl">{title}</h2>
      </div>
      {href && linkLabel && (
        <Link
          href={href}
          className="text-xs font-bold uppercase tracking-widest text-spartan-gold hover:text-white"
        >
          {linkLabel} →
        </Link>
      )}
    </div>
  );
}
