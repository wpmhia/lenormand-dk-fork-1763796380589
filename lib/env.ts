// Shared environment variable access for Edge runtime compatibility
export function getEnv(key: string): string | undefined {
  if (typeof process !== "undefined" && process.env) {
    return process.env[key];
  }
  if (typeof globalThis !== "undefined" && (globalThis as any).env && typeof (globalThis as any).env === "object") {
    return (globalThis as any).env[key];
  }
  return undefined;
}
