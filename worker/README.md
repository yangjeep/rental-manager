# Image Sync Worker

Cloudflare Worker that syncs images from Google Drive to R2 bucket when triggered by Airtable webhooks.

## Prerequisites

Before deploying the worker, ensure you have:

1. **Cloudflare R2 Buckets** created and configured (see `../R2_SETUP.md`)
   - Production: `rental-manager-images`
   - Demo: `rental-manager-demo-images`
2. **Google Drive API Key** (see `../GOOGLE_DRIVE_SETUP.md`)
   - The Drive folders must be set to "Anyone with the link can view"
3. **Airtable Base** with Properties table containing `Image Folder URL` field

## Environments

The worker supports two environments:

- **Production** (default): Uses `rental-manager-images` R2 bucket
- **Demo**: Uses `rental-manager-demo-images` R2 bucket

Each environment has its own:
- Worker deployment (separate URLs)
- R2 bucket binding
- Secrets (can use same or different API keys/secrets)

## Setup

### 1. Install Dependencies

```bash
cd worker
npm install
```

### 2. Configure Secrets

Secrets are configured per environment. You can use the same secrets for both environments or different ones.

#### For Production Environment:

Set up Google Drive API key:

```bash
npx wrangler secret put GOOGLE_DRIVE_API_KEY
# When prompted, paste your Google Drive API key
```

Set up webhook security secret:

```bash
npx wrangler secret put AIRTABLE_WEBHOOK_SECRET
# When prompted, paste your secret (e.g., a random UUID or strong password)
```

#### For Demo Environment:

Set up Google Drive API key (can be same or different from prod):

```bash
npx wrangler secret put GOOGLE_DRIVE_API_KEY --env demo
# When prompted, paste your Google Drive API key
```

Set up webhook security secret (should be different from prod for security):

```bash
npx wrangler secret put AIRTABLE_WEBHOOK_SECRET --env demo
# When prompted, paste your demo secret
```

**Note:** 
- Secrets are stored securely by Cloudflare and are not visible in your code
- R2 bucket names are already configured in `wrangler.toml`:
  - Production: `rental-manager-images`
  - Demo: `rental-manager-demo-images`

### 3. Local Development (Optional)

Test the worker locally before deploying:

**For Production:**
```bash
npm run dev
```

**For Demo:**
```bash
npm run dev:demo
```

The worker will be available at `http://localhost:8787`

To test locally, you'll need to set up local secrets in `.dev.vars`:

```bash
# Create .dev.vars file in the worker directory
echo "GOOGLE_DRIVE_API_KEY=your-api-key-here" > .dev.vars
echo "AIRTABLE_WEBHOOK_SECRET=your-secret-here" >> .dev.vars
```

**Note:** Add `.dev.vars` to `.gitignore` to avoid committing secrets.

### 4. Deploy to Cloudflare

**Deploy to Production:**
```bash
npm run deploy:prod
# or simply
npm run deploy
```

**Deploy to Demo:**
```bash
npm run deploy:demo
```

After deployment, note the Worker URL from the output:

**Production:**
```
✨  Deployed to https://rental-manager-image-sync.your-subdomain.workers.dev
```

**Demo:**
```
✨  Deployed to https://rental-manager-image-sync-demo.your-subdomain.workers.dev
```

**Save these URLs** - you'll need them for the Airtable webhook configurations.

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

### Manual Testing with curl

Before setting up the Airtable automation, test the worker manually:

```bash
curl -X POST https://your-worker.workers.dev/sync-images \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: your-secret" \
  -d '{
    "recordId": "recXXXXXXXXXXXXXX",
    "slug": "test-property-slug",
    "imageFolderUrl": "https://drive.google.com/drive/folders/FOLDER_ID"
  }'
```

**Replace:**
- `https://your-worker.workers.dev` with your actual Worker URL
- `your-secret` with the same secret you set in `AIRTABLE_WEBHOOK_SECRET`
- `recXXXXXXXXXXXXXX` with an actual Airtable record ID (optional, for logging)
- `test-property-slug` with a property slug (e.g., "downtown-apartment-123")
- `FOLDER_ID` with a Google Drive folder ID that contains images

**Expected Success Response:**
```json
{
  "success": true,
  "recordId": "recXXXXXXXXXXXXXX",
  "slug": "test-property-slug",
  "imageCount": 5,
  "images": [
    "test-property-slug/image1.jpg",
    "test-property-slug/image2.jpg",
    ...
  ]
}
```

**Common Errors:**
- `401 Unauthorized` - Check that `X-Webhook-Secret` header matches your secret
- `400 Bad Request` - Verify `slug` and `imageFolderUrl` are provided and valid
- `404 Not Found` - Check that the Google Drive folder contains image files
- `500 Internal Server Error` - Check worker logs: `npx wrangler tail`

### View Worker Logs

Monitor worker execution in real-time:

```bash
npx wrangler tail
```

This shows all requests, responses, and console.log output from the worker.

### Verify Images in R2

After a successful sync, verify images are in your R2 bucket:

1. Go to Cloudflare Dashboard → R2
2. Select your bucket:
   - Production: `rental-manager-images`
   - Demo: `rental-manager-demo-images`
3. Navigate to the folder matching your slug (e.g., `test-property-slug/`)
4. You should see all uploaded images with their original filenames

## How It Works

1. **Airtable triggers webhook** when `Image Folder URL` field is updated
2. **Worker receives POST request** to `/sync-images` endpoint
3. **Validates webhook secret** from `X-Webhook-Secret` header
4. **Extracts Google Drive folder ID** from the provided URL
5. **Lists all image files** in the Drive folder using Google Drive API
6. **Downloads each image** from Google Drive
7. **Deletes existing images** for this property from R2 (if any) to avoid duplicates
8. **Uploads images to R2** at `{slug}/original-filename.jpg` (preserves original filenames)
9. **Returns success response** with list of uploaded image keys

## Image Storage Details

- **Location:** Images are stored in R2 at `{slug}/filename.jpg`
- **Filename Preservation:** Original filenames from Google Drive are preserved (special characters are sanitized)
- **Sorting:** Images are sorted alphabetically by filename in Google Drive
- **Supported Formats:** `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.bmp`

## Next Steps

After deploying the worker:

1. **Configure Airtable Webhook** - See `../AIRTABLE_WEBHOOK_SETUP.md` for detailed instructions
2. **Test with a sample property** - Update `Image Folder URL` in Airtable and verify sync works
3. **Monitor logs** - Use `npx wrangler tail` to watch for any errors
4. **Verify in Next.js app** - Check that synced images appear on property pages

