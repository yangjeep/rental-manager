# R2 Image Naming and Sorting

This document explains how images are stored and retrieved from R2.

## Worker Upload Behavior

When the Cloudflare Worker syncs images from Google Drive to R2:

### Original Filenames Preserved
- **Keeps original filenames** from Google Drive
- Example: If Drive has `IMG_1234.jpg`, `house_front.png`, `bedroom_2.jpg`
- R2 will have: `{slug}/IMG_1234.jpg`, `{slug}/house_front.png`, `{slug}/bedroom_2.jpg`

### Filename Sanitization
- Special characters replaced with underscores
- Preserves: letters, numbers, dots, hyphens, underscores
- Example: `My Photo (2023).jpg` → `My_Photo__2023_.jpg`

### No Renaming Convention
- Does NOT rename to `image-1.jpg`, `image-2.jpg`, etc.
- Filenames remain as they were in Google Drive

---

## Next.js Fetching Behavior

When Next.js fetches images from R2:

### Dynamic Listing via R2 API
- Uses S3-compatible API to list all files in `{slug}/` folder
- No assumptions about filenames
- Finds all image files regardless of name

### Alphanumeric Sorting
Images are sorted using natural alphanumeric sorting:

```javascript
// Natural sort (handles numbers correctly)
'image1.jpg' < 'image2.jpg' < 'image10.jpg'

// Not: 'image1.jpg' < 'image10.jpg' < 'image2.jpg'
```

**Sort behavior:**
- Case-insensitive
- Numeric values sorted naturally (1, 2, 10 not 1, 10, 2)
- Full path used for sorting: `{slug}/filename.jpg`

### Thumbnail Selection
- **First image** (alphabetically) becomes the thumbnail
- If Drive has: `photo_a.jpg`, `photo_b.jpg`, `photo_z.jpg`
- Thumbnail will be: `photo_a.jpg`

---

## Recommended Drive Naming Conventions

For best control over image order, name your files in Google Drive:

### Option 1: Numbered Prefix
```
01_exterior_front.jpg
02_living_room.jpg
03_kitchen.jpg
10_bedroom_master.jpg
```
✅ Clear ordering  
✅ Descriptive names

### Option 2: Simple Numbers
```
1.jpg
2.jpg
3.jpg
```
✅ Simple  
⚠️ Less descriptive

### Option 3: Descriptive with Prefix
```
a_front_view.jpg
b_kitchen.jpg
c_bedroom_1.jpg
```
✅ Alphabetical control  
✅ Descriptive

### ❌ What to Avoid
```
IMG_1234.jpg      // Camera default (random order)
photo.jpg         // Non-unique
My Photo (1).jpg  // Special chars (will be sanitized)
```

---

## Technical Requirements

### R2 API Credentials Required
Since Next.js needs to list files dynamically (no filename pattern to guess):

**Required Environment Variables:**
```bash
R2_PUBLIC_URL=https://pub-xxx.r2.dev
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=rental-manager-images
```

### Supported Image Formats
- `.jpg`, `.jpeg`
- `.png`
- `.webp`
- `.gif`
- `.bmp`

---

## Example Flow

**Google Drive Folder:**
```
vacation_home_123/
  ├── front.jpg
  ├── kitchen_modern.jpg
  ├── bedroom_1.jpg
  └── backyard.jpg
```

**After Sync to R2:**
```
vacation-home-123/
  ├── backyard.jpg
  ├── bedroom_1.jpg
  ├── front.jpg
  └── kitchen_modern.jpg
```

**Displayed Order (alphabetically):**
1. `backyard.jpg` ← **Thumbnail**
2. `bedroom_1.jpg`
3. `front.jpg`
4. `kitchen_modern.jpg`

**To control order, rename in Drive:**
```
vacation_home_123/
  ├── 1_front.jpg
  ├── 2_kitchen_modern.jpg
  ├── 3_bedroom_1.jpg
  └── 4_backyard.jpg
```

**New order:**
1. `1_front.jpg` ← **Thumbnail** ✅
2. `2_kitchen_modern.jpg`
3. `3_bedroom_1.jpg`
4. `4_backyard.jpg`

---

## Summary

✅ **Original filenames preserved from Google Drive**  
✅ **Alphanumeric sorting handles numbers correctly**  
✅ **No naming convention enforced**  
✅ **First image alphabetically = thumbnail**  
⚠️ **Rename files in Drive to control display order**

