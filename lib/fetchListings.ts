import { slugify, parseBoolish, splitCSV } from "./utils";
import type { Listing } from "./types";
import fs from "node:fs/promises";
import path from "node:path";

export async function fetchListings(): Promise<Listing[]> {
  const url = process.env.NEXT_PUBLIC_LISTINGS_URL;
  const revalidate = Number(process.env.REVALIDATE_SECONDS || 3600);

  try {
    if (!url) throw new Error("NEXT_PUBLIC_LISTINGS_URL not set");
    const res = await fetch(url, { next: { revalidate } });
    if (!res.ok) throw new Error(`Failed to fetch listings: ${res.status}`);
    const rows = await res.json();
    return normalize(rows);
  } catch (e) {
    const p = path.join(process.cwd(), "data", "listings.sample.json");
    const raw = await fs.readFile(p, "utf-8");
    const rows = JSON.parse(raw);
    return normalize(rows);
  }
}

function normalize(rows: any[]): Listing[] {
  return rows.map((r: any) => {
    const utilities = splitCSV(r.UtilitiesIncluded);
    const gallery = splitCSV(r.ImageURLs);
    const parkingBool = parseBoolish(r.Parking);
    // prefer explicit text like "1 spot" if provided
    const parking = (typeof r.Parking === "string" && !/^(y|yes|true|1|n|no|false|0)$/i.test(r.Parking.trim()))
      ? String(r.Parking).trim()
      : parkingBool;

    return {
      id: r.ID || crypto.randomUUID(),
      title: r.Title,
      slug: r.Slug || slugify(r.Title),
      price: Number(r.Price || 0),
      city: r.City || "",
      bedrooms: Number(r.Bedrooms || 0),
      status: r.Status || "Available",
      imageUrl: r.ImageURL || "/placeholder.jpg",
      images: gallery && gallery.length ? gallery : undefined,
      description: r.Description || "",
      address: r.Address || "",
      parking,
      pets: r.Pets || undefined,
      utilitiesIncluded: utilities,
    } as Listing;
  });
}
