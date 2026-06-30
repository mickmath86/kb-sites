import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLeadBySlug } from "@/lib/supabase";
import { PageShell } from "@/components/templates/electrician/PageShell";
import { ServicesPageContent } from "@/components/templates/electrician/ServicesPageContent";
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
    title: `Services — ${lead.company_name}`,
    description: `Electrical services from ${lead.company_name}, serving ${city} and the 805. Free quotes, licensed and insured.`,
    robots: { index: false, follow: false },
  };
}

export default async function ServicesPage({
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

  return (
    <PageShell lead={lead} copy={copy} theme={theme} credits={images.all_credits}>
      <ServicesPageContent lead={lead} copy={copy} theme={theme} />
    </PageShell>
  );
}
