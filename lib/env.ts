// Shared environment variable access for Edge runtime compatibility
export function getEnv(key: string): string | undefined {
  if (typeof process !== "undefined" && process.env) {
    return process.env[key];
  }
  if (typeof globalThis !== "undefined" && (globalThis as any).env) {
    return (globalThis as any).env[key];
  }
  return undefined;
}
