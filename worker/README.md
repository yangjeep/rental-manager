# Image Sync Worker

Cloudflare Worker that syncs images from Google Drive to R2 bucket when triggered by AirTable webhooks.

## Setup

### 1. Install Dependencies

```bash
cd worker
npm install
```

### 2. Configure Secrets

Set up Google Drive API credentials:

```bash
# Option 1: API Key (for public folders)
npx wrangler secret put GOOGLE_DRIVE_API_KEY

# Option 2: Service Account (recommended)
npx wrangler secret put GOOGLE_SERVICE_ACCOUNT_JSON
```

Set up webhook security:

```bash
npx wrangler secret put AIRTABLE_WEBHOOK_SECRET
```

### 3. Update wrangler.toml

Ensure `bucket_name` in `wrangler.toml` matches your R2 bucket name.

### 4. Local Development

```bash
npm run dev
```

Test locally at `http://localhost:8787`

### 5. Deploy to Cloudflare

```bash
npm run deploy
```

Note the Worker URL (e.g., `https://rental-manager-image-sync.your-subdomain.workers.dev`)

## API Endpoint

### POST /sync-images

Syncs images from Google Drive to R2.

**Headers:**
- `X-Webhook-Secret`: Must match `AIRTABLE_WEBHOOK_SECRET`

**Body:**
```json
{
  "recordId": "recXXXXXXXXXXXXXX",
  "slug": "property-slug",
  "imageFolderUrl": "https://drive.google.com/drive/folders/FOLDER_ID"
}
```

**Response (Success):**
```json
{
  "success": true,
  "slug": "property-slug",
  "imageCount": 5,
  "images": [
    "https://pub-xxxxx.r2.dev/properties/property-slug/image-1.jpg",
    "https://pub-xxxxx.r2.dev/properties/property-slug/image-2.jpg"
  ]
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Error message"
}
```

## Testing

### Test with curl:

```bash
curl -X POST https://your-worker.workers.dev/sync-images \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: your-secret" \
  -d '{
    "recordId": "rec123",
    "slug": "test-property",
    "imageFolderUrl": "https://drive.google.com/drive/folders/FOLDER_ID"
  }'
```

## How It Works

1. Worker receives webhook from AirTable
2. Validates webhook secret
3. Extracts Google Drive folder ID from URL
4. Lists all images in the Drive folder
5. Downloads each image
6. Deletes existing images for this property from R2 (if any)
7. Uploads images to R2 at `/{slug}/original-filename.jpg` (keeps original names)
8. Returns list of uploaded image URLs

