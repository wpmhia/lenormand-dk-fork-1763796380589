export function extractJsonObject(raw: string): Record<string, unknown> | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const candidates = [
    trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim(),
    trimmed.slice(trimmed.indexOf("{"), trimmed.lastIndexOf("}") + 1),
  ];

  for (const candidate of candidates) {
    if (!candidate || !candidate.startsWith("{") || !candidate.endsWith("}")) continue;
    try {
      const parsed: unknown = JSON.parse(candidate);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
    }
  }
  return null;
}
