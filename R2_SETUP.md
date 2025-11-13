# Cloudflare R2 Bucket Setup Guide

## Step 1: Create R2 Bucket

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **R2** in the left sidebar
3. Click **Create bucket**
4. Name: `rental-manager-images`
5. Location: Choose closest to your users (or leave default)
6. Click **Create bucket**

## Step 2: Enable Public Access

1. Go to your bucket settings
2. Navigate to **Settings** > **Public Access**
3. Click **Allow Access** and note the public URL
   - Example: `https://pub-xxxxxxxxxxxxx.r2.dev`
4. Save this URL - you'll need it for `R2_PUBLIC_URL` in your `.env` file

## Step 3: Configure CORS (if needed for direct browser access)

1. In bucket settings, go to **CORS**
2. Add CORS policy:

```json
[
  {
    "AllowedOrigins": ["https://your-domain.com", "http://localhost:3000"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3000
  }
]
```

## Step 4: Generate R2 API Tokens (Optional - for Next.js to list images)

Only needed if you want Next.js to dynamically list R2 images instead of trying sequential URLs.

1. Go to **R2** > **Overview**
2. Click **Manage R2 API Tokens**
3. Click **Create API Token**
4. Permissions: **Object Read & Write**
5. TTL: No expiry (or set as desired)
6. Click **Create API Token**
7. Save these credentials:
   - `R2_ACCOUNT_ID`
   - `R2_ACCESS_KEY_ID`
   - `R2_SECRET_ACCESS_KEY`

## Environment Variables

Add to your `.env` file:

```bash
R2_PUBLIC_URL=https://pub-xxxxxxxxxxxxx.r2.dev
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key_id
R2_SECRET_ACCESS_KEY=your_secret_access_key
R2_BUCKET_NAME=rental-manager-images
```

## Next Steps

After completing R2 setup, proceed to:
1. Set up Google Drive API (see `GOOGLE_DRIVE_SETUP.md`)
2. Deploy the Cloudflare Worker (see `/worker/README.md`)
3. Configure AirTable automation (see main `README.md`)

