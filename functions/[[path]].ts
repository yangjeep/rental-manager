import { requireBasicAuth } from "../lib/auth";
import { envFlag, readEnv } from "../lib/env";
import { fetchListings } from "../lib/fetchListings";
import {
  renderAboutPage,
  renderApplicationPage,
  renderHomePage,
  renderMapPage,
  renderNotFound,
  renderPropertyPage,
  renderSitemap,
} from "../lib/pages";
import type { Listing } from "../lib/types";

const HTML_HEADERS = {
  "content-type": "text/html; charset=utf-8",
};

export const onRequestGet: PagesFunction<Record<string, string>> = async context => {
  const url = new URL(context.request.url);
  const pathname = normalizePath(url.pathname);
  const noIndex = envFlag(context.env, "DEMO_NOINDEX");

  const authResponse = requireBasicAuth(context.env, context.request);
  if (authResponse) {
    if (noIndex) {
      authResponse.headers.set("X-Robots-Tag", "noindex, nofollow");
    }
    return authResponse;
  }

  // Pass through static files to Cloudflare Pages static file serving
  if (isStaticFile(pathname)) {
    return await context.next();
  }

  if (pathname === "/sitemap.xml") {
    const listings = await fetchListings(context.env);
    const xml = renderSitemap(listings, `${url.protocol}//${url.host}`);
    return new Response(xml, {
      headers: {
        "content-type": "application/xml; charset=utf-8",
        "cache-control": "public, max-age=3600",
      },
    });
  }

  const listings = await fetchListings(context.env);
  const filters = Object.fromEntries(url.searchParams.entries());

  if (pathname === "/") {
    const filtered = applyFilters(listings, url.searchParams);
    const body = renderHomePage({
      filteredListings: filtered,
      allListings: listings,
      filters,
      activePath: "/",
    });
    return htmlResponse(body, 200, noIndex, { "cache-control": "public, max-age=60" });
  }

  if (pathname === "/map") {
    const filtered = applyFilters(listings, url.searchParams);
    const body = renderMapPage({
      filteredListings: filtered,
      allListings: listings,
      filters,
      googleMapsApiKey: readEnv(context.env, "GOOGLE_MAPS_API_KEY"),
      activePath: "/map",
    });
    return htmlResponse(body, 200, noIndex, { "cache-control": "public, max-age=120" });
  }

  if (pathname === "/apply") {
    const body = renderApplicationPage({ activePath: "/apply" });
    return htmlResponse(body, 200, noIndex, { "cache-control": "public, max-age=300" });
  }

  if (pathname === "/about") {
    const body = renderAboutPage({ activePath: "/about" });
    return htmlResponse(body, 200, noIndex, { "cache-control": "public, max-age=300" });
  }

  if (pathname.startsWith("/properties/")) {
    const slug = decodeURIComponent(pathname.replace("/properties/", ""));
    const listing = listings.find(item => item.slug === slug || item.id === slug);
    if (!listing) {
      return htmlResponse(renderNotFound(`Property “${slug}” not found.`), 404, noIndex);
    }
    const body = renderPropertyPage({ listing });
    return htmlResponse(body, 200, noIndex, { "cache-control": "public, max-age=120" });
  }

  return htmlResponse(renderNotFound("The page you are looking for does not exist."), 404, noIndex);
};

function normalizePath(pathname: string): string {
  if (pathname === "/") return "/";
  return pathname.replace(/\/$/, "");
}

function isStaticFile(pathname: string): boolean {
  const staticExtensions = [
    ".css",
    ".js",
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".webp",
    ".svg",
    ".ico",
    ".txt",
    ".woff",
    ".woff2",
    ".ttf",
    ".eot",
    ".otf",
    ".json",
    ".pdf",
  ];
  return staticExtensions.some(ext => pathname.toLowerCase().endsWith(ext));
}

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

function htmlResponse(body: string, status: number, noIndex: boolean, extra: Record<string, string> = {}): Response {
  const headers = new Headers({ ...HTML_HEADERS, ...extra });
  if (noIndex) {
    headers.set("X-Robots-Tag", "noindex, nofollow");
  }
  return new Response(body, { status, headers });
}

