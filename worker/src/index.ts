/**
 * Cloudflare Worker to sync images from Google Drive to R2
 * Triggered by AirTable webhooks when "Image Folder URL" is updated
 */

export interface Env {
  R2_BUCKET: R2Bucket;
  GOOGLE_DRIVE_API_KEY?: string;
  GOOGLE_SERVICE_ACCOUNT_JSON?: string;
  AIRTABLE_WEBHOOK_SECRET?: string;
}

interface SyncRequest {
  recordId: string;
  slug: string;
  imageFolderUrl: string;
}

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
}

interface DriveListResponse {
  files: DriveFile[];
  nextPageToken?: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, X-Webhook-Secret",
        },
      });
    }

    // Only accept POST requests
    if (request.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405);
    }

    const url = new URL(request.url);
    
    // Route: POST /sync-images
    if (url.pathname === "/sync-images" || url.pathname === "/") {
      return handleSyncImages(request, env);
    }

    return jsonResponse({ error: "Not found" }, 404);
  },
};

/**
 * Main handler for image sync webhook
 */
async function handleSyncImages(request: Request, env: Env): Promise<Response> {
  try {
    // Validate webhook secret
    const providedSecret = request.headers.get("X-Webhook-Secret");
    if (env.AIRTABLE_WEBHOOK_SECRET && providedSecret !== env.AIRTABLE_WEBHOOK_SECRET) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    // Parse request body
    const body = await request.json() as SyncRequest;
    const { recordId, slug, imageFolderUrl } = body;

    // Validate required fields
    if (!slug || !imageFolderUrl) {
      return jsonResponse({ 
        error: "Missing required fields: slug, imageFolderUrl" 
      }, 400);
    }

    // Extract Google Drive folder ID
    const folderId = extractDriveFolderId(imageFolderUrl);
    if (!folderId) {
      return jsonResponse({ 
        error: "Invalid Google Drive folder URL" 
      }, 400);
    }

    console.log(`Syncing images for property: ${slug}, folder: ${folderId}`);

    // Get access token (API key or service account)
    const accessToken = await getAccessToken(env);
    if (!accessToken) {
      return jsonResponse({ 
        error: "Google Drive credentials not configured" 
      }, 500);
    }

    // List image files from Drive folder
    const driveFiles = await listDriveFiles(folderId, accessToken);
    if (driveFiles.length === 0) {
      return jsonResponse({ 
        error: "No images found in Drive folder" 
      }, 404);
    }

    console.log(`Found ${driveFiles.length} images in Drive folder`);

    // Delete existing images for this property in R2
    await deletePropertyImages(env.R2_BUCKET, slug);

    // Download and upload images
    const uploadedImages: string[] = [];
    let imageIndex = 1;

    for (const file of driveFiles) {
      // Only process image files
      if (!file.mimeType.startsWith("image/")) {
        console.log(`Skipping non-image file: ${file.name}`);
        continue;
      }

      try {
        // Download image from Drive
        const imageData = await downloadDriveFile(file.id, accessToken);
        
        // Determine file extension from mime type
        const extension = getExtensionFromMimeType(file.mimeType);
        const r2Key = `properties/${slug}/image-${imageIndex}.${extension}`;

        // Upload to R2
        await env.R2_BUCKET.put(r2Key, imageData, {
          httpMetadata: {
            contentType: file.mimeType,
          },
        });

        uploadedImages.push(r2Key);
        console.log(`Uploaded: ${r2Key}`);
        imageIndex++;
      } catch (error) {
        console.error(`Failed to process ${file.name}:`, error);
        // Continue with other images
      }
    }

    if (uploadedImages.length === 0) {
      return jsonResponse({ 
        error: "Failed to upload any images" 
      }, 500);
    }

    return jsonResponse({
      success: true,
      recordId,
      slug,
      imageCount: uploadedImages.length,
      images: uploadedImages,
    });

  } catch (error) {
    console.error("Error syncing images:", error);
    return jsonResponse({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }, 500);
  }
}

/**
 * Extract folder ID from Google Drive URL
 */
function extractDriveFolderId(url: string): string | null {
  if (!url) return null;
  
  // Match: https://drive.google.com/drive/folders/FOLDER_ID
  const match = url.match(/\/folders\/([A-Za-z0-9_\-]+)/);
  if (match) return match[1];
  
  // If it's already just an ID
  if (/^[A-Za-z0-9_\-]{10,}$/.test(url)) return url;
  
  return null;
}

/**
 * Get access token for Google Drive API
 */
async function getAccessToken(env: Env): Promise<string | null> {
  // Option 1: API Key (simpler, for public folders)
  if (env.GOOGLE_DRIVE_API_KEY) {
    return env.GOOGLE_DRIVE_API_KEY;
  }

  // Option 2: Service Account (more secure)
  if (env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    try {
      const serviceAccount = JSON.parse(env.GOOGLE_SERVICE_ACCOUNT_JSON);
      return await getServiceAccountToken(serviceAccount);
    } catch (error) {
      console.error("Failed to parse service account JSON:", error);
      return null;
    }
  }

  return null;
}

/**
 * Get OAuth2 token from service account
 */
async function getServiceAccountToken(serviceAccount: any): Promise<string> {
  const jwtHeader = btoa(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  
  const now = Math.floor(Date.now() / 1000);
  const jwtClaimSet = btoa(JSON.stringify({
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/drive.readonly",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  }));

  // Note: In production, you'd need to sign this JWT with the private key
  // This is a simplified version - consider using a library or external service
  // For now, we'll use API key approach which is simpler for Workers
  
  throw new Error("Service account not fully implemented - use GOOGLE_DRIVE_API_KEY instead");
}

/**
 * List image files in a Google Drive folder
 */
async function listDriveFiles(folderId: string, accessToken: string): Promise<DriveFile[]> {
  const isApiKey = !accessToken.includes(".");
  const files: DriveFile[] = [];
  let pageToken: string | undefined;

  do {
    const params = new URLSearchParams({
      q: `'${folderId}' in parents and trashed=false`,
      fields: "files(id,name,mimeType),nextPageToken",
      pageSize: "100",
    });

    if (pageToken) {
      params.set("pageToken", pageToken);
    }

    // Add auth based on type
    if (isApiKey) {
      params.set("key", accessToken);
    }

    const url = `https://www.googleapis.com/drive/v3/files?${params.toString()}`;
    const headers: HeadersInit = {};
    
    if (!isApiKey) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }

    const response = await fetch(url, { headers });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Drive API error: ${response.status} - ${error}`);
    }

    const data = await response.json() as DriveListResponse;
    files.push(...data.files);
    pageToken = data.nextPageToken;

  } while (pageToken);

  // Sort files by name for consistent ordering
  files.sort((a, b) => a.name.localeCompare(b.name));

  return files;
}

/**
 * Download a file from Google Drive
 */
async function downloadDriveFile(fileId: string, accessToken: string): Promise<ArrayBuffer> {
  const isApiKey = !accessToken.includes(".");
  const params = new URLSearchParams();
  
  if (isApiKey) {
    params.set("key", accessToken);
  }

  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&${params.toString()}`;
  const headers: HeadersInit = {};
  
  if (!isApiKey) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  const response = await fetch(url, { headers });

  if (!response.ok) {
    throw new Error(`Failed to download file: ${response.status}`);
  }

  return await response.arrayBuffer();
}

/**
 * Delete all existing images for a property from R2
 */
async function deletePropertyImages(bucket: R2Bucket, slug: string): Promise<void> {
  const prefix = `properties/${slug}/`;
  
  // List all objects with this prefix
  const listed = await bucket.list({ prefix });
  
  // Delete each object
  for (const object of listed.objects) {
    await bucket.delete(object.key);
    console.log(`Deleted: ${object.key}`);
  }
}

/**
 * Get file extension from MIME type
 */
function getExtensionFromMimeType(mimeType: string): string {
  const mimeMap: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/webp": "webp",
    "image/svg+xml": "svg",
    "image/bmp": "bmp",
  };

  return mimeMap[mimeType.toLowerCase()] || "jpg";
}

/**
 * Helper to create JSON response
 */
function jsonResponse(data: any, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

