import React, { useMemo } from "react";
import LinkPreview from "./LinkPreview";

interface MessageRendererProps {
  message: string;
  className?: string;
}

interface MarkdownElement {
  type: string;
  content: string;
  index?: number;
  length?: number;
  fullMatch?: string;
  url?: string | null;
  language?: string;
}

const parseInlineMarkdown = (text: string): MarkdownElement[] => {
  const parts: MarkdownElement[] = [];
  let lastIndex = 0;

  // Regex patterns for inline elements (ordered by specificity)
  const patterns = [
    // Block elements (must be at line start)
    { regex: /^#{1,3}\s+(.+)$/gm, type: 'header' },
    { regex: /^>\s*(.+)$/gm, type: 'blockquote' },
    { regex: /^>>>\s*(.+)$/gm, type: 'multilineblockquote' },
    { regex: /^\*\s+(.+)$/gm, type: 'listitem' },
    { regex: /^-\s+(.+)$/gm, type: 'sublistitem' },
    { regex: /^-#\s*(.+)$/gm, type: 'subtext' },

    // Inline elements (can be anywhere)
    { regex: /`([^`]+)`/g, type: 'inlinecode' },
    { regex: /\[([^\]]+)\]\(([^)]+)\)/g, type: 'maskedlink' },
    { regex: /\*\*(.*?)\*\*/g, type: 'bold' },
    { regex: /__(.*?)__/g, type: 'underline' },
    { regex: /~~(.*?)~~/g, type: 'strikethrough' },
    { regex: /\*(.*?)\*/g, type: 'italic' },
    { regex: /_(.*?)_/g, type: 'italic' },
    { regex: /(https?:\/\/[^\s]+)/g, type: 'url' },
  ];

  // Find all matches without overlapping
  const matches: MarkdownElement[] = [];
  patterns.forEach(({ regex, type }) => {
    regex.lastIndex = 0; // Reset regex state
    let match;
    while ((match = regex.exec(text)) !== null) {
      // Check if this match overlaps with existing matches
      const matchStart = match.index;
      const matchEnd = match.index + match[0].length;
      const overlaps = matches.some(existing =>
        (matchStart < (existing.index || 0) + (existing.length || 0) && matchEnd > (existing.index || 0))
      );

      if (!overlaps) {
        matches.push({
          index: match.index,
          length: match[0].length,
          type,
          content: match[1] || match[0],
          fullMatch: match[0],
          url: match[2] || null,
        });
      }
    }
  });

  // Sort matches by index
  matches.sort((a, b) => (a.index || 0) - (b.index || 0));

  // Remove overlapping matches (keep the more specific one)
  const filteredMatches: MarkdownElement[] = [];
  for (const match of matches) {
    const overlaps = filteredMatches.some(existing =>
      (match.index || 0) < (existing.index || 0) + (existing.length || 0) &&
      (match.index || 0) + (match.length || 0) > (existing.index || 0)
    );
    if (!overlaps) {
      filteredMatches.push(match);
    }
  }

  // Process matches
  filteredMatches.forEach((match) => {
    if ((match.index || 0) > lastIndex) {
      parts.push({
        type: 'text',
        content: text.slice(lastIndex, match.index),
      });
    }
    parts.push(match);
    lastIndex = (match.index || 0) + (match.length || 0);
  });

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push({
      type: 'text',
      content: text.slice(lastIndex),
    });
  }

  return parts;
};

const MessageRenderer = ({ message, className }: MessageRendererProps) => {
  const parseMarkdown = useMemo(() => {
    const elements: MarkdownElement[] = [];
    let remainingText = message;

    // Process code blocks first (multiline)
    const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)```/g;
    let codeMatch;
    while ((codeMatch = codeBlockRegex.exec(message)) !== null) {
      const beforeCode = remainingText.slice(0, codeMatch.index);
      if (beforeCode) {
        elements.push(...parseInlineMarkdown(beforeCode));
      }
      elements.push({
        type: 'codeblock',
        language: codeMatch[1] || '',
        content: codeMatch[2].trim(),
      });
      remainingText = remainingText.slice(codeMatch.index + codeMatch[0].length);
    }
    if (remainingText) {
      elements.push(...parseInlineMarkdown(remainingText));
    }

    return elements;
  }, [message]);

  const renderElement = (element: MarkdownElement, index: number): React.ReactElement => {
    switch (element.type) {
      case 'bold':
        return <strong key={index} className="font-bold">{element.content}</strong>;
      case 'italic':
        return <em key={index} className="italic">{element.content}</em>;
      case 'underline':
        return <u key={index} className="underline">{element.content}</u>;
      case 'strikethrough':
        return <del key={index} className="line-through">{element.content}</del>;
      case 'inlinecode':
        return <code key={index} className="bg-neutral-200 dark:bg-neutral-700 px-1 py-0.5 rounded text-sm font-mono">{element.content}</code>;
      case 'codeblock':
        return (
          <pre key={index} className="bg-neutral-200 dark:bg-neutral-800 p-3 rounded-md overflow-x-auto font-mono text-sm my-2">
            <code>{element.content}</code>
          </pre>
        );
      case 'header':
        const level = (element.fullMatch?.match(/^#+/) || [''])[0].length;
        const sizeClasses = {
          1: 'text-2xl font-bold',
          2: 'text-xl font-bold',
          3: 'text-lg font-bold',
        };
        if (level === 1) return <h1 key={index} className={sizeClasses[1]}>{element.content}</h1>;
        if (level === 2) return <h2 key={index} className={sizeClasses[2]}>{element.content}</h2>;
        if (level === 3) return <h3 key={index} className={sizeClasses[3]}>{element.content}</h3>;
        return <h3 key={index} className="text-lg font-bold">{element.content}</h3>;
      case 'blockquote':
      case 'multilineblockquote':
        return (
          <blockquote key={index} className="border-l-4 border-neutral-400 pl-4 italic text-neutral-700 dark:text-neutral-300 my-2">
            {element.content}
          </blockquote>
        );
      case 'listitem':
        return (
          <div key={index} className="flex items-start gap-2 my-1">
            <span className="text-neutral-500">•</span>
            <span>{element.content}</span>
          </div>
        );
      case 'sublistitem':
        return (
          <div key={index} className="flex items-start gap-2 my-1 ml-4">
            <span className="text-neutral-500">·</span>
            <span>{element.content}</span>
          </div>
        );
      case 'maskedlink':
        return (
          <a
            key={index}
            href={element.url || ''}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 underline"
          >
            {element.content}
          </a>
        );
      case 'subtext':
        return <span key={index} className="text-sm opacity-60">{element.content}</span>;
      case 'url':
        return (
          <span key={index}>
            <LinkPreview url={element.content} />
            <a
              href={element.content}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 underline"
            >
              {element.content}
            </a>
          </span>
        );
      default:
        return <span key={index}>{element.content}</span>;
    }
  };

  return (
    <div className={`${className} whitespace-pre-wrap`}>
      {parseMarkdown.map((element, index) => renderElement(element, index))}
    </div>
  );
};

export default MessageRenderer;
