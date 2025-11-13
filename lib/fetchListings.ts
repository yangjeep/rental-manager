// lib/fetchListings.airtable.ts
import type { EnvSource } from "./env";
import { envFlag, readEnv } from "./env";
import type { Listing } from "./types";

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

export async function fetchListings(env: EnvSource = {}): Promise<Listing[]> {
  const token = readEnv(env, "AIRTABLE_TOKEN");
  const baseId = readEnv(env, "AIRTABLE_BASE_ID");
  const table = readEnv(env, "AIRTABLE_TABLE_NAME") || "Properties";
  const r2Field = readEnv(env, "AIRTABLE_R2_IMAGE_FIELD") || "R2 Images";
  const isCI = envFlag(env, "CI");
  const isProduction = readEnv(env, "NODE_ENV") === "production";
  if (!token || !baseId) {
    // In CI/build environments, return empty array instead of throwing
    if (isCI || isProduction) {
      console.warn("Missing AIRTABLE_TOKEN or AIRTABLE_BASE_ID - returning empty listings array");
      return [];
    }
    throw new Error("Missing AIRTABLE_TOKEN or AIRTABLE_BASE_ID");
  }

  // 拉取 100 条，可按需分页扩展
  const url =
    `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}` +
    `?pageSize=100&sort[0][field]=Title`;

  // Cache Airtable data for 60 seconds
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    // In CI/build environments, return empty array instead of throwing
    if (isCI) {
      console.warn(`Airtable fetch failed: ${res.status} - returning empty listings array`);
      return [];
    }
    throw new Error(`Airtable fetch failed: ${res.status}`);
  }
  const json = await res.json();

  // 先做基础字段映射
  const baseItems: Listing[] = (json.records as AirtableRecord[]).map(({ fields }) => {
    // 基础字段名完全按你截图里的列来取：
    const title: string = fields["Title"] ?? "";
    // Ensure slug is always a string
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

    // Parking is always text - convert to string
    const rawParking = fields["Parking"];
    const parking = rawParking != null ? String(rawParking).trim() : undefined;

    // R2 attachment field provides the cover image
    const r2Images = extractAttachmentUrls(fields[r2Field]);

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
      imageUrl: r2Images?.[0] || "/placeholder.jpg",
    };
  });

  // 确保所有 items 都有 imageUrl，如果没有则使用 placeholder
  for (const item of baseItems) {
    if (!item.imageUrl || item.imageUrl.trim() === "") {
      item.imageUrl = "/placeholder.jpg";
    }
  }

  return baseItems;
}
