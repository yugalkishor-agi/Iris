import { Link } from "react-router-dom";

/**
 * Parse caption and convert @mentions and #hashtags to links
 */
export function ParsedCaption({ text }: { text: string }) {
  const parts = text.split(/(@[\w.]+|#[\w.]+)/g);
  
  return (
    <>
      {parts.map((part, index) => {
        // Check if it's a mention
        if (part.startsWith('@')) {
          const username = part.slice(1); // Remove @
          return (
            <Link
              key={index}
              to={`/profile/${username}`}
              className="text-primary hover:underline font-medium"
            >
              {part}
            </Link>
          );
        }
        
        // Check if it's a hashtag
        if (part.startsWith('#')) {
          const tag = part.slice(1); // Remove #
          return (
            <Link
              key={index}
              to={`/search?q=${encodeURIComponent(tag)}`}
              className="text-primary hover:underline font-medium"
            >
              {part}
            </Link>
          );
        }
        
        // Regular text
        return <span key={index}>{part}</span>;
      })}
    </>
  );
}
