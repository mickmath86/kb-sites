import Image from "next/image";
import type { Lead, GeneratedCopy } from "@/lib/supabase";
import type { ImageAsset } from "@/lib/images";
import type { VariantTheme } from "@/lib/variant";
import { BookingButton } from "@/components/BookingButton";
import { CheckIcon, Stars, accentClassesFor } from "./shared";

/**
 * Variant B — Light/Editorial.
 *
 * Hero: white background, serif display headline (Georgia stack via Tailwind `font-serif`),
 * left-aligned text column + right-aligned tall portrait photo with a floating
 * rating chip docked over the photo's lower-left corner.
 *
 * Indigo accent. Pill-shaped badges. Magazine vibe.
 */
export function HeroB({
  lead,
  copy,
  heroImage,
  theme,
}: {
  lead: Lead;
  copy: GeneratedCopy;
  heroImage: ImageAsset | null;
  theme: VariantTheme;
}) {
  return (
    <section className="relative overflow-hidden bg-white text-zinc-900">
      {/* Subtle indigo wash in the top-right */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_-10%,rgba(99,102,241,0.10),transparent_55%)]" />
      <div className="relative mx-auto max-w-6xl px-4 pt-16 pb-20 sm:px-6 sm:pt-24 sm:pb-28">
        <div className="grid items-stretch gap-12 lg:grid-cols-[1.1fr_1fr]">
          {/* LEFT — copy */}
          <div className="flex flex-col justify-center">
            <div
              className={`mb-6 inline-flex w-fit items-center gap-2 rounded-full border ${theme.accent.border} ${theme.accent.bgSoft} px-3 py-1 text-xs font-semibold uppercase tracking-wide ${theme.accent.text}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${theme.accent.bg}`} />
              Licensed Electrician · {lead.city ?? "Ventura County"}
            </div>
            <h1 className="font-serif text-[2.75rem] font-semibold leading-[1.05] tracking-tight text-zinc-900 sm:text-5xl lg:text-6xl">
              {copy.hero_headline}
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-zinc-600">
              {copy.hero_subhead}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <BookingButton
                label={copy.hero_cta_label}
                variant="primary"
                leadId={lead.id}
                slug={lead.slug}
                source="hero"
                accentClasses={accentClassesFor(theme)}
              />
              {lead.phone && (
                <a
                  href={`tel:${lead.phone}`}
                  className="inline-flex h-12 items-center justify-center rounded-md border border-zinc-300 bg-white px-6 text-base font-semibold text-zinc-900 transition hover:bg-zinc-50"
                >
                  Or call {lead.phone}
                </a>
              )}
            </div>
            <div className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm text-zinc-600">
              {copy.trust_strip.map((t, i) => (
                <span key={i} className="inline-flex items-center gap-2">
                  <CheckIcon className={`h-4 w-4 ${theme.accent.text}`} />
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* RIGHT — tall portrait photo with floating rating chip */}
          <div className="relative">
            {heroImage ? (
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl bg-zinc-100 shadow-xl shadow-zinc-200">
                <Image
                  src={heroImage.src}
                  alt={heroImage.alt}
                  fill
                  priority
                  sizes="(min-width: 1024px) 45vw, 100vw"
                  className="object-cover"
                />
                {/* Floating rating chip docked bottom-left */}
                {lead.google_rating != null && (
                  <div className="absolute bottom-5 left-5 right-5 rounded-2xl bg-white/95 p-4 shadow-lg backdrop-blur sm:right-auto sm:max-w-[260px]">
                    <div className="flex items-center gap-3">
                      <div className={`text-3xl font-bold tabular-nums ${theme.accent.text}`}>
                        {lead.google_rating.toFixed(1)}
                      </div>
                      <div>
                        <Stars rating={lead.google_rating} accent="text-amber-500" />
                        <div className="text-[11px] text-zinc-500">
                          {lead.review_count ?? 0} Google reviews
                        </div>
                      </div>
                    </div>
                    <blockquote className="mt-3 line-clamp-3 text-xs italic leading-snug text-zinc-700">
                      &ldquo;{copy.testimonial_quote}&rdquo;
                    </blockquote>
                  </div>
                )}
              </div>
            ) : (
              // No photo → render the rating card alone for visual balance
              <div className="flex h-full min-h-[420px] items-center justify-center rounded-3xl border border-zinc-200 bg-zinc-50 p-8">
                {lead.google_rating != null && (
                  <div className="text-center">
                    <div className={`text-6xl font-bold tabular-nums ${theme.accent.text}`}>
                      {lead.google_rating.toFixed(1)}
                    </div>
                    <div className="mt-3 flex justify-center">
                      <Stars rating={lead.google_rating} accent="text-amber-500" />
                    </div>
                    <div className="mt-2 text-xs text-zinc-500">
                      {lead.review_count ?? 0} Google reviews
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
