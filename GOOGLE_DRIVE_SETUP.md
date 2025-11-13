# Google Drive API Setup Guide

The Cloudflare Worker needs access to Google Drive API to download images from folders shared by your realtor.

## Option 1: API Key (Simpler, for public folders)

### Steps:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable **Google Drive API**:
   - Go to **APIs & Services** > **Library**
   - Search for "Google Drive API"
   - Click **Enable**
4. Create API Key:
   - Go to **APIs & Services** > **Credentials**
   - Click **Create Credentials** > **API Key**
   - Copy the API key
5. Restrict the API Key (recommended):
   - Click on the API key to edit
   - Under **API restrictions**, select "Restrict key"
   - Choose **Google Drive API** only
   - Save

### Add to Worker Secrets:

```bash
cd worker
npx wrangler secret put GOOGLE_DRIVE_API_KEY
# Paste your API key when prompted
```

### Requirements for this approach:
- Google Drive folders must be set to "Anyone with the link can view"
- Simple but less secure

## Option 2: Service Account (More secure, recommended for production)

### Steps:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable **Google Drive API** (same as above)
4. Create Service Account:
   - Go to **APIs & Services** > **Credentials**
   - Click **Create Credentials** > **Service Account**
   - Name: `rental-manager-drive-reader`
   - Click **Create and Continue**
   - Skip optional role assignment
   - Click **Done**
5. Create Service Account Key:
   - Click on the service account you just created
   - Go to **Keys** tab
   - Click **Add Key** > **Create new key**
   - Choose **JSON**
   - Download the JSON file (keep it secure!)
6. Share Drive folders with service account:
   - Open Google Drive folder
   - Click **Share**
   - Add service account email (looks like `rental-manager-drive-reader@project-id.iam.gserviceaccount.com`)
   - Give **Viewer** permission

### Add to Worker Secrets:

```bash
cd worker
npx wrangler secret put GOOGLE_SERVICE_ACCOUNT_JSON
# Paste the entire JSON content when prompted (minified, single line)
```

### Requirements for this approach:
- More secure - no public folder access needed
- Each Drive folder must be shared with service account email
- Best for production use

## Testing

Test your credentials work:

```bash
# For API Key
curl "https://www.googleapis.com/drive/v3/files?q='FOLDER_ID'+in+parents&key=YOUR_API_KEY"

# For Service Account (get access token first)
# See Google OAuth2 documentation for service account authentication
```

## Next Steps

After setting up Google Drive API:
1. Configure credentials in Worker secrets
2. Deploy Worker
3. Test the sync endpoint with a sample property

