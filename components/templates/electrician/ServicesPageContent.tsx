import Image from "next/image";
import Link from "next/link";
import type { Lead, GeneratedCopy } from "@/lib/supabase";
import type { VariantTheme } from "@/lib/variant";
import { BookingButton } from "@/components/BookingButton";
import { ELECTRICIAN_SERVICE_PRICING } from "@/components/ElectricianEstimator";
import { getLeadImages } from "@/lib/images";
import {
  BoltIcon,
  CheckIcon,
  accentClassesFor,
  accentClassesForDark,
} from "./shared";

/**
 * Try to map a service.name from generated copy to a row in the pricing table.
 * Substring match on label (case-insensitive). Returns null if no match.
 */
function findPricing(name: string) {
  const n = name.toLowerCase();
  for (const v of Object.values(ELECTRICIAN_SERVICE_PRICING)) {
    const label = v.label.toLowerCase();
    // Match either way (e.g. service "EV charger install" ↔ pricing "EV charger (Level 2) install")
    if (label.includes(n) || n.includes(label.split(" (")[0])) return v;
  }
  // Token-overlap fallback
  const tokens = n.split(/[^a-z]+/).filter((t) => t.length > 3);
  for (const v of Object.values(ELECTRICIAN_SERVICE_PRICING)) {
    if (tokens.some((t) => v.label.toLowerCase().includes(t))) return v;
  }
  return null;
}

function fmt(n: number) {
  return n >= 1000 ? `$${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k` : `$${n}`;
}

export function ServicesPageContent({
  lead,
  copy,
  theme,
}: {
  lead: Lead;
  copy: GeneratedCopy;
  theme: VariantTheme;
}) {
  const images = getLeadImages(lead.slug, "electrician");
  const city = lead.city ?? "Ventura County";

  return (
    <>
      {/* Page hero */}
      <section className="relative overflow-hidden border-b border-zinc-200 bg-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_-10%,rgba(0,0,0,0.04),transparent_55%)]" />
        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <div
            className={`mb-4 inline-flex items-center gap-2 rounded-full ${theme.accent.bgSoft} px-3 py-1 text-xs font-semibold uppercase tracking-wide ${theme.accent.text}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${theme.accent.bg}`} />
            Services
          </div>
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
            Residential electrical work in {city}.
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-zinc-600">
            {copy.services_intro}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <BookingButton
              label={copy.hero_cta_label}
              variant="primary"
              leadId={lead.id}
              slug={lead.slug}
              source="services_hero"
              accentClasses={accentClassesFor(theme)}
            />
            <Link
              href="/contact"
              className="inline-flex h-12 items-center justify-center rounded-md border border-zinc-300 bg-white px-6 text-base font-semibold text-zinc-900 transition hover:bg-zinc-50"
            >
              Send us a message
            </Link>
          </div>
        </div>
      </section>

      {/* Service detail grid */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="grid gap-6 lg:grid-cols-2">
          {copy.services.map((s, i) => {
            const tile = images.service_tiles[i % Math.max(images.service_tiles.length, 1)];
            const pricing = findPricing(s.name);
            return (
              <article
                key={i}
                className={`overflow-hidden border border-zinc-200 bg-white ${
                  theme.badgeShape === "pill" ? "rounded-2xl" : "rounded-md"
                }`}
              >
                <div className="grid sm:grid-cols-[1.1fr_1fr]">
                  {tile && (
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-100 sm:aspect-auto">
                      <Image
                        src={tile.src}
                        alt={tile.alt}
                        fill
                        sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="p-6 sm:p-7">
                    <div
                      className={`mb-3 inline-flex h-8 w-8 items-center justify-center ${theme.accent.bgSoft} ${theme.accent.text} ${
                        theme.badgeShape === "pill" ? "rounded-full" : "rounded-md"
                      }`}
                    >
                      <BoltIcon className="h-4 w-4" />
                    </div>
                    <h3 className="text-xl font-semibold text-zinc-900">{s.name}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-600">{s.blurb}</p>
                    {pricing && (
                      <div className="mt-4 inline-flex items-center gap-2 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-700">
                        <span className="text-zinc-500">Typical range:</span>
                        <span className="tabular-nums font-semibold text-zinc-900">
                          {fmt(pricing.min)} – {fmt(pricing.max)}
                        </span>
                      </div>
                    )}
                    <div className="mt-5 flex flex-wrap items-center gap-3 text-sm">
                      <BookingButton
                        label="Get a quote"
                        variant="primary"
                        leadId={lead.id}
                        slug={lead.slug}
                        source={`services_card_${i}`}
                        accentClasses={accentClassesFor(theme)}
                      />
                      <Link
                        href="/contact"
                        className="text-sm font-semibold text-zinc-700 hover:text-zinc-900"
                      >
                        Send a message →
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* Pricing disclaimer */}
        <p className="mt-8 text-xs text-zinc-500">
          Pricing ranges are typical {city} estimates. Final pricing depends on your home,
          permits, and existing wiring — we&apos;ll quote it free on the call.
        </p>
      </section>

      {/* Trust bar */}
      <section className="bg-white py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-6 sm:grid-cols-3">
            {copy.trust_strip.slice(0, 3).map((t, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-md border border-zinc-200 bg-zinc-50 p-5"
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center ${theme.accent.bgSoft} ${theme.accent.text} ${
                    theme.badgeShape === "pill" ? "rounded-full" : "rounded-md"
                  }`}
                >
                  <CheckIcon className="h-4 w-4" />
                </div>
                <div className="text-sm font-semibold text-zinc-900">{t}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA band */}
      <section className="relative overflow-hidden bg-zinc-950 py-16 text-white">
        {images.finished && (
          <div className="absolute inset-0">
            <Image
              src={images.finished.src}
              alt={images.finished.alt}
              fill
              sizes="100vw"
              className="object-cover opacity-40"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/85 via-zinc-950/70 to-zinc-950" />
          </div>
        )}
        <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Not sure which service you need?
          </h2>
          <p className="mt-3 text-lg text-zinc-300">
            Send us a quick note and we&apos;ll point you to the right scope and price range.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <BookingButton
              label={copy.hero_cta_label}
              variant="primary"
              leadId={lead.id}
              slug={lead.slug}
              source="services_final"
              accentClasses={accentClassesForDark(theme)}
            />
            <Link
              href="/contact"
              className="inline-flex h-12 items-center justify-center rounded-md border border-white/25 px-6 text-base font-semibold text-white transition hover:bg-white/10"
            >
              Send a message
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
