import type { Lead, GeneratedCopy } from "@/lib/supabase";
import type { VariantTheme } from "@/lib/variant";
import { PostHogProvider } from "@/components/PostHogProvider";
import { Header, Footer } from "./shared";
import type { ImageAsset } from "@/lib/images";

/**
 * Wraps a sub-page (Services, Contact) with the shared Header + Footer
 * tied to the lead's resolved variant theme. Children render between them.
 */
export function PageShell({
  lead,
  copy,
  theme,
  credits,
  children,
}: {
  lead: Lead;
  copy: GeneratedCopy;
  theme: VariantTheme;
  credits: ImageAsset[] | { photographer: string; photographer_url: string }[];
  children: React.ReactNode;
}) {
  // Normalize credits — accept either ImageAsset[] or the credit shape
  const flatCredits = credits.map((c) =>
    "photographer" in c && "photographer_url" in c
      ? { photographer: c.photographer, photographer_url: c.photographer_url }
      : (c as ImageAsset)
  ) as { photographer: string; photographer_url: string }[];

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <PostHogProvider leadId={lead.id} slug={lead.slug} category={lead.category} />
      <Header lead={lead} copy={copy} theme={theme} />
      {children}
      <Footer lead={lead} credits={flatCredits} theme={theme} />
    </div>
  );
}
