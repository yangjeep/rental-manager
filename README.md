# Welcome to Rent-In-Ottawa! (Next.js + Airtable)

A ready-to-deploy demo environment for a rental listings website.

## Quick Start

```bash
npm install
cp env.example .env.local
# Edit AIRTABLE_TOKEN, AIRTABLE_BASE_ID, and AIRTABLE_TABLE_NAME (optional)
npm run dev
```

Deploy to Vercel and set the same env vars in Project Settings.

## Datasource (Airtable)

Table name: `Properties` (default, configurable via `AIRTABLE_TABLE_NAME`)

### Required Fields

- `ID` — Unique identifier (string)
- `Title` — Property title
- `Monthly Rent` — Monthly rental price (number)
- `Bedrooms` — Number of bedrooms (number)
- `Bathrooms` — Number of bathrooms (number)
- `Status` — Availability status (e.g., "Available")
- `City` — City name
- `Address` — Full address
- `Description` — Property description

### Optional Fields

- `Slug` — URL-friendly identifier (auto-generated from Title if not provided)
- `Pets` — Pet policy (e.g., "Allowed", "Not Allowed", "Conditional")
- `Parking` — Parking information (accepts "Yes/No", "True/False", "1/0", or free text like "1 spot", "Street")
- `Image Folder URL` — Google Drive folder URL or folder ID for property images

### Setting Up Images

This project supports **two image storage methods**:
1. **Cloudflare R2** (Recommended) - Fast, unlimited bandwidth, automatic sync
2. **Google Drive** (Fallback) - Manual setup, used as fallback if R2 images unavailable

#### Option 1: Cloudflare R2 with Automatic Sync (Recommended)

Images are automatically synced from Google Drive to Cloudflare R2 when you update the `Image Folder URL` field in AirTable.

**Setup Steps:**

1. **Set up Cloudflare R2 Bucket** (See `R2_SETUP.md` for detailed instructions)
   - Create R2 bucket in Cloudflare Dashboard
   - Enable public access and note the public URL
   - Add `R2_PUBLIC_URL` to your `.env.local`

2. **Set up Google Drive API** (See `GOOGLE_DRIVE_SETUP.md` for detailed instructions)
   - Create API key or service account in Google Cloud Console
   - Enable Google Drive API

3. **Deploy Cloudflare Worker**:
   ```bash
   cd worker
   npm install
   
   # Set up secrets
   npx wrangler secret put GOOGLE_DRIVE_API_KEY
   npx wrangler secret put AIRTABLE_WEBHOOK_SECRET
   
   # Deploy
   npm run deploy
   # Note the Worker URL (e.g., https://rental-manager-image-sync.your-subdomain.workers.dev)
   ```

4. **Configure AirTable Automation**:
   - In your AirTable base, go to **Automations**
   - Click **Create automation**
   - **Trigger**: "When record matches conditions"
     - Table: `Properties`
     - Field: `Image Folder URL`
     - Condition: "is not empty"
   - **Action**: "Send webhook"
     - URL: `https://your-worker-url.workers.dev/sync-images`
     - Method: `POST`
     - Headers: Add `X-Webhook-Secret` with your secret value
     - Body (JSON):
       ```json
       {
         "recordId": "{{AIRTABLE_RECORD_ID()}}",
         "slug": "{{Slug}}",
         "imageFolderUrl": "{{Image Folder URL}}"
       }
       ```
   - Test the automation and turn it on

**How it works:**
- Realtor pastes Google Drive folder URL into AirTable
- AirTable triggers webhook to Cloudflare Worker
- Worker downloads images from Drive and uploads to R2 (keeps original filenames)
- Images stored at: `/{slug}/original-filename.jpg`
- Next.js lists all images via R2 API and sorts alphanumerically
- First image (alphabetically) becomes the thumbnail
- Next.js app fetches images from R2 (fast, unlimited bandwidth)

#### Option 2: Google Drive Only (Fallback/Alternative)

If R2 is not set up, images can be fetched directly from Google Drive:

1. **In Airtable**: Add the `Image Folder URL` field to your Properties table. For each property, paste either:
   - The full Google Drive folder URL (e.g., `https://drive.google.com/drive/folders/1ABC123...`)
   - Or just the folder ID (e.g., `1ABC123...`)

2. **Deploy Google Apps Script**:
   - Go to [Google Apps Script](https://script.google.com)
   - Create a new project
   - Copy the code from `scripts/apps_script.gs` into the editor
   - Click "Deploy" → "New deployment"
   - Choose type: "Web app"
   - Set "Execute as": "Me"
   - Set "Who has access": "Anyone"
   - Click "Deploy" and copy the web app URL

3. **Add to Environment Variables**:
   - Add `DRIVE_LIST_ENDPOINT=<your-apps-script-url>` to your `.env.local`
   - The endpoint will be called as: `DRIVE_LIST_ENDPOINT?folder=<folderId>`
   - It should return a JSON array of image URLs

**Image Resolution Priority:**
1. Try R2: Lists all images in folder via R2 API, sorts alphanumerically
2. Fallback to placeholder images if R2 not configured or no images found

**Note:** R2 API credentials are required to list images (no filename conventions assumed).

## Security / Demo

- Basic Auth is enabled via `middleware.ts` using `DEMO_USER`/`DEMO_PASS`.
- `DEMO_NOINDEX=true` adds `X-Robots-Tag: noindex, nofollow`.
- For production, remove `robots.txt` block and set `DEMO_NOINDEX=false`.

## Revalidate

- ISR is set via `REVALIDATE_SECONDS` (default 60 for preview).
- Manual revalidate endpoint: `/api/revalidate?secret=...` with env `REVALIDATE_SECRET`.

## Performance Testing

Lighthouse CI is integrated to monitor performance, accessibility, best practices, and SEO.

### Running Lighthouse Locally

```bash
# Install dependencies first
npm install

# Set baseline from current performance (run once)
npm run build
npm run start  # In another terminal
npm run lighthouse:baseline  # Captures current performance as baseline

# Run Lighthouse CI tests
npm run lighthouse

# Or run a quick local test
npm run lighthouse:local
```

**Setting Baseline**: Run `npm run lighthouse:baseline` once to capture your current performance metrics and set them as the baseline thresholds. This ensures tests don't fail on your first run and allows you to track performance regressions.

### GitHub Actions

Lighthouse tests run automatically on:
- Every push to `main`/`master` branch
- Every pull request to `main`/`master` branch
- Manual trigger via GitHub Actions UI

Results are uploaded as artifacts and the workflow will fail if performance thresholds are not met:
- Performance: ≥ 80
- Accessibility: ≥ 90
- Best Practices: ≥ 90
- SEO: ≥ 90

## Tech

- Next.js App Router
- Tailwind CSS
- Lighthouse CI for performance monitoring
- No backend server needed

### Environment Variables

**Required:**
- `AIRTABLE_TOKEN` — Airtable API token
- `AIRTABLE_BASE_ID` — Airtable base ID

**Optional:**
- `AIRTABLE_TABLE_NAME` — Table name (defaults to "Properties")

**For R2 Image Storage (recommended):**
- `R2_PUBLIC_URL` — Cloudflare R2 public URL (required)
- `R2_ACCOUNT_ID` — R2 account ID (required for listing images)
- `R2_ACCESS_KEY_ID` — R2 access key (required for listing images)
- `R2_SECRET_ACCESS_KEY` — R2 secret key (required for listing images)
- `R2_BUCKET_NAME` — R2 bucket name (defaults to "rental-manager-images")

**For image sync (if using R2):**
- See `worker/README.md` for Worker-specific environment variables

