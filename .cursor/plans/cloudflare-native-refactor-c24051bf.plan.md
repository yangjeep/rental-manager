<!-- c24051bf-93b9-47c3-bff1-9c2e8a1bad13 806a90ed-72cf-4f64-bf76-b0cef8730d92 -->
# Cloudflare Native Refactor Plan

## Overview

Simplify the codebase to be fully Cloudflare-native by removing Google Drive integration from the main website, using R2 images directly, and consolidating utilities while maintaining structure.

## Key Changes

### 1. Simplify Image Handling (R2-only)

- **Remove** `functions/api/image.ts` - no longer needed since we use R2 directly
- **Simplify** `lib/fetchListings.ts`:
- Remove Google Drive folder fetching logic
- Remove `DRIVE_LIST_ENDPOINT` dependency
- Only use R2 images from Airtable `R2 Images` attachment field
- Remove `imageFolderUrl` processing
- **Remove** `lib/drive.ts` - no longer needed
- **Update** `lib/types.ts` - remove `imageFolderUrl` and `images` array (keep only `imageUrl` from R2)

### 2. Consolidate Utility Files

- **Merge** `lib/utils.ts` into `lib/fetchListings.ts` (only `slugify` is used)
- **Simplify** `lib/env.ts` - remove `process.env` fallback (Cloudflare-native only uses `context.env`)
- **Keep** `lib/auth.ts` and `lib/templates.ts` as separate files (they're substantial enough)

### 3. Update Main Router

- **Simplify** `functions/[[path]].ts` - remove references to image proxy
- Update static file detection if needed

### 4. Clean Up Configuration

- **Update** `env.example` - remove `DRIVE_LIST_ENDPOINT` and `AIRTABLE_IMAGE_FOLDER_FIELD`
- **Keep** `workers/r2-sync/` as-is (separate workflow)

### 5. Update Documentation

- **Update** `README.md` - remove Google Drive setup instructions, simplify to R2-only workflow

## File Changes Summary

**Files to Delete:**

- `functions/api/image.ts`
- `lib/drive.ts`
- `lib/utils.ts` (merge into fetchListings)

**Files to Modify:**

- `lib/fetchListings.ts` - simplify to R2-only
- `lib/types.ts` - remove Drive-related fields
- `lib/env.ts` - Cloudflare-native only
- `lib/templates.ts` - remove Drive folder link
- `functions/[[path]].ts` - remove image proxy route
- `env.example` - remove Drive config
- `README.md` - update documentation

**Files to Keep:**

- `workers/r2-sync/` - separate workflow
- `lib/auth.ts` - unchanged
- `lib/templates.ts` - simplified (remove Drive link)