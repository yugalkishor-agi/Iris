import { useState } from "react";
import { Link } from "react-router-dom";

interface TagPosition {
  userId: string;
  username: string;
  x: number;
  y: number;
}

interface TagDisplayProps {
  imageUrl: string;
  tags: TagPosition[];
  className?: string;
}

export function TagDisplay({ imageUrl, tags, className = "" }: TagDisplayProps) {
  const [showTags, setShowTags] = useState(false);

  return (
    <div 
      className={`relative ${className}`}
      onMouseEnter={() => setShowTags(true)}
      onMouseLeave={() => setShowTags(false)}
      onClick={() => setShowTags(!showTags)}
    >
      <img
        src={imageUrl}
        alt="Post"
        className="w-full h-full object-cover"
      />

      {/* Tag indicators - show on hover or tap */}
      {showTags && tags.map((tag, index) => (
        <div
          key={index}
          className="absolute -translate-x-1/2 -translate-y-1/2 group z-10"
          style={{ left: `${tag.x}%`, top: `${tag.y}%` }}
        >
          {/* White circle indicator */}
          <div className="h-8 w-8 rounded-full bg-white border-2 border-white shadow-lg flex items-center justify-center cursor-pointer">
            <div className="h-4 w-4 rounded-full bg-primary" />
          </div>

          {/* Username popup with link */}
          <Link
            to={`/u/${tag.username}`}
            className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-black/90 text-white text-xs px-3 py-1.5 rounded-md whitespace-nowrap hover:bg-black transition-colors z-20"
            onClick={(e) => e.stopPropagation()}
          >
            @{tag.username}
          </Link>
        </div>
      ))}
    </div>
  );
}
