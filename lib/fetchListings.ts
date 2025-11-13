// lib/fetchListings.airtable.ts
import type { EnvSource } from "./env";
import { envFlag, readEnv } from "./env";
import { parseDriveFolderId } from "./drive";
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
  const folderField = readEnv(env, "AIRTABLE_IMAGE_FOLDER_FIELD") || "Image Folder URL";
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

    // 封面：如果你以后加了 Attachments 字段，这里可优先取附件的第一张
    const rawFolder = fields[folderField];
    const imageFolderUrl: string | undefined = rawFolder != null ? String(rawFolder) : undefined;
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
      imageFolderUrl,
      imageUrl: r2Images?.[0] || "/placeholder.jpg",
      images: r2Images,
    };
  });

  // 若你提供了"通过 folderId 列出图片"的端点，则顺序拉取图片列表
  const listEndpoint = readEnv(env, "DRIVE_LIST_ENDPOINT");
  if (!listEndpoint) {
    // 没有端点：直接返回（前端可用 imageFolderUrl 做"查看相册"跳转）
    return baseItems;
  }

  // 顺序拉取图片列表（缓存 1 小时）
  for (const item of baseItems) {
    if (item.images && item.images.length > 0) {
      continue;
    }
    const folderId = parseDriveFolderId(item.imageFolderUrl);
    if (!folderId) {
      continue;
    }
    try {
      const u = new URL(listEndpoint);
      u.searchParams.set("folder", folderId);
      const endpointUrl = u.toString();
      // Cache image URLs for 1 hour (images don't change often)
      const r = await fetch(endpointUrl);
      if (r.ok) {
        const data = await r.json();
        // Handle both array response and error object response
        if (Array.isArray(data) && data.length > 0) {
          // Proxy images through Next.js API route to avoid CORS/issues
          item.images = data.map(url => `/api/image?url=${encodeURIComponent(url)}`);
          item.imageUrl = `/api/image?url=${encodeURIComponent(data[0])}`;
        }
        // Silently ignore errors - images will fall back to placeholder
      }
    } catch (error) {
      // Silently ignore errors - images will fall back to placeholder
    }
  }
  
  // 确保所有 items 都有 imageUrl，如果没有则使用 placeholder
  for (const item of baseItems) {
    if (!item.imageUrl || item.imageUrl.trim() === "") {
      item.imageUrl = "/placeholder.jpg";
    }
  }

  return baseItems;
}
