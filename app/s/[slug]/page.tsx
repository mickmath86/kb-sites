import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllSlugs, getLeadBySlug } from "@/lib/supabase";
import { ElectricianTemplate } from "@/components/templates/ElectricianTemplate";

// SSG with ISR — pages render once at build time then revalidate every 5 minutes
// (or instantly via /api/revalidate). Slugs not built at build time will 404
// unless they were generated post-build and trigger revalidate.
// TEMP: force-dynamic while we debug. Revert to ISR (revalidate = 300) once stable.
export const dynamic = "force-dynamic";
export const dynamicParams = true;
export const revalidate = 0;

export async function generateStaticParams() {
  const rows = await getAllSlugs();
  return rows.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const lead = await getLeadBySlug(slug);
  if (!lead) return { title: "Not found" };
  const copy = lead.generated_copy;
  return {
    title: copy?.meta_title ?? `${lead.company_name} — ${lead.city ?? "Ventura County"}`,
    description:
      copy?.meta_description ??
      `${lead.company_name} — licensed local pro serving ${lead.city ?? "Ventura County"}.`,
    robots: { index: false, follow: false }, // preview-only; don't let SEO index outreach pages
  };
}

export default async function SitePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  console.log("[SitePage] resolving slug:", JSON.stringify(slug));
  const lead = await getLeadBySlug(slug);
  console.log(
    "[SitePage] lead lookup",
    JSON.stringify({
      slug,
      found: !!lead,
      company: lead?.company_name ?? null,
      category: lead?.category ?? null,
    })
  );
  if (!lead) notFound();

  switch (lead.category) {
    case "electrician":
      return <ElectricianTemplate lead={lead} />;
    case "hvac_contractor":
    case "plumber":
      // Phase 2.b — for now, render the electrician template as a placeholder
      // so previews don't 404 while we ship the other two trade templates.
      return <ElectricianTemplate lead={lead} />;
    default:
      return <ElectricianTemplate lead={lead} />;
  }
}
