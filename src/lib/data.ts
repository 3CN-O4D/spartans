export type Player = {
  id: string;
  name: string;
  position: "Goalkeeper" | "Defender" | "Midfielder" | "Forward";
  squadNo: number;
  jerseyNo: number;
  age: number;
  hometown: string;
  bio: string;
  initials: string;
  photo?: string;
  photoBack?: string;
  stats?: Record<string, number>;
};

export type Fixture = {
  id: string;
  competition: string;
  opponent: string;
  opponentLogo?: string;
  opponentInfo?: string;
  date: string;
  time: string;
  venue: "Home" | "Away";
  ground: string;
  status: "upcoming" | "result";
  scoreFor?: number;
  scoreAgainst?: number;
};

export type Article = {
  slug: string;
  title: string;
  category: string;
  date: string;
  readMins: number;
  excerpt: string;
  body: string[];
  author: string;
  coverImage?: string;
};

export type GalleryItem = {
  id: string;
  title: string;
  image?: string;
  video?: string;
  tint: string;
  caption?: string;
  date?: string;
  credit?: string;
  link?: string;
};

export type TableRow = {
  pos: number;
  team: string;
  logo?: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gd: number;
  points: number;
};

export type Club = {
  name: string;
  nickname: string;
  founded: number;
  town: string;
  county: string;
  country: string;
  ground: string;
  phone: string;
  phones?: string[];
  email: string;
  motto: string;
  slogan?: string;
  ageGroup: string;
  logo?: string;
  facebook?: string;
  instagram?: string;
  /** Admin-only account link; never rendered on public pages. */
  tiktok?: string;
};

export type InfoRow = { label: string; value: string };

export type Info = {
  training: InfoRow[];
  fees: InfoRow[];
  tournament: { title: string; dates: string; cost: string; note: string };
};

export type Settings = {
  defaultFormation: string;
  enabledFormations: string[];
};

export type Lineup = {
  formation: string;
  slots: (string | null)[];
};

export type Content = {
  club: Club;
  players: Player[];
  fixtures: Fixture[];
  leagueTable: TableRow[];
  articles: Article[];
  gallery: GalleryItem[];
  settings: Settings;
  info: Info;
  lineup?: Lineup;
};

export const club: Club = {
  name: "Spartans Soccer Academy",
  nickname: "The Shield",
  founded: 2023,
  town: "Eldoret",
  county: "Uasin Gishu",
  country: "Kenya",
  ground: "Eldoret Premier School, Eldoret",
  phone: "0720874395",
  phones: ["0720874395", "0722469659", "0723802791"],
  email: "spartanssocceracademy@gmail.com",
  motto: "One Team, One Dream, One Family",
  slogan: "Building Skills. Building Character. Building Champions.",
  ageGroup: "Under 9 – Under 17",
  logo: "/brand/spartans-crest.png",
  facebook: "Spartans Soccer Academy",
  instagram: "@spartanssocceracademy",
  tiktok: "@spartanssocceraca",
};

export const info: Info = {
  training: [
    { label: "Saturday", value: "10:00 am – 12:00 pm" },
    { label: "Sunday", value: "2:00 pm – 4:00 pm" },
    { label: "Holidays (Mon–Fri)", value: "10:00 am – 1:00 pm" },
  ],
  fees: [
    { label: "Daily training", value: "Ksh 200" },
    { label: "Daily transport", value: "Ksh 200" },
    { label: "Monthly fee", value: "Ksh 4,000 (or Ksh 3,000 upfront)" },
    { label: "Registration fee", value: "Ksh 1,000" },
    { label: "Home & away kit (black/red)", value: "Ksh 4,600" },
  ],
  tournament: {
    title: "5-Day Tournament — Arusha, Tanzania",
    dates: "7th – 13th December",
    cost: "Ksh 42,500",
    note: "Plus Ksh 12,000 for parent's transport",
  },
};

export const players: Player[] = [
  { id: "brian-onyango", name: "Brian Onyango", position: "Goalkeeper", squadNo: 1, jerseyNo: 1, age: 16, hometown: "Langas, Eldoret", initials: "BO", bio: "Commanding shot-stopper and vice captain, known for organising the back line well beyond his years." },
  { id: "faith-chebet", name: "Faith Chebet", position: "Goalkeeper", squadNo: 2, jerseyNo: 13, age: 14, hometown: "Kapsabet", initials: "FC", bio: "Agile keeper who leads the Under-15 side's press-free build-up play from the back." },
  { id: "mark-kiptoo", name: "Mark Kiptoo", position: "Goalkeeper", squadNo: 3, jerseyNo: 30, age: 15, hometown: "Kapsabet", initials: "MK", bio: "Tall, brave keeper who thrives in one-on-one situations." },
  { id: "kevin-kimutai", name: "Kevin Kimutai", position: "Defender", squadNo: 4, jerseyNo: 2, age: 15, hometown: "Kimumu, Eldoret", initials: "KK", bio: "Right back with relentless energy and an eye for the overlap." },
  { id: "mercy-jepkosgei", name: "Mercy Jepkosgei", position: "Defender", squadNo: 5, jerseyNo: 5, age: 16, hometown: "Kapsoya", initials: "MJ", bio: "Composed centre back and the club captain for the Under-17 girls." },
  { id: "sospeter-otieno", name: "Sospeter Otieno", position: "Defender", squadNo: 6, jerseyNo: 4, age: 15, hometown: "Elgon View", initials: "SO", bio: "Reads the game early and steps out of defence to start attacks." },
  { id: "joseph-malel", name: "Joseph Malel", position: "Defender", squadNo: 7, jerseyNo: 3, age: 15, hometown: "Ngeria", initials: "JM", bio: "Aggressive left back who never stops running the flank." },
  { id: "sarah-nekesa", name: "Sarah Nekesa", position: "Defender", squadNo: 8, jerseyNo: 15, age: 14, hometown: "Langas, Eldoret", initials: "SN", bio: "Quick, tenacious full back and a natural leader on the pitch." },
  { id: "elvis-wanyonyi", name: "Elvis Wanyonyi", position: "Defender", squadNo: 9, jerseyNo: 22, age: 16, hometown: "Kimumu, Eldoret", initials: "EW", bio: "Aerially dominant centre back with a powerful recovery pace." },
  { id: "amina-hassan", name: "Amina Hassan", position: "Midfielder", squadNo: 10, jerseyNo: 8, age: 14, hometown: "Langas, Eldoret", initials: "AH", bio: "Tireless box-to-box midfielder who sets the tempo in the centre of the park." },
  { id: "dennis-mwangi", name: "Dennis Mwangi", position: "Midfielder", squadNo: 11, jerseyNo: 10, age: 16, hometown: "Ngeria", initials: "DM", bio: "Creative playmaker and set-piece specialist the crowd loves to watch." },
  { id: "gladys-wanjiru", name: "Gladys Wanjiru", position: "Midfielder", squadNo: 12, jerseyNo: 6, age: 15, hometown: "Kapsabet", initials: "GW", bio: "Deep-lying metronome with a knack for the forward pass." },
  { id: "tony-kipruto", name: "Tony Kipruto", position: "Midfielder", squadNo: 13, jerseyNo: 16, age: 15, hometown: "Kapsoya", initials: "TK", bio: "Silky winger-turned-midfielder with close control in tight spaces." },
  { id: "brenda-nasimiyu", name: "Brenda Nasimiyu", position: "Midfielder", squadNo: 14, jerseyNo: 18, age: 14, hometown: "Elgon View", initials: "BN", bio: "Creative number ten who links midfield and attack beautifully." },
  { id: "felix-ouma", name: "Felix Ouma", position: "Midfielder", squadNo: 15, jerseyNo: 20, age: 16, hometown: "Ngeria", initials: "FO", bio: "Energetic engine room player with a fierce long-range strike." },
  { id: "collins-kiprop", name: "Collins Kiprop", position: "Forward", squadNo: 16, jerseyNo: 9, age: 16, hometown: "Kimumu, Eldoret", initials: "CK", bio: "Leading scorer for two seasons running and the club's top prospect." },
  { id: "linet-achieng", name: "Linet Achieng", position: "Forward", squadNo: 17, jerseyNo: 11, age: 14, hometown: "Elgon View", initials: "LA", bio: "Fearless winger who loves to run at defenders and cut inside." },
  { id: "peter-barasa", name: "Peter Barasa", position: "Forward", squadNo: 18, jerseyNo: 7, age: 15, hometown: "Kapsoya", initials: "PB", bio: "Pacey forward with a calm finish and endless work rate off the ball." },
  { id: "nessa-juma", name: "Nessa Juma", position: "Forward", squadNo: 19, jerseyNo: 14, age: 13, hometown: "Ngeria", initials: "NJ", bio: "Youngest in the first squad, already tipped for the county select team." },
  { id: "sharon-chelimo", name: "Sharon Chelimo", position: "Forward", squadNo: 20, jerseyNo: 19, age: 15, hometown: "Kapsabet", initials: "SC", bio: "Predatory finisher who arrives in the box at exactly the right time." },
];

export const fixtures: Fixture[] = [
  { id: "f1", competition: "Uasin Gishu Youth League", opponent: "Rift Rangers Academy", opponentInfo: "Strong academy side from the Rift Valley circuit.", date: "2026-10-24", time: "14:00", venue: "Home", ground: "Eldoret Premier School, Eldoret", status: "upcoming" },
  { id: "f2", competition: "County Youth Cup", opponent: "Cheptiret Stars", opponentInfo: "Cup specialists with a lively away support.", date: "2026-10-31", time: "11:00", venue: "Away", ground: "Cheptiret Grounds", status: "upcoming" },
  { id: "f3", competition: "Uasin Gishu Youth League", opponent: "Kapsoya United Kids", opponentInfo: "Current league leaders.", date: "2026-11-07", time: "15:30", venue: "Home", ground: "Eldoret Premier School, Eldoret", status: "upcoming" },
  { id: "f4", competition: "Friendly", opponent: "Elgon View Cubs", opponentInfo: "Neighbourly friendly fixture.", date: "2026-10-12", time: "13:00", venue: "Home", ground: "Eldoret Premier School, Eldoret", status: "result", scoreFor: 4, scoreAgainst: 1 },
  { id: "f5", competition: "Uasin Gishu Youth League", opponent: "Kimumu Warriors", date: "2026-10-05", time: "14:00", venue: "Away", ground: "Kimumu Primary", status: "result", scoreFor: 2, scoreAgainst: 2 },
  { id: "f6", competition: "County Youth Cup", opponent: "Ngeria Stars", date: "2026-09-28", time: "10:30", venue: "Home", ground: "Eldoret Premier School, Eldoret", status: "result", scoreFor: 3, scoreAgainst: 0 },
];

export const leagueTable: TableRow[] = [
  { pos: 1, team: "Kapsoya United Kids", played: 9, won: 8, drawn: 0, lost: 1, gd: 19, points: 24 },
  { pos: 2, team: "Spartans Soccer Academy", played: 9, won: 7, drawn: 1, lost: 1, gd: 16, points: 22 },
  { pos: 3, team: "Rift Rangers Academy", played: 9, won: 6, drawn: 1, lost: 2, gd: 11, points: 19 },
  { pos: 4, team: "Cheptiret Stars", played: 9, won: 4, drawn: 3, lost: 2, gd: 5, points: 15 },
  { pos: 5, team: "Kimumu Warriors", played: 9, won: 3, drawn: 3, lost: 3, gd: 1, points: 12 },
  { pos: 6, team: "Ngeria Stars", played: 9, won: 2, drawn: 2, lost: 5, gd: -7, points: 8 },
  { pos: 7, team: "Elgon View Cubs", played: 9, won: 1, drawn: 2, lost: 6, gd: -14, points: 5 },
  { pos: 8, team: "Kapsabet Juniors", played: 9, won: 0, drawn: 2, lost: 7, gd: -31, points: 2 },
];

export const articles: Article[] = [
  {
    slug: "spartans-storm-into-county-cup-semis",
    title: "Spartans storm into County Youth Cup semi-finals",
    category: "Match Report",
    date: "2026-10-13",
    readMins: 3,
    author: "Club Media",
    excerpt: "A dominant second-half display saw the Under-15s book their place in the last four with a comfortable home win.",
    body: [
      "Spartans Soccer Academy produced their most complete performance of the season on Saturday, easing past Elgon View Cubs to reach the semi-finals of the County Youth Cup.",
      "After a cagey opening, the deadlock was broken from a well-worked corner routine, and from there the young Spartans never looked back.",
      'Coach Otieno praised the side\'s patience: "We asked the boys and girls to trust the process, keep the ball and wait for our moments. They did exactly that."',
      "The result sets up a mouth-watering last-four tie against Rift Rangers Academy, a fixture that has become a regular on the youth calendar in Uasin Gishu.",
    ],
  },
  {
    slug: "academy-opens-new-eldoret-training-hub",
    title: "Academy opens new training hub in Eldoret",
    category: "Club News",
    date: "2026-10-10",
    readMins: 4,
    author: "Club Media",
    excerpt: "A community-funded pitch and classroom space will help Spartans give more local children a safe place to play and learn.",
    body: [
      "Spartans Soccer Academy has officially opened a brand-new training hub on the edge of Eldoret, complete with a levelled playing surface and a small classroom for after-school study.",
      "The project was made possible by donations from parents, local businesses and a fundraising tournament held over the school holidays.",
      'Club chairperson Mary Wanjala said the hub was about more than football: "Every child should have somewhere safe to run, learn and belong. Today we made that a reality."',
      "The hub will also host free weekend sessions for children aged six and up, with no experience required.",
    ],
  },
  {
    slug: "five-spartans-called-up-to-county-select",
    title: "Five Spartans called up to county select squad",
    category: "Academy",
    date: "2026-10-06",
    readMins: 2,
    author: "Club Media",
    excerpt: "A club-record five players have been selected for the Uasin Gishu county youth representative side.",
    body: [
      "Five Spartans players have been named in the Uasin Gishu county select squad for the upcoming regional tournament.",
      "The call-ups reflect a strong season for the academy and the growing reputation of its player pathway.",
      'It is a proud day for the players and their families, said the head of youth development. "Our job is to give them the platform; they do the rest."',
    ],
  },
  {
    slug: "community-days-return-this-holiday",
    title: "Community football days return this holiday",
    category: "Community",
    date: "2026-10-01",
    readMins: 2,
    author: "Club Media",
    excerpt: "Free open sessions for local children return across three estates this school holiday.",
    body: [
      "Spartans Soccer Academy will host free community football days across Langas, Kapsoya and Elgon View this school holiday.",
      "The sessions are open to all children, with equipment provided and no cost to families.",
      "Volunteers and coaches who want to help can get in touch through the club contact page.",
    ],
  },
];

export const gallery: GalleryItem[] = [
  { id: "g1", title: "Matchday at Eldoret Premier School", tint: "from-spartan-red to-spartan-ink" },
  { id: "g2", title: "Under-13 training session", tint: "from-spartan-gold to-spartan-red" },
  { id: "g3", title: "County Cup celebrations", tint: "from-sky-700 to-spartan-ink" },
  { id: "g4", title: "Community open day", tint: "from-emerald-600 to-spartan-ink" },
  { id: "g5", title: "New training hub opening", tint: "from-violet-700 to-spartan-ink" },
  { id: "g6", title: "Girls' team development camp", tint: "from-rose-500 to-spartan-darkred" },
];

export const defaultContent: Content = {
  club,
  players,
  fixtures,
  leagueTable,
  articles,
  gallery,
  info,
  settings: {
    defaultFormation: "4-3-3",
    enabledFormations: [
      "4-3-3",
      "4-4-2",
      "3-5-2",
      "4-2-3-1",
      "4-1-4-1",
      "4-1-2-1-2",
      "4-5-1",
      "3-4-3",
      "3-4-2-1",
      "5-3-2",
      "5-4-1",
      "4-2-4",
    ],
  },
};

export function formatDate(iso: string) {
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function getArticleFrom(list: Article[], slug: string) {
  return list.find((a) => a.slug === slug);
}
