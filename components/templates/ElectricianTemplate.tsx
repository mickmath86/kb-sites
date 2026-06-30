import type { Lead } from "@/lib/supabase";
import { PostHogProvider } from "@/components/PostHogProvider";
import { getLeadImages } from "@/lib/images";
import { resolveVariant, VARIANT_THEMES } from "@/lib/variant";
import {
  withFallbacks,
  Header,
  ServicesSection,
  EstimatorSection,
  WhyUsSection,
  FaqSection,
  FinalCtaSection,
  Footer,
} from "./electrician/shared";
import { HeroA } from "./electrician/VariantA";
import { HeroB } from "./electrician/VariantB";
import { HeroC } from "./electrician/VariantC";

/**
 * Electrician trade template — dispatches to one of 3 design variants (A/B/C).
 *
 * Variant resolution:
 *   - lead.template_variant override, else
 *   - deterministic FNV-1a hash of lead.slug.
 *
 * Each variant has its own hero + section order; shared primitives
 * (Services, WhyUs, FAQ, FinalCTA, Footer) accept a `theme` so accent
 * color + badge style swap per variant.
 */
export function ElectricianTemplate({ lead }: { lead: Lead }) {
  const copy = withFallbacks(lead);
  const images = getLeadImages(lead.slug, "electrician");
  const variant = resolveVariant(lead.slug, lead.template_variant);
  const theme = VARIANT_THEMES[variant];

  const hero =
    variant === "A" ? (
      <HeroA lead={lead} copy={copy} heroImage={images.hero} theme={theme} />
    ) : variant === "B" ? (
      <HeroB lead={lead} copy={copy} heroImage={images.hero} theme={theme} />
    ) : (
      <HeroC lead={lead} copy={copy} heroImage={images.hero} theme={theme} />
    );

  // Body section order varies per variant.
  // A (Dark/Bold):       Services → Estimator → WhyUs → FAQ
  // B (Light/Editorial): WhyUs    → Services  → Estimator → FAQ   (story-first)
  // C (Industrial):      Services → WhyUs     → Estimator → FAQ   (work-first)
  const services = (
    <ServicesSection
      key="services"
      copy={copy}
      serviceTiles={images.service_tiles}
      theme={theme}
      tone={variant === "B" ? "alt" : "light"}
    />
  );
  const estimator = <EstimatorSection key="estimator" lead={lead} />;
  const whyUs = (
    <WhyUsSection key="whyus" copy={copy} trust={images.trust} theme={theme} />
  );
  const faq = <FaqSection key="faq" copy={copy} />;

  const sections =
    variant === "A"
      ? [services, estimator, whyUs, faq]
      : variant === "B"
        ? [whyUs, services, estimator, faq]
        : [services, whyUs, estimator, faq];

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <PostHogProvider leadId={lead.id} slug={lead.slug} category={lead.category} />
      <Header lead={lead} copy={copy} theme={theme} />
      {hero}
      {sections}
      <FinalCtaSection
        lead={lead}
        copy={copy}
        finished={images.finished}
        theme={theme}
      />
      <Footer lead={lead} credits={images.all_credits} />
    </div>
  );
}
