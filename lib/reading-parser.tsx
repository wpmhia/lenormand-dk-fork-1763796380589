import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getCards } from "@/lib/data";

const allCards = getCards();
const CARD_NAMES = allCards.map(c => c.name);

const CARD_PATTERN = new RegExp(
  `(${CARD_NAMES.sort((a, b) => b.length - a.length).map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`,
  'gi'
);

function processNode(children: React.ReactNode): React.ReactNode {
  return React.Children.toArray(children).flatMap(child => {
    if (typeof child === 'string') {
      const parts = child.split(CARD_PATTERN);
      if (parts.length === 1) return child;

      return parts.filter(Boolean).map((part, i) => {
        const match = CARD_NAMES.find(name => name.toLowerCase() === part.toLowerCase());
        if (match) {
          return React.createElement('span', { key: i, className: 'text-primary font-medium' }, match);
        }
        return part;
      });
    }
    if (React.isValidElement(child) && child.props?.children) {
      return React.cloneElement(child, {
        ...child.props,
        children: processNode(child.props.children)
      });
    }
    return child;
  });
}

export const ReadingMarkdown = React.memo(function ReadingMarkdown({ children }: { children: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => <p className="mb-2 last:mb-0">{processNode(children)}</p>,
        h1: ({ children }) => <h1 className="text-2xl font-bold mt-4 mb-2">{processNode(children)}</h1>,
        h2: ({ children }) => <h2 className="text-xl font-bold mt-4 mb-2">{processNode(children)}</h2>,
        h3: ({ children }) => <h3 className="text-lg font-bold mt-3 mb-1">{processNode(children)}</h3>,
        strong: ({ children }) => <strong className="font-bold">{children}</strong>,
        em: ({ children }) => <em className="italic">{children}</em>,
        code: ({ children }) => <code className="bg-muted px-1 py-0.5 rounded text-sm">{children}</code>,
        ul: ({ children }) => <ul className="mb-2 list-disc pl-5 space-y-1">{children}</ul>,
        ol: ({ children }) => <ol className="mb-2 list-decimal pl-5 space-y-1">{children}</ol>,
        li: ({ children }) => <li className="text-foreground">{processNode(children)}</li>,
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
