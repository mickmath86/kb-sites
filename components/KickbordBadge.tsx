import Link from "next/link";
import { KICKBORD } from "@/lib/constants";

/**
 * Small "Built with Kickbord" badge that shows in the footer of every preview site.
 * Doubles as outbound marketing for Kickbord itself.
 */
export function KickbordBadge() {
  return (
    <Link
      href={KICKBORD.pitchUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-full border border-zinc-800/60 bg-black/80 px-3 py-1.5 text-xs font-medium text-zinc-200 backdrop-blur transition hover:border-amber-400/60 hover:text-amber-300"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
      Built with {KICKBORD.brandName}
    </Link>
  );
}
