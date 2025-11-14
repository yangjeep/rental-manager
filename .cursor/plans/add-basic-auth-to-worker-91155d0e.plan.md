<!-- 91155d0e-45d2-4171-aadf-1bbbd8fd8df4 4cb9c2c4-785a-4aab-a475-ecbd85c98cdd -->
# Add Required Bearer Token Authentication to Cloudflare Worker

## Overview

The worker currently has optional Bearer token authentication via `SYNC_SECRET`. We need to make authentication required - all HTTP requests must include a valid Bearer token, or they will receive a 401 Unauthorized response.

## Implementation Plan

### 1. Update Worker Code (`worker/src/index.ts`)

- Make `SYNC_SECRET` required in the `Env` interface (change from optional to required)
- Update the authentication check in the `fetch` handler to:
- Always require `SYNC_SECRET` to be set (return 500 if missing)
- Always validate Bearer token for all HTTP requests (except OPTIONS preflight)
- Return 401 Unauthorized if token is missing or invalid
- Keep CORS preflight (OPTIONS) requests unauthenticated
- Cron triggers remain unauthenticated (internal Cloudflare calls)

### 2. Update Configuration (`worker/wrangler.toml`)

- Update comments to indicate `SYNC_SECRET` is now a required secret (not optional)
- Update both production and demo environment documentation

### 3. Update Documentation (`worker/README.md`)

- Update setup instructions to indicate `SYNC_SECRET` is required
- Remove references to "optional" authentication
- Update usage examples to show Bearer token is always required
- Update `.dev.vars` example to show `SYNC_SECRET` is required
- Add note that worker will fail if `SYNC_SECRET` is not configured

## Files to Modify

- `worker/src/index.ts` - Make Bearer token auth required
- `worker/wrangler.toml` - Update secret documentation
- `worker/README.md` - Update setup and usage instructions

## Security Considerations

- Bearer token will be stored as a Cloudflare secret
- All HTTP requests (except OPTIONS) require valid Bearer token
- Worker returns 401 Unauthorized for missing or invalid tokens
- Worker returns 500 if `SYNC_SECRET` environment variable is not configured