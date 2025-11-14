# Airtable Webhook Automation Setup Guide

This guide walks you through setting up an Airtable automation that triggers the Cloudflare Worker to sync images from Google Drive to R2 whenever a property's `Image Folder URL` is updated.

## Prerequisites

Before setting up the webhook, ensure you have:

1. ✅ **Cloudflare Worker deployed** (see `worker/README.md`)
   - **Production Worker URL:** `https://rental-manager-image-sync.your-subdomain.workers.dev`
   - **Demo Worker URL:** `https://rental-manager-image-sync-demo.your-subdomain.workers.dev`
   - Worker secrets configured: `GOOGLE_DRIVE_API_KEY` and `AIRTABLE_WEBHOOK_SECRET` (per environment)

2. ✅ **Airtable Base** with Properties table
   - Table must have `Image Folder URL` field (single line text or URL field)
   - Table should have `Slug` field (or it will be auto-generated from Title)

3. ✅ **Google Drive folders** set to "Anyone with the link can view"

**Note:** You can set up separate automations for production and demo environments, each pointing to their respective worker URLs.

## Step-by-Step Setup

### Step 1: Open Airtable Automations

1. Open your Airtable base
2. Click on **"Automations"** in the top menu bar
3. Click **"Create automation"** button

### Step 2: Configure the Trigger

1. **Trigger Type:** Select **"When record matches conditions"**

2. **Configuration:**
   - **Table:** Select `Properties` (or your table name)
   - **Condition:** Add condition:
     - **Field:** `Image Folder URL`
     - **Condition:** `is not empty`
   - **Run trigger:** Choose when to run:
     - **"When a record is created or updated"** (recommended)
     - OR **"Only when a record is updated"** (if you only want to sync on updates)

3. Click **"Continue"**

### Step 3: Configure the Webhook Action

1. **Action Type:** Select **"Send webhook"**

2. **Webhook Configuration:**
   - **Method:** `POST`
   - **URL:** Enter your Worker URL:
     - **Production:** `https://rental-manager-image-sync.your-subdomain.workers.dev/sync-images`
     - **Demo:** `https://rental-manager-image-sync-demo.your-subdomain.workers.dev/sync-images`
     (Replace with your actual Worker URL - use the appropriate one for your environment)

3. **Headers:** Click **"Add header"** and add:
   - **Name:** `X-Webhook-Secret`
   - **Value:** Enter the same secret you set in `AIRTABLE_WEBHOOK_SECRET`
     (This must match exactly - copy it carefully!)

4. **Body Type:** Select **"JSON"**

5. **Body Content:** Enter the following JSON:
   ```json
   {
     "recordId": "{{AIRTABLE_RECORD_ID()}}",
     "slug": "{{Slug}}",
     "imageFolderUrl": "{{Image Folder URL}}"
   }
   ```

   **Important Notes:**
   - If your `Slug` field might be empty, you can use a fallback:
     ```json
     {
       "recordId": "{{AIRTABLE_RECORD_ID()}}",
       "slug": "{{Slug}}",
       "imageFolderUrl": "{{Image Folder URL}}"
     }
     ```
   - The worker will auto-generate a slug from the Title if Slug is empty, but it's better to have it in Airtable
   - Field names are case-sensitive - ensure they match your Airtable field names exactly

6. Click **"Continue"**

### Step 4: Test the Automation

1. **Before turning on the automation**, click **"Test action"**

2. Airtable will send a test webhook to your worker. Check:
   - **Airtable shows:** "Test successful" or similar
   - **Worker logs:** Run `npx wrangler tail` in your terminal to see the request
   - **Expected response:** Worker should return `200 OK` with a JSON response

3. **If test fails:**
   - Check that Worker URL is correct
   - Verify `X-Webhook-Secret` header matches your worker secret
   - Check worker logs for error messages
   - Ensure the test record has a valid `Image Folder URL` and `Slug`

### Step 5: Turn On the Automation

1. Once testing is successful, click **"Turn on automation"**

2. **Optional:** Give your automation a descriptive name:
   - Example: "Sync Images to R2"

3. The automation is now active! 🎉

## Testing the Automation

### Manual Test

1. **Select a test property** in your Airtable table
2. **Update the `Image Folder URL` field** with a Google Drive folder URL:
   - Full URL: `https://drive.google.com/drive/folders/FOLDER_ID`
   - Or just the folder ID: `FOLDER_ID`
3. **Save the record**
4. **Wait a few seconds** for the automation to trigger
5. **Check worker logs:**
   ```bash
   npx wrangler tail
   ```
   You should see:
   - Webhook request received
   - Images being downloaded from Drive
   - Images being uploaded to R2
   - Success response

6. **Verify in R2:**
   - Go to Cloudflare Dashboard → R2
   - Navigate to your bucket
   - Check that images appear in `{slug}/` folder

7. **Verify in Next.js app:**
   - Visit the property page
   - Images should load from R2

## Troubleshooting

### Automation Not Triggering

- **Check automation status:** Ensure it's turned on (green toggle)
- **Check trigger conditions:** Verify the record matches the condition
- **Check Airtable activity log:** Go to Automations → Activity to see if automation ran
- **Verify field names:** Ensure `Image Folder URL` field name matches exactly (case-sensitive)

### Webhook Returns 401 Unauthorized

- **Check secret header:** Ensure `X-Webhook-Secret` value matches `AIRTABLE_WEBHOOK_SECRET` exactly
- **Check for extra spaces:** Copy-paste the secret to avoid typos
- **Verify worker secret:** Run `npx wrangler secret list` to confirm secret is set

### Webhook Returns 400 Bad Request

- **Check required fields:** Ensure `slug` and `imageFolderUrl` are provided in the JSON body
- **Check field names:** Verify field names in JSON match your Airtable field names
- **Check URL format:** Ensure `Image Folder URL` contains a valid Google Drive folder URL or ID

### Webhook Returns 404 Not Found

- **Check Drive folder:** Ensure the Google Drive folder contains image files
- **Check folder permissions:** Folder must be set to "Anyone with the link can view"
- **Check API key:** Verify `GOOGLE_DRIVE_API_KEY` is set correctly in worker secrets

### Webhook Returns 500 Internal Server Error

- **Check worker logs:** Run `npx wrangler tail` to see detailed error messages
- **Check R2 bucket:** Ensure bucket name in `wrangler.toml` matches your actual bucket
- **Check R2 permissions:** Ensure worker has write access to R2 bucket (should be automatic with binding)

### Images Not Appearing in Next.js App

- **Wait for sync:** Allow a few seconds for images to upload
- **Check R2 bucket:** Verify images are actually in R2 at `{slug}/filename.jpg`
- **Check Next.js env vars:** Ensure `R2_PUBLIC_URL` and R2 API credentials are set
- **Check slug matching:** Ensure the slug in R2 matches the slug in your property URL

## Automation Best Practices

1. **Test with one property first** before syncing all properties
2. **Monitor logs** for the first few syncs to catch any issues
3. **Use descriptive automation name** for easy identification
4. **Keep webhook secret secure** - don't share it or commit it to git
5. **Set up error notifications** (optional) - Airtable can send email alerts if automation fails

## Advanced: Conditional Sync

If you want to only sync when certain conditions are met, you can add additional conditions to the trigger:

**Example:** Only sync when property status is "Available"
- Add condition: `Status` = `Available`
- This ensures images are only synced for available properties

**Example:** Only sync when Image Folder URL changes
- Use trigger: "When a record is updated"
- Add condition: `Image Folder URL` field changed

## Next Steps

After setting up the webhook:

1. ✅ Test with a sample property
2. ✅ Verify images appear in R2
3. ✅ Verify images display in Next.js app
4. ✅ Monitor logs for any errors
5. ✅ Update remaining properties with Image Folder URLs

For more information, see:
- `worker/README.md` - Worker deployment and configuration
- `GOOGLE_DRIVE_SETUP.md` - Google Drive API setup
- `R2_SETUP.md` - R2 bucket configuration

