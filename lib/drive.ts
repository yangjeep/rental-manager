/**
 * Parse a Google Drive folder identifier from either a direct ID or a full URL.
 */
export function parseDriveFolderId(input?: string | null): string | undefined {
  if (!input) return undefined;
  const trimmed = String(input).trim();
  const urlMatch = trimmed.match(/\/folders\/([A-Za-z0-9_-]+)/);
  if (urlMatch) {
    return urlMatch[1];
  }
  if (/^[A-Za-z0-9_-]{10,}$/.test(trimmed)) {
    return trimmed;
  }
  return undefined;
}
