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
