import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLeadBySlug } from "@/lib/supabase";
import { PageShell } from "@/components/templates/electrician/PageShell";
import { ContactForm } from "@/components/templates/electrician/ContactForm";
import { withFallbacks } from "@/components/templates/electrician/shared";
import { resolveVariant, VARIANT_THEMES } from "@/lib/variant";
import { getLeadImages } from "@/lib/images";

export const dynamicParams = true;
export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const lead = await getLeadBySlug(slug);
  if (!lead) return { title: "Not found" };
  const city = lead.city ?? "Ventura County";
  return {
    title: `Contact — ${lead.company_name}`,
    description: `Get in touch with ${lead.company_name} for free electrical quotes in ${city} and the 805. Licensed, insured, and ready to help.`,
    robots: { index: false, follow: false },
  };
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const lead = await getLeadBySlug(slug);
  if (!lead) notFound();

  const copy = withFallbacks(lead);
  const variant = resolveVariant(lead.slug, lead.template_variant);
  const theme = VARIANT_THEMES[variant];
  const images = getLeadImages(lead.slug, "electrician");

  // Services from the lead's generated copy, fallback to lead.services_offered
  const servicesList: { name: string }[] = (() => {
    if (Array.isArray(copy.services) && copy.services.length > 0) {
      return copy.services.map((s) => ({ name: s.name }));
    }
    if (Array.isArray(lead.services_offered) && lead.services_offered.length > 0) {
      return lead.services_offered.map((s: string) => ({ name: s }));
    }
    return [
      { name: "Panel upgrades" },
      { name: "Outlet & switch installation" },
      { name: "Lighting" },
      { name: "EV charger installation" },
      { name: "Troubleshooting & repair" },
    ];
  })();

  const city = lead.city ?? "Ventura County";
  const phone = lead.phone ?? "";

  // Hero tone per variant
  const heroBg =
    theme.surfaceTone === "dark"
      ? "bg-zinc-950 text-zinc-50"
      : theme.surfaceTone === "industrial"
      ? "bg-zinc-100 text-zinc-900"
      : "bg-white text-zinc-900";

  const eyebrowClass =
    theme.surfaceTone === "dark" ? theme.accent.textSoft : theme.accent.text;

  // Solid CTA button classes — pick a sensible text color per accent bg
  const ctaBtnClasses = (() => {
    if (theme.accent.bg === "bg-amber-400") return `${theme.accent.bg} ${theme.accent.bgHover} text-zinc-950`;
    return `${theme.accent.bg} ${theme.accent.bgHover} text-white`;
  })();

  return (
    <PageShell lead={lead} copy={copy} theme={theme} credits={images.all_credits}>
      <main>
        {/* Hero */}
        <section className={`${heroBg} border-b border-zinc-200/60`}>
          <div className="mx-auto max-w-6xl px-5 py-14 sm:py-20">
            <p className={`mb-3 text-xs font-semibold uppercase tracking-[0.2em] ${eyebrowClass}`}>
              Get in touch
            </p>
            <h1
              className={`text-3xl font-bold leading-[1.1] tracking-tight sm:text-5xl ${
                theme.surfaceTone === "light" ? "font-serif" : ""
              }`}
            >
              Tell us about your project.
            </h1>
            <p className="mt-4 max-w-2xl text-base sm:text-lg text-zinc-500">
              Free estimates for {city} and the 805. We typically respond the same business day.
            </p>
            {phone ? (
              <p className="mt-6 text-sm text-zinc-500">
                Prefer to call?{" "}
                <a
                  href={`tel:${phone.replace(/[^\d+]/g, "")}`}
                  className={`font-semibold underline-offset-2 hover:underline ${eyebrowClass}`}
                >
                  {phone}
                </a>
              </p>
            ) : null}
          </div>
        </section>

        {/* Form */}
        <section className="bg-white">
          <div className="mx-auto max-w-3xl px-5 py-14 sm:py-20">
            <ContactForm
              leadId={lead.id}
              slug={lead.slug}
              services={servicesList}
              theme={theme}
              accentBtnClasses={ctaBtnClasses}
            />
          </div>
        </section>

        {/* Reassurance band */}
        <section className="border-t border-zinc-200 bg-zinc-50">
          <div className="mx-auto grid max-w-6xl gap-6 px-5 py-10 sm:grid-cols-3">
            <div>
              <p className="text-sm font-semibold text-zinc-900">Licensed & insured</p>
              <p className="mt-1 text-sm text-zinc-600">
                Fully credentialed electrical contractor serving the 805.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-900">Free quotes</p>
              <p className="mt-1 text-sm text-zinc-600">
                No-pressure estimates — we explain the work in plain English.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-900">Fast response</p>
              <p className="mt-1 text-sm text-zinc-600">
                Same-business-day reply on most weekday submissions.
              </p>
            </div>
          </div>
        </section>
      </main>
    </PageShell>
  );
}
