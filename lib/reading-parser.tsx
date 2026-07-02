import { memo } from "react";
import ReactMarkdown from "react-markdown";

export const ReadingMarkdown = memo(function ReadingMarkdown({ children }: { children: string }) {
  return (
    <ReactMarkdown
      components={{
        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
        h2: ({ children }) => <h2 className="mb-2 mt-4 text-xl font-bold">{children}</h2>,
        strong: ({ children }) => <strong>{children}</strong>,
        ul: ({ children }) => <ul className="mb-2 list-disc space-y-1 pl-5">{children}</ul>,
        li: ({ children }) => <li>{children}</li>,
      }}
    >
      {children}
    </ReactMarkdown>
  );
});

export function parseReadingText(text: string): React.ReactNode {
  return <ReadingMarkdown>{text}</ReadingMarkdown>;
}
