/**
 * My Activity - Archived Stories Page
 * Shows all user's stories organized by date
 * Accessible from Settings
 */

import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, Calendar, Play, Image as ImageIcon, Loader2, CheckCircle2, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { storyService } from '../../src/services/story.service';
import type { Story } from '../../src/types/database';

interface GroupedStories {
  date: string;
  displayDate: string;
  stories: Story[];
}

export default function MyActivity() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [groupedStories, setGroupedStories] = useState<GroupedStories[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStories, setSelectedStories] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadArchivedStories();
  }, [user]);

  const loadArchivedStories = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const stories = await storyService.getUserArchivedStories(user.userId);
      
      // Group stories by date
      const grouped = groupStoriesByDate(stories);
      setGroupedStories(grouped);
    } catch (error) {
      console.error('Failed to load archived stories:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your activity',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const groupStoriesByDate = (stories: Story[]): GroupedStories[] => {
    const groups: { [key: string]: Story[] } = {};

    stories.forEach(story => {
      const date = story.createdAt?.toDate?.() || new Date();
      const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(story);
    });

    // Convert to array and sort by date (newest first)
    return Object.keys(groups)
      .sort((a, b) => b.localeCompare(a))
      .map(dateKey => ({
        date: dateKey,
        displayDate: formatDate(dateKey),
        stories: groups[dateKey].sort((a, b) => {
          const timeA = a.createdAt?.toDate?.().getTime() || 0;
          const timeB = b.createdAt?.toDate?.().getTime() || 0;
          return timeB - timeA;
        })
      }));
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (dateString === today.toISOString().split('T')[0]) {
      return 'Today';
    } else if (dateString === yesterday.toISOString().split('T')[0]) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      });
    }
  };

  const handleStoryClick = (storyId: string) => {
    if (selectionMode) {
      // If in selection mode, toggle selection
      toggleStorySelection(storyId);
    } else {
      // Otherwise, view the story
      navigate(`/story-archived/${storyId}?from=activity`);
    }
  };

  const toggleStorySelection = (storyId: string) => {
    const newSelection = new Set(selectedStories);
    if (newSelection.has(storyId)) {
      newSelection.delete(storyId);
    } else {
      newSelection.add(storyId);
    }
    setSelectedStories(newSelection);
  };

  const handleLongPressStart = (storyId: string) => {
    longPressTimer.current = setTimeout(() => {
      // Enter selection mode
      setSelectionMode(true);
      toggleStorySelection(storyId);
      
      // Haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }, 500); // 500ms long press
  };

  const handleLongPressEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedStories(new Set());
  };

  const handleAddToHighlight = () => {
    if (selectedStories.size === 0) {
      toast({
        title: 'No stories selected',
        description: 'Please select at least one story',
        variant: 'destructive'
      });
      return;
    }

    // Navigate to highlight manager with selected stories
    const storyIds = Array.from(selectedStories).join(',');
    window.location.href = `/story-highlights?selected=${storyIds}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            {selectionMode ? (
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
                onClick={exitSelectionMode}
              >
                <X className="h-5 w-5" />
              </Button>
            ) : (
              <Link to="/settings">
                <Button variant="ghost" size="icon" className="rounded-full">
                  <ChevronLeft className="h-5 w-5" />
                </Button>
              </Link>
            )}
            <div>
              <h1 className="text-xl font-bold">
                {selectionMode ? `${selectedStories.size} Selected` : 'My Activity'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {selectionMode 
                  ? 'Tap stories to select'
                  : `${groupedStories.reduce((sum, group) => sum + group.stories.length, 0)} stories`
                }
              </p>
            </div>
          </div>

          {selectedStories.size > 0 && (
            <Button
              onClick={handleAddToHighlight}
              size="sm"
              className="rounded-full"
            >
              Add to Highlight ({selectedStories.size})
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto p-4">
        {groupedStories.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-lg font-semibold mb-2">No archived stories</h2>
            <p className="text-muted-foreground">
              Your stories will appear here after 24 hours
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {groupedStories.map((group) => (
              <div key={group.date}>
                {/* Date Header */}
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <h2 className="font-semibold text-lg">{group.displayDate}</h2>
                  <span className="text-sm text-muted-foreground">
                    ({group.stories.length} {group.stories.length === 1 ? 'story' : 'stories'})
                  </span>
                </div>

                {/* Stories Grid */}
                <div className="grid grid-cols-3 gap-2">
                  {group.stories.map((story) => (
                    <button
                      key={story.storyId}
                      onClick={() => handleStoryClick(story.storyId)}
                      onTouchStart={() => handleLongPressStart(story.storyId)}
                      onTouchEnd={handleLongPressEnd}
                      onMouseDown={() => handleLongPressStart(story.storyId)}
                      onMouseUp={handleLongPressEnd}
                      onMouseLeave={handleLongPressEnd}
                      className={`relative aspect-[9/16] rounded-lg overflow-hidden group transition-all ${
                        selectedStories.has(story.storyId)
                          ? 'ring-4 ring-primary scale-95'
                          : 'hover:scale-105'
                      }`}
                    >
                      {/* Thumbnail */}
                      <img
                        src={story.thumbnailURL || story.mediaURL}
                        alt="Story"
                        className="w-full h-full object-cover"
                      />

                      {/* Media Type Icon */}
                      <div className="absolute top-2 right-2">
                        {story.mediaType === 'video' ? (
                          <Play className="h-4 w-4 text-white drop-shadow-lg" />
                        ) : (
                          <ImageIcon className="h-4 w-4 text-white drop-shadow-lg" />
                        )}
                      </div>

                      {/* Selection Indicator */}
                      {selectedStories.has(story.storyId) && (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                          <div className="bg-primary rounded-full p-2">
                            <svg
                              className="h-6 w-6 text-primary-foreground"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={3}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </div>
                        </div>
                      )}

                      {/* Time */}
                      <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-xs text-white">
                        {story.createdAt?.toDate?.().toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </div>

                      {/* Views Count */}
                      <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-xs text-white flex items-center gap-1">
                        <svg
                          className="h-3 w-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                        {story.viewsCount || 0}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selection Helper */}
      {selectedStories.size > 0 && (
        <div className="fixed bottom-20 left-0 right-0 flex justify-center px-4">
          <div className="bg-card/95 backdrop-blur-xl border border-border rounded-full px-6 py-3 shadow-lg">
            <p className="text-sm font-medium">
              {selectedStories.size} {selectedStories.size === 1 ? 'story' : 'stories'} selected
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
