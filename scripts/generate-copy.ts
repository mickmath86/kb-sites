/**
 * One-off (and per-lead) copy generator.
 *
 * Reads leads from Supabase, asks DeepSeek (via OpenRouter) to fill an 8-slot
 * copy schema, and writes the JSON to leads.generated_copy. Then calls
 * /api/revalidate to rebuild the static page.
 *
 * Usage:
 *   # Generate copy for every electrician lead missing copy
 *   npx tsx scripts/generate-copy.ts --category electrician
 *
 *   # Force re-generate for one slug
 *   npx tsx scripts/generate-copy.ts --slug ef-oxnard-oxn --force
 *
 *   # Generate for everyone missing copy
 *   npx tsx scripts/generate-copy.ts
 *
 * Requires env: SUPABASE_SERVICE_ROLE_KEY, OPENROUTER_API_KEY,
 *               NEXT_PUBLIC_SUPABASE_URL, REVALIDATE_SECRET (optional),
 *               NEXT_PUBLIC_PREVIEW_ROOT_DOMAIN (optional).
 */
import { createClient } from "@supabase/supabase-js";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OPENROUTER = process.env.OPENROUTER_API_KEY;
const REVALIDATE_SECRET = process.env.REVALIDATE_SECRET;
const PREVIEW_ROOT =
  process.env.NEXT_PUBLIC_PREVIEW_ROOT_DOMAIN ?? "preview.kickbord.com";

if (!SUPABASE_URL || !SERVICE_KEY) {
  throw new Error("Missing Supabase env");
}
if (!OPENROUTER) {
  throw new Error("Missing OPENROUTER_API_KEY");
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ---- args ----
const args = process.argv.slice(2);
function flag(name: string): string | undefined {
  const idx = args.indexOf(`--${name}`);
  if (idx === -1) return undefined;
  return args[idx + 1];
}
function bool(name: string) {
  return args.includes(`--${name}`);
}
const argCategory = flag("category");
const argSlug = flag("slug");
const argForce = bool("force");

// ---- prompt ----
const SCHEMA = `{
  "hero_headline": "string (7-10 words, value-prop)",
  "hero_subhead": "string (15-25 words, plain English)",
  "hero_cta_label": "string (2-4 words)",
  "trust_strip": ["3-5 short trust signals, e.g. 'Licensed & insured'"],
  "services_intro": "1 sentence framing the services list",
  "services": [
    { "name": "string (2-4 words)", "blurb": "string (one line)" }
  ],
  "why_us": [
    { "title": "string (2-4 words)", "body": "string (one line)" }
  ],
  "testimonial_quote": "synthesized ≤ 30 words, conversational, NOT copying any real review verbatim",
  "testimonial_author": "string like 'Verified Customer, <city>'",
  "faq": [
    { "q": "string", "a": "string (1-3 sentences, plain English)" }
  ],
  "service_area_line": "1 sentence about where they serve",
  "meta_title": "≤ 60 chars",
  "meta_description": "≤ 155 chars"
}`;

function buildPrompt(lead: {
  company_name: string;
  category: string;
  city: string | null;
  google_rating: number | null;
  review_count: number | null;
  icp_summary: string | null;
  recommended_site_angle: string | null;
}) {
  const trade =
    lead.category === "electrician"
      ? "electrical contractor"
      : lead.category === "hvac_contractor"
      ? "HVAC contractor (heating & air)"
      : lead.category === "plumber"
      ? "plumber"
      : lead.category;

  return [
    {
      role: "system" as const,
      content:
        "You write conversion-focused homepage copy for local trade businesses. Plain English, no fluff, no exclamation points, no emojis. Never fabricate certifications, awards, or numbers. Never copy a real customer review verbatim — only synthesize from general themes.",
    },
    {
      role: "user" as const,
      content: `Write homepage copy for this business as strict JSON.

Business: ${lead.company_name}
Trade: ${trade}
City: ${lead.city ?? "Ventura County, CA"}
Google rating: ${lead.google_rating ?? "n/a"} (${lead.review_count ?? 0} reviews)

Positioning notes:
${lead.icp_summary ?? "(none provided)"}

Recommended angle:
${lead.recommended_site_angle ?? "(none provided)"}

Return JSON ONLY (no markdown fences) matching this shape:
${SCHEMA}

Constraints:
- 4-6 items in services
- exactly 3 items in why_us
- 3-5 items in faq
- testimonial_quote MUST be synthesized (not a real review)
- hero_cta_label should be action-led, like "Get a Free Quote" or "Book a Visit"
- trust_strip should feel concrete: licensing, response time, warranty, family-owned, etc.
`,
    },
  ];
}

async function callDeepSeek(messages: { role: string; content: string }[]) {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://kickbord.com",
      "X-Title": "Kickbord Template Factory",
    },
    body: JSON.stringify({
      model: "deepseek/deepseek-chat-v3",
      messages,
      temperature: 0.7,
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`OpenRouter ${res.status}: ${txt}`);
  }
  const json = (await res.json()) as {
    choices: { message: { content: string } }[];
  };
  const raw = json.choices?.[0]?.message?.content ?? "{}";
  // Strip code fences if any slip through
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
  return JSON.parse(cleaned);
}

async function revalidate(slug: string) {
  if (!REVALIDATE_SECRET) return;
  try {
    const url = `https://${PREVIEW_ROOT}/api/revalidate`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-revalidate-secret": REVALIDATE_SECRET,
      },
      body: JSON.stringify({ slug }),
    });
    if (!res.ok) {
      console.warn(`  ⚠ revalidate ${slug} failed: ${res.status}`);
    }
  } catch (e) {
    console.warn("  ⚠ revalidate error", e);
  }
}

async function main() {
  let query = supabase
    .from("leads")
    .select(
      "id, slug, company_name, category, city, google_rating, review_count, icp_summary, recommended_site_angle, generated_copy"
    )
    .not("slug", "is", null);

  if (argSlug) query = query.eq("slug", argSlug);
  if (argCategory) query = query.eq("category", argCategory);

  const { data, error } = await query;
  if (error) throw error;
  if (!data) throw new Error("No leads returned");

  const targets = data.filter((l) => argForce || !l.generated_copy);
  console.log(
    `Generating copy for ${targets.length} of ${data.length} leads` +
      (argCategory ? ` (category=${argCategory})` : "") +
      (argSlug ? ` (slug=${argSlug})` : "") +
      (argForce ? " [force]" : "")
  );

  let ok = 0;
  let fail = 0;
  for (const lead of targets) {
    process.stdout.write(`  ${lead.slug} (${lead.company_name}) ... `);
    try {
      const copy = await callDeepSeek(buildPrompt(lead));
      const { error: upErr } = await supabase
        .from("leads")
        .update({ generated_copy: copy })
        .eq("id", lead.id);
      if (upErr) throw upErr;
      await revalidate(lead.slug!);
      console.log("ok");
      ok++;
    } catch (e) {
      console.log("FAIL", (e as Error).message);
      fail++;
    }
  }
  console.log(`\nDone. ${ok} ok, ${fail} failed.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
