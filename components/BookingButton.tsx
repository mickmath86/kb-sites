"use client";
import { useState } from "react";
import { GHL_BOOKING_URL } from "@/lib/constants";
import { trackCta } from "./PostHogProvider";

export function BookingButton({
  label,
  variant = "primary",
  leadId,
  slug,
  source,
}: {
  label: string;
  variant?: "primary" | "secondary";
  leadId: string;
  slug: string;
  source: string;
}) {
  const [open, setOpen] = useState(false);

  const base =
    "inline-flex items-center justify-center rounded-md font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950";
  const sizes = "h-12 px-6 text-base";
  const styles =
    variant === "primary"
      ? "bg-amber-400 text-zinc-950 hover:bg-amber-300 shadow-lg shadow-amber-500/20"
      : "border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50";

  return (
    <>
      <button
        type="button"
        className={`${base} ${sizes} ${styles}`}
        onClick={() => {
          trackCta("preview_cta_click", {
            lead_id: leadId,
            slug,
            source,
            label,
          });
          setOpen(true);
        }}
      >
        {label}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative h-[80vh] w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="absolute right-3 top-3 z-10 rounded-full bg-white/90 px-3 py-1 text-sm font-medium text-zinc-700 shadow hover:bg-white"
              onClick={() => setOpen(false)}
              aria-label="Close booking widget"
            >
              ✕
            </button>
            <iframe
              src={GHL_BOOKING_URL}
              className="h-full w-full border-0"
              title="Book a call"
              onLoad={() => {
                trackCta("preview_booking_opened", {
                  lead_id: leadId,
                  slug,
                  source,
                });
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}
