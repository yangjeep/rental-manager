# Remix Migration Plan

## Executive Summary

Migrate from **Next.js 14 + @cloudflare/next-on-pages** to **Remix with native Cloudflare Pages support**.

**Why Migrate?**

- ✅ Official Cloudflare support (no adapter hacks)
- ✅ Better edge runtime compatibility
- ✅ Simpler deployment process
- ✅ Progressive enhancement for forms
- ✅ Better performance on Cloudflare Workers
- ✅ Cleaner mental model for data loading

---

## Current Architecture Analysis

### Routes (Next.js App Router)

```
app/
├── page.tsx                    → Home (listings grid + filters)
├── map/page.tsx                → Map view with filters
├── apply/page.tsx              → Application form (Airtable iframe)
├── about/page.tsx              → About page
├── properties/[slug]/page.tsx  → Property detail page
├── layout.tsx                  → Root layout
├── globals.css                 → Tailwind + custom CSS
├── error.tsx                   → Error boundary
├── global-error.tsx            → Global error
├── not-found.tsx               → 404 page
└── sitemap.xml/route.ts        → Dynamic sitemap
```

### Components

```
components/
├── FilterControls.tsx     → 'use client' - Form filters with router.push()
├── ListingCard.tsx        → Server component - Grid card display
├── MapView.tsx            → 'use client' - Google Maps integration
├── Navigation.tsx         → 'use client' - Active link highlighting
└── PropertyGallery.tsx    → Unknown (not analyzed yet)
```

### Libraries

```
lib/
├── fetchListings.ts       → Airtable API integration (server-side)
├── env.ts                 → Environment variable reader (hybrid)
├── types.ts               → TypeScript types
├── geocode.ts             → OpenStreetMap geocoding
├── auth.ts                → Auth utilities (not analyzed)
└── pages/shared.ts        → Shared constants (SITE_TITLE, etc.)
```

### Current Dependencies

```json
{
  "next": "14.2.15",
  "@cloudflare/next-on-pages": "1.11.0",
  "react": "^18.3.0",
  "react-dom": "^18.3.0",
  "wrangler": "^3.0.0"
}
```

### Key Features

1. **Server-side data fetching** from Airtable
2. **Client-side filtering** with URL search params
3. **Google Maps integration** (client-side)
4. **Image optimization** (disabled for Cloudflare)
5. **Edge runtime** specified on route level
6. **Dynamic metadata** generation
7. **Sitemap generation**

---

## Target Architecture (Remix)

### Route Structure

```
app/
└── routes/
    ├── _index.tsx                  → Home (loader + component)
    ├── map.tsx                     → Map view (loader + component)
    ├── apply.tsx                   → Application form
    ├── about.tsx                   → About page
    ├── properties.$slug.tsx        → Property detail (loader + meta)
    ├── sitemap[.]xml.tsx           → Dynamic sitemap (loader)
    └── _layout.tsx                 → Optional shared layout
```

### Component Changes

| Component | Status | Changes Needed |

|-----------|--------|----------------|

| `FilterControls.tsx` | **MAJOR** | Replace `useRouter` + `useSearchParams` with `useSearchParams` + `useSubmit` from Remix |

| `ListingCard.tsx` | **MINOR** | Replace Next.js `Link` and `Image` with Remix equivalents |

| `MapView.tsx` | **NONE** | Pure React - works as-is |

| `Navigation.tsx` | **MINOR** | Replace `usePathname` with `useLocation` from Remix |

| `PropertyGallery.tsx` | **TBD** | Need to analyze |

### Library Changes

| File | Status | Changes Needed |

|------|--------|----------------|

| `fetchListings.ts` | **MINOR** | Change `process.env` access → `context.env` pattern |

| `env.ts` | **REFACTOR** | Simplify for Remix's loader context |

| `types.ts` | **NONE** | Pure TypeScript - works as-is |

| `geocode.ts` | **NONE** | Pure utility - works as-is |

| `pages/shared.ts` | **NONE** | Pure constants - works as-is |

---

## Migration Steps

### Phase 1: Setup & Dependencies (30 mins)

#### 1.1 Create New Remix Project Structure

```bash
# Create a new Remix project with Cloudflare template
npx create-remix@latest rental-manager-remix --template remix-run/remix/templates/cloudflare-pages

# Or migrate in-place (recommended)
npm install @remix-run/react @remix-run/cloudflare @remix-run/cloudflare-pages
npm install -D @remix-run/dev @cloudflare/workers-types
```

#### 1.2 Update package.json

```json
{
  "scripts": {
    "dev": "remix vite:dev",
    "build": "remix vite:build",
    "deploy": "npm run build && wrangler pages deploy ./build/client",
    "typecheck": "tsc"
  },
  "dependencies": {
    "@remix-run/cloudflare": "^2.15.0",
    "@remix-run/cloudflare-pages": "^2.15.0",
    "@remix-run/react": "^2.15.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "isbot": "^4.1.0"
  },
  "devDependencies": {
    "@remix-run/dev": "^2.15.0",
    "@cloudflare/workers-types": "^4.20241127.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "typescript": "^5.4.5",
    "vite": "^5.0.0",
    "wrangler": "^3.0.0"
  }
}
```

#### 1.3 Create Remix Config Files

**remix.config.js**

```javascript
/** @type {import('@remix-run/dev').AppConfig} */
export default {
  serverModuleFormat: "esm",
  serverPlatform: "neutral",
  server: "./server.ts",
  ignoredRouteFiles: ["**/.*"],
  tailwindcss: true,
  postcss: true,
};
```

**vite.config.ts**

```typescript
import { defineConfig } from "vite";
import { vitePlugin as remix } from "@remix-run/dev";
import { cloudflareDevProxyVitePlugin } from "@remix-run/dev/dist/vite/cloudflare-dev-proxy.js";

export default defineConfig({
  plugins: [
    cloudflareDevProxyVitePlugin(),
    remix(),
  ],
});
```

**server.ts** (Cloudflare Pages entry)

```typescript
import { createPagesFunctionHandler } from "@remix-run/cloudflare-pages";
import * as build from "./build/server";

export const onRequest = createPagesFunctionHandler({ build });
```

**load-context.ts** (Type-safe environment)

```typescript
import type { AppLoadContext } from "@remix-run/cloudflare";
import type { PlatformProxy } from "wrangler";

export interface Env {
  AIRTABLE_TOKEN: string;
  AIRTABLE_BASE_ID: string;
  AIRTABLE_INVENTORY_TABLE_NAME?: string;
  AIRTABLE_R2_IMAGE_FIELD?: string;
  GOOGLE_MAPS_API_KEY?: string;
  R2_PUBLIC_BASE_URL?: string;
  DEMO_USER?: string;
  DEMO_PASS?: string;
  DEMO_NOINDEX?: string;
}

declare module "@remix-run/cloudflare" {
  interface AppLoadContext {
    cloudflare: Omit<PlatformProxy<Env>, "dispose">;
  }
}
```

---

### Phase 2: Migrate Core Files (1 hour)

#### 2.1 Root Layout → `app/root.tsx`

```typescript
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import { Navigation } from "~/components/Navigation";
import { SITE_TITLE, DESCRIPTION } from "~/lib/pages/shared";
import styles from "~/styles/globals.css?url";

export const links = () => [
  { rel: "stylesheet", href: styles },
];

export const meta = () => {
  return [
    { title: `${SITE_TITLE} · Rentals` },
    { name: "description", content: DESCRIPTION },
  ];
};

export default function App() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <header className="max-w-[1100px] mx-auto px-[clamp(1rem,3vw,2rem)] pt-6 flex items-center justify-between gap-4">
          <a href="/" className="text-fg font-bold text-xl uppercase tracking-wider no-underline">
            {SITE_TITLE}
          </a>
          <Navigation />
        </header>
        <main className="max-w-[1100px] mx-auto px-[clamp(1rem,3vw,2rem)] py-8 pb-20">
          <Outlet />
        </main>
        <footer className="text-center py-8 pb-12 text-muted">
          <small>Built with a modern edge-native stack</small>
        </footer>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
```

#### 2.2 Home Page → `app/routes/_index.tsx`

```typescript
import { json, type LoaderFunctionArgs, type MetaFunction } from "@remix-run/cloudflare";
import { useLoaderData, useSearchParams } from "@remix-run/react";
import { fetchListings } from "~/lib/fetchListings";
import { ListingCard } from "~/components/ListingCard";
import { FilterControls } from "~/components/FilterControls";
import { SITE_TITLE, DESCRIPTION } from "~/lib/pages/shared";
import type { Listing } from "~/lib/types";

function applyFilters(listings: Listing[], params: URLSearchParams): Listing[] {
  const city = params.get("city");
  const bedrooms = params.get("bedrooms");
  const min = params.get("min");
  const max = params.get("max");
  const status = params.get("status");

  return listings.filter(listing => {
    const cityOk = !city || city === "All" || listing.city?.toLowerCase() === city.toLowerCase();
    const bedroomOk = !bedrooms || Number(listing.bedrooms) >= Number(bedrooms);
    const minOk = !min || Number(listing.price) >= Number(min);
    const maxOk = !max || Number(listing.price) <= Number(max);
    const statusOk = !status ? listing.status !== "Rented" : listing.status === status;
    return cityOk && bedroomOk && minOk && maxOk && statusOk;
  });
}

export const loader = async ({ request, context }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const allListings = await fetchListings(context.cloudflare.env);
  const filteredListings = applyFilters(allListings, url.searchParams);
  const availableCount = filteredListings.filter(l => l.status !== "Rented").length;

  return json({
    allListings,
    filteredListings,
    availableCount,
  });
};

export const meta: MetaFunction = () => {
  return [
    { title: `${SITE_TITLE} · Rentals` },
    { name: "description", content: DESCRIPTION },
  ];
};

export default function Index() {
  const { allListings, filteredListings, availableCount } = useLoaderData<typeof loader>();

  return (
    <>
      <section className="flex flex-wrap gap-8 items-start mb-8">
        <div>
          <p className="uppercase tracking-widest text-xs text-accent">Thoughtfully Managed Homes</p>
          <h1 className="text-[clamp(2.5rem,6vw,3.5rem)] my-2 mb-2">{SITE_TITLE}</h1>
          <p className="m-0 text-muted">{DESCRIPTION}</p>
        </div>
        <div className="flex gap-6 p-4 px-6 bg-white/3 border border-white/8 rounded-2xl">
          <div>
            <span className="block text-xs text-muted">Total units</span>
            <strong className="text-3xl">{allListings.length}</strong>
          </div>
          <div>
            <span className="block text-xs text-muted">Available today</span>
            <strong className="text-3xl">{availableCount}</strong>
          </div>
        </div>
      </section>
      
      <FilterControls listings={allListings} resetHref="/" />
      
      <section className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6 mt-8">
        {filteredListings.length > 0 ? (
          filteredListings.map(listing => (
            <ListingCard key={listing.id} listing={listing} />
          ))
        ) : (
          <p className="text-muted">No properties matched your filters.</p>
        )}
      </section>
    </>
  );
}
```

#### 2.3 Property Detail → `app/routes/properties.$slug.tsx`

```typescript
import { json, type LoaderFunctionArgs, type MetaFunction } from "@remix-run/cloudflare";
import { useLoaderData, Link } from "@remix-run/react";
import { fetchListings } from "~/lib/fetchListings";
import { PropertyGallery } from "~/components/PropertyGallery";
import { formatPrice, SITE_TITLE } from "~/lib/pages/shared";

export const loader = async ({ params, context }: LoaderFunctionArgs) => {
  const listings = await fetchListings(context.cloudflare.env);
  const slug = decodeURIComponent(params.slug!);
  const listing = listings.find(item => item.slug === slug || item.id === slug);

  if (!listing) {
    throw new Response("Not Found", { status: 404 });
  }

  return json({ listing });
};

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data) {
    return [{ title: "Not Found" }];
  }
  return [
    { title: `${data.listing.title} · ${SITE_TITLE}` },
  ];
};

export default function PropertyDetail() {
  const { listing } = useLoaderData<typeof loader>();
  const statusClass = listing.status.toLowerCase();

  return (
    <>
      <Link to="/" className="inline-block mb-4 text-accent no-underline">
        ← Back to all listings
      </Link>
      <article className="property">
        <header className="flex flex-wrap justify-between gap-4 items-start">
          <div>
            <p className="uppercase tracking-widest text-xs text-accent">{listing.city}</p>
            <h1 className="text-[clamp(2rem,5vw,2.8rem)] my-2 mb-2">{listing.title}</h1>
            <p className="text-muted">{listing.address || ""}</p>
          </div>
          <div className="flex flex-col gap-2 items-end">
            <span className="text-2xl font-semibold">{formatPrice(listing.price)} / mo</span>
            <a
              href={`mailto:rentals@example.com?subject=${encodeURIComponent(`Inquiry: ${listing.title}`)}`}
              className="rounded-full px-5 py-2.5 bg-accent text-[#04140f] font-semibold border-none cursor-pointer text-center no-underline"
            >
              Contact
            </a>
          </div>
        </header>
        
        <PropertyGallery listing={listing} />
        
        <ul className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4 p-6 rounded-xl bg-card/85 border border-white/8 list-none">
          <li>
            <span className="text-muted text-sm">Monthly rent</span>
            <strong className="block text-xl">{formatPrice(listing.price)}</strong>
          </li>
          <li>
            <span className="text-muted text-sm">Bedrooms</span>
            <strong className="block text-xl">{listing.bedrooms || "—"}</strong>
          </li>
          <li>
            <span className="text-muted text-sm">Bathrooms</span>
            <strong className="block text-xl">{listing.bathrooms ? String(listing.bathrooms) : "—"}</strong>
          </li>
          <li>
            <span className="text-muted text-sm">Status</span>
            <strong className={`block text-xl ${
              statusClass === 'available' ? 'text-green-400' :
              statusClass === 'pending' ? 'text-yellow-400' :
              'text-red-400'
            }`}>
              {listing.status}
            </strong>
          </li>
        </ul>
        
        {listing.description ? (
          <div className="leading-relaxed text-fg mt-6 whitespace-pre-line">
            {listing.description.split('\n').map((line, i) => (
              <p key={i} className="mb-4">{line}</p>
            ))}
          </div>
        ) : (
          <p className="text-muted mt-6">No description yet.</p>
        )}
      </article>
    </>
  );
}
```

---

### Phase 3: Component Migration (1 hour)

#### 3.1 FilterControls.tsx (MAJOR CHANGES)

```typescript
// components/FilterControls.tsx
import { Form, useSearchParams } from "@remix-run/react";
import type { Listing } from "~/lib/types";

interface FilterControlsProps {
  listings: Listing[];
  resetHref?: string;
}

export function FilterControls({ listings, resetHref = "/" }: FilterControlsProps) {
  const [searchParams] = useSearchParams();
  
  const uniqueCities = Array.from(new Set(listings.map(listing => listing.city).filter(Boolean))).sort();
  const currentCity = searchParams.get('city') || '';
  const currentBedrooms = searchParams.get('bedrooms') || '0';
  const currentStatus = searchParams.get('status') || '';
  const currentMin = searchParams.get('min') || '';
  const currentMax = searchParams.get('max') || '';

  return (
    <section className="filters">
      <Form method="get" className="realtime-filters grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-4 p-6 rounded-2xl bg-card/85 border border-white/6 backdrop-blur-xl">
        <label className="flex flex-col gap-1.5 text-sm text-muted">
          <span>City</span>
          <select
            name="city"
            defaultValue={currentCity}
            onChange={(e) => e.currentTarget.form?.requestSubmit()}
            className="bg-bg border border-white/12 text-fg rounded-xl px-3 py-2"
          >
            <option value="All">All cities</option>
            {uniqueCities.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </label>
        
        <label className="flex flex-col gap-1.5 text-sm text-muted">
          <span>Bedrooms</span>
          <select
            name="bedrooms"
            defaultValue={currentBedrooms}
            onChange={(e) => e.currentTarget.form?.requestSubmit()}
            className="bg-bg border border-white/12 text-fg rounded-xl px-3 py-2"
          >
            {[0, 1, 2, 3, 4].map(num => (
              <option key={num} value={num}>{num === 0 ? 'Any' : `${num}+`}</option>
            ))}
          </select>
        </label>
        
        <label className="flex flex-col gap-1.5 text-sm text-muted">
          <span>Status</span>
          <select
            name="status"
            defaultValue={currentStatus}
            onChange={(e) => e.currentTarget.form?.requestSubmit()}
            className="bg-bg border border-white/12 text-fg rounded-xl px-3 py-2"
          >
            <option value="">All</option>
            {['Available', 'Pending', 'Rented'].map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </label>
        
        <label className="flex flex-col gap-1.5 text-sm text-muted">
          <span>Min rent</span>
          <input
            type="number"
            min="0"
            name="min"
            defaultValue={currentMin}
            onChange={(e) => e.currentTarget.form?.requestSubmit()}
            className="bg-bg border border-white/12 text-fg rounded-xl px-3 py-2"
          />
        </label>
        
        <label className="flex flex-col gap-1.5 text-sm text-muted">
          <span>Max rent</span>
          <input
            type="number"
            min="0"
            name="max"
            defaultValue={currentMax}
            onChange={(e) => e.currentTarget.form?.requestSubmit()}
            className="bg-bg border border-white/12 text-fg rounded-xl px-3 py-2"
          />
        </label>
        
        <a
          href={resetHref}
          className="self-end rounded-full px-5 py-2.5 bg-transparent border border-white/25 text-fg font-semibold text-center no-underline hover:bg-white/10"
        >
          Reset
        </a>
      </Form>
    </section>
  );
}
```

**Key Changes:**

- Removed `'use client'` directive
- Replaced `useRouter()` with Remix `<Form method="get">`
- Changed `Link` to plain `<a>` for reset (simpler)
- Changed `value` to `defaultValue` + auto-submit on change
- Leverages native form behavior (works without JS!)

#### 3.2 Navigation.tsx (MINOR CHANGES)

```typescript
// components/Navigation.tsx
import { NavLink } from "@remix-run/react";

const NAV_ITEMS: Array<{ href: string; label: string }> = [
  { href: "/", label: "Listings" },
  { href: "/map", label: "Map" },
  { href: "/apply", label: "Submit an Application" },
  { href: "/about", label: "About" },
];

export function Navigation() {
  return (
    <nav className="flex gap-2 items-center">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.href}
          to={item.href}
          end={item.href === "/"}
          className={({ isActive }) =>
            `px-5 py-2.5 rounded-full text-sm font-medium border-1.5 border-transparent transition-colors ${
              isActive
                ? 'text-accent bg-accent/15 border-accent/30 font-semibold'
                : 'text-muted hover:text-fg hover:bg-white/10 hover:border-white/15'
            }`
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
```

**Key Changes:**

- Removed `'use client'` directive
- Replaced Next.js `Link` + `usePathname` with Remix `NavLink`
- `NavLink` provides `isActive` via render prop
- Added `end` prop for exact matching on home route

#### 3.3 ListingCard.tsx (MINOR CHANGES)

```typescript
// components/ListingCard.tsx
import { Link } from "@remix-run/react";
import type { Listing } from "~/lib/types";
import { formatPrice } from "~/lib/pages/shared";

interface ListingCardProps {
  listing: Listing;
}

export function ListingCard({ listing }: ListingCardProps) {
  const cover = listing.imageUrl || "/placeholder.jpg";
  const statusClass = listing.status.toLowerCase();

  return (
    <article className="bg-card/90 border border-white/8 rounded-2xl overflow-hidden transition-transform hover:-translate-y-1 hover:border-accent/60">
      <Link to={`/properties/${encodeURIComponent(listing.slug)}`} className="flex flex-col gap-4 p-4 pb-6 text-inherit no-underline">
        <img
          src={cover}
          alt={`${listing.title} cover`}
          width={400}
          height={300}
          className="w-full h-auto rounded-2xl object-cover"
          loading="lazy"
        />
        <div>
          <div className={`inline-block px-3 py-0.5 rounded-full text-xs uppercase tracking-wider ${
            statusClass === 'available' ? 'text-green-400' :
            statusClass === 'pending' ? 'text-yellow-400' :
            'text-red-400'
          }`}>
            {listing.status}
          </div>
          <h2 className="mt-2 mb-1 text-xl font-semibold">{listing.title}</h2>
          <p className="my-1 text-muted">{listing.address || listing.city}</p>
          <p className="text-2xl my-2 font-semibold">{formatPrice(listing.price)}</p>
          <ul className="flex gap-4 list-none p-0 m-0 text-muted text-sm">
            <li>{listing.bedrooms} bd</li>
            <li>{listing.bathrooms ? `${listing.bathrooms} ba` : "—"}</li>
            <li>{listing.parking || "Parking TBD"}</li>
          </ul>
        </div>
      </Link>
    </article>
  );
}
```

**Key Changes:**

- Replaced Next.js `Link` with Remix `Link` (prop: `href` → `to`)
- Replaced Next.js `Image` with plain `<img>` (images.unoptimized was already true)

#### 3.4 MapView.tsx (NO CHANGES)

```typescript
// components/MapView.tsx
// ✅ NO CHANGES NEEDED - Pure React component
// Just copy as-is from Next.js version
```

---

### Phase 4: Library Migration (30 mins)

#### 4.1 lib/fetchListings.ts

**Changes needed:**

1. Remove `process.env` fallback
2. Accept Cloudflare `Env` directly
3. Simplify environment reading
```typescript
// lib/fetchListings.ts
import type { Listing } from "./types";
import type { Env } from "~/load-context";

// ---------- helpers ----------
function slugify(s: string) {
  return (s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function toNum(v: any): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function extractAttachmentUrls(value: unknown): string[] | undefined {
  if (!value) return undefined;
  const asArray = Array.isArray(value) ? value : [value];
  const urls = asArray
    .map((entry: any) => {
      if (entry && typeof entry.url === "string") return entry.url;
      if (typeof entry === "string") return entry;
      return undefined;
    })
    .filter((url): url is string => typeof url === "string" && url.trim().length > 0);
  return urls.length ? urls : undefined;
}

// ---------- airtable fetch ----------
type AirtableRecord = { id: string; fields: Record<string, any> };

export async function fetchListings(env: Env): Promise<Listing[]> {
  console.log("[fetchListings] Starting Airtable fetch...");
  
  const token = env.AIRTABLE_TOKEN;
  const baseId = env.AIRTABLE_BASE_ID;
  const table = env.AIRTABLE_INVENTORY_TABLE_NAME || "Properties";
  const r2Field = env.AIRTABLE_R2_IMAGE_FIELD || "R2 Images";
  
  if (!token || !baseId) {
    console.error("[fetchListings] ERROR: Missing AIRTABLE_TOKEN or AIRTABLE_BASE_ID");
    return [];
  }

  const url =
    `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}` +
    `?pageSize=100&sort[0][field]=Title`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    console.error("[fetchListings] Airtable fetch failed:", res.status, errorText);
    return [];
  }
  
  const json = await res.json();
  console.log("[fetchListings] Fetched records:", json.records?.length || 0);

  const listings: Listing[] = (json.records as AirtableRecord[]).map(({ fields }) => {
    const title: string = fields["Title"] ?? "";
    const rawSlug = fields["Slug"];
    const slug: string = rawSlug != null ? String(rawSlug) : slugify(title);
    const price: number = toNum(fields["Monthly Rent"]);
    const bedrooms: number = toNum(fields["Bedrooms"]);
    const bathrooms: number = toNum(fields["Bathrooms"]);
    const status: string = fields["Status"] ?? "Available";
    const city: string = fields["City"] ?? "";
    const address: string = fields["Address"] ?? "";
    const description: string = fields["Description"] ?? "";
    const pets: string | undefined = fields["Pets"] ?? undefined;
    const rawParking = fields["Parking"];
    const parking = rawParking != null ? String(rawParking).trim() : undefined;

    const r2Images = extractAttachmentUrls(fields[r2Field]);
    const fallbackImages = ["/placeholder.jpg", "/placeholder2.jpg"];
    const images = r2Images && r2Images.length > 0 ? r2Images : fallbackImages;

    return {
      id: fields["ID"] ? String(fields["ID"]) : slug || crypto.randomUUID(),
      title,
      slug,
      price,
      city,
      address,
      status,
      bedrooms,
      bathrooms: bathrooms || undefined,
      parking,
      pets,
      description,
      imageUrl: images[0],
      images: images,
    };
  });

  return listings;
}
```


**Key Changes:**

- Accept `Env` type directly (no fallback to `process.env`)
- Removed `EnvSource` abstraction
- Simplified error handling
- Removed CI/production special cases

#### 4.2 Delete lib/env.ts

```bash
# Not needed in Remix - loaders receive typed context directly
rm lib/env.ts
```

#### 4.3 Other lib/ files

- ✅ `types.ts` - NO CHANGES
- ✅ `geocode.ts` - NO CHANGES
- ✅ `pages/shared.ts` - NO CHANGES

---

### Phase 5: Additional Routes (30 mins)

#### 5.1 Map Page → `app/routes/map.tsx`

```typescript
import { json, type LoaderFunctionArgs, type MetaFunction } from "@remix-run/cloudflare";
import { useLoaderData, Link } from "@remix-run/react";
import { fetchListings } from "~/lib/fetchListings";
import { FilterControls } from "~/components/FilterControls";
import { MapView } from "~/components/MapView";
import { SITE_TITLE, formatPrice } from "~/lib/pages/shared";
import type { Listing } from "~/lib/types";

function applyFilters(listings: Listing[], params: URLSearchParams): Listing[] {
  // ... same as home page
}

export const loader = async ({ request, context }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const allListings = await fetchListings(context.cloudflare.env);
  const filteredListings = applyFilters(allListings, url.searchParams);
  const googleMapsApiKey = context.cloudflare.env.GOOGLE_MAPS_API_KEY;

  return json({
    allListings,
    filteredListings,
    googleMapsApiKey,
  });
};

export const meta: MetaFunction = () => {
  return [{ title: `Map · ${SITE_TITLE}` }];
};

export default function MapPage() {
  const { allListings, filteredListings, googleMapsApiKey } = useLoaderData<typeof loader>();

  return (
    <>
      {/* Same JSX as Next.js version, just replace Next Link with Remix Link */}
    </>
  );
}
```

#### 5.2 Apply Page → `app/routes/apply.tsx`

```typescript
import type { MetaFunction } from "@remix-run/cloudflare";
import { SITE_TITLE } from "~/lib/pages/shared";

export const meta: MetaFunction = () => {
  return [{ title: `Apply · ${SITE_TITLE}` }];
};

export default function ApplyPage() {
  // Same JSX as Next.js version - no changes needed
}
```

#### 5.3 About Page → `app/routes/about.tsx`

```typescript
// Similar pattern - copy from Next.js, adjust imports
```

#### 5.4 Sitemap → `app/routes/sitemap[.]xml.tsx`

```typescript
import type { LoaderFunctionArgs } from "@remix-run/cloudflare";
import { fetchListings } from "~/lib/fetchListings";

export const loader = async ({ context }: LoaderFunctionArgs) => {
  const listings = await fetchListings(context.cloudflare.env);
  
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://yoursite.com/</loc>
    <changefreq>daily</changefreq>
  </url>
  <url>
    <loc>https://yoursite.com/map</loc>
    <changefreq>weekly</changefreq>
  </url>
  ${listings.map(listing => `
  <url>
    <loc>https://yoursite.com/properties/${encodeURIComponent(listing.slug)}</loc>
    <changefreq>weekly</changefreq>
  </url>`).join('')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
};
```

---

### Phase 6: Styling & Assets (15 mins)

#### 6.1 Move CSS

```bash
mkdir -p app/styles
mv app/globals.css app/styles/globals.css
```

#### 6.2 Update Tailwind Config

```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

#### 6.3 Move Public Assets

```bash
# Remix uses /public too - no changes needed
# Just ensure files are in /public/
```

---

### Phase 7: Deployment (15 mins)

#### 7.1 Update wrangler.toml

```toml
name = "rental-manager"
compatibility_date = "2024-12-18"
compatibility_flags = ["nodejs_compat"]

# Remix builds to /build
# Cloudflare Pages needs the /build/client directory
pages_build_output_dir = "build/client"

# Environment variables - set these in Cloudflare dashboard
# [vars]
# AIRTABLE_TOKEN = "" # Set as secret in dashboard
# AIRTABLE_BASE_ID = ""
```

#### 7.2 Deploy to Cloudflare Pages

```bash
# Build for production
npm run build

# Deploy
wrangler pages deploy ./build/client --project-name rental-manager

# Or connect to Git in Cloudflare dashboard:
# Build command: npm run build
# Output directory: build/client
```

#### 7.3 Set Environment Variables

In Cloudflare dashboard:

- Settings → Environment Variables
- Add: AIRTABLE_TOKEN, AIRTABLE_BASE_ID, GOOGLE_MAPS_API_KEY, etc.

---

## Migration Checklist

### Pre-Migration

- [ ] Backup current code (git branch or tag)
- [ ] Document any custom configurations
- [ ] List all environment variables
- [ ] Test current Next.js build locally

### Migration

- [ ] Phase 1: Setup dependencies (30 mins)
- [ ] Phase 2: Migrate core files (1 hour)
- [ ] Phase 3: Migrate components (1 hour)
- [ ] Phase 4: Migrate libraries (30 mins)
- [ ] Phase 5: Additional routes (30 mins)
- [ ] Phase 6: Styling & assets (15 mins)
- [ ] Phase 7: Deployment (15 mins)

### Post-Migration

- [ ] Test all routes locally (`npm run dev`)
- [ ] Verify filtering works
- [ ] Verify map integration
- [ ] Test property detail pages
- [ ] Test 404 handling
- [ ] Deploy to Cloudflare Pages
- [ ] Verify production build
- [ ] Test with real Airtable data
- [ ] Check performance (Lighthouse)
- [ ] Update README.md

---

## Estimated Timeline

| Phase | Duration | Cumulative |

|-------|----------|------------|

| Setup | 30 mins | 0:30 |

| Core Routes | 1 hour | 1:30 |

| Components | 1 hour | 2:30 |

| Libraries | 30 mins | 3:00 |

| Additional Routes | 30 mins | 3:30 |

| Styling | 15 mins | 3:45 |

| Deployment | 15 mins | 4:00 |

| **Total** | **~4 hours** | **4:00** |

---

## Benefits After Migration

1. ✅ **Simpler deployment** - No adapter, native Cloudflare support
2. ✅ **Better DX** - Loaders/actions pattern is clearer than App Router
3. ✅ **Progressive enhancement** - Forms work without JS
4. ✅ **Smaller bundles** - No Next.js overhead
5. ✅ **Better type safety** - Loader data is typed end-to-end
6. ✅ **Faster cold starts** - Optimized for Workers runtime
7. ✅ **Future-proof** - Remix is officially supported by Cloudflare

---

## Risks & Mitigation

| Risk | Likelihood | Impact | Mitigation |

|------|------------|--------|------------|

| Breaking changes in dependencies | Low | Medium | Pin exact versions in package.json |

| Google Maps not loading | Low | High | Test thoroughly in dev environment |

| Environment variables not passed | Medium | High | Use load-context.ts for type safety |

| Airtable API changes | Low | High | Keep fetchListings.ts flexible |

| CSS not loading | Low | Medium | Test all routes after migration |

---

## Rollback Plan

If migration fails:

```bash
# Revert to Next.js version
git checkout dev/nextjs-for-cf
npm install
npm run dev
```

Keep Next.js branch until Remix is proven stable in production (1-2 weeks).

---

## Next Steps

1. **Review this plan** - Any missing features?
2. **Create backup branch** - `git checkout -b backup/nextjs-migration`
3. **Start Phase 1** - Setup new Remix structure
4. **Migrate incrementally** - Follow phases 2-7
5. **Test thoroughly** - Every route, every feature
6. **Deploy to staging** - Test with production data
7. **Deploy to production** - Monitor for issues
8. **Archive Next.js branch** - After 2 weeks of stability

---

## Questions to Resolve

1. ❓ Do you need authentication? (DEMO_USER/DEMO_PASS)
2. ❓ Is PropertyGallery.tsx a client component?
3. ❓ Any other routes not listed in app/ directory?
4. ❓ Do you want to keep both Next.js and Remix in same repo? (side-by-side migration)
5. ❓ Any custom Cloudflare Workers (beyond R2 sync)?

---

## Resources

- [Remix Docs](https://remix.run/docs)
- [Remix on Cloudflare](https://remix.run/docs/en/main/guides/deployment#cloudflare-pages)
- [Cloudflare Pages Functions](https://developers.cloudflare.com/pages/functions/)
- [Remix Vite Plugin](https://remix.run/docs/en/main/future/vite)

---

**Ready to start migration?** Let me know which phase to begin with, or if you want me to start executing the migration automatically!