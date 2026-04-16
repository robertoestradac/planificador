/**
 * Validates and sanitizes an image URL.
 * Returns the URL if valid, or empty string if unsafe/invalid.
 * Allows: http(s) URLs and data: URIs for images.
 * Blocks: javascript:, vbscript:, and other dangerous protocols.
 */
export function sanitizeImageUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (trimmed === '') return '';

  // Allow data URIs for images only
  if (/^data:image\/(png|jpe?g|gif|webp|svg\+xml|bmp|ico);base64,/i.test(trimmed)) {
    return trimmed;
  }

  // Allow relative paths (starts with /)
  if (trimmed.startsWith('/')) return trimmed;

  // Allow http and https only
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  // Block everything else (javascript:, vbscript:, etc.)
  return '';
}
