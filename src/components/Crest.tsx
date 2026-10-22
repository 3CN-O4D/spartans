export function Crest({
  className = "h-12 w-12",
  logo,
  alt = "",
  priority = false,
}: {
  className?: string;
  logo?: string;
  alt?: string;
  priority?: boolean;
}) {
  if (logo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logo}
        alt={alt}
        width={160}
        height={160}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        className={`${className} object-contain`}
      />
    );
  }
  return (
    <svg viewBox="0 0 120 140" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="crestBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e01839" />
          <stop offset="100%" stopColor="#8a0b1f" />
        </linearGradient>
      </defs>
      <path
        d="M60 4 L112 20 V74 C112 108 88 128 60 136 C32 128 8 108 8 74 V20 Z"
        fill="url(#crestBody)"
        stroke="#f2c14e"
        strokeWidth="5"
      />
      <path
        d="M60 22 L96 33 V74 C96 98 80 112 60 119 C40 112 24 98 24 74 V33 Z"
        fill="none"
        stroke="#ffffff"
        strokeWidth="3"
        opacity="0.85"
      />
      <path
        d="M40 52 L60 82 L80 52 L80 74 C80 92 70 100 60 105 C50 100 40 92 40 74 Z"
        fill="#f2c14e"
      />
      <circle cx="60" cy="44" r="6" fill="#ffffff" />
    </svg>
  );
}

export function CrestWordmark({
  className = "",
  logo,
  name = "Spartans",
  town = "Eldoret",
}: {
  className?: string;
  logo?: string;
  name?: string;
  town?: string;
}) {
  const short = name.split(/\s+/)[0] || name;
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Crest className="h-12 w-12" logo={logo} alt={`${name} crest`} priority />
      <div className="leading-none">
        <div className="font-display text-xl text-white">{short.toUpperCase()}</div>
        <div className="text-[10px] font-bold uppercase tracking-[0.35em] text-spartan-gold">
          {town}
        </div>
      </div>
    </div>
  );
}
