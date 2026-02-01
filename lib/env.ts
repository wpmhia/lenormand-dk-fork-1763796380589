// Shared environment variable access for Edge runtime compatibility
export function getEnv(key: string): string | undefined {
  // Try different methods for Edge runtime compatibility
  return (
    (process.env as Record<string, string | undefined>)?.[key] ||
    ((globalThis as unknown) as Record<string, Record<string, string | undefined>>)?.env?.[key]
  );
}
