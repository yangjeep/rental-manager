# Image Sync Deployment Guide

Complete step-by-step guide to deploy the automated image sync system.

## Overview

Your realtor will simply paste a Google Drive folder URL into AirTable. The system automatically:
1. AirTable triggers a webhook to Cloudflare Worker
2. Worker downloads images from Google Drive
3. Worker uploads images to R2 bucket
4. Next.js app displays images from R2 (with Drive fallback)

## Deployment Checklist

### ✅ Step 1: Set up Cloudflare R2 Bucket

**Status:** Configuration completed in code ✅

**Manual steps required:**

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/) → R2
2. Create bucket: `rental-manager-images`
3. Go to Settings → Public Access → Click "Allow Access"
4. Copy the public URL (already configured: `https://pub-8ad53ad0fd6f414fad3c0fdb189ec060.r2.dev`)

📖 Detailed instructions: See `R2_SETUP.md`

---

### ✅ Step 2: Set up Google Drive API

**Status:** Documentation ready ✅

**Manual steps required:**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create/select project
3. Enable Google Drive API
4. Create API Key (for public folders) OR Service Account (for private folders)
5. Save credentials for next step

📖 Detailed instructions: See `GOOGLE_DRIVE_SETUP.md`

---

### ✅ Step 3: Deploy Cloudflare Worker

**Status:** Code ready, needs deployment ⏳

**Manual steps required:**

```bash
# 1. Navigate to worker directory
cd worker

# 2. Install dependencies
npm install

# 3. Set up Google Drive credentials (choose one)
# Option A: API Key (simpler)
npx wrangler secret put GOOGLE_DRIVE_API_KEY
# Paste your API key when prompted

# Option B: Service Account (more secure)
# npx wrangler secret put GOOGLE_SERVICE_ACCOUNT_JSON
# Paste the entire JSON content (minified) when prompted

# 4. Set up webhook security
npx wrangler secret put AIRTABLE_WEBHOOK_SECRET
# Enter a random secret (e.g., generate at: https://randomkeygen.com/)
# SAVE THIS SECRET - you'll need it for AirTable setup

# 5. Deploy the worker
npm run deploy

# 6. Copy the Worker URL from the output
# Example: https://rental-manager-image-sync.your-subdomain.workers.dev
```

📖 Detailed instructions: See `worker/README.md`

---

### ✅ Step 4: Configure AirTable Automation

**Status:** Documentation ready ✅

**Manual steps required:**

1. Open your AirTable base
2. Go to **Automations** (top right)
3. Click **Create automation**

**Configure Trigger:**
- Name: "Sync Property Images to R2"
- Trigger: "When record matches conditions"
  - Table: `Properties`
  - Conditions: When "Image Folder URL" is not empty

**Configure Action:**
- Action: "Send webhook"
- URL: `https://your-worker-url.workers.dev/sync-images` (from Step 3)
- Method: `POST`
- Headers:
  ```
  Content-Type: application/json
  X-Webhook-Secret: YOUR_SECRET_FROM_STEP_3
  ```
- Body (select "Custom JSON"):
  ```json
  {
    "recordId": "{{AIRTABLE_RECORD_ID()}}",
    "slug": "{{Slug}}",
    "imageFolderUrl": "{{Image Folder URL}}"
  }
  ```

4. Click **Test action** with a property that has an Image Folder URL
5. Verify images appear in R2 bucket
6. Turn on the automation

---

### ✅ Step 5: Verify Next.js Configuration

**Status:** Code updated ✅

Your `.env` and `.env.local` files already have:
```bash
R2_PUBLIC_URL=https://pub-8ad53ad0fd6f414fad3c0fdb189ec060.r2.dev
```

No additional steps needed!

---

## Testing the Complete Flow

### Test 1: Manual Sync

```bash
# Test the worker directly
curl -X POST https://your-worker-url.workers.dev/sync-images \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: YOUR_SECRET" \
  -d '{
    "recordId": "recTest123",
    "slug": "test-property",
    "imageFolderUrl": "https://drive.google.com/drive/folders/YOUR_FOLDER_ID"
  }'
```

Expected response:
```json
{
  "success": true,
  "slug": "test-property",
  "imageCount": 5,
  "images": [...]
}
```

### Test 2: Via AirTable

1. Open a property in AirTable
2. Paste a Google Drive folder URL into "Image Folder URL" field
3. Wait 5-10 seconds
4. Check R2 bucket for images at: `/properties/{slug}/image-1.jpg`
5. Refresh your Next.js app - images should appear!

### Test 3: Verify Fallback

1. Remove `R2_PUBLIC_URL` from `.env.local` temporarily
2. Restart dev server: `npm run dev`
3. Images should still load from Google Drive (via DRIVE_LIST_ENDPOINT)
4. Re-add `R2_PUBLIC_URL` and restart

---

## Troubleshooting

### Images not syncing from Drive to R2

1. **Check Worker logs:**
   ```bash
   cd worker
   npx wrangler tail
   ```
   Trigger the sync and watch for errors

2. **Common issues:**
   - Drive folder not shared publicly (if using API key)
   - Wrong folder ID in AirTable
   - Webhook secret mismatch
   - R2 bucket binding not configured in `wrangler.toml`

### Images not displaying in Next.js

1. **Check browser console** for 404 errors
2. **Verify R2 public URL** is correct in `.env.local`
3. **Check image paths** in R2 bucket (should be `/properties/{slug}/image-1.jpg`)
4. **Clear Next.js cache:**
   ```bash
   rm -rf .next
   npm run dev
   ```

### AirTable automation not triggering

1. **Check automation is turned ON** in AirTable
2. **Verify trigger condition** matches (field not empty)
3. **Check webhook URL** is correct
4. **Test webhook manually** with curl command above

---

## Cost Estimates

### Cloudflare Free Tier
- **R2 Storage:** 10 GB/month free
- **R2 Operations:** 1M writes, 10M reads/month free
- **R2 Bandwidth:** Unlimited free ✨
- **Worker Requests:** 100,000/day free

### Estimated Usage (50 properties, 5 images each)
- **Storage:** ~125 MB (well under 10 GB)
- **Monthly operations:** ~500 writes, ~10,000 reads
- **Cost:** $0/month 🎉

---

## Next Steps

After completing deployment:

1. ✅ Update your realtor's documentation
   - "Just paste the Google Drive folder URL into AirTable"
   - Images will sync automatically in 5-10 seconds

2. ✅ Monitor Worker logs for first few days
   ```bash
   cd worker
   npx wrangler tail
   ```

3. ✅ Set up custom domain for Worker (optional)
   - More professional webhook URL
   - Configure in Cloudflare Dashboard → Workers → your worker → Settings → Triggers

4. ✅ Consider adding notification on sync completion
   - Email realtor when images are synced
   - Add to Worker code using Cloudflare Email Workers or external service

---

## Support

- **R2 Setup:** See `R2_SETUP.md`
- **Google Drive API:** See `GOOGLE_DRIVE_SETUP.md`
- **Worker Details:** See `worker/README.md`
- **Main Documentation:** See `README.md`

Happy deploying! 🚀

