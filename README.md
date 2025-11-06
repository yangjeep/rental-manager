# Rentals Demo (Next.js + Google Sheets)

A ready-to-deploy demo environment for a rental listings website.

## Quick Start

```bash
npm install
cp .env.example .env.local
# Edit NEXT_PUBLIC_LISTINGS_URL (Google Apps Script deploy URL)
npm run dev
```

Deploy to Vercel and set the same env vars in Project Settings.

## Datasource (Google Sheets → Apps Script)

Sheet name: `Listings`
Headers: `ID | Title | Slug | Price | City | Bedrooms | Status | ImageURL | Description | Address`

`/scripts/apps_script.gs` contains the doGet() script. Deploy as a Web App with "Anyone" access.

## Security / Demo

- Basic Auth is enabled via `middleware.ts` using `DEMO_USER`/`DEMO_PASS`.
- `DEMO_NOINDEX=true` adds `X-Robots-Tag: noindex, nofollow`.
- For production, remove `robots.txt` block and set `DEMO_NOINDEX=false`.

## Revalidate

- ISR is set via `REVALIDATE_SECONDS` (default 60 for preview).
- Manual revalidate endpoint: `/api/revalidate?secret=...` with env `REVALIDATE_SECRET`.

## Tech

- Next.js App Router
- Tailwind CSS
- No backend server needed

### New Columns (optional but supported)

- `Parking` — accepts "Yes/No", "True/False", "1/0", or free text like "1 spot", "Street".
- `Pets` — recommended values: "Allowed" / "Not Allowed" / "Conditional".
- `UtilitiesIncluded` — comma-separated list, e.g., `Heat, Water, Electricity`.
- `ImageURLs` — comma- or newline-separated image URLs for the gallery. First image will be used as the cover.
