/**
 * CORS headers for API routes
 * Restrictive by default - only allow same-origin requests
 */
export const corsHeaders = {
  "Access-Control-Allow-Origin": process.env.ALLOWED_ORIGIN || "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

/**
 * Handle OPTIONS preflight requests
 */
export function handleCorsPreflight(): Response {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}
