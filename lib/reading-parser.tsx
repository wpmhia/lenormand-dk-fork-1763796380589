import { getCards } from "@/lib/data";

const allCards = getCards();
const CARD_NAMES = allCards.map(c => c.name);

function parseRemainingText(text: string, segments: { type: 'text' | 'bold' | 'italic' | 'code' | 'card'; content: string }[]) {
  const pattern = /\*([^*]+)\*|`([^`]+)`|([A-Z][a-z]+(?: [A-Z][a-z]+)*)/g;
  let lastIndex = 0;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }

    if (match[1]) {
      segments.push({ type: 'italic', content: match[1] });
    } else if (match[2]) {
      segments.push({ type: 'code', content: match[2] });
    } else if (match[3]) {
      const word = match[3];
      const isCardName = CARD_NAMES.some(name => name.toLowerCase() === word.toLowerCase());
      if (isCardName) {
        segments.push({ type: 'card', content: word });
      } else {
        segments.push({ type: 'text', content: word });
      }
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    segments.push({ type: 'text', content: text.slice(lastIndex) });
  }
}

function parseLineContent(text: string): React.ReactNode[] {
  const segments: { type: 'text' | 'bold' | 'italic' | 'code' | 'card'; content: string }[] = [];

  let remaining = text;
  let lastIndex = 0;
  const boldRegex = /\*\*([^*]+)\*\*/g;
  let match;

  while ((match = boldRegex.exec(remaining)) !== null) {
    if (match.index > lastIndex) {
      const beforeText = remaining.slice(lastIndex, match.index);
      if (beforeText) {
        parseRemainingText(beforeText, segments);
      }
    }
    segments.push({ type: 'bold', content: match[1] });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < remaining.length) {
    parseRemainingText(remaining.slice(lastIndex), segments);
  }

  return segments.map((seg, key) => {
    switch (seg.type) {
      case 'bold':
        return <strong key={key} className="font-bold">{seg.content}</strong>;
      case 'italic':
        return <em key={key} className="italic">{seg.content}</em>;
      case 'code':
        return <code key={key} className="bg-muted px-1 py-0.5 rounded text-sm">{seg.content}</code>;
      case 'card':
        return <span key={key} className="text-primary font-medium">{seg.content}</span>;
      default:
        return <span key={key}>{seg.content}</span>;
    }
  });
}

export function parseReadingText(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  const result: React.ReactNode[] = [];
  let key = 0;

  lines.forEach((line) => {
    if (line.startsWith('# ')) {
      result.push(<h1 key={key++} className="text-2xl font-bold mt-4 mb-2">{parseLineContent(line.slice(2))}</h1>);
    } else if (line.startsWith('## ')) {
      result.push(<h2 key={key++} className="text-xl font-bold mt-4 mb-2">{parseLineContent(line.slice(3))}</h2>);
    } else if (line.startsWith('### ')) {
      result.push(<h3 key={key++} className="text-lg font-bold mt-3 mb-1">{parseLineContent(line.slice(4))}</h3>);
    } else if (line.trim()) {
      result.push(<p key={key++} className="mb-2">{parseLineContent(line)}</p>);
    }
  });

  return result;
}
