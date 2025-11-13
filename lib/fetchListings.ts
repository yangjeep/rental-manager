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
 * Fetch images from R2 bucket using S3 API (with credentials)
 * Lists all objects in {slug}/ folder
 */
async function fetchImagesFromR2Api(slug: string): Promise<string[]> {
  console.log(`[R2 API] Starting fetch for slug: ${slug}`);
  
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BUCKET_NAME || 'rental-manager-images';
  const publicUrl = process.env.R2_PUBLIC_URL;

  console.log(`[R2 API] Account ID: ${accountId ? '✅ Set' : '❌ Not set'}`);
  console.log(`[R2 API] Access Key ID: ${accessKeyId ? '✅ Set' : '❌ Not set'}`);
  console.log(`[R2 API] Secret Key: ${secretAccessKey ? '✅ Set' : '❌ Not set'}`);
  console.log(`[R2 API] Bucket Name: ${bucketName}`);
  console.log(`[R2 API] Public URL: ${publicUrl || '❌ Not set'}`);

  if (!accountId || !accessKeyId || !secretAccessKey || !publicUrl) {
    console.log(`[R2 API] ⚠️ Missing credentials, skipping API method`);
    return [];
  }

  try {
    const endpoint = `https://${accountId}.r2.cloudflarestorage.com`;
    console.log(`[R2 API] Endpoint: ${endpoint}`);
    
    const s3Client = new S3Client({
      region: 'auto',
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    const prefix = `${slug}/`;
    console.log(`[R2 API] Listing objects with prefix: ${prefix}`);

    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: prefix,
    });

    const response = await s3Client.send(command);

    console.log(`[R2 API] Response received. Objects found: ${response.Contents?.length || 0}`);

    if (!response.Contents || response.Contents.length === 0) {
      console.log(`[R2 API] ⚠️ No objects found in bucket`);
      return [];
    }

    // Filter for image files and sort alphanumerically by filename
    const images = response.Contents
      .filter(obj => obj.Key && /\.(jpg|jpeg|png|webp|gif|bmp)$/i.test(obj.Key))
      .sort((a, b) => {
        // Sort alphanumerically by the full key
        const keyA = (a.Key || '').toLowerCase();
        const keyB = (b.Key || '').toLowerCase();
        return keyA.localeCompare(keyB, undefined, { numeric: true, sensitivity: 'base' });
      })
      .map(obj => `${publicUrl}/${obj.Key}`);

    console.log(`[R2 API] ✅ Images after filtering and sorting (alphanumeric):`);
    images.forEach((img, idx) => console.log(`  ${idx + 1}. ${img}`));

    return images;
  } catch (error) {
    console.error('[R2 API] ❌ Error fetching from R2 API:', error);
    if (error instanceof Error) {
      console.error('[R2 API] Error message:', error.message);
      console.error('[R2 API] Error stack:', error.stack);
    }
    return [];
  }
}

/**
 * Fetch images from R2 - lists all images in folder and sorts alphanumerically
 */
async function fetchImagesFromR2(slug: string): Promise<string[]> {
  console.log(`\n=== [R2] Fetching images for property: ${slug} ===`);
  console.log(`[R2] Using API to list all images in folder, sorted alphanumerically`);
  
  const images = await fetchImagesFromR2Api(slug);
  
  if (images.length > 0) {
    console.log(`[R2] ✅ Success! Found ${images.length} images`);
  } else {
    console.log(`[R2] ⚠️ No images found`);
  }
  
  console.log(`=== [R2] Complete ===\n`);
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

  // Image resolution: Try R2, then fallback to placeholders
  for (const item of baseItems) {
    console.log(`\n🔍 [Image Resolution] Property: ${item.title} (${item.slug})`);

    // Try R2 bucket (uses public URL or API credentials)
    if (item.slug) {
      console.log(`[Image Resolution] Trying R2...`);
      const r2Images = await fetchImagesFromR2(item.slug);
      if (r2Images.length > 0) {
        console.log(`[Image Resolution] ✅ R2 success! Found ${r2Images.length} images`);
        item.images = r2Images;
        item.imageUrl = r2Images[0];
      } else {
        console.log(`[Image Resolution] ⚠️ R2 returned no images - will use placeholders`);
      }
    }

    console.log(`[Image Resolution] ================================\n`);
  }
  
  // Ensure all items have imageUrl and images, use placeholders as fallback
  console.log(`\n📝 [Placeholder Fallback] Applying placeholders where needed...`);
  for (let i = 0; i < baseItems.length; i++) {
    const item = baseItems[i];
    if (!item.imageUrl || item.imageUrl.trim() === "") {
      // Alternate between placeholder images for demo purposes
      item.imageUrl = i % 2 === 0 ? "/placeholder1.jpg" : "/placeholder2.jpg";
      console.log(`[Placeholder Fallback] ${item.slug}: Using placeholder for imageUrl`);
    }
    // If no images array, provide both placeholders for gallery demo
    if (!item.images || item.images.length === 0) {
      item.images = ["/placeholder1.jpg", "/placeholder2.jpg"];
      console.log(`[Placeholder Fallback] ${item.slug}: Using placeholders for images array`);
    }
  }
  console.log(`[Placeholder Fallback] Complete!\n`);


  return baseItems;
}
