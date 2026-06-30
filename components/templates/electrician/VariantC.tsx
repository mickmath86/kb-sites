import Image from "next/image";
import type { Lead, GeneratedCopy } from "@/lib/supabase";
import type { ImageAsset } from "@/lib/images";
import type { VariantTheme } from "@/lib/variant";
import { BookingButton } from "@/components/BookingButton";
import { CheckIcon, Stars, accentClassesForDark } from "./shared";

/**
 * Variant C — Industrial / Trade.
 *
 * Hero: hard 50/50 split — left half deep slate w/ orange-accent stripe + copy,
 * right half full-bleed action photo. Diagonal orange stripe behind the headline.
 * Square (rounded-md) badges, condensed display font feel via tracking-tighter.
 *
 * Section order is reordered in `ElectricianTemplate.tsx`:
 *   Hero → Services FIRST (lead with what they do) → Estimator → WhyUs → FAQ → FinalCTA
 */
export function HeroC({
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
    <section className="relative overflow-hidden bg-zinc-900 text-white">
      <div className="grid lg:grid-cols-2">
        {/* LEFT — slate panel with copy */}
        <div className="relative flex flex-col justify-center bg-zinc-900 px-4 py-16 sm:px-10 sm:py-20 lg:py-28">
          {/* Diagonal orange stripe accent — pure decoration */}
          <div
            className={`pointer-events-none absolute -left-10 top-12 h-1 w-40 ${theme.accent.bg} rotate-[-12deg]`}
          />
          <div
            className={`pointer-events-none absolute -left-10 top-16 h-1 w-24 ${theme.accent.bg} rotate-[-12deg] opacity-60`}
          />

          <div className="relative mx-auto w-full max-w-xl">
            <div
              className={`mb-6 inline-flex items-center gap-2 rounded-md ${theme.accent.bg} px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-white`}
            >
              Licensed Electrician
              <span className="text-white/70">·</span>
              {lead.city ?? "Ventura County"}
            </div>
            <h1 className="text-4xl font-extrabold uppercase tracking-tight text-white sm:text-5xl lg:text-[3.5rem] lg:leading-[1.05]">
              {copy.hero_headline}
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-zinc-300">{copy.hero_subhead}</p>
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
                  className="inline-flex h-12 items-center justify-center rounded-md border border-white/25 px-6 text-base font-semibold text-white transition hover:bg-white/10"
                >
                  Or call {lead.phone}
                </a>
              )}
            </div>
            <div className="mt-10 grid grid-cols-3 gap-3 border-t border-white/10 pt-6">
              {copy.trust_strip.slice(0, 3).map((t, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-zinc-300">
                  <CheckIcon className={`mt-0.5 h-4 w-4 shrink-0 ${theme.accent.textSoft}`} />
                  <span className="leading-snug">{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT — full-bleed photo column with rating chip */}
        <div className="relative min-h-[420px] lg:min-h-0">
          {heroImage ? (
            <>
              <Image
                src={heroImage.src}
                alt={heroImage.alt}
                fill
                priority
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
              {/* slight dark vignette on the left edge for transition */}
              <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-zinc-900 to-transparent" />
            </>
          ) : (
            <div className={`absolute inset-0 ${theme.accent.bg} opacity-90`} />
          )}

          {/* Rating chip — bottom-right on photo */}
          {lead.google_rating != null && (
            <div className="absolute bottom-6 right-6 max-w-[260px] rounded-md border-l-4 bg-white p-4 shadow-xl"
                 style={{ borderLeftColor: "currentColor" }}>
              <div className={theme.accent.text}>
                <div className="flex items-center gap-3">
                  <div className="text-3xl font-extrabold tabular-nums">
                    {lead.google_rating.toFixed(1)}
                  </div>
                  <div>
                    <Stars rating={lead.google_rating} accent="text-amber-500" />
                    <div className="text-[11px] font-medium text-zinc-500">
                      {lead.review_count ?? 0} Google reviews
                    </div>
                  </div>
                </div>
              </div>
              <blockquote className="mt-2 line-clamp-3 text-xs italic leading-snug text-zinc-700">
                &ldquo;{copy.testimonial_quote}&rdquo;
              </blockquote>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
