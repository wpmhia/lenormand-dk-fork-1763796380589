import { memo } from "react";
import ReactMarkdown from "react-markdown";

const COMBINATION_PATTERN = /^\s*(?:\*\*)?\s*([A-Za-z][A-Za-z ]+?\s+\+\s+[A-Za-z][A-Za-z ]+?)\s*(?:\*\*)?\s*:\s*(.+)$/;

function extractCombination(children: React.ReactNode): { pair: string; meaning: string } | null {
  let text = "";
  if (typeof children === "string") {
    text = children;
  } else if (Array.isArray(children)) {
    text = children.map((c) => (typeof c === "string" ? c : "")).join("");
  } else {
    return null;
  }
  const match = text.match(COMBINATION_PATTERN);
  if (!match) return null;
  return { pair: match[1].trim(), meaning: match[2].trim() };
}

export const ReadingMarkdown = memo(function ReadingMarkdown({ children }: { children: string }) {
  return (
    <ReactMarkdown
      components={{
        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
        h2: ({ children }) => <h2 className="mb-2 mt-4 text-xl font-bold">{children}</h2>,
        strong: ({ children }) => <strong>{children}</strong>,
        ul: ({ children }) => <ul className="mb-2 list-none space-y-3 pl-0">{children}</ul>,
        li: ({ children, ...props }) => {
          const combo = extractCombination(children);
          if (combo) {
            return (
              <li className="list-none" {...props}>
                <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
                  <div className="mb-1 font-semibold text-foreground">{combo.pair}</div>
                  <p className="text-sm text-muted-foreground">{combo.meaning}</p>
                </div>
              </li>
            );
          }
          return (
            <li className="list-disc pl-5" {...props}>
              {children}
            </li>
          );
        },
      }}
    >
      {children}
    </ReactMarkdown>
  );
});

export function parseReadingText(text: string): React.ReactNode {
  return <ReadingMarkdown>{text}</ReadingMarkdown>;
}
