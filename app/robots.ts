import type { MetadataRoute } from "next";

/**
 * Preview-only sites: disallow indexing across the board.
 * Once a prospect converts and the site goes live, we'll switch to per-host
 * robots based on the slug's go-live flag.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", disallow: "/" }],
  };
}
