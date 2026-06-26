# kb-sites — Kickbord preview template factory

One Next.js app that serves a personalized preview website for every Kickbord prospect at:

```
<slug>.sites.kickbord.com
```

Each preview is a static HTML page, generated once, served from Vercel's edge, and driven entirely by the prospect's row in `leads` in Supabase (`kb-smb-outreach`).

## Stack

- Next.js 16 (App Router, `proxy.ts` for wildcard subdomain routing)
- React 19 + Tailwind v4 (CSS-first config)
- Supabase Postgres (`leads.slug`, `leads.generated_copy`)
- DeepSeek V3 via OpenRouter (one-time copy generation per lead)
- PostHog (preview_page_view, preview_cta_click, preview_booking_opened)
- GoHighLevel (booking widget iframe)

## How a preview renders

1. Visitor hits `ef-oxnard-oxn.sites.kickbord.com`.
2. `proxy.ts` reads the host, extracts the subdomain (`ef-oxnard-oxn`), and rewrites internally to `/_sites/ef-oxnard-oxn`.
3. `app/_sites/[slug]/page.tsx` fetches the lead by slug, picks the right trade template, and renders.
4. Page is static (`revalidate = 300`). New leads added later are built on-demand and cached.
5. Updating a lead's copy triggers `/api/revalidate` to rebuild that one page within seconds.

## Local setup

```bash
cp .env.example .env.local
# fill in the Supabase + OpenRouter + PostHog + REVALIDATE_SECRET values
npm install
npm run dev
```

Two ways to test a preview locally:

- **Query param shortcut** — `http://localhost:3000/?slug=ef-oxnard-oxn` (proxy detects localhost and rewrites internally).
- **Real subdomain on localhost** — add to `/etc/hosts`:
  ```
  127.0.0.1 ef-oxnard-oxn.sites.localhost
  ```
  then visit `http://ef-oxnard-oxn.sites.localhost:3000`.

## Generate copy for prospects

`generated_copy` is a JSONB column populated by DeepSeek V3 once per lead.

```bash
# Generate for every lead in a category that's missing copy
npm run generate-copy -- --category electrician

# Generate for one lead, even if copy already exists
npm run generate-copy -- --slug ef-oxnard-oxn --force

# Generate for everyone missing copy
npm run generate-copy
```

The script also pings `/api/revalidate` so the static page rebuilds within seconds (no full redeploy needed).

## Deploy to Vercel

1. **Connect repo** — `mickmath86/kb-sites`, main branch.
2. **Add env vars** (all from `.env.example`):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server only)
   - `NEXT_PUBLIC_POSTHOG_KEY`
   - `NEXT_PUBLIC_POSTHOG_HOST`
   - `OPENROUTER_API_KEY` (only needed if running the generator on Vercel)
   - `REVALIDATE_SECRET` (any random string)
   - `NEXT_PUBLIC_PREVIEW_ROOT_DOMAIN` = `sites.kickbord.com`
3. **Wildcard domain** — Vercel → Domains → add `*.sites.kickbord.com` and `sites.kickbord.com`. Vercel will give you the CNAME to point your DNS at.
4. **DNS** — at your registrar/DNS provider, add:
   - `sites.kickbord.com` → `cname.vercel-dns.com`
   - `*.sites.kickbord.com` → `cname.vercel-dns.com`

After deploy, visit any prospect's preview at `<slug>.sites.kickbord.com`.

## Schema

`public.leads` columns used by the previews:

| Column | Type | Purpose |
|---|---|---|
| `id` | uuid | Identifier (used in PostHog events) |
| `slug` | text unique | Subdomain |
| `company_name` | text | Header + footer |
| `category` | text | Picks the trade template |
| `phone`, `address`, `city` | text | Header, footer, tel: links |
| `google_rating`, `review_count` | num/int | Hero rating card |
| `current_website` | text | Reference only (we replace it) |
| `icp_summary`, `recommended_site_angle` | text | Fed to DeepSeek as positioning |
| `generated_copy` | jsonb | All hero/services/why/faq/meta copy |

Schema for `generated_copy` is the `GeneratedCopy` type in `lib/supabase.ts`.

## Adding more trade templates

Templates live in `components/templates/`. Add e.g. `HvacTemplate.tsx`, then in `app/_sites/[slug]/page.tsx` route the new category to it. The `generated_copy` schema is shared across trades — the differences live in template visuals and the trade-specific widgets (e.g. `ElectricianEstimator.tsx`).
