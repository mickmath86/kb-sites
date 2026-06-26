import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";

/**
 * TEMPORARY diagnostic endpoint. Reports which env vars are set
 * (without exposing values) and attempts a Supabase round-trip
 * using the same columns the production page uses.
 *
 * REMOVE this file once Phase 2 validation is complete.
 *
 * Visit: https://kb-sites-sooty.vercel.app/api/debug
 */
const SAMPLE_COLUMNS =
  "id, slug, company_name, category, phone, formatted_address, city, generated_copy";

export async function GET() {
  const checks = {
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_URL_value_preview:
      process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 30) ?? null,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_SERVICE_ROLE_KEY_length:
      process.env.SUPABASE_SERVICE_ROLE_KEY?.length ?? 0,
    NEXT_PUBLIC_PREVIEW_ROOT_DOMAIN:
      process.env.NEXT_PUBLIC_PREVIEW_ROOT_DOMAIN ?? null,
    OPENROUTER_API_KEY: !!process.env.OPENROUTER_API_KEY,
    REVALIDATE_SECRET: !!process.env.REVALIDATE_SECRET,
    NEXT_PUBLIC_POSTHOG_KEY: !!process.env.NEXT_PUBLIC_POSTHOG_KEY,
  };

  let supabaseTest: {
    ok: boolean;
    error?: string;
    found?: boolean;
    company?: string | null;
    category?: string | null;
  };

  try {
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from("leads")
      .select(SAMPLE_COLUMNS)
      .eq("slug", "e-f-oxnard-oxn")
      .maybeSingle();

    if (error) {
      supabaseTest = { ok: false, error: error.message };
    } else {
      supabaseTest = {
        ok: true,
        found: !!data,
        company: data?.company_name ?? null,
        category: data?.category ?? null,
      };
    }
  } catch (err) {
    supabaseTest = {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }

  return NextResponse.json(
    {
      env: checks,
      supabaseTest,
      runtime: "nodejs",
      timestamp: new Date().toISOString(),
    },
    { headers: { "cache-control": "no-store" } }
  );
}
