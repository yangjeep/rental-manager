import { NextResponse } from 'next/server';
import { fetchListings } from '@/lib/fetchListings';

export const runtime = 'edge';

export async function GET(request: Request) {
  const listings = await fetchListings();
  const url = new URL(request.url);
  const origin = `${url.protocol}//${url.host}`;

  const urls = listings
    .map(listing => `
      <url>
        <loc>${origin}/properties/${encodeURIComponent(listing.slug)}</loc>
        <changefreq>daily</changefreq>
      </url>
    `)
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      <url>
        <loc>${origin}/</loc>
        <changefreq>hourly</changefreq>
      </url>
      ${urls}
    </urlset>`;

  return new NextResponse(xml, {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      'cache-control': 'public, max-age=3600',
    },
  });
}

