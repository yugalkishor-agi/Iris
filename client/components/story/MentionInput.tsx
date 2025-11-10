import { useState, useRef, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { searchService } from '../../../src/services/search.service';

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

interface UserSuggestion {
  userId: string;
  username: string;
  avatarURL?: string;
  verified?: boolean;
}

export function MentionInput({ value, onChange, placeholder, className }: MentionInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionQuery, setMentionQuery] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Detect @ mentions
  useEffect(() => {
    const textBeforeCursor = value.slice(0, cursorPosition);
    const lastAtSymbol = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtSymbol !== -1) {
      const textAfterAt = textBeforeCursor.slice(lastAtSymbol + 1);
      
      // Check if there's a space after @
      if (!textAfterAt.includes(' ') && textAfterAt.length >= 0) {
        setMentionQuery(textAfterAt);
        setShowSuggestions(true);
        
        // Search for users
        if (textAfterAt.length > 0) {
          searchUsers(textAfterAt);
        } else {
          setSuggestions([]);
        }
      } else {
        setShowSuggestions(false);
      }
    } else {
      setShowSuggestions(false);
    }
  }, [value, cursorPosition]);

  const searchUsers = async (query: string) => {
    try {
      const results = await searchService.searchUsers(query, 5);
      setSuggestions(results.users || []);
      setSelectedIndex(0);
    } catch (error) {
      console.error('Failed to search users:', error);
      setSuggestions([]);
    }
  };

  const insertMention = (username: string) => {
    const textBeforeCursor = value.slice(0, cursorPosition);
    const textAfterCursor = value.slice(cursorPosition);
    const lastAtSymbol = textBeforeCursor.lastIndexOf('@');
    
    const newText = 
      textBeforeCursor.slice(0, lastAtSymbol + 1) + 
      username + ' ' + 
      textAfterCursor;
    
    onChange(newText);
    setShowSuggestions(false);
    setSuggestions([]);
    
    // Focus back to input
    setTimeout(() => {
      inputRef.current?.focus();
      const newCursorPos = lastAtSymbol + username.length + 2;
      inputRef.current?.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % suggestions.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
        break;
      case 'Enter':
      case 'Tab':
        if (suggestions[selectedIndex]) {
          e.preventDefault();
          insertMention(suggestions[selectedIndex].username);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        break;
    }
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setCursorPosition(e.target.selectionStart || 0);
        }}
        onKeyDown={handleKeyDown}
        onClick={(e) => setCursorPosition(e.currentTarget.selectionStart || 0)}
        placeholder={placeholder}
        className={className}
      />

      {/* Mention Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-black/95 backdrop-blur-sm rounded-xl shadow-2xl border border-white/10 overflow-hidden z-50 max-h-60 overflow-y-auto">
          {suggestions.map((user, index) => (
            <button
              key={user.userId}
              onClick={() => insertMention(user.username)}
              className={`w-full px-4 py-3 flex items-center gap-3 transition-colors ${
                index === selectedIndex
                  ? 'bg-primary/20 border-l-2 border-primary'
                  : 'hover:bg-white/5'
              }`}
            >
              <Avatar className="h-10 w-10 border border-white/20">
                <AvatarImage src={user.avatarURL} />
                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-sm">
                  {user.username?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-white font-semibold text-sm">@{user.username}</span>
                  {user.verified && (
                    <svg className="h-3.5 w-3.5 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
