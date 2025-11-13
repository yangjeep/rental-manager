import type { LoaderFunctionArgs } from "@remix-run/cloudflare";
import { fetchListings } from "~/lib/fetchListings";

export const loader = async ({ request, context }: LoaderFunctionArgs) => {
  const listings = await fetchListings(context.cloudflare.env);
  const url = new URL(request.url);
  const origin = `${url.protocol}//${url.host}`;
  
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${origin}/</loc>
    <changefreq>hourly</changefreq>
  </url>
  <url>
    <loc>${origin}/map</loc>
    <changefreq>weekly</changefreq>
  </url>
  ${listings.map(listing => `
  <url>
    <loc>${origin}/properties/${encodeURIComponent(listing.slug)}</loc>
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

