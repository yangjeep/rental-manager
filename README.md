# Rentals Demo (Cloudflare Pages + TypeScript)

A fully serverless rental listings experience that runs natively on Cloudflare Pages
Functions. The site renders HTML using TypeScript templates, fetches listings directly
from Airtable at request time, and keeps optional R2-hosted photos in sync via a
companion Worker.

## Quick Start

```bash
npm install
cp env.example .env
# Fill in AIRTABLE_* values and optional DEMO_* secrets

# Requires `wrangler` (install via `npm install -g wrangler` or `brew install wrangler`)
npm run dev
```

The development server runs `wrangler pages dev public --compatibility-date=2024-12-18`
so you get the same runtime as production. Static assets live in `public/` (for example
`public/styles.css` and the placeholder images) and dynamic requests are handled by the
TypeScript functions in `functions/`.

### Deploying to Cloudflare Pages

The repository uses `wrangler.toml` to point Pages at the `public/` directory plus the
`functions/` folder. Any Cloudflare environment variable defined in the dashboard is
available to the TypeScript runtime via `context.env`.

```bash
wrangler login
wrangler pages deploy public --project-name <your-project>
```

`npm run build` and `npm run lint` both run `tsc --noEmit`, ensuring the codebase stays
type-safe during CI even though Pages is responsible for the actual bundling step.

## Runtime Architecture

- `functions/[[path]].ts` — Router that serves `/`, `/properties/:slug`, and `/sitemap.xml`
  with server-rendered HTML. It applies demo-only Basic Auth (`DEMO_USER`/`DEMO_PASS`)
  and optionally injects `X-Robots-Tag` when `DEMO_NOINDEX=true`.
- `lib/fetchListings.ts` — Airtable integration that maps table rows into strongly typed
  listings and reads Cloudflare R2 attachment URLs for imagery.
- `lib/templates.ts` — Zero-dependency HTML templates for the homepage, filters, cards,
  and property detail views.
- `public/styles.css` — Small handcrafted stylesheet (no Tailwind or PostCSS) that keeps
  the UI cohesive when rendered from the edge runtime.

## Datasource (Airtable)

Table name: `Properties` (configurable via `AIRTABLE_TABLE_NAME`).

### Required Fields

- `ID` — Unique identifier (string)
- `Title` — Property title
- `Monthly Rent` — Monthly rental price (number)
- `Bedrooms` — Number of bedrooms (number)
- `Bathrooms` — Number of bathrooms (number)
- `Status` — Availability status (e.g., "Available")
- `City` — City name
- `Address` — Full address
- `Description` — Property description

### Optional Fields

- `Slug` — URL-friendly identifier (auto-generated from Title if not provided)
- `Pets` — Pet policy (e.g., "Allowed", "Not Allowed", "Conditional")
- `Parking` — Parking information (free text like "1 spot" or "Street")
- `R2 Images` — Attachment field that stores Cloudflare R2 image URLs (preferred)

## Cloudflare R2 Image Automation

`workers/r2-sync` is an optional Cloudflare Worker that copies Google Drive assets into
R2 and patches the Airtable `R2 Images` attachment field so that the frontend can load
images from Cloudflare without touching Google infrastructure.

1. **Create Cloudflare resources**
   - Provision an R2 bucket (e.g., `rental-images`) and optional custom domain
     (populate `R2_PUBLIC_BASE_URL`).
   - Deploy the worker:
     ```bash
     cd workers/r2-sync
     wrangler deploy
     ```
   - Configure the worker bindings/secrets so it can talk to Airtable, your Apps Script
     endpoint, and the target R2 bucket.
2. **Wire Airtable automations**
   - Add an `Image Folder URL` field in Airtable (Drive folder link or ID).
   - Create an automation that fires when `Image Folder URL` changes (or on demand).
   - Add a "Run script" step that POSTs `{ "recordId": "recXXXX" }` to the Worker URL.
3. **Worker behaviour**
   - Looks up the Airtable record, enumerates the Drive folder, copies images into R2, and
     stores the new public URLs back inside the `R2 Images` attachment field.

With this in place the web UI always prefers the R2 attachment URLs, so Cloudflare serves
all media while letting Drive act as an optional source of truth.

## Environment Variables

```
AIRTABLE_TOKEN                # required Airtable API token
AIRTABLE_BASE_ID              # required base ID
AIRTABLE_TABLE_NAME           # defaults to "Properties"
AIRTABLE_R2_IMAGE_FIELD       # defaults to "R2 Images"
R2_PUBLIC_BASE_URL            # used by workers/r2-sync when writing back to Airtable
DEMO_USER / DEMO_PASS         # enable Basic Auth for previews
DEMO_NOINDEX                  # set to true to emit X-Robots-Tag headers
```

## Performance Testing

Lighthouse CI remains wired up via `npm run lighthouse` and `npm run lighthouse:local`.
Start the dev server (`npm run dev`) and then execute whichever Lighthouse script you
need. The helper in `scripts/generate-lighthouse-baseline.js` still captures new baselines
for CI gating.

## Tech

- Cloudflare Pages Functions (native Workers runtime)
- TypeScript-first templating (no React / Next.js)
- Airtable + Cloudflare R2 attachments
- Optional Cloudflare Worker for syncing Drive → R2
- Lighthouse CI for performance monitoring
