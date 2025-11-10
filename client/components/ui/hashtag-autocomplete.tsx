import { useState, useEffect, useRef } from "react";
import { Hash } from "lucide-react";
import { searchService } from "../../../src/services/search.service";

interface HashtagAutocompleteProps {
  searchQuery: string;
  onSelect: (hashtag: string) => void;
  position: { top: number; left: number };
}

export function HashtagAutocomplete({ searchQuery, onSelect, position }: HashtagAutocompleteProps) {
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const searchHashtags = async () => {
      if (searchQuery.length === 0) {
        // Show trending hashtags
        try {
          const trending = await searchService.getTrendingHashtags(10);
          const tags = trending.map((t: { tag: string; postCount: number }) => t.tag);
          setHashtags(tags);
        } catch (error) {
          setHashtags([]);
        }
        return;
      }

      try {
        // Search for hashtags using the post search
        const results = await searchService.searchHashtag(searchQuery, 10);
        // Extract unique hashtags from posts
        const uniqueTags = new Set<string>();
        results.posts.forEach((post: any) => {
          post.tags?.forEach((tag: string) => {
            if (tag.toLowerCase().includes(searchQuery.toLowerCase())) {
              uniqueTags.add(tag);
            }
          });
        });
        setHashtags(Array.from(uniqueTags).slice(0, 10));
        setSelectedIndex(0);
      } catch (error) {
        console.error("Failed to search hashtags:", error);
        setHashtags([]);
      }
    };

    const debounce = setTimeout(searchHashtags, 200);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const handleSelect = (hashtag: string) => {
    onSelect(hashtag);
  };

  if (hashtags.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className="absolute z-50 bg-popover border border-border rounded-lg shadow-lg max-h-64 overflow-y-auto w-72"
      style={{ top: position.top, left: position.left }}
    >
      {hashtags.map((hashtag, index) => (
        <button
          key={hashtag}
          onClick={() => handleSelect(hashtag)}
          className={`w-full flex items-center gap-3 p-3 hover:bg-accent transition-colors ${
            index === selectedIndex ? 'bg-accent' : ''
          }`}
        >
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Hash className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 text-left min-w-0">
            <p className="text-sm font-medium truncate">#{hashtag}</p>
          </div>
        </button>
      ))}
    </div>
  );
}
