# R2 Configuration Strategy

This document explains how the app accesses images from Cloudflare R2.

## Two Access Methods

### Method 1: Public URL (Recommended for Demo/Dev)

**Configuration:**
```bash
R2_PUBLIC_URL=https://pub-xxx.r2.dev
```

**How it works:**
- Uses simple HTTP HEAD requests to check if images exist
- Tries sequential filenames: `/{slug}/image-1.jpg`, `image-2.jpg`, etc.
- No credentials needed
- Simpler and sufficient for most use cases

**Pros:**
- ✅ Simple setup (just one env var)
- ✅ No credential management
- ✅ Works great for small-medium catalogs

**Cons:**
- ⚠️ Makes multiple HEAD requests per property
- ⚠️ Less efficient for properties with many images

---

### Method 2: R2 API with Credentials (Recommended for Production)

**Configuration:**
```bash
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=rental-manager-images
```

**How it works:**
- Uses AWS S3-compatible API to list objects
- Makes one API call to get all images for a property
- More efficient for listings with many images

**Pros:**
- ✅ Single API call per property
- ✅ More efficient for large catalogs
- ✅ Can handle properties with many images

**Cons:**
- ⚠️ Requires credential management
- ⚠️ More complex setup

---

## Automatic Fallback Strategy

The app automatically chooses the best method:

```
1. If R2_PUBLIC_URL is set:
   → Try public URL method first
   → If images found, stop here ✅
   
2. If R2 credentials are set:
   → Use S3 API to list images
   → If images found, stop here ✅
   
3. If DRIVE_LIST_ENDPOINT is set:
   → Fetch from Google Drive
   → If images found, stop here ✅
   
4. Otherwise:
   → Use placeholder images 🖼️
```

---

## Recommended Setup by Environment

### Demo/Development (`.env.local`)
```bash
# Simplest - just public URL
R2_PUBLIC_URL=https://pub-demo-xxx.r2.dev
```

### Production (`.env.prod` or Vercel)
```bash
# Option A: Public URL only (simple)
R2_PUBLIC_URL=https://pub-prod-xxx.r2.dev

# Option B: With credentials (more efficient)
R2_PUBLIC_URL=https://pub-prod-xxx.r2.dev
R2_ACCOUNT_ID=7a402359a381dd38e3fd9c0a60239ad9
R2_ACCESS_KEY_ID=ef8017d296ead4865cb1471289bbf672
R2_SECRET_ACCESS_KEY=b8a1bb1daeb941eb6c26363b03e2e775cb02a6a545623d9abb1eef294ef10518
R2_BUCKET_NAME=rental-manager-images
```

---

## When to Use Which Method?

### Use Public URL Only When:
- You have < 100 properties
- Each property has < 10 images
- You want simple setup
- You're in development/demo environment

### Use API Credentials When:
- You have > 100 properties
- Some properties have many images (10+)
- You want optimal performance
- You're in production environment

---

## Cost Comparison

Both methods use Cloudflare R2's free tier:

### Public URL Method:
- **Class B Operations** (reads): 10M/month free
- Each property listing = ~5-10 HEAD requests
- Can handle ~1M property views/month (free)

### API Method:
- **Class A Operations** (list): 1M/month free
- Each property listing = 1 API call
- Can handle ~1M property views/month (free)
- **More efficient** if you exceed free tier

---

## Security Note

Both methods only provide **read access** to images:
- Public URL: Anyone can view images if they know the URL
- API credentials: Only your Next.js app can list objects

Neither method exposes write access or allows uploading images.
Image uploads are handled separately by the Cloudflare Worker.

