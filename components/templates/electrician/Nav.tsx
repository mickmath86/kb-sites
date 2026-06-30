"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { Lead, GeneratedCopy } from "@/lib/supabase";
import type { VariantTheme } from "@/lib/variant";
import { BookingButton } from "@/components/BookingButton";

/**
 * Top navigation: logo + page links + phone + CTA.
 *
 * Renders inside the sticky header. On mobile collapses to a hamburger
 * that expands the link list into a fly-down panel.
 *
 * Active-link state is derived from usePathname() against the public-facing
 * paths (`/`, `/services`, `/contact`). The proxy rewrites these to
 * /s/[slug]/... internally but the browser URL stays clean.
 */
export function Nav({
  lead,
  copy,
  theme,
  accentBtnClasses,
  badgeShape,
  BoltMark,
}: {
  lead: Lead;
  copy: GeneratedCopy;
  theme: VariantTheme;
  accentBtnClasses: string;
  badgeShape: "pill" | "square";
  // Pass the bolt icon in so we don't re-import shared.tsx (this is "use client").
  BoltMark: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const links = [
    { href: "/", label: "Home" },
    { href: "/services", label: "Services" },
    { href: "/contact", label: "Contact" },
  ];

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname?.startsWith(href);

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 outline-none">
          <div
            className={`flex h-9 w-9 items-center justify-center text-white ${theme.accent.bg} ${
              badgeShape === "pill" ? "rounded-full" : "rounded-md"
            }`}
          >
            {BoltMark}
          </div>
          <div className="text-lg font-bold tracking-tight text-zinc-900">
            {lead.company_name}
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`relative rounded-md px-3 py-2 text-sm font-medium transition ${
                isActive(l.href)
                  ? `${theme.accent.text}`
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              {l.label}
              {isActive(l.href) && (
                <span
                  className={`absolute inset-x-3 -bottom-px h-0.5 ${theme.accent.bg}`}
                  aria-hidden
                />
              )}
            </Link>
          ))}
        </nav>

        {/* Right: phone + CTA (desktop) */}
        <div className="hidden items-center gap-3 sm:flex">
          {lead.phone && (
            <a
              href={`tel:${lead.phone}`}
              className="text-sm font-semibold text-zinc-700 hover:text-zinc-900"
            >
              {lead.phone}
            </a>
          )}
          <BookingButton
            label={copy.hero_cta_label}
            variant="primary"
            leadId={lead.id}
            slug={lead.slug}
            source="header"
            accentClasses={accentBtnClasses}
          />
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-zinc-200 text-zinc-700 md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {open ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </>
            ) : (
              <>
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            )}
          </svg>
        </button>
      </div>

      {/* Mobile fly-down */}
      {open && (
        <div className="border-t border-zinc-200 bg-white md:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3 sm:px-6" aria-label="Primary mobile">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-md px-3 py-2 text-base font-medium ${
                  isActive(l.href)
                    ? `${theme.accent.bgSoft} ${theme.accent.text}`
                    : "text-zinc-700 hover:bg-zinc-50"
                }`}
                onClick={() => setOpen(false)}
              >
                {l.label}
              </Link>
            ))}
            {lead.phone && (
              <a
                href={`tel:${lead.phone}`}
                className="mt-2 rounded-md border border-zinc-200 px-3 py-2 text-center text-base font-semibold text-zinc-900 hover:bg-zinc-50"
              >
                Call {lead.phone}
              </a>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
