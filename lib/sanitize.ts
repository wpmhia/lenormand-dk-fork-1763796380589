/**
 * Create safe JSON-LD structured data script content
 */
export function createSafeJsonLd(data: unknown): string {
  const jsonString = JSON.stringify(data);
  // Escape HTML tags in JSON to prevent XSS
  const escaped = jsonString
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e");
  return escaped;
}
