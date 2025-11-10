import { useState, useEffect } from 'react';
import { Users, Loader2 } from 'lucide-react';
import { suggestionService } from '../../src/services/suggestion.service';
import { SuggestionCard } from '../components/suggestions/SuggestionCard';
import { useAuth } from '../contexts/AuthContext';
import type { SuggestedUser } from '../../src/services/suggestion.service';

/**
 * Discovery Tab - People Suggestions
 * Shows for new users (< 30 days OR < 10 followers)
 * 
 * Pagination:
 * - Initial: 7 suggestions
 * - Show More #1: +4 (total 11)
 * - Show More #2+: +6 each time
 */
const Discovery = () => {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<SuggestedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showMoreCount, setShowMoreCount] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (user) {
      loadInitialSuggestions();
    }
  }, [user]);

  const loadInitialSuggestions = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const data = await suggestionService.getSuggestionsForUser(user.userId, 7, 0);
      setSuggestions(data);
      setHasMore(data.length === 7);
    } catch (error) {
      console.error('Error loading suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShowMore = async () => {
    if (!user || loadingMore) return;
    
    setLoadingMore(true);
    try {
      // Calculate how many to load
      const loadCount = showMoreCount === 0 ? 4 : 6;
      const offset = suggestions.length;
      
      const data = await suggestionService.getSuggestionsForUser(
        user.userId,
        loadCount,
        offset
      );
      
      setSuggestions(prev => [...prev, ...data]);
      setShowMoreCount(prev => prev + 1);
      setHasMore(data.length === loadCount);
      
    } catch (error) {
      console.error('Error loading more suggestions:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleFollowSuccess = () => {
    // Refresh suggestions after following
    loadInitialSuggestions();
    setShowMoreCount(0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Finding people for you...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b z-10">
        <div className="flex items-center gap-3 p-4">
          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-primary to-purple-600 flex items-center justify-center">
            <Users className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Discover People</h1>
            <p className="text-xs text-muted-foreground">Find people to follow</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {suggestions.length === 0 ? (
          // Empty state
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-4">
              <Users className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold mb-2">No suggestions yet</h2>
            <p className="text-sm text-muted-foreground max-w-sm">
              Start following people and we'll suggest more users based on your interests!
            </p>
          </div>
        ) : (
          <>
            {/* Grid of suggestions - 2 columns */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {suggestions.map((user) => (
                <SuggestionCard 
                  key={user.userId} 
                  user={user}
                  onFollowSuccess={handleFollowSuccess}
                />
              ))}
            </div>

            {/* Show More Button */}
            {hasMore && (
              <button
                onClick={handleShowMore}
                disabled={loadingMore}
                className="w-full mt-6 py-3 rounded-lg bg-gradient-to-r from-primary to-purple-600 text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  `Show More (${showMoreCount === 0 ? 4 : 6})`
                )}
              </button>
            )}

            {/* End message */}
            {!hasMore && suggestions.length > 7 && (
              <p className="text-center text-sm text-muted-foreground mt-6">
                You've seen all suggestions for now
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Discovery;
