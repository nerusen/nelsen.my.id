import { useMemo } from "react";
import LinkPreview from "./LinkPreview";

interface MessageRendererProps {
  message: string;
  className?: string;
}

const MessageRenderer = ({ message, className }: MessageRendererProps) => {
  // Regex to detect URLs
  const urlRegex = /(https?:\/\/[^\s]+)/g;

  const parts = useMemo(() => {
    const matches = [];
    let lastIndex = 0;
    let match;

    while ((match = urlRegex.exec(message)) !== null) {
      // Add text before the URL
      if (match.index > lastIndex) {
        matches.push({
          type: 'text',
          content: message.slice(lastIndex, match.index),
        });
      }

      // Add the URL
      matches.push({
        type: 'url',
        content: match[0],
      });

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < message.length) {
      matches.push({
        type: 'text',
        content: message.slice(lastIndex),
      });
    }

    return matches;
  }, [message]);

  return (
    <div className={`${className} whitespace-pre-wrap`}>
      {parts.map((part, index) => {
        if (part.type === 'url') {
          return (
            <span key={index}>
              <LinkPreview url={part.content} />
              <a
                href={part.content}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 underline"
              >
                {part.content}
              </a>
            </span>
          );
        }
        return <span key={index}>{part.content}</span>;
      })}
    </div>
  );
};

export default MessageRenderer;
