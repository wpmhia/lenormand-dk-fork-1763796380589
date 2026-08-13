import { memo } from "react";
import type { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import { extractCombinationFromChildren } from "@/lib/reading-combination";

export const ReadingMarkdown = memo(function ReadingMarkdown({ children }: { children: string }) {
  return (
    <ReactMarkdown
      components={{
        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
        h2: ({ children }) => <h2 className="mb-2 mt-4 text-xl font-bold">{children}</h2>,
        strong: ({ children }) => <strong>{children}</strong>,
        ul: ({ children }) => <ul className="mb-2 list-none space-y-3 pl-0">{children}</ul>,
        li: ({ children, ...props }) => {
          const combo = extractCombinationFromChildren(children);
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

export function parseReadingText(text: string): ReactNode {
  return <ReadingMarkdown>{text}</ReadingMarkdown>;
}
