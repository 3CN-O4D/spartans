import Link from "next/link";

export function PageHero({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <section className="border-b border-white/10 bg-gradient-to-br from-spartan-darkred to-spartan-ink">
      <div className="section py-14">
        <div className="eyebrow">{eyebrow}</div>
        <h1 className="mt-2 font-display text-4xl uppercase sm:text-5xl">{title}</h1>
        {subtitle && <p className="mt-3 max-w-2xl text-white/70">{subtitle}</p>}
        <div className="mt-5 text-xs uppercase tracking-widest text-white/50">
          <Link href="/" className="hover:text-white">
            Home
          </Link>{" "}
          / {title}
        </div>
      </div>
    </section>
  );
}
