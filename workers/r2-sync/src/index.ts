import { parseDriveFolderId } from '../../../lib/drive';

type AirtableRecord = { id: string; fields: Record<string, any> };
type UploadedAsset = { url: string; filename: string };
type R2Bucket = {
  put: (key: string, value: ArrayBuffer | ReadableStream | string, options?: { httpMetadata?: { contentType?: string } }) => Promise<unknown>;
};

interface Env {
  AIRTABLE_TOKEN: string;
  AIRTABLE_BASE_ID: string;
  AIRTABLE_TABLE_NAME?: string;
  AIRTABLE_IMAGE_FOLDER_FIELD?: string;
  AIRTABLE_R2_IMAGE_FIELD?: string;
  DRIVE_LIST_ENDPOINT?: string;
  R2_PUBLIC_BASE_URL: string;
  R2_IMAGES: R2Bucket;
}

const JSON_HEADERS = {
  'content-type': 'application/json',
  'access-control-allow-origin': '*',
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: JSON_HEADERS });
    }
    if (request.method !== 'POST') {
      return json({ error: 'Method not allowed' }, 405);
    }

    const missing = missingSecrets(env, ['AIRTABLE_TOKEN', 'AIRTABLE_BASE_ID', 'DRIVE_LIST_ENDPOINT', 'R2_PUBLIC_BASE_URL']);
    if (missing.length) {
      return json({ error: `Missing environment values: ${missing.join(', ')}` }, 500);
    }

    const payload = await readPayload(request);
    const recordId = payload?.recordId || new URL(request.url).searchParams.get('recordId');
    if (!recordId) {
      return json({ error: 'recordId is required' }, 400);
    }

    const table = env.AIRTABLE_TABLE_NAME || 'Properties';
    const folderField = env.AIRTABLE_IMAGE_FOLDER_FIELD || 'Image Folder URL';
    const r2Field = env.AIRTABLE_R2_IMAGE_FIELD || 'R2 Images';

    const record = await fetchRecord(recordId, table, env);
    if (!record) {
      return json({ error: `Record ${recordId} not found` }, 404);
    }

    const folderId = parseDriveFolderId(record.fields?.[folderField]);
    if (!folderId) {
      return json({ error: `Field "${folderField}" does not contain a valid Google Drive folder` }, 400);
    }

    const listUrl = new URL(env.DRIVE_LIST_ENDPOINT!);
    listUrl.searchParams.set('folder', folderId);
    const listRes = await fetch(listUrl.toString());
    if (!listRes.ok) {
      return json({ error: `Drive listing failed: ${listRes.status}` }, 502);
    }
    const driveData = await listRes.json();
    const driveUrls = normaliseDriveResponse(driveData);
    if (!driveUrls.length) {
      return json({ error: 'Drive folder did not return any images' }, 400);
    }

    const uploads: UploadedAsset[] = [];
    for (let i = 0; i < driveUrls.length; i += 1) {
      const url = driveUrls[i];
      try {
        const asset = await copyImageToR2(url, recordId, i, env);
        if (asset) uploads.push(asset);
      } catch (error) {
        console.error('[r2-sync] failed to copy image', url, error);
      }
    }

    if (!uploads.length) {
      return json({ error: 'No images were uploaded to R2' }, 502);
    }

    const updateOk = await updateRecord(recordId, table, r2Field, uploads, env);
    if (!updateOk) {
      return json({ error: 'Uploaded images but failed to update Airtable' }, 502);
    }

    return json({ recordId, uploaded: uploads.length, field: r2Field });
  },
};

async function readPayload(request: Request): Promise<Record<string, any> | undefined> {
  try {
    const text = await request.text();
    if (!text) return undefined;
    return JSON.parse(text);
  } catch (error) {
    console.warn('[r2-sync] invalid JSON payload', error);
    return undefined;
  }
}

function missingSecrets(env: Env, keys: (keyof Env)[]): string[] {
  return keys.filter((key) => !env[key]);
}

function json(body: Record<string, any>, status = 200): Response {
  return new Response(JSON.stringify(body, null, 2), { status, headers: JSON_HEADERS });
}

async function fetchRecord(recordId: string, table: string, env: Env): Promise<AirtableRecord | undefined> {
  const url = `https://api.airtable.com/v0/${env.AIRTABLE_BASE_ID}/${encodeURIComponent(table)}/${recordId}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${env.AIRTABLE_TOKEN}` },
  });
  if (res.status === 404) return undefined;
  if (!res.ok) {
    throw new Error(`Airtable returned ${res.status}`);
  }
  return (await res.json()) as AirtableRecord;
}

function normaliseDriveResponse(data: unknown): string[] {
  if (Array.isArray(data)) {
    return data.filter((item): item is string => typeof item === 'string' && item.startsWith('http'));
  }
  if (data && typeof data === 'object' && Array.isArray((data as any).files)) {
    return (data as any).files.filter((item: unknown): item is string => typeof item === 'string' && item.startsWith('http'));
  }
  return [];
}

async function copyImageToR2(sourceUrl: string, recordId: string, index: number, env: Env): Promise<UploadedAsset | undefined> {
  const res = await fetch(sourceUrl);
  if (!res.ok) {
    throw new Error(`Drive image fetch failed ${res.status}`);
  }
  const contentType = res.headers.get('content-type') || 'application/octet-stream';
  const arrayBuffer = await res.arrayBuffer();
  const extension = extensionFromContentType(contentType);
  const safePrefix = recordId.replace(/[^A-Za-z0-9_-]/g, '-');
  const key = `${safePrefix}/${Date.now()}-${index}${extension}`;
  await env.R2_IMAGES.put(key, arrayBuffer, {
    httpMetadata: { contentType },
  });
  const baseUrl = env.R2_PUBLIC_BASE_URL.replace(/\/$/, '');
  const url = `${baseUrl}/${key}`;
  const filename = key.split('/').pop() || `image-${index}${extension}`;
  return { url, filename };
}

async function updateRecord(recordId: string, table: string, field: string, assets: UploadedAsset[], env: Env): Promise<boolean> {
  const url = `https://api.airtable.com/v0/${env.AIRTABLE_BASE_ID}/${encodeURIComponent(table)}/${recordId}`;
  const body = {
    fields: {
      [field]: assets.map((asset) => ({ url: asset.url, filename: asset.filename })),
    },
  };
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${env.AIRTABLE_TOKEN}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  return res.ok;
}

function extensionFromContentType(type: string): string {
  if (type.includes('jpeg')) return '.jpg';
  if (type.includes('png')) return '.png';
  if (type.includes('webp')) return '.webp';
  if (type.includes('gif')) return '.gif';
  return '.bin';
}
