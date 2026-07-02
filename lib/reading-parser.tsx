import { memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export const ReadingMarkdown = memo(function ReadingMarkdown({ children }: { children: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
        h1: ({ children }) => <h1 className="mb-2 mt-4 text-2xl font-bold">{children}</h1>,
        h2: ({ children }) => <h2 className="mb-2 mt-4 text-xl font-bold">{children}</h2>,
        h3: ({ children }) => <h3 className="mb-1 mt-3 text-lg font-bold">{children}</h3>,
        strong: ({ children }) => <strong>{children}</strong>,
        em: ({ children }) => <em className="italic">{children}</em>,
        code: ({ children }) => <code className="rounded bg-muted px-1 py-0.5 text-sm">{children}</code>,
        ul: ({ children }) => <ul className="mb-2 list-disc space-y-1 pl-5">{children}</ul>,
        ol: ({ children }) => <ol className="mb-2 list-decimal space-y-1 pl-5">{children}</ol>,
        li: ({ children }) => <li>{children}</li>,
        blockquote: ({ children }) => (
          <blockquote className="mb-2 border-l-4 border-primary/30 pl-4 italic text-muted-foreground">
            {children}
          </blockquote>
        ),
        hr: () => <hr className="my-4 border-border" />,
        a: ({ children, href }) => (
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2 hover:opacity-80">
            {children}
          </a>
        ),
      }}
    >
      {children}
    </ReactMarkdown>
  );
});

export function parseReadingText(text: string): React.ReactNode {
  return <ReadingMarkdown>{text}</ReadingMarkdown>;
}
