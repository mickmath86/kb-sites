/**
 * Deterministic image selection per lead.
 *
 * Each lead gets a stable set of images derived from a hash of their slug.
 * Re-renders for the same lead always produce the same combination
 * (good for caching, SSG, and looking intentional). Different leads
 * cycle through different combinations so their pages don't look identical.
 *
 * All images are stored in /public/images/<vertical>/.
 */

type Vertical = "electrician" | "hvac" | "plumber";

// Photographer attribution. Required by Unsplash License terms? No
// (commercial use without attribution is permitted), but we surface
// it in the footer as a good-faith credit + signal of quality.
export type ImageAsset = {
  src: string; // public path under /public
  alt: string;
  photographer: string;
  photographer_url: string;
};

// ─── Electrician set (9 photos) ────────────────────────────────────────────

const ELECTRICIAN_HERO: ImageAsset[] = [
  {
    src: "/images/electrician/hero-lineman-sky.jpg",
    alt: "Licensed electrician working on a power line at height.",
    photographer: "American Public Power Association",
    photographer_url: "https://unsplash.com/@publicpowerorg",
  },
  {
    src: "/images/electrician/action-utility-trucks.jpg",
    alt: "Crew of electricians working on utility infrastructure.",
    photographer: "American Public Power Association",
    photographer_url: "https://unsplash.com/@publicpowerorg",
  },
];

const ELECTRICIAN_SERVICE_TILES: ImageAsset[] = [
  {
    src: "/images/electrician/action-panel-work.jpg",
    alt: "Electrician working on an electrical wall panel.",
    photographer: "Emmanuel Ikwuegbu",
    photographer_url: "https://unsplash.com/@emmages",
  },
  {
    src: "/images/electrician/detail-panel-guts.jpg",
    alt: "Inside view of an electrical distribution panel.",
    photographer: "Mostafa Mahmoudi",
    photographer_url: "https://unsplash.com/@mostafa_mahmoudi24",
  },
  {
    src: "/images/electrician/wiring-outlet-macro.jpg",
    alt: "Close-up of electrical outlet wiring installation.",
    photographer: "Fabian Kleiser",
    photographer_url: "https://unsplash.com/@fabiankleiser",
  },
  {
    src: "/images/electrician/safety-wiring-wall.jpg",
    alt: "Electrical conduit being installed into a wall.",
    photographer: "Fabian Kleiser",
    photographer_url: "https://unsplash.com/@fabiankleiser",
  },
];

const ELECTRICIAN_TRUST: ImageAsset[] = [
  {
    src: "/images/electrician/trust-uniformed-tech.jpg",
    alt: "Licensed electrician on the job site.",
    photographer: "Emmanuel Ikwuegbu",
    photographer_url: "https://unsplash.com/@emmages",
  },
  {
    src: "/images/electrician/trust-team-planning.jpg",
    alt: "Electricians reviewing project plans on site.",
    photographer: "ThisisEngineering",
    photographer_url: "https://unsplash.com/@thisisengineering",
  },
];

const ELECTRICIAN_FINISHED: ImageAsset[] = [
  {
    src: "/images/electrician/finished-home-dusk.jpg",
    alt: "Home glowing warmly at dusk.",
    photographer: "Clay Banks",
    photographer_url: "https://unsplash.com/@claybanks",
  },
];

// ─── HVAC + Plumber stubs (filled in subsequent phases) ────────────────────

const HVAC_HERO: ImageAsset[] = [];
const HVAC_SERVICE_TILES: ImageAsset[] = [];
const HVAC_TRUST: ImageAsset[] = [];
const HVAC_FINISHED: ImageAsset[] = [];

const PLUMBER_HERO: ImageAsset[] = [];
const PLUMBER_SERVICE_TILES: ImageAsset[] = [];
const PLUMBER_TRUST: ImageAsset[] = [];
const PLUMBER_FINISHED: ImageAsset[] = [];

const POOLS: Record<
  Vertical,
  {
    hero: ImageAsset[];
    service_tiles: ImageAsset[];
    trust: ImageAsset[];
    finished: ImageAsset[];
  }
> = {
  electrician: {
    hero: ELECTRICIAN_HERO,
    service_tiles: ELECTRICIAN_SERVICE_TILES,
    trust: ELECTRICIAN_TRUST,
    finished: ELECTRICIAN_FINISHED,
  },
  hvac: {
    hero: HVAC_HERO,
    service_tiles: HVAC_SERVICE_TILES,
    trust: HVAC_TRUST,
    finished: HVAC_FINISHED,
  },
  plumber: {
    hero: PLUMBER_HERO,
    service_tiles: PLUMBER_SERVICE_TILES,
    trust: PLUMBER_TRUST,
    finished: PLUMBER_FINISHED,
  },
};

// Tiny deterministic hash → integer. Stable across builds and runtimes.
function hashSlug(slug: string): number {
  let h = 2166136261;
  for (let i = 0; i < slug.length; i++) {
    h ^= slug.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function pickOne<T>(arr: T[], seed: number, offset = 0): T | null {
  if (arr.length === 0) return null;
  return arr[(seed + offset) % arr.length];
}

function pickMany<T>(arr: T[], seed: number, count: number): T[] {
  if (arr.length === 0) return [];
  // Rotate the array based on seed, then take the first `count`. This keeps
  // each lead's selection stable and ensures every image is used across leads.
  const start = seed % arr.length;
  const out: T[] = [];
  for (let i = 0; i < Math.min(count, arr.length); i++) {
    out.push(arr[(start + i) % arr.length]);
  }
  return out;
}

export type LeadImageSet = {
  hero: ImageAsset | null;
  service_tiles: ImageAsset[]; // up to 3
  trust: ImageAsset | null;
  finished: ImageAsset | null;
  all_credits: ImageAsset[]; // unique photographers used on this page
};

export function getLeadImages(
  slug: string,
  vertical: Vertical
): LeadImageSet {
  const pool = POOLS[vertical] ?? POOLS.electrician;
  const seed = hashSlug(slug);

  const hero = pickOne(pool.hero, seed);
  const service_tiles = pickMany(pool.service_tiles, seed, 3);
  const trust = pickOne(pool.trust, seed, 7);
  const finished = pickOne(pool.finished, seed, 13);

  const used = [hero, ...service_tiles, trust, finished].filter(
    (x): x is ImageAsset => x !== null
  );
  const seenUrls = new Set<string>();
  const all_credits: ImageAsset[] = [];
  for (const a of used) {
    const key = `${a.photographer}|${a.photographer_url}`;
    if (!seenUrls.has(key)) {
      seenUrls.add(key);
      all_credits.push(a);
    }
  }

  return { hero, service_tiles, trust, finished, all_credits };
}
