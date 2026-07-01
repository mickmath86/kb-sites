/**
 * Per-lead site copy generator.
 *
 * Reads leads from Supabase, asks DeepSeek V3 (via OpenRouter) to fill the
 * generated_copy JSON schema, validates the response, and writes back to
 * leads.generated_copy. Also persists leads.template_variant (deterministic
 * A/B/C from slug hash) so the mailer flow can reference it directly.
 *
 * Usage:
 *   # Dry-run all electrician leads missing copy (prints to console, no writes)
 *   npx tsx scripts/generate-copy.ts --category electrician --dry-run
 *
 *   # Generate for one slug
 *   npx tsx scripts/generate-copy.ts --slug e-f-oxnard-oxn
 *
 *   # Generate for a comma-separated list
 *   npx tsx scripts/generate-copy.ts --slugs e-f-oxnard-oxn,provolt-electric-cam
 *
 *   # Force re-generate even if copy already exists
 *   npx tsx scripts/generate-copy.ts --category electrician --force
 *
 *   # Skip revalidation (useful for batch runs; hit /api/revalidate later)
 *   npx tsx scripts/generate-copy.ts --category electrician --no-revalidate
 *
 * Required env (from .env.local):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   OPENROUTER_API_KEY
 *
 * Optional env:
 *   REVALIDATE_SECRET             — if set + --no-revalidate not passed, hits /api/revalidate
 *   REVALIDATE_HOST               — defaults to kb-sites-sooty.vercel.app
 *   DEEPSEEK_MODEL                — defaults to deepseek/deepseek-chat-v3-0324
 */
import { createClient } from "@supabase/supabase-js";
import { config as loadEnv } from "dotenv";
import { resolveVariant, type TemplateVariant } from "../lib/variant";

// Load .env.local first (Next convention), then .env fallback.
loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

// ─── Env ──────────────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OPENROUTER = process.env.OPENROUTER_API_KEY;
const REVALIDATE_SECRET = process.env.REVALIDATE_SECRET;
const REVALIDATE_HOST = process.env.REVALIDATE_HOST ?? "kb-sites-sooty.vercel.app";
const MODEL = process.env.DEEPSEEK_MODEL ?? "deepseek/deepseek-chat-v3-0324";

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
if (!OPENROUTER) {
  console.error("Missing OPENROUTER_API_KEY");
  process.exit(1);
}

// @supabase/supabase-js eagerly constructs a RealtimeClient inside createClient(),
// and on Node < 22 without native WebSocket it throws. This script never
// subscribes to realtime, so we shim globalThis.WebSocket with a no-op class
// before creating the client. Node 22+ has WebSocket natively and this is a no-op.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
if (typeof (globalThis as any).WebSocket === "undefined") {
  class NoopWebSocket {
    constructor() {
      throw new Error(
        "WebSocket use is not supported in scripts/generate-copy.ts (realtime is disabled)."
      );
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).WebSocket = NoopWebSocket;
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ─── CLI args ─────────────────────────────────────────────────────────────────
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
const argSlugs = flag("slugs");
const argForce = bool("force");
const argDryRun = bool("dry-run");
const argNoRevalidate = bool("no-revalidate");
const argVerbose = bool("verbose");

// ─── Types ────────────────────────────────────────────────────────────────────
type Lead = {
  id: string;
  slug: string;
  company_name: string;
  category: string | null;
  city: string | null;
  state: string | null;
  google_rating: number | null;
  review_count: number | null;
  services_offered: string[] | null;
  service_area: string | null;
  icp_summary: string | null;
  current_usps: string | null;
  content_gaps: string | null;
  generated_copy: unknown;
  template_variant: TemplateVariant | null;
};

type GeneratedCopy = {
  hero_headline: string;
  hero_subhead: string;
  hero_cta_label: string;
  trust_strip: string[];
  services_intro: string;
  services: { name: string; blurb: string }[];
  why_us: { title: string; body: string }[];
  testimonial_quote: string;
  testimonial_author: string;
  faq: { q: string; a: string }[];
  service_area_line: string;
  meta_title: string;
  meta_description: string;
};

// ─── Category-aware fallback services ─────────────────────────────────────────
// Used only when lead.services_offered is empty AND the prompt somehow returns
// zero services. In practice the model invents a good list on its own.
const FALLBACK_SERVICES: Record<string, string[]> = {
  electrician: [
    "Panel upgrades",
    "Outlet & switch installation",
    "Lighting installation",
    "EV charger installation",
    "Troubleshooting & repair",
  ],
  hvac_contractor: [
    "AC installation & replacement",
    "Heating system service",
    "Ductwork & ventilation",
    "System tune-ups",
    "Emergency repair",
  ],
  plumber: [
    "Leak detection & repair",
    "Drain cleaning",
    "Water heater service",
    "Fixture installation",
    "Emergency plumbing",
  ],
};

function tradeLabel(category: string | null): string {
  switch (category) {
    case "electrician":
      return "electrical contractor";
    case "hvac_contractor":
      return "HVAC contractor (heating & air conditioning)";
    case "plumber":
      return "plumber";
    default:
      return category ?? "local trade business";
  }
}

// ─── Prompt ───────────────────────────────────────────────────────────────────
const SCHEMA_DESCRIPTION = `{
  "hero_headline": "string, 6-10 words, punchy, value-first, no exclamation points",
  "hero_subhead": "string, 15-28 words, plain English, concrete",
  "hero_cta_label": "string, 2-4 words, action-led (e.g. 'Get a Free Quote', 'Book a Visit')",
  "trust_strip": ["3-5 short trust signals: licensing, rating, response time, warranty, family-owned, etc."],
  "services_intro": "1 sentence framing the services list",
  "services": [
    { "name": "2-4 words", "blurb": "one line, 8-16 words" }
  ],
  "why_us": [
    { "title": "2-4 words", "body": "one line, 10-20 words" }
  ],
  "testimonial_quote": "SYNTHESIZED quote, ≤ 30 words, conversational, NOT copied from any real review",
  "testimonial_author": "'Verified Customer, <city>' or similar plausible attribution",
  "faq": [
    { "q": "question, 4-12 words", "a": "1-3 sentences, plain English" }
  ],
  "service_area_line": "1 sentence about where they serve",
  "meta_title": "≤ 60 chars, includes company name + city",
  "meta_description": "≤ 155 chars, one-line pitch"
}`;

function buildPrompt(lead: Lead): { role: "system" | "user"; content: string }[] {
  const trade = tradeLabel(lead.category);
  const city = lead.city ?? "Ventura County";
  const rating =
    lead.google_rating != null && lead.review_count != null
      ? `${lead.google_rating}★ from ${lead.review_count} Google reviews`
      : lead.google_rating != null
        ? `${lead.google_rating}★ Google rating`
        : "(rating not disclosed)";

  const knownServices =
    lead.services_offered && lead.services_offered.length > 0
      ? lead.services_offered.join(", ")
      : `(none listed — invent 4–6 plausible ${trade} services)`;

  const usps = lead.current_usps?.trim() || "(none listed)";
  const gaps = lead.content_gaps?.trim() || "(none listed)";
  const serviceArea = lead.service_area?.trim() || `${city} and the 805 area`;

  return [
    {
      role: "system",
      content:
        [
          "You write conversion-focused homepage copy for local trade businesses in California's 805 area (Ventura County + Santa Barbara County).",
          "Voice: confident, warm, and local. Plain English. Read like a trusted neighbor, not a corporate brochure.",
          "Never use exclamation points, em dashes, or emojis.",
          "Never fabricate certifications, awards, years-in-business, or specific numbers not provided in the brief.",
          "Never copy any real customer review verbatim — testimonials must be synthesized from general themes.",
          "Return STRICT JSON only, no markdown code fences.",
        ].join(" "),
    },
    {
      role: "user",
      content: [
        `Write homepage copy for this business as strict JSON.`,
        ``,
        `Business: ${lead.company_name}`,
        `Trade: ${trade}`,
        `City: ${city}`,
        `Service area: ${serviceArea}`,
        `Reputation: ${rating}`,
        `Known services: ${knownServices}`,
        `Their strengths: ${usps}`,
        `Their gaps to address: ${gaps}`,
        ``,
        `Positioning brief:`,
        lead.icp_summary?.trim() || "(none provided — infer from the fields above)",
        ``,
        `Return JSON ONLY (no markdown fences) matching this shape:`,
        SCHEMA_DESCRIPTION,
        ``,
        `Hard constraints:`,
        `- 4–6 items in services`,
        `- exactly 3 items in why_us`,
        `- 3–5 items in faq`,
        `- testimonial_quote MUST be synthesized (never a real review)`,
        `- If rating and review count are provided, weave them naturally into ONE of: hero_subhead, trust_strip, or testimonial_author`,
        `- hero_cta_label should be action-led: "Get a Free Quote", "Book a Visit", "Talk to an Electrician", etc.`,
        `- trust_strip should feel concrete: licensing, insured, ${lead.google_rating ?? ""}★ rated, same-day response, warranty, family-owned, etc.`,
      ].join("\n"),
    },
  ];
}

// ─── OpenRouter call ──────────────────────────────────────────────────────────
type Usage = {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
};

async function callDeepSeek(
  messages: { role: string; content: string }[]
): Promise<{ json: unknown; usage: Usage; raw: string }> {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://kickbord.com",
      "X-Title": "Kickbord Template Factory",
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: 0.7,
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`OpenRouter ${res.status}: ${txt.slice(0, 400)}`);
  }
  const body = (await res.json()) as {
    choices: { message: { content: string } }[];
    usage?: Usage;
  };
  const raw = body.choices?.[0]?.message?.content ?? "{}";
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
  return { json: JSON.parse(cleaned), usage: body.usage ?? {}, raw };
}

// ─── Validation ───────────────────────────────────────────────────────────────
function validate(obj: unknown): { ok: true; copy: GeneratedCopy } | { ok: false; reason: string } {
  if (!obj || typeof obj !== "object") return { ok: false, reason: "not an object" };
  const o = obj as Record<string, unknown>;

  const isStr = (v: unknown, min = 1) => typeof v === "string" && v.trim().length >= min;
  const isStrArr = (v: unknown, min: number, max: number) =>
    Array.isArray(v) && v.length >= min && v.length <= max && v.every((x) => typeof x === "string" && x.trim().length > 0);

  if (!isStr(o.hero_headline)) return { ok: false, reason: "hero_headline missing" };
  if (!isStr(o.hero_subhead)) return { ok: false, reason: "hero_subhead missing" };
  if (!isStr(o.hero_cta_label)) return { ok: false, reason: "hero_cta_label missing" };
  if (!isStrArr(o.trust_strip, 3, 5)) return { ok: false, reason: "trust_strip must be 3–5 strings" };
  if (!isStr(o.services_intro)) return { ok: false, reason: "services_intro missing" };

  if (
    !Array.isArray(o.services) ||
    o.services.length < 4 ||
    o.services.length > 6 ||
    !o.services.every((s: unknown) => {
      const x = s as { name?: unknown; blurb?: unknown };
      return isStr(x?.name) && isStr(x?.blurb);
    })
  ) {
    return { ok: false, reason: "services must be 4–6 items with {name, blurb}" };
  }

  if (
    !Array.isArray(o.why_us) ||
    o.why_us.length !== 3 ||
    !o.why_us.every((s: unknown) => {
      const x = s as { title?: unknown; body?: unknown };
      return isStr(x?.title) && isStr(x?.body);
    })
  ) {
    return { ok: false, reason: "why_us must be exactly 3 items with {title, body}" };
  }

  if (!isStr(o.testimonial_quote)) return { ok: false, reason: "testimonial_quote missing" };
  if (!isStr(o.testimonial_author)) return { ok: false, reason: "testimonial_author missing" };

  if (
    !Array.isArray(o.faq) ||
    o.faq.length < 3 ||
    o.faq.length > 5 ||
    !o.faq.every((s: unknown) => {
      const x = s as { q?: unknown; a?: unknown };
      return isStr(x?.q) && isStr(x?.a);
    })
  ) {
    return { ok: false, reason: "faq must be 3–5 items with {q, a}" };
  }

  if (!isStr(o.service_area_line)) return { ok: false, reason: "service_area_line missing" };
  if (!isStr(o.meta_title)) return { ok: false, reason: "meta_title missing" };
  if (!isStr(o.meta_description)) return { ok: false, reason: "meta_description missing" };

  return { ok: true, copy: obj as GeneratedCopy };
}

// ─── Cost tracking ────────────────────────────────────────────────────────────
// DeepSeek V3 0324 pricing on OpenRouter: ~$0.20/M input, ~$0.80/M output.
const COST_IN_PER_MTOK = 0.2002;
const COST_OUT_PER_MTOK = 0.8001;

function costUsd(usage: Usage): number {
  const inTok = usage.prompt_tokens ?? 0;
  const outTok = usage.completion_tokens ?? 0;
  return (inTok / 1_000_000) * COST_IN_PER_MTOK + (outTok / 1_000_000) * COST_OUT_PER_MTOK;
}

// ─── Revalidate ───────────────────────────────────────────────────────────────
async function revalidate(slug: string) {
  if (argNoRevalidate || !REVALIDATE_SECRET) return;
  try {
    const res = await fetch(`https://${REVALIDATE_HOST}/api/revalidate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-revalidate-secret": REVALIDATE_SECRET,
      },
      body: JSON.stringify({ slug }),
    });
    if (!res.ok) console.warn(`    ⚠ revalidate ${slug} failed: ${res.status}`);
  } catch (e) {
    console.warn(`    ⚠ revalidate ${slug} error:`, (e as Error).message);
  }
}

// ─── Retry wrapper ────────────────────────────────────────────────────────────
async function generateWithRetry(lead: Lead, maxAttempts = 2) {
  let lastErr: string | null = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const { json, usage, raw } = await callDeepSeek(buildPrompt(lead));
      const check = validate(json);
      if (check.ok) return { copy: check.copy, usage, raw };
      lastErr = `validation failed: ${check.reason}`;
      if (argVerbose) console.log(`      attempt ${attempt} ${lastErr}`);
    } catch (e) {
      lastErr = (e as Error).message;
      if (argVerbose) console.log(`      attempt ${attempt} threw: ${lastErr}`);
    }
    // Small backoff between attempts.
    if (attempt < maxAttempts) await new Promise((r) => setTimeout(r, 1500));
  }
  throw new Error(lastErr ?? "unknown failure");
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  // Resolve target slug list.
  const explicitSlugs = argSlug
    ? [argSlug]
    : argSlugs
      ? argSlugs.split(",").map((s) => s.trim()).filter(Boolean)
      : null;

  let query = supabase
    .from("leads")
    .select(
      "id, slug, company_name, category, city, state, google_rating, review_count, services_offered, service_area, icp_summary, current_usps, content_gaps, generated_copy, template_variant"
    )
    .not("slug", "is", null);

  if (explicitSlugs) query = query.in("slug", explicitSlugs);
  if (argCategory) query = query.eq("category", argCategory);

  const { data, error } = await query;
  if (error) throw error;
  if (!data || data.length === 0) {
    console.log("No leads matched.");
    return;
  }

  const leads = data as Lead[];
  const targets = leads.filter((l) => argForce || !l.generated_copy);

  console.log(
    `Found ${leads.length} lead(s); ${targets.length} to process` +
      (argForce ? " [--force]" : "") +
      (argDryRun ? " [--dry-run]" : "") +
      ` [model=${MODEL}]`
  );
  if (targets.length === 0) {
    console.log("Nothing to do (all matched leads already have generated_copy). Use --force to regenerate.");
    return;
  }

  let ok = 0;
  let fail = 0;
  let totalUsd = 0;
  const perLeadCost: { slug: string; usd: number; usage: Usage }[] = [];

  for (const lead of targets) {
    const variant = resolveVariant(lead.slug, lead.template_variant);
    process.stdout.write(
      `  ${lead.slug.padEnd(32)} (${lead.company_name}, variant ${variant}) ... `
    );

    try {
      const { copy, usage, raw } = await generateWithRetry(lead);
      const usd = costUsd(usage);
      totalUsd += usd;
      perLeadCost.push({ slug: lead.slug, usd, usage });

      if (argDryRun) {
        console.log(`OK (dry-run, ${usage.prompt_tokens ?? 0}→${usage.completion_tokens ?? 0} tok, $${usd.toFixed(4)})`);
        console.log("    ─ preview ─");
        console.log(`      headline:      ${copy.hero_headline}`);
        console.log(`      subhead:       ${copy.hero_subhead}`);
        console.log(`      cta:           ${copy.hero_cta_label}`);
        console.log(`      trust_strip:   ${copy.trust_strip.join(" · ")}`);
        console.log(`      services (${copy.services.length}): ${copy.services.map((s) => s.name).join(", ")}`);
        console.log(`      testimonial:   "${copy.testimonial_quote}" — ${copy.testimonial_author}`);
        console.log(`      meta_title:    ${copy.meta_title}`);
        console.log(`      meta_desc:     ${copy.meta_description}`);
        if (argVerbose) {
          console.log("    ─ full JSON ─");
          console.log(JSON.stringify(copy, null, 2).split("\n").map((l) => "      " + l).join("\n"));
        }
        ok++;
        continue;
      }

      // Persist copy + variant + touch updated_at.
      const { error: upErr } = await supabase
        .from("leads")
        .update({
          generated_copy: copy,
          template_variant: variant,
          updated_at: new Date().toISOString(),
        })
        .eq("id", lead.id);
      if (upErr) throw upErr;

      await revalidate(lead.slug);

      console.log(`OK (${usage.prompt_tokens ?? 0}→${usage.completion_tokens ?? 0} tok, $${usd.toFixed(4)})`);
      ok++;
    } catch (e) {
      console.log(`FAIL — ${(e as Error).message}`);
      // Save raw output for post-mortem when it exists on the error path.
      fail++;
    }
  }

  console.log(`\nDone. ${ok} ok, ${fail} failed. Total spend: $${totalUsd.toFixed(4)}`);
  if (perLeadCost.length > 0) {
    const avg = totalUsd / perLeadCost.length;
    console.log(`Avg per lead: $${avg.toFixed(4)}. Projected 500-lead run: $${(avg * 500).toFixed(2)}.`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
