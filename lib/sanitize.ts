import DOMPurify from "dompurify";

/**
 * Sanitize HTML content for safe rendering with dangerouslySetInnerHTML
 * 
 * This is used for structured data (JSON-LD) and other HTML that needs
 * to be rendered as raw HTML but should be sanitized first.
 */
export function sanitizeHtml(html: string): string {
  if (typeof window === "undefined") {
    // Server-side: basic sanitization
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/javascript:/gi, "")
      .replace(/on\w+\s*=/gi, "");
  }
  
  // Client-side: use DOMPurify
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["script", "div", "span", "p", "br", "hr", "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "li", "a", "strong", "em", "b", "i"],
    ALLOWED_ATTR: ["type", "id", "class", "href", "target", "rel", "aria-label", "aria-hidden"],
  });
}

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
