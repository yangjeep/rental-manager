# Rental Manager (Remix + Cloudflare Pages)

A fully serverless rental listings experience built with Remix and deployed natively on Cloudflare Pages. The site fetches listings directly from Airtable at request time and keeps optional R2-hosted photos in sync via a companion Worker.

## Quick Start

```bash
npm install
cp env.example .env
# Fill in AIRTABLE_* values and optional GOOGLE_MAPS_API_KEY

npm run dev
```

The development server runs on `http://localhost:5173` using Remix's Vite dev server with Cloudflare Workers compatibility.

### Environment Variables

Create a `.env` file with the following variables:

```bash
AIRTABLE_TOKEN=your_token_here
AIRTABLE_BASE_ID=your_base_id_here
AIRTABLE_INVENTORY_TABLE_NAME=Properties  # Optional, defaults to "Properties"
AIRTABLE_R2_IMAGE_FIELD=R2 Images         # Optional, defaults to "R2 Images"
GOOGLE_MAPS_API_KEY=your_key_here        # Optional, for map page
```

### Deploying to Cloudflare Pages

The repository uses Remix with Cloudflare Pages adapter for native deployment.

```bash
# Build for production
npm run build

# Deploy using wrangler
npm run deploy

# Or connect to Git in Cloudflare dashboard:
# Build command: npm run build
# Output directory: build/client
```

Set environment variables in the Cloudflare dashboard:
- Settings → Environment Variables
- Add: `AIRTABLE_TOKEN`, `AIRTABLE_BASE_ID`, `GOOGLE_MAPS_API_KEY`, etc.

## Architecture

- **Remix Routes** (`app/routes/`) — Server-rendered routes with loaders for data fetching
  - `_index.tsx` — Home page with listings grid and filters
  - `map.tsx` — Interactive map view with Google Maps
  - `apply.tsx` — Application form (Airtable iframe)
  - `about.tsx` — About page
  - `properties.$slug.tsx` — Property detail pages
  - `sitemap[.]xml.tsx` — Dynamic sitemap generation
- **Components** (`components/`) — Reusable React components
  - `FilterControls.tsx` — Progressive form-based filtering
  - `ListingCard.tsx` — Property card display
  - `MapView.tsx` — Google Maps integration
  - `Navigation.tsx` — Site navigation
  - `PropertyGallery.tsx` — Image gallery for property details
- **Libraries** (`lib/`)
  - `fetchListings.ts` — Airtable API integration
  - `types.ts` — TypeScript type definitions
  - `pages/shared.ts` — Shared constants and utilities
- **Styling** — Tailwind CSS with custom CSS variables in `app/styles/globals.css`

## Features

- ✅ Server-side data fetching from Airtable
- ✅ Progressive form-based filtering (works without JavaScript)
- ✅ Google Maps integration for property locations
- ✅ Dynamic sitemap generation
- ✅ Edge runtime optimized for Cloudflare Workers
- ✅ Type-safe environment variables
- ✅ Responsive design with Tailwind CSS

## Development

```bash
# Start dev server
npm run dev

# Type check
npm run typecheck

# Lint
npm run lint

# Build for production
npm run build
```

## Tech Stack

- **Framework**: Remix 2.15+
- **Runtime**: Cloudflare Workers/Pages
- **Styling**: Tailwind CSS
- **TypeScript**: Full type safety
- **Deployment**: Cloudflare Pages

## Migration Notes

This project was migrated from Next.js 14 to Remix for better Cloudflare Pages compatibility and native edge runtime support.
