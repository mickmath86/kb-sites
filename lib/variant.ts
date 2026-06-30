/**
 * Design variant resolver.
 *
 * Each lead renders one of three design variants (A/B/C).
 *
 * Resolution order:
 *   1. `lead.template_variant` (manual override, if set)
 *   2. Deterministic FNV-1a hash of the slug → A/B/C
 *
 * Same slug always resolves to the same variant — so prospects
 * see a stable design across visits, but the 5 pilot leads
 * naturally distribute across all three looks.
 */

export type TemplateVariant = "A" | "B" | "C";

const ALL_VARIANTS: TemplateVariant[] = ["A", "B", "C"];

function hashSlug(slug: string): number {
  // FNV-1a-style hash — same primitive used for image selection in lib/images.ts
  let h = 2166136261;
  for (let i = 0; i < slug.length; i++) {
    h ^= slug.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export function resolveVariant(
  slug: string,
  override?: TemplateVariant | null
): TemplateVariant {
  if (override && ALL_VARIANTS.includes(override)) return override;
  return ALL_VARIANTS[hashSlug(slug) % ALL_VARIANTS.length];
}

/**
 * Visual config for each variant.
 * Shared primitives (Header, Footer, Services tiles, etc.) read this
 * to swap accent color + badge style per variant.
 */
export type VariantTheme = {
  // Tailwind tokens used by primitives. We keep them as plain class names
  // (not arbitrary values) so Tailwind's JIT can see them.
  accent: {
    bg: string;      // solid accent bg (buttons, badges)
    bgHover: string;
    bgSoft: string;  // soft bg (icon chips)
    text: string;    // accent text color on light bg
    textSoft: string; // muted accent (300/400) for dark bg
    border: string;
    ring: string;
  };
  badgeShape: "pill" | "square";
  surfaceTone: "dark" | "light" | "industrial"; // hint for primitives
};

export const VARIANT_THEMES: Record<TemplateVariant, VariantTheme> = {
  A: {
    // Dark/Bold — current canonical look. Amber on near-black.
    accent: {
      bg: "bg-amber-400",
      bgHover: "hover:bg-amber-300",
      bgSoft: "bg-amber-100",
      text: "text-amber-700",
      textSoft: "text-amber-300",
      border: "border-amber-400/30",
      ring: "ring-amber-400",
    },
    badgeShape: "pill",
    surfaceTone: "dark",
  },
  B: {
    // Light/Editorial — white hero, serif display, indigo accent, pill badge with dot.
    accent: {
      bg: "bg-indigo-600",
      bgHover: "hover:bg-indigo-500",
      bgSoft: "bg-indigo-50",
      text: "text-indigo-700",
      textSoft: "text-indigo-400",
      border: "border-indigo-200",
      ring: "ring-indigo-500",
    },
    badgeShape: "pill",
    surfaceTone: "light",
  },
  C: {
    // Industrial/Trade — split hero w/ vertical photo column, orange accent, square badge.
    accent: {
      bg: "bg-orange-600",
      bgHover: "hover:bg-orange-500",
      bgSoft: "bg-orange-100",
      text: "text-orange-700",
      textSoft: "text-orange-400",
      border: "border-orange-300",
      ring: "ring-orange-500",
    },
    badgeShape: "square",
    surfaceTone: "industrial",
  },
};
