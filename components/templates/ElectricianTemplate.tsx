import type { Lead, GeneratedCopy } from "@/lib/supabase";
import { BookingButton } from "@/components/BookingButton";
import { ElectricianEstimator } from "@/components/ElectricianEstimator";
import { KickbordBadge } from "@/components/KickbordBadge";
import { PostHogProvider } from "@/components/PostHogProvider";

/**
 * Electrician trade template.
 *
 * All copy is driven by `lead.generated_copy` (JSONB). If a slot is missing,
 * a conservative fallback is rendered so the page never breaks.
 */
export function ElectricianTemplate({ lead }: { lead: Lead }) {
  const copy = withFallbacks(lead);
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <PostHogProvider
        leadId={lead.id}
        slug={lead.slug}
        category={lead.category}
      />

      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-amber-400 text-zinc-950">
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
            />
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(251,191,36,0.18),transparent_45%)]" />
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-300">
                Licensed Electrician · {lead.city ?? "Ventura County"}
              </div>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                {copy.hero_headline}
              </h1>
              <p className="mt-6 max-w-xl text-lg text-zinc-300">
                {copy.hero_subhead}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <BookingButton
                  label={copy.hero_cta_label}
                  variant="primary"
                  leadId={lead.id}
                  slug={lead.slug}
                  source="hero"
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
                    <CheckIcon className="h-4 w-4 text-amber-400" />
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Right column: rating card */}
            <div className="lg:justify-self-end">
              <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur">
                {lead.google_rating != null && (
                  <div className="flex items-center gap-3">
                    <div className="text-4xl font-bold tabular-nums text-amber-300">
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

      {/* Services */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Services
          </h2>
          <p className="mt-4 text-lg text-zinc-600">{copy.services_intro}</p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {copy.services.map((s, i) => (
            <div
              key={i}
              className="rounded-xl border border-zinc-200 bg-white p-6 transition hover:border-amber-300 hover:shadow-md"
            >
              <div className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-md bg-amber-100 text-amber-700">
                <BoltIcon className="h-4 w-4" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-900">{s.name}</h3>
              <p className="mt-1.5 text-sm text-zinc-600">{s.blurb}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Estimator */}
      <section className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <ElectricianEstimator
          leadId={lead.id}
          slug={lead.slug}
          phone={lead.phone}
        />
      </section>

      {/* Why us */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
            Why homeowners pick us
          </h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {copy.why_us.map((w, i) => (
              <div key={i}>
                <div className="text-2xl font-bold tabular-nums text-amber-500">
                  0{i + 1}
                </div>
                <h3 className="mt-3 text-lg font-semibold text-zinc-900">
                  {w.title}
                </h3>
                <p className="mt-2 text-sm text-zinc-600">{w.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Common questions
        </h2>
        <div className="mt-8 divide-y divide-zinc-200 rounded-2xl border border-zinc-200 bg-white">
          {copy.faq.map((item, i) => (
            <details key={i} className="group p-6 open:bg-zinc-50">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                <span className="text-base font-semibold text-zinc-900">
                  {item.q}
                </span>
                <span className="text-zinc-400 transition group-open:rotate-45 text-2xl leading-none">
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-zinc-600">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-zinc-950 py-20 text-white">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
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

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-white py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-4 sm:flex-row sm:items-center sm:px-6">
          <div>
            <div className="text-sm font-semibold text-zinc-900">
              {lead.company_name}
            </div>
            <div className="text-xs text-zinc-500">
              {lead.formatted_address ?? lead.city ?? "Ventura County, CA"}
            </div>
          </div>
          <KickbordBadge />
        </div>
      </footer>
    </div>
  );
}

// ---- helpers ----

function withFallbacks(lead: Lead): GeneratedCopy {
  const city = lead.city ?? "Ventura County";
  const c = lead.generated_copy;
  return {
    hero_headline:
      c?.hero_headline ?? `Trusted electricians in ${city}.`,
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
    services:
      c?.services && c.services.length
        ? c.services
        : DEFAULT_SERVICES,
    why_us:
      c?.why_us && c.why_us.length
        ? c.why_us
        : DEFAULT_WHY_US,
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

// ---- tiny inline icons (no external dep) ----

function BoltIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M13 2 4 14h7l-2 8 9-12h-7l2-8z" />
    </svg>
  );
}
function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
function Stars({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          className={`h-4 w-4 ${i < full ? "text-amber-400" : "text-zinc-600"}`}
          fill="currentColor"
        >
          <path d="M12 2 15 9l8 1-6 5 2 8-7-4-7 4 2-8-6-5 8-1 3-7z" />
        </svg>
      ))}
    </div>
  );
}
