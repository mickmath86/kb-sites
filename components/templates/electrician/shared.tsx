import Image from "next/image";
import type { Lead, GeneratedCopy } from "@/lib/supabase";
import type { VariantTheme } from "@/lib/variant";
import type { ImageAsset } from "@/lib/images";
import { BookingButton } from "@/components/BookingButton";
import { ElectricianEstimator } from "@/components/ElectricianEstimator";
import { KickbordBadge } from "@/components/KickbordBadge";

/**
 * Shared electrician primitives used across all 3 design variants.
 *
 * Each primitive accepts `theme` so accent color + badge style swap per variant.
 * Variants compose these into different hero treatments + section orders.
 */

// ---- Copy fallbacks (variant-agnostic) ----

export function withFallbacks(lead: Lead): GeneratedCopy {
  const city = lead.city ?? "Ventura County";
  const c = lead.generated_copy;
  return {
    hero_headline: c?.hero_headline ?? `Trusted electricians in ${city}.`,
    hero_subhead:
      c?.hero_subhead ??
      `${lead.company_name} delivers fast, code-compliant electrical work for ${city} homeowners — from outlets to full panel upgrades.`,
    hero_cta_label: c?.hero_cta_label ?? "Get a Free Quote",
    trust_strip:
      c?.trust_strip && c.trust_strip.length
        ? c.trust_strip
        : ["Licensed & insured", "Same-day estimates", "Local to " + city],
    services_intro:
      c?.services_intro ??
      "Residential electrical work, done right the first time.",
    services: c?.services && c.services.length ? c.services : DEFAULT_SERVICES,
    why_us: c?.why_us && c.why_us.length ? c.why_us : DEFAULT_WHY_US,
    testimonial_quote:
      c?.testimonial_quote ??
      "Showed up on time, explained everything, and the price was exactly what they quoted.",
    testimonial_author: c?.testimonial_author ?? `Verified Customer, ${city}`,
    faq: c?.faq && c.faq.length ? c.faq : DEFAULT_FAQ,
    service_area_line:
      c?.service_area_line ??
      `Proudly serving ${city} and the surrounding 805 area.`,
    meta_title: c?.meta_title ?? `${lead.company_name} — Electrician in ${city}`,
    meta_description:
      c?.meta_description ??
      `${lead.company_name} is a licensed ${city} electrician. Free quotes, same-day estimates, and code-compliant work.`,
  };
}

const DEFAULT_SERVICES: GeneratedCopy["services"] = [
  { name: "Panel upgrades", blurb: "Modern 200A panels safely sized for today's homes." },
  { name: "EV charger install", blurb: "Level 2 chargers wired and inspected for daily use." },
  { name: "Outlets & switches", blurb: "Adding, replacing, or upgrading anywhere in your home." },
  { name: "Recessed lighting", blurb: "Clean installs with dimmers and smart options available." },
  { name: "Troubleshooting", blurb: "Flickering lights, breakers tripping, or burning smells — diagnosed fast." },
  { name: "Generator hookups", blurb: "Standby and portable generator transfer switches." },
];
const DEFAULT_WHY_US: GeneratedCopy["why_us"] = [
  { title: "Licensed & insured", body: "Every job is permitted and inspected to California code." },
  { title: "Upfront pricing", body: "No surprise charges. You see the price before we start." },
  { title: "Local, fast response", body: "Same-day estimates and most jobs scheduled within the week." },
];
const DEFAULT_FAQ: GeneratedCopy["faq"] = [
  { q: "Do you offer free quotes?", a: "Yes — most residential jobs get a free estimate during a quick site visit." },
  { q: "Are you licensed and insured?", a: "Yes. Fully licensed in California with general liability and worker's comp coverage." },
  { q: "How fast can you get out?", a: "We try to be on-site within 1–2 business days for most non-emergency jobs." },
];

// ---- Inline icons ----

export function BoltIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M13 2 4 14h7l-2 8 9-12h-7l2-8z" />
    </svg>
  );
}
export function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
export function Stars({ rating, accent = "text-amber-400" }: { rating: number; accent?: string }) {
  const full = Math.floor(rating);
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          className={`h-4 w-4 ${i < full ? accent : "text-zinc-600"}`}
          fill="currentColor"
        >
          <path d="M12 2 15 9l8 1-6 5 2 8-7-4-7 4 2-8-6-5 8-1 3-7z" />
        </svg>
      ))}
    </div>
  );
}

// ---- Header (variant-aware) ----

export function Header({
  lead,
  copy,
  theme,
}: {
  lead: Lead;
  copy: GeneratedCopy;
  theme: VariantTheme;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-9 w-9 items-center justify-center text-white ${theme.accent.bg} ${
              theme.badgeShape === "pill" ? "rounded-full" : "rounded-md"
            }`}
          >
            <BoltIcon className="h-5 w-5" />
          </div>
          <div className="text-lg font-bold tracking-tight text-zinc-900">
            {lead.company_name}
          </div>
        </div>
        <div className="hidden items-center gap-3 sm:flex">
          {lead.phone && (
            <a
              href={`tel:${lead.phone}`}
              className="text-sm font-semibold text-zinc-700 hover:text-zinc-900"
            >
              {lead.phone}
            </a>
          )}
          <BookingButton
            label={copy.hero_cta_label}
            variant="primary"
            leadId={lead.id}
            slug={lead.slug}
            source="header"
            accentClasses={accentClassesFor(theme)}
          />
        </div>
      </div>
    </header>
  );
}

/**
 * Tailwind classes for a primary CTA on a light background.
 * Composed only from full class literals already present in `lib/variant.ts`
 * so the JIT can see them. Avoid computed `prefix:${token}` strings here —
 * those would not be generated.
 */
export function accentClassesFor(theme: VariantTheme): string {
  // text-zinc-950 for the amber theme (yellow on dark text reads best),
  // white text for indigo / orange (saturated mid-tones).
  const fg = theme.accent.bg === "bg-amber-400" ? "text-zinc-950" : "text-white";
  return `${theme.accent.bg} ${theme.accent.bgHover} ${fg} shadow-lg focus-visible:ring-zinc-900/30 focus-visible:ring-offset-white`;
}

/** Same but tuned for dark hero backgrounds. */
export function accentClassesForDark(theme: VariantTheme): string {
  const fg = theme.accent.bg === "bg-amber-400" ? "text-zinc-950" : "text-white";
  return `${theme.accent.bg} ${theme.accent.bgHover} ${fg} shadow-lg focus-visible:ring-white/40 focus-visible:ring-offset-zinc-950`;
}

// ---- Services grid ----

export function ServicesSection({
  copy,
  serviceTiles,
  theme,
  tone = "light",
}: {
  copy: GeneratedCopy;
  serviceTiles: ImageAsset[];
  theme: VariantTheme;
  tone?: "light" | "alt";
}) {
  return (
    <section
      className={`${tone === "alt" ? "bg-white" : "bg-zinc-50"} mx-auto max-w-6xl px-4 py-20 sm:px-6`}
    >
      <div className="max-w-2xl">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Services</h2>
        <p className="mt-4 text-lg text-zinc-600">{copy.services_intro}</p>
      </div>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {copy.services.map((s, i) => {
          const tile = serviceTiles[i % Math.max(serviceTiles.length, 1)];
          return (
            <div
              key={i}
              className={`group overflow-hidden border border-zinc-200 bg-white transition hover:shadow-md hover:border-zinc-400 ${
                theme.badgeShape === "pill" ? "rounded-2xl" : "rounded-md"
              }`}
            >
              {tile && (
                <div className="relative h-40 w-full overflow-hidden bg-zinc-100">
                  <Image
                    src={tile.src}
                    alt={tile.alt}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                </div>
              )}
              <div className="p-6">
                <div
                  className={`mb-3 inline-flex h-8 w-8 items-center justify-center ${theme.accent.bgSoft} ${theme.accent.text} ${
                    theme.badgeShape === "pill" ? "rounded-full" : "rounded-md"
                  }`}
                >
                  <BoltIcon className="h-4 w-4" />
                </div>
                <h3 className="text-lg font-semibold text-zinc-900">{s.name}</h3>
                <p className="mt-1.5 text-sm text-zinc-600">{s.blurb}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ---- Estimator block ----

export function EstimatorSection({ lead }: { lead: Lead }) {
  return (
    <section className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <ElectricianEstimator leadId={lead.id} slug={lead.slug} phone={lead.phone} />
    </section>
  );
}

// ---- Why us ----

export function WhyUsSection({
  copy,
  trust,
  theme,
}: {
  copy: GeneratedCopy;
  trust: ImageAsset | null;
  theme: VariantTheme;
}) {
  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <h2 className="max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
              Why homeowners pick us
            </h2>
            <div className="mt-10 grid gap-8">
              {copy.why_us.map((w, i) => (
                <div key={i} className="flex gap-4">
                  <div className={`shrink-0 text-2xl font-bold tabular-nums ${theme.accent.text}`}>
                    0{i + 1}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-zinc-900">{w.title}</h3>
                    <p className="mt-1 text-sm text-zinc-600">{w.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {trust && (
            <div
              className={`relative aspect-[4/5] w-full overflow-hidden bg-zinc-100 lg:justify-self-end ${
                theme.badgeShape === "pill" ? "rounded-3xl" : "rounded-md"
              }`}
            >
              <Image
                src={trust.src}
                alt={trust.alt}
                fill
                sizes="(min-width: 1024px) 40vw, 100vw"
                className="object-cover"
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// ---- FAQ ----

export function FaqSection({ copy }: { copy: GeneratedCopy }) {
  return (
    <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
      <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Common questions</h2>
      <div className="mt-8 divide-y divide-zinc-200 rounded-2xl border border-zinc-200 bg-white">
        {copy.faq.map((item, i) => (
          <details key={i} className="group p-6 open:bg-zinc-50">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
              <span className="text-base font-semibold text-zinc-900">{item.q}</span>
              <span className="text-2xl leading-none text-zinc-400 transition group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-zinc-600">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

// ---- Final CTA ----

export function FinalCtaSection({
  lead,
  copy,
  finished,
  theme,
}: {
  lead: Lead;
  copy: GeneratedCopy;
  finished: ImageAsset | null;
  theme: VariantTheme;
}) {
  return (
    <section className="relative overflow-hidden bg-zinc-950 py-20 text-white">
      {finished && (
        <div className="absolute inset-0">
          <Image
            src={finished.src}
            alt={finished.alt}
            fill
            sizes="100vw"
            className="object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/85 via-zinc-950/70 to-zinc-950" />
        </div>
      )}
      <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Get your project on the schedule.
        </h2>
        <p className="mt-4 text-lg text-zinc-300">{copy.service_area_line}</p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <BookingButton
            label={copy.hero_cta_label}
            variant="primary"
            leadId={lead.id}
            slug={lead.slug}
            source="final"
            accentClasses={accentClassesForDark(theme)}
          />
          {lead.phone && (
            <a
              href={`tel:${lead.phone}`}
              className="inline-flex h-12 items-center justify-center rounded-md border border-white/20 px-6 text-base font-semibold text-white transition hover:bg-white/10"
            >
              {lead.phone}
            </a>
          )}
        </div>
      </div>
    </section>
  );
}

// ---- Footer ----

export function Footer({
  lead,
  credits,
}: {
  lead: Lead;
  credits: { photographer: string; photographer_url: string }[];
}) {
  return (
    <footer className="border-t border-zinc-200 bg-white py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <div className="text-sm font-semibold text-zinc-900">{lead.company_name}</div>
            <div className="text-xs text-zinc-500">
              {lead.formatted_address ?? lead.city ?? "Ventura County, CA"}
            </div>
          </div>
          <KickbordBadge />
        </div>
        {credits.length > 0 && (
          <div className="mt-6 border-t border-zinc-100 pt-4 text-[10px] leading-relaxed text-zinc-400">
            Photography:{" "}
            {credits.map((c, i) => (
              <span key={c.photographer_url}>
                <a
                  href={c.photographer_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline-offset-2 hover:underline"
                >
                  {c.photographer}
                </a>
                {i < credits.length - 1 ? ", " : ""}
              </span>
            ))}{" "}
            via{" "}
            <a
              href="https://unsplash.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline-offset-2 hover:underline"
            >
              Unsplash
            </a>
          </div>
        )}
      </div>
    </footer>
  );
}
