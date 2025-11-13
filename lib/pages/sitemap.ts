import type { Listing } from "../types";
import { escapeAttribute } from "./shared";

export function renderSitemap(listings: Listing[], origin: string): string {
  const urls = listings
    .map(listing => `
      <url>
        <loc>${origin}/properties/${encodeURIComponent(listing.slug)}</loc>
        <changefreq>daily</changefreq>
      </url>
    `)
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      <url>
        <loc>${escapeAttribute(origin)}/</loc>
        <changefreq>hourly</changefreq>
      </url>
      ${urls}
    </urlset>`;
}

