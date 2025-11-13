// lib/fetchListings.airtable.ts
import type { Listing } from "./types";
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";

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

/**
 * Fetch images from R2 bucket using public URL (HEAD requests)
 * Tries to find images at: /properties/{slug}/image-1.jpg, image-2.jpg, etc.
 */
async function fetchImagesFromR2PublicUrl(slug: string, r2PublicUrl: string): Promise<string[]> {
  const images: string[] = [];
  const maxImages = 20; // Try up to 20 images

  // Common image extensions to try
  const extensions = ['jpg', 'jpeg', 'png', 'webp'];

  for (let i = 1; i <= maxImages; i++) {
    let found = false;

    // Try each extension
    for (const ext of extensions) {
      const imageUrl = `${r2PublicUrl}/properties/${slug}/image-${i}.${ext}`;
      
      try {
        // Use HEAD request to check if image exists (faster than GET)
        const response = await fetch(imageUrl, { 
          method: 'HEAD',
          next: { revalidate: 3600 } // Cache for 1 hour
        });
        
        if (response.ok) {
          images.push(imageUrl);
          found = true;
          break; // Found this index, move to next
        }
      } catch (error) {
        // Silently ignore fetch errors
        continue;
      }
    }

    // If we didn't find this index, assume no more images exist
    if (!found) {
      break;
    }
  }

  return images;
}

/**
 * Fetch images from R2 bucket using S3 API (with credentials)
 * Lists all objects in properties/{slug}/ folder
 */
async function fetchImagesFromR2Api(slug: string): Promise<string[]> {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BUCKET_NAME || 'rental-manager-images';
  const publicUrl = process.env.R2_PUBLIC_URL;

  if (!accountId || !accessKeyId || !secretAccessKey || !publicUrl) {
    return [];
  }

  try {
    const s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: `properties/${slug}/`,
    });

    const response = await s3Client.send(command);

    if (!response.Contents || response.Contents.length === 0) {
      return [];
    }

    // Sort by key (which includes image-1, image-2, etc.)
    const images = response.Contents
      .filter(obj => obj.Key && /\.(jpg|jpeg|png|webp|gif)$/i.test(obj.Key))
      .sort((a, b) => (a.Key || '').localeCompare(b.Key || ''))
      .map(obj => `${publicUrl}/${obj.Key}`);

    return images;
  } catch (error) {
    console.error('Error fetching from R2 API:', error);
    return [];
  }
}

/**
 * Fetch images from R2 - tries public URL first, then API credentials
 */
async function fetchImagesFromR2(slug: string): Promise<string[]> {
  const r2PublicUrl = process.env.R2_PUBLIC_URL;
  
  // Strategy 1: Use public URL with HEAD requests (simpler, no credentials needed)
  if (r2PublicUrl) {
    const images = await fetchImagesFromR2PublicUrl(slug, r2PublicUrl);
    if (images.length > 0) {
      return images;
    }
  }

  // Strategy 2: Use R2 API with credentials (more efficient for listing)
  const images = await fetchImagesFromR2Api(slug);
  return images;
}

// ---------- airtable fetch ----------
type AirtableRecord = { id: string; fields: Record<string, any> };

export async function fetchListings(): Promise<Listing[]> {
  const token = process.env.AIRTABLE_TOKEN;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const table = process.env.AIRTABLE_TABLE_NAME || "Properties";
  if (!token || !baseId) {
    // In CI/build environments, return empty array instead of throwing
    // This allows builds to succeed even without Airtable credentials
    if (process.env.CI || process.env.NODE_ENV === 'production') {
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
    next: { revalidate: 60 }, // Cache for 60 seconds
  });
  if (!res.ok) {
    // In CI/build environments, return empty array instead of throwing
    if (process.env.CI) {
      console.warn(`Airtable fetch failed: ${res.status} - returning empty listings array`);
      return [];
    }
    throw new Error(`Airtable fetch failed: ${res.status}`);
  }
  const json = await res.json();

  // 先做基础字段映射
  const baseItems: Listing[] = (json.records as AirtableRecord[]).map(({ id, fields }) => {
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
      airtableRecordId: id, // Capture the actual Airtable record ID
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
      imageUrl: "/placeholder1.jpg", // 默认使用 placeholder
      images: undefined,   // 若配置了 DRIVE_LIST_ENDPOINT，会去拉取
    };
  });

  // Image resolution: Try R2 first, then fallback to Drive
  const listEndpoint = process.env.DRIVE_LIST_ENDPOINT;

  for (const item of baseItems) {
    let imagesFound = false;

    // Step 1: Try R2 bucket first (uses public URL or API credentials)
    if (item.slug) {
      const r2Images = await fetchImagesFromR2(item.slug);
      if (r2Images.length > 0) {
        item.images = r2Images;
        item.imageUrl = r2Images[0];
        imagesFound = true;
      }
    }

    // Step 2: Fallback to Google Drive if R2 didn't have images
    if (!imagesFound && listEndpoint) {
      const folderId = parseDriveFolderId(item.imageFolderUrl);
      if (folderId) {
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
              // Use direct URLs (no proxy needed)
              item.images = data;
              item.imageUrl = data[0];
              imagesFound = true;
            }
          }
        } catch (error) {
          // Silently ignore errors - images will fall back to placeholder
        }
      }
    }
  }
  
  // 确保所有 items 都有 imageUrl 和 demo images，如果没有则使用 placeholders
  for (let i = 0; i < baseItems.length; i++) {
    const item = baseItems[i];
    if (!item.imageUrl || item.imageUrl.trim() === "") {
      // Alternate between placeholder images for demo purposes
      item.imageUrl = i % 2 === 0 ? "/placeholder1.jpg" : "/placeholder2.jpg";
    }
    // If no images array, provide both placeholders for gallery demo
    if (!item.images || item.images.length === 0) {
      item.images = ["/placeholder1.jpg", "/placeholder2.jpg"];
    }
  }

  return baseItems;
}
