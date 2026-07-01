# scripts/

Local Node scripts for the Kickbord template factory. Run with `npx tsx`.

## generate-copy.ts

Generates the `leads.generated_copy` JSONB for each lead using DeepSeek V3
via OpenRouter, and persists `template_variant` (A/B/C, deterministic from
slug hash) so postcards can reference the assigned variant directly.

### Setup (one time)

```bash
cd kb-sites
cp .env.example .env.local
# Fill in:
#   NEXT_PUBLIC_SUPABASE_URL       (already set for you in .env.example)
#   SUPABASE_SERVICE_ROLE_KEY      (Supabase → Project Settings → API → service_role)
#   OPENROUTER_API_KEY             (openrouter.ai → Keys)
#   REVALIDATE_SECRET              (paste the value from Vercel env, listed below)
```

Current `REVALIDATE_SECRET` (used to trigger on-demand revalidation after
copy writes):

```
078d52004b2d6d475eb108008ea4c6021d711e2931b21df9556c488a665308f4
```

### Common commands

```bash
# 1. Dry-run for the 5 electrician pilot leads (prints preview, no writes)
npx tsx scripts/generate-copy.ts \
  --slugs e-f-oxnard-oxn,electrician-pros-thousand-to,dnz-electrical-ah,provolt-electric-cam,priority-electric-wv \
  --dry-run

# 2. Verbose dry-run (dumps the full JSON per lead)
npx tsx scripts/generate-copy.ts --slug e-f-oxnard-oxn --dry-run --verbose

# 3. Real run for the 5 pilot electricians (writes + revalidates)
npx tsx scripts/generate-copy.ts \
  --slugs e-f-oxnard-oxn,electrician-pros-thousand-to,dnz-electrical-ah,provolt-electric-cam,priority-electric-wv

# 4. Generate for one lead
npx tsx scripts/generate-copy.ts --slug e-f-oxnard-oxn

# 5. Generate for every electrician lead missing copy
npx tsx scripts/generate-copy.ts --category electrician

# 6. Force re-generate even if generated_copy already exists
npx tsx scripts/generate-copy.ts --category electrician --force

# 7. Batch run without revalidating (useful for large batches; revalidate later)
npx tsx scripts/generate-copy.ts --category electrician --no-revalidate
```

### Flags

| Flag                   | Description                                                                    |
| ---------------------- | ------------------------------------------------------------------------------ |
| `--slug <slug>`        | Target a single lead by slug                                                   |
| `--slugs <a,b,c>`      | Comma-separated slug list                                                      |
| `--category <cat>`     | Filter by category (`electrician`, `hvac_contractor`, `plumber`)               |
| `--force`              | Regenerate even if `generated_copy` is already populated                       |
| `--dry-run`            | Print preview per lead, do NOT write to Supabase                               |
| `--no-revalidate`      | Skip the POST to `/api/revalidate` after writing                               |
| `--verbose`            | Dump full JSON and per-attempt errors                                          |

### What gets written

For each lead the script updates three columns:

- `generated_copy` — the full JSON schema (hero, services, why_us, faq, meta, …)
- `template_variant` — `"A"`, `"B"`, or `"C"` from the slug hash
- `updated_at` — bumped so the site rebuild picks it up

Then it POSTs `{ "slug": "<slug>" }` to
`https://kb-sites-sooty.vercel.app/api/revalidate` with the
`x-revalidate-secret` header, which triggers Next's on-demand revalidation
for that page.

### Cost

At current DeepSeek V3 0324 pricing on OpenRouter
(~$0.20/M input, ~$0.80/M output), each lead runs about
**$0.001–$0.003**. A 500-lead batch is roughly **$0.50–$1.50**.

Every run prints the actual cost per lead plus a projected 500-lead spend.

### Retry / validation

If the model returns malformed JSON or a shape that fails schema validation
(e.g. wrong number of `services`, missing `hero_headline`), the script
retries once with a 1.5s backoff. If the second attempt also fails, it logs
the failure and moves on — a failed lead is skipped, not aborted.

Use `--verbose` to see the exact validation reason on each failed attempt.

### Choosing the model

Set `DEEPSEEK_MODEL` in `.env.local` to override the default. Options:

| Model ID                                | Notes                                                    |
| --------------------------------------- | -------------------------------------------------------- |
| `deepseek/deepseek-chat-v3-0324`        | **Default.** Pinned V3, best price/quality.              |
| `deepseek/deepseek-chat`                | Rolling alias — always latest V3.                        |
| `deepseek/deepseek-r1`                  | Reasoning model, 5–6× cost. Overkill for this task.      |
| `deepseek/deepseek-chat-v3-0324:free`   | Free tier with strict rate limits. Not for batch runs.   |

### Troubleshooting

- **"Missing OPENROUTER_API_KEY"** — add the key to `.env.local`.
- **"OpenRouter 401"** — key is invalid or has zero credits. Top up at openrouter.ai/credits.
- **"validation failed: services must be 4–6 items"** — the model went off-schema.
  The script auto-retries once; if it keeps failing, run with `--verbose` to see
  the raw output.
- **`revalidate ... failed: 401`** — `REVALIDATE_SECRET` in `.env.local`
  doesn't match Vercel. Copy the value listed above into `.env.local`.
