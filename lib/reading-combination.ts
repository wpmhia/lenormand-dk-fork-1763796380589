import type { ReactNode } from "react";
import { isValidElement } from "react";

export const COMBINATION_PATTERN = /^\s*(?:\*\*\s*)?([A-Za-z][A-Za-z ]+?\s+\+\s+[A-Za-z][A-Za-z ]+?)\s*(?:\*\*)?\s*:\s*(.+)$/;

export function nodeToString(node: ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(nodeToString).join("");
  if (isValidElement(node)) {
    const props = node.props as { children?: ReactNode };
    return nodeToString(props.children);
  }
  return "";
}

function isBoldElement(node: ReactNode): boolean {
  if (!isValidElement(node)) return false;
  const type = node.type as string | { displayName?: string; name?: string } | undefined;
  if (typeof type === "string") return type === "strong" || type === "b";
  const name = type?.displayName || type?.name;
  return name === "strong" || name === "b";
}

export function nodeToStringWithBold(node: ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(nodeToStringWithBold).join("");
  if (isValidElement(node)) {
    const inner = (node.props as { children?: ReactNode }).children;
    const content = nodeToStringWithBold(inner);
    return isBoldElement(node) ? `**${content}**` : content;
  }
  return "";
}

export function extractCombinationFromChildren(children: ReactNode): { pair: string; meaning: string } | null {
  const rawText = nodeToStringWithBold(children);
  const plainText = rawText.replace(/\*\*/g, "");
  const match = rawText.match(COMBINATION_PATTERN) || plainText.match(COMBINATION_PATTERN);
  if (!match) return null;
  return { pair: match[1].trim(), meaning: match[2].trim() };
}

export function extractCombinationFromText(text: string): { pair: string; meaning: string } | null {
  const match = text.match(COMBINATION_PATTERN);
  if (!match) return null;
  return { pair: match[1].trim(), meaning: match[2].trim() };
}
