/**
 * CORS headers for API routes
 * Restrictive by default - only allow same-origin requests
 */
export const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

if (process.env.ALLOWED_ORIGIN) {
  corsHeaders["Access-Control-Allow-Origin"] = process.env.ALLOWED_ORIGIN;
}

/**
 * Handle OPTIONS preflight requests
 */
export function handleCorsPreflight(): Response {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}
