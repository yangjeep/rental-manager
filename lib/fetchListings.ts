// lib/fetchListings.airtable.ts
import type { Listing } from "./types";

// ---------- helpers ----------
function slugify(s: string) {
  return (s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
function toNum(v: any): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}
function parseBoolish(v: any): boolean | undefined {
  if (v === undefined || v === null) return undefined;
  const s = String(v).trim().toLowerCase();
  if (["y", "yes", "true", "1"].includes(s)) return true;
  if (["n", "no", "false", "0"].includes(s)) return false;
  return undefined;
}
/** 支持粘贴整条 Google Drive folder 链接 或 直接粘 folderId */
function parseDriveFolderId(input?: string | null): string | undefined {
  if (!input) return undefined;
  const s = String(input).trim();
  // .../drive/folders/<id>
  const m = s.match(/\/folders\/([A-Za-z0-9_\-]+)/);
  if (m) return m[1];
  // 直接给了 id
  if (/^[A-Za-z0-9_\-]{10,}$/.test(s)) return s;
  return undefined;
}

// ---------- airtable fetch ----------
type AirtableRecord = { id: string; fields: Record<string, any> };

export async function fetchListings(): Promise<Listing[]> {
  const token = process.env.AIRTABLE_TOKEN!;
  const baseId = process.env.AIRTABLE_BASE_ID!;
  const table = process.env.AIRTABLE_TABLE_NAME || "Properties";
  if (!token || !baseId) {
    throw new Error("Missing AIRTABLE_TOKEN or AIRTABLE_BASE_ID");
  }

  // 拉取 100 条，可按需分页扩展
  const url =
    `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}` +
    `?pageSize=100&sort[0][field]=Title`;

  // Cache Airtable data for 60 seconds
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 60 }, // Cache for 60 seconds
  });
  if (!res.ok) throw new Error(`Airtable fetch failed: ${res.status}`);
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
    const imageFolderUrl: string | undefined = fields["Image Folder URL"] || undefined;

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
      imageUrl: "/placeholder.jpg", // 默认使用 placeholder
      images: undefined,   // 若配置了 DRIVE_LIST_ENDPOINT，会去拉取
    };
  });

  // 若你提供了"通过 folderId 列出图片"的端点，则顺序拉取图片列表
  const listEndpoint = process.env.DRIVE_LIST_ENDPOINT;
  if (!listEndpoint) {
    // 没有端点：直接返回（前端可用 imageFolderUrl 做"查看相册"跳转）
    return baseItems;
  }

  // 顺序拉取图片列表（缓存 1 小时）
  for (const item of baseItems) {
    const folderId = parseDriveFolderId(item.imageFolderUrl);
    if (!folderId) {
      continue;
    }
    try {
      const u = new URL(listEndpoint);
      u.searchParams.set("folder", folderId);
      const endpointUrl = u.toString();
      // Cache image URLs for 1 hour (images don't change often)
      const r = await fetch(endpointUrl, { 
        next: { revalidate: 3600 } // Cache for 1 hour
      });
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
