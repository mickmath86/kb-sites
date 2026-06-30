import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getServerSupabase } from "@/lib/supabase";

/**
 * POST /api/contact
 *
 * Persists prospect inquiries from the per-lead contact page and (when
 * GHL_CONTACT_WEBHOOK_URL is configured) fans the payload out to GoHighLevel.
 *
 * The webhook is intentionally a no-op when the env var is unset so the
 * preview sites can collect leads into Supabase before the GHL workflow is
 * wired up.
 *
 * Payload (JSON):
 *   {
 *     lead_id: string (uuid)              required
 *     slug: string                         required
 *     name: string                         required
 *     email: string                        required
 *     phone?: string|null
 *     service_interest?: string|null       // selected from the lead's services
 *     service_interest_other?: string|null // free-text when "Other / not sure"
 *     message?: string|null
 *   }
 */

type Payload = {
  lead_id?: string;
  slug?: string;
  name?: string;
  email?: string;
  phone?: string | null;
  service_interest?: string | null;
  service_interest_other?: string | null;
  message?: string | null;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clean(s: string | null | undefined, max = 2000): string | null {
  if (!s) return null;
  const trimmed = s.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

function getClientIp(req: NextRequest): string | null {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]?.trim() || null;
  return req.headers.get("x-real-ip") ?? null;
}

export async function POST(req: NextRequest) {
  let body: Payload;
  try {
    body = (await req.json()) as Payload;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const lead_id = clean(body.lead_id, 64);
  const slug = clean(body.slug, 128);
  const name = clean(body.name, 200);
  const email = clean(body.email, 200);
  const phone = clean(body.phone ?? null, 80);
  const service_interest = clean(body.service_interest ?? null, 200);
  const service_interest_other = clean(body.service_interest_other ?? null, 200);
  const message = clean(body.message ?? null, 5000);

  if (!lead_id || !slug || !name || !email) {
    return NextResponse.json(
      { error: "lead_id, slug, name, and email are required" },
      { status: 400 }
    );
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "invalid email" }, { status: 400 });
  }

  const ip_address = getClientIp(req);
  const user_agent = clean(req.headers.get("user-agent"), 500);

  // Fan out to GHL first so we can record the webhook status alongside the row.
  let ghl_webhook_status: string | null = null;
  let ghl_webhook_error: string | null = null;
  const webhookUrl = process.env.GHL_CONTACT_WEBHOOK_URL;
  if (webhookUrl) {
    try {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          source: "kickbord-preview-site",
          lead_id,
          slug,
          name,
          email,
          phone,
          service_interest,
          service_interest_other,
          message,
          submitted_at: new Date().toISOString(),
        }),
        // Short timeout so a slow GHL endpoint doesn't hang the form.
        signal: AbortSignal.timeout(8000),
      });
      ghl_webhook_status = String(res.status);
      if (!res.ok) {
        ghl_webhook_error = (await res.text().catch(() => "")).slice(0, 500) || null;
      }
    } catch (err) {
      ghl_webhook_status = "error";
      ghl_webhook_error = (err instanceof Error ? err.message : String(err)).slice(0, 500);
    }
  } else {
    ghl_webhook_status = "not_configured";
  }

  // Persist to Supabase. Failures here are user-visible because we have no
  // other durable store for the submission.
  try {
    const supabase = getServerSupabase();
    const { error } = await supabase.from("contact_submissions").insert({
      lead_id,
      slug,
      name,
      email,
      phone,
      service_interest,
      service_interest_other,
      message,
      ip_address,
      user_agent,
      ghl_webhook_status,
      ghl_webhook_error,
    });
    if (error) {
      console.error("contact_submissions insert failed", error);
      return NextResponse.json(
        { error: "Could not save your message. Please try again or call us." },
        { status: 500 }
      );
    }
  } catch (err) {
    console.error("contact_submissions insert threw", err);
    return NextResponse.json(
      { error: "Could not save your message. Please try again or call us." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, ghl_webhook_status });
}
