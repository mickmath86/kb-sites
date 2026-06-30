import Image from "next/image";
import type { Lead, GeneratedCopy } from "@/lib/supabase";
import type { ImageAsset } from "@/lib/images";
import type { VariantTheme } from "@/lib/variant";
import { BookingButton } from "@/components/BookingButton";
import {
  BoltIcon,
  CheckIcon,
  Stars,
  accentClassesForDark,
} from "./shared";

/**
 * Variant A — Dark/Bold.
 *
 * Hero: full-bleed dark photo + amber gradient bloom, two-column layout
 * with rating card on the right. Headline is sans-serif, large.
 *
 * Section order: Hero → Services → Estimator → WhyUs → FAQ → FinalCTA
 */
export function HeroA({
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
    <section className="relative overflow-hidden bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-white">
      {heroImage && (
        <div className="absolute inset-0">
          <Image
            src={heroImage.src}
            alt={heroImage.alt}
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-55"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/60 to-zinc-950/30" />
        </div>
      )}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(251,191,36,0.18),transparent_45%)]" />
      <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <div
              className={`mb-4 inline-flex items-center gap-2 rounded-full border ${theme.accent.border} bg-amber-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide ${theme.accent.textSoft}`}
            >
              Licensed Electrician · {lead.city ?? "Ventura County"}
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              {copy.hero_headline}
            </h1>
            <p className="mt-6 max-w-xl text-lg text-zinc-300">{copy.hero_subhead}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <BookingButton
                label={copy.hero_cta_label}
                variant="primary"
                leadId={lead.id}
                slug={lead.slug}
                source="hero"
                accentClasses={accentClassesForDark(theme)}
              />
              {lead.phone && (
                <a
                  href={`tel:${lead.phone}`}
                  className="inline-flex h-12 items-center justify-center rounded-md border border-white/20 px-6 text-base font-semibold text-white transition hover:bg-white/10"
                >
                  Or call {lead.phone}
                </a>
              )}
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-zinc-300">
              {copy.trust_strip.map((t, i) => (
                <span key={i} className="inline-flex items-center gap-2">
                  <CheckIcon className={`h-4 w-4 ${theme.accent.textSoft}`} />
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div className="lg:justify-self-end">
            <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur">
              {lead.google_rating != null && (
                <div className="flex items-center gap-3">
                  <div className={`text-4xl font-bold tabular-nums ${theme.accent.textSoft}`}>
                    {lead.google_rating.toFixed(1)}
                  </div>
                  <div>
                    <Stars rating={lead.google_rating} />
                    <div className="text-xs text-zinc-400">
                      {lead.review_count ?? 0} Google reviews
                    </div>
                  </div>
                </div>
              )}
              <div className="mt-6 border-t border-white/10 pt-6">
                <blockquote className="text-sm italic text-zinc-200">
                  &ldquo;{copy.testimonial_quote}&rdquo;
                </blockquote>
                <div className="mt-3 text-xs font-medium text-zinc-400">
                  — {copy.testimonial_author}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
