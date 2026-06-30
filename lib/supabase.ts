import { createClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client (uses service role key).
 * Use in:
 *  - generateStaticParams
 *  - server components fetching lead data
 *  - /api/revalidate
 *
 * Never import this from a Client Component.
 */
export function getServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env var"
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// ---- Domain types ----

export type LeadCategory = "electrician" | "hvac_contractor" | "plumber";

export type GeneratedCopy = {
  hero_headline: string;          // 7-10 words, value-prop driven
  hero_subhead: string;           // 15-25 words
  hero_cta_label: string;         // 2-4 words, e.g. "Get a Free Quote"
  trust_strip: string[];          // 3-5 short trust signals, e.g. "Licensed & insured"
  services_intro: string;         // 1 sentence framing the services list
  services: { name: string; blurb: string }[]; // 4-6 services with one-line each
  why_us: { title: string; body: string }[];   // 3 differentiators
  testimonial_quote: string;      // synthesized quote ≤ 30 words (from Google review themes, NOT a real review)
  testimonial_author: string;     // e.g. "Verified Customer, Oxnard"
  faq: { q: string; a: string }[]; // 3-5 FAQs
  service_area_line: string;      // 1 sentence, e.g. "Proudly serving Oxnard, Ventura, and the 805."
  meta_title: string;             // ≤ 60 chars
  meta_description: string;       // ≤ 155 chars
};

export type Lead = {
  id: string;
  slug: string;
  company_name: string;
  category: LeadCategory;
  phone: string | null;
  formatted_address: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  google_rating: number | null;
  review_count: number | null;
  current_website: string | null;
  site_status: string | null;
  icp_summary: string | null;
  services_offered: string[] | null;
  service_area: string | null;
  current_usps: string | null;
  content_gaps: string | null;
  lead_score: number | null;
  tier: string | null;
  generated_copy: GeneratedCopy | null;
  template_variant: "A" | "B" | "C" | null;
};

// Columns selected for the public preview page render. Keep in sync with the
// `Lead` type above and with the actual public.leads schema (see migrations).
const LEAD_COLUMNS =
  "id, slug, company_name, category, phone, formatted_address, city, state, postal_code, google_rating, review_count, current_website, site_status, icp_summary, services_offered, service_area, current_usps, content_gaps, lead_score, tier, generated_copy, template_variant";

export async function getLeadBySlug(slug: string): Promise<Lead | null> {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("leads")
    .select(LEAD_COLUMNS)
    .eq("slug", slug)
    .maybeSingle();
  if (error) {
    console.error("[getLeadBySlug]", slug, error.message);
    return null;
  }
  return (data as Lead) ?? null;
}

export async function getAllSlugs(): Promise<{ slug: string }[]> {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("leads")
    .select("slug")
    .not("slug", "is", null);
  if (error) {
    console.error("[getAllSlugs]", error.message);
    return [];
  }
  return (data ?? []).filter((r): r is { slug: string } => !!r.slug);
}
