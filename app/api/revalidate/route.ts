import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * On-demand revalidation.
 *
 * Usage:
 *   curl -X POST https://preview.kickbord.com/api/revalidate \
 *        -H "x-revalidate-secret: $REVALIDATE_SECRET" \
 *        -H "content-type: application/json" \
 *        -d '{"slug": "ef-oxnard-oxn"}'
 *
 * Wire this into the DeepSeek copy generator so every time a lead's
 * `generated_copy` changes, the static page rebuilds within seconds.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "REVALIDATE_SECRET not configured" },
      { status: 500 }
    );
  }
  if (req.headers.get("x-revalidate-secret") !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  let body: { slug?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const slug = body.slug?.trim();
  if (!slug) {
    return NextResponse.json({ error: "slug is required" }, { status: 400 });
  }
  revalidatePath(`/_sites/${slug}`);
  return NextResponse.json({ revalidated: true, slug });
}
