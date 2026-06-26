<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Project-specific gotchas

- **`middleware.ts` is dead.** This project uses `proxy.ts` (Next 16 rename). The exported function MUST be named `proxy`, not `middleware`. See `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`.
- **`params` is a Promise.** In any `page.tsx` you must `await params` before destructuring.
- **Tailwind v4 is CSS-first.** Theme tokens live inside `@theme inline` blocks in `app/globals.css`. There is no `tailwind.config.js`. Add new tokens via `--color-*`, `--font-*`, etc.
- **Wildcard subdomains.** Every prospect's site is `<slug>.preview.kickbord.com`. `proxy.ts` rewrites this to `/_sites/[slug]` internally; never link to `/_sites/...` from user-facing UI.
- **Server-only secrets.** `SUPABASE_SERVICE_ROLE_KEY`, `OPENROUTER_API_KEY`, and `REVALIDATE_SECRET` are server-only. Never import `lib/supabase.ts` (server client) into a `"use client"` component.
- **Templates render from `lead.generated_copy`.** If a field is missing, the template falls back to safe defaults — see the `withFallbacks` helper in each template. Always run `npm run generate-copy --slug <slug>` after meaningful changes to ICP / positioning data.
