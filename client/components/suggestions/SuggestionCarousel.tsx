import { useState, useEffect, useCallback } from 'react';
import { Users, UserX, Loader2 } from 'lucide-react';
import { suggestionService } from '../../../src/services/suggestion.service';
import { SuggestionCard } from './SuggestionCard';
import { useAuth } from '../../contexts/AuthContext';
import type { SuggestedUser } from '../../../src/services/suggestion.service';

interface SuggestionCarouselProps {
  userId: string;
}

/**
 * Horizontal swipeable carousel for suggestions
 * Shows on Profile page below Edit Profile button
 * Features:
 * - Hide/Show toggle (saved in localStorage)
 * - Horizontal scroll with touch support
 * - Loads 10 suggestions initially
 */
export const SuggestionCarousel = ({ userId }: SuggestionCarouselProps) => {
  const { user: currentUser } = useAuth();
  const [suggestions, setSuggestions] = useState<SuggestedUser[]>([]);
  const [isVisible, setIsVisible] = useState(true);
  const [loading, setLoading] = useState(true);

  const loadSuggestions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await suggestionService.getSuggestionsForUser(userId, 10, 0);
      setSuggestions(data);
    } catch (error) {
      console.error('Error loading suggestions:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    // Load visibility preference from localStorage
    const hiddenKey = `suggestions_hidden_${userId}`;
    const hidden = localStorage.getItem(hiddenKey);
    const shouldShow = hidden !== 'true';
    setIsVisible(shouldShow);
    
    if (shouldShow) {
      loadSuggestions();
    } else {
      setLoading(false);
    }
  }, [userId, loadSuggestions]);
  
  useEffect(() => {
    // Listen for toggle event from Profile page button
    const handleToggle = (event: Event) => {
      const customEvent = event as CustomEvent;
      const visible = customEvent.detail?.visible;
      
      if (typeof visible === 'boolean') {
        setIsVisible(visible);
        
        if (visible && suggestions.length === 0) {
          loadSuggestions();
        }
      }
    };
    
    window.addEventListener('suggestionsToggle', handleToggle);
    return () => window.removeEventListener('suggestionsToggle', handleToggle);
  }, [suggestions.length, loadSuggestions]);

  const toggleVisibility = () => {
    const newState = !isVisible;
    setIsVisible(newState);
    
    // Save preference to localStorage
    const hiddenKey = `suggestions_hidden_${userId}`;
    localStorage.setItem(hiddenKey, String(!newState));
    
    // Load suggestions if showing for first time
    if (newState && suggestions.length === 0) {
      loadSuggestions();
    }
  };

  const handleFollowSuccess = () => {
    // Refresh suggestions after following
    loadSuggestions();
  };

  // Don't show on other users' profiles
  if (!currentUser || currentUser.userId !== userId) {
    return null;
  }

  // Hidden state - don't show anything
  if (!isVisible) {
    return null;
  }

  // Loading state
  if (loading) {
    return (
      <div className="py-4">
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Loading suggestions...</span>
        </div>
      </div>
    );
  }

  // No suggestions
  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="py-4 border-b">
      {/* Header with toggle */}
      <div className="flex items-center justify-between mb-3 px-4">
        <h3 className="font-semibold text-sm">Suggested for You</h3>
        <button
          onClick={toggleVisibility}
          className="text-muted-foreground hover:text-foreground transition-colors"
          title="Hide suggestions"
        >
          <UserX className="h-4 w-4" />
        </button>
      </div>

      {/* Horizontal scroll container */}
      <div className="relative">
        <div className="flex gap-3 overflow-x-auto scrollbar-hide px-4 snap-x snap-mandatory pb-2">
          {suggestions.map((user) => (
            <div
              key={user.userId}
              className="flex-shrink-0 w-40 snap-center"
            >
              <SuggestionCard 
                user={user} 
                compact 
                onFollowSuccess={handleFollowSuccess}
              />
            </div>
          ))}
        </div>

        {/* Scroll indicator */}
        <div className="text-center mt-2 text-xs text-muted-foreground">
          Swipe for more →
        </div>
      </div>
    </div>
  );
};
