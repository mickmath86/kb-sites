"use client";
import { useEffect } from "react";
import posthog from "posthog-js";

export function PostHogProvider({
  leadId,
  slug,
  category,
}: {
  leadId: string;
  slug: string;
  category: string;
}) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;
    if (!key) return; // analytics disabled when key not set
    if (!posthog.__loaded) {
      posthog.init(key, {
        api_host: host ?? "https://us.i.posthog.com",
        capture_pageview: false, // we send a custom event with lead context
        capture_pageleave: true,
        person_profiles: "identified_only",
      });
    }
    posthog.capture("preview_page_view", {
      lead_id: leadId,
      slug,
      category,
    });
  }, [leadId, slug, category]);
  return null;
}

export function trackCta(name: string, props: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  // posthog may not be loaded if no key; guard
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ph = (posthog as any);
  if (ph && ph.__loaded) {
    posthog.capture(name, props);
  }
}
