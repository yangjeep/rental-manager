import type { Listing, GeocodedListing } from "./types";

const NOMINATIM_ENDPOINT = "https://nominatim.openstreetmap.org/search";
const REQUEST_DELAY_MS = 1100;
const memoryCache = new Map<string, { lat: number; lon: number }>();

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function geocodeListings(listings: Listing[]): Promise<GeocodedListing[]> {
  const results: GeocodedListing[] = [];
  for (const listing of listings) {
    const queryParts = [listing.address, listing.city].filter(Boolean);
    if (queryParts.length === 0) continue;
    const query = queryParts.join(", ");
    if (!query.trim()) continue;

    let coords = memoryCache.get(query);
    if (!coords) {
      const url = `${NOMINATIM_ENDPOINT}?format=json&limit=1&q=${encodeURIComponent(query)}`;
      try {
        const response = await fetch(url, {
          headers: {
            "User-Agent": "rental-manager/1.0 (rentals@example.com)",
            Accept: "application/json",
          },
        });
        if (response.ok) {
          const data = await response.json() as Array<{ lat: string; lon: string }>;
          const first = Array.isArray(data) ? data[0] : undefined;
          if (first && first.lat && first.lon) {
            coords = { lat: Number(first.lat), lon: Number(first.lon) };
            memoryCache.set(query, coords);
          }
        }
      } catch (error) {
        console.error("[geocode] failed to geocode", query, error);
      }
      if (!coords) {
        await sleep(REQUEST_DELAY_MS);
        continue;
      }
      await sleep(REQUEST_DELAY_MS);
    }

    results.push({
      ...listing,
      latitude: coords.lat,
      longitude: coords.lon,
    });
  }

  return results;
}

