"use client";

import { useState, useTransition } from "react";
import type { VariantTheme } from "@/lib/variant";
import { trackCta } from "@/components/PostHogProvider";

/**
 * Contact form for the prospect preview site.
 *
 * Submits to /api/contact (server route fans out to GHL webhook + Supabase).
 * Service-interest dropdown is built from the lead's own services list with
 * an "Other / not sure yet" fallback that reveals a free-text input.
 *
 * Theme-aware: accent colors come from the resolved variant.
 */
export function ContactForm({
  leadId,
  slug,
  services,
  theme,
  accentBtnClasses,
}: {
  leadId: string;
  slug: string;
  services: { name: string }[];
  theme: VariantTheme;
  accentBtnClasses: string;
}) {
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<
    | { kind: "idle" }
    | { kind: "ok" }
    | { kind: "error"; message: string }
  >({ kind: "idle" });

  const [service, setService] = useState<string>(services[0]?.name ?? "Other");
  const [serviceOther, setServiceOther] = useState("");
  const showOther = service === "__other__";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus({ kind: "idle" });
    const form = e.currentTarget;
    const fd = new FormData(form);

    const payload = {
      lead_id: leadId,
      slug,
      name: String(fd.get("name") ?? "").trim(),
      email: String(fd.get("email") ?? "").trim(),
      phone: String(fd.get("phone") ?? "").trim() || null,
      service_interest: service === "__other__" ? null : service,
      service_interest_other:
        service === "__other__" ? serviceOther.trim() || null : null,
      message: String(fd.get("message") ?? "").trim() || null,
    };

    if (!payload.name || !payload.email) {
      setStatus({ kind: "error", message: "Please share your name and email." });
      return;
    }

    trackCta("contact_form_submit", {
      lead_id: leadId,
      slug,
      service_interest: payload.service_interest ?? payload.service_interest_other ?? "unknown",
    });

    startTransition(async () => {
      try {
        const res = await fetch("/api/contact", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { error?: string };
          setStatus({
            kind: "error",
            message: body.error ?? "We hit an error sending your message. Please call us instead.",
          });
          return;
        }
        setStatus({ kind: "ok" });
        form.reset();
        setService(services[0]?.name ?? "__other__");
        setServiceOther("");
      } catch {
        setStatus({
          kind: "error",
          message: "Could not reach our server. Please try again or call us.",
        });
      }
    });
  }

  if (status.kind === "ok") {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
        <div
          className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${theme.accent.bgSoft} ${theme.accent.text}`}
        >
          <svg
            viewBox="0 0 24 24"
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-zinc-900">Got it — message received.</h3>
        <p className="mt-2 text-zinc-600">
          We&apos;ll be in touch shortly. If it&apos;s urgent, give us a call.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" name="name" type="text" required autoComplete="name" theme={theme} />
        <Field label="Email" name="email" type="email" required autoComplete="email" theme={theme} />
        <Field label="Phone" name="phone" type="tel" autoComplete="tel" theme={theme} />
        <SelectField
          label="What can we help with?"
          name="service_interest"
          value={service}
          onChange={setService}
          options={[
            ...services.map((s) => ({ value: s.name, label: s.name })),
            { value: "__other__", label: "Other / not sure yet" },
          ]}
          theme={theme}
        />
      </div>

      {showOther && (
        <div className="mt-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-zinc-700">
              Tell us a bit more
            </span>
            <input
              type="text"
              value={serviceOther}
              onChange={(e) => setServiceOther(e.target.value)}
              placeholder="e.g. Hot tub wiring, flickering lights, EV charger"
              className={`w-full rounded-md border border-zinc-300 bg-white px-3 py-2.5 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 ${focusRingFor(theme)}`}
            />
          </label>
        </div>
      )}

      <label className="mt-4 block">
        <span className="mb-1 block text-sm font-medium text-zinc-700">
          Message <span className="text-zinc-400">(optional)</span>
        </span>
        <textarea
          name="message"
          rows={4}
          placeholder="Anything we should know before we reach out?"
          className={`w-full resize-y rounded-md border border-zinc-300 bg-white px-3 py-2.5 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 ${focusRingFor(theme)}`}
        />
      </label>

      {status.kind === "error" && (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {status.message}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className={`mt-6 inline-flex h-12 w-full items-center justify-center rounded-md font-semibold transition disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto sm:px-8 ${accentBtnClasses}`}
      >
        {pending ? "Sending…" : "Send message"}
      </button>
      <p className="mt-3 text-xs text-zinc-500">
        We&apos;ll never share your info. Free quotes only — no spam.
      </p>
    </form>
  );
}

function focusRingFor(theme: VariantTheme): string {
  // Pick a static focus ring class per accent so Tailwind JIT sees the literal.
  if (theme.accent.bg === "bg-amber-400") return "focus:ring-amber-400/40";
  if (theme.accent.bg === "bg-indigo-600") return "focus:ring-indigo-500/40";
  if (theme.accent.bg === "bg-orange-600") return "focus:ring-orange-500/40";
  return "focus:ring-zinc-400/40";
}

function Field({
  label,
  name,
  type = "text",
  required,
  autoComplete,
  theme,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
  theme: VariantTheme;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-zinc-700">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </span>
      <input
        type={type}
        name={name}
        required={required}
        autoComplete={autoComplete}
        className={`w-full rounded-md border border-zinc-300 bg-white px-3 py-2.5 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 ${focusRingFor(theme)}`}
      />
    </label>
  );
}

function SelectField({
  label,
  name,
  value,
  onChange,
  options,
  theme,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  theme: VariantTheme;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-zinc-700">{label}</span>
      <select
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-md border border-zinc-300 bg-white px-3 py-2.5 text-zinc-900 focus:outline-none focus:ring-2 ${focusRingFor(theme)}`}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
