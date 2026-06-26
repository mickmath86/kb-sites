"use client";
import { useMemo, useState } from "react";
import { trackCta } from "./PostHogProvider";

/**
 * Quick ballpark cost estimator for an electrician site.
 * Numbers are intentionally wide ranges so the user always books a
 * real visit for an exact quote.
 *
 * Source ranges: Ventura County market averages, Q2 2026.
 */
const SERVICES: Record<
  string,
  { label: string; min: number; max: number; unit?: string }
> = {
  outlet: { label: "Add a new outlet", min: 150, max: 350 },
  ceiling_fan: { label: "Ceiling fan install", min: 175, max: 450 },
  ev_charger: { label: "EV charger (Level 2) install", min: 1200, max: 2800 },
  panel_upgrade: { label: "Panel upgrade (200A)", min: 2500, max: 6500 },
  recessed_lights: {
    label: "Recessed lighting (per 6-light set)",
    min: 600,
    max: 1200,
  },
  diagnostic: { label: "Diagnostic service call", min: 95, max: 175 },
  whole_home_rewire: {
    label: "Whole-home rewire (avg 2,000 sqft)",
    min: 12000,
    max: 25000,
  },
};

export function ElectricianEstimator({
  leadId,
  slug,
  phone,
}: {
  leadId: string;
  slug: string;
  phone?: string | null;
}) {
  const [service, setService] = useState<keyof typeof SERVICES>("ev_charger");
  const cfg = useMemo(() => SERVICES[service], [service]);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-700">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        Free ballpark estimate
      </div>
      <h3 className="text-2xl font-bold tracking-tight text-zinc-900">
        What might my project cost?
      </h3>
      <p className="mt-2 text-sm text-zinc-600">
        Pick a service for a typical Ventura County price range. Final price
        depends on your home and we&apos;ll quote it free on the call.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-zinc-700">
            Service
          </span>
          <select
            value={service}
            onChange={(e) => {
              const v = e.target.value as keyof typeof SERVICES;
              setService(v);
              trackCta("estimator_service_change", {
                lead_id: leadId,
                slug,
                service: v,
              });
            }}
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2.5 text-zinc-900 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/30"
          >
            {Object.entries(SERVICES).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
        </label>

        <div className="block">
          <span className="mb-1 block text-sm font-medium text-zinc-700">
            Typical range
          </span>
          <div className="flex h-[42px] items-center rounded-md border border-zinc-200 bg-zinc-50 px-3 text-lg font-semibold tabular-nums text-zinc-900">
            ${cfg.min.toLocaleString()} – ${cfg.max.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        {phone && (
          <a
            href={`tel:${phone}`}
            onClick={() =>
              trackCta("estimator_phone_click", { lead_id: leadId, slug })
            }
            className="inline-flex h-11 items-center justify-center rounded-md border border-zinc-300 bg-white px-5 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
          >
            Call {phone}
          </a>
        )}
        <p className="text-xs text-zinc-500">
          Ranges are estimates only. Permits, materials, and existing wiring may
          shift the final price.
        </p>
      </div>
    </div>
  );
}
