/**
 * BACKEND INTEGRATION PLAN
 * 
 * Firestore Collections:
 * 
 * 1. glimpses/{glimpseId}
 *    - userId: string
 *    - videoURL: string (Supabase)
 *    - coverImageURL: string (Supabase) - Cover image for both videos and images
 *    - caption: string
 *    - hashtags: string[]
 *    - mentions: string[]
 *    - location: string
 *    - taggedPeople: string[] (userIds)
 *    - linkedGlimpseId: string | null
 *    - audience: 'everyone' | 'followers' | 'closeFriends'
 *    - shareToMoments: boolean
 *    - settings: {
 *        allowComments: boolean
 *        allowRemix: boolean
 *        allowDuet: boolean
 *        allowDownload: boolean
 *        hideLikes: boolean
 *        showCaptions: boolean
 *      }
 *    - stats: { likes, comments, shares, views, saves }
 *    - createdAt: Timestamp
 *    - updatedAt: Timestamp
 * 
 * 2. glimpse_drafts/{draftId}
 *    - userId: string
 *    - Same fields as glimpses (except URLs and stats)
 *    - savedAt: Timestamp
 * 
 * Supabase Buckets:
 *    - glimpses/videos/{userId}/{timestamp}.mp4
 *    - glimpses/covers/{userId}/{timestamp}.jpg
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { 
  ChevronLeft, ChevronRight, Hash, Users, MapPin, Link as LinkIcon, 
  MessageSquare, Smile, Settings, Image as ImageIcon, X, BadgeCheck
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { glimpseService } from '../../../src/services/glimpse.service';
import { db } from '../../../src/config/firebase';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

export interface GlimpsePublishData {
  caption: string;
  location: string;
  taggedPeople: string[];
  linkedGlimpseId: string;
  audience: 'everyone' | 'followers' | 'closeFriends';
  shareToMoments: boolean;
  settings: {
    allowComments: boolean;
    allowDownload: boolean;
    hideLikes: boolean;
    showCaptions: boolean;
  };
}

interface GlimpsePublishFlowProps {
  videoBlob: Blob;
  coverBlob: Blob;
  onPublish: (data: GlimpsePublishData) => void;
  onBack: () => void;
}

type ViewMode = 'main' | 'editCover' | 'hashtags' | 'linkGlimpse' | 'tagPeople' | 'location' | 'audience' | 'moreOptions';

interface SeriesOption {
  id: string;
  title: string;
  partCount: number;
  lastGlimpseId: string;
}

export function GlimpsePublishFlow({ videoBlob, coverBlob, onPublish, onBack }: GlimpsePublishFlowProps) {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('main');
  
  // Main form state
  const [caption, setCaption] = useState('');
  const [currentCover, setCurrentCover] = useState<Blob>(coverBlob);
  const [coverPreview, setCoverPreview] = useState<string>('');
  const [taggedPeople, setTaggedPeople] = useState<string[]>([]);
  const [taggedUserObjects, setTaggedUserObjects] = useState<any[]>([]);
  const [location, setLocation] = useState('');
  const [linkedGlimpseId, setLinkedGlimpseId] = useState<string | null>(null);
  const [audience, setAudience] = useState<'everyone' | 'followers' | 'closeFriends'>('everyone');
  const [shareToMoments, setShareToMoments] = useState(false);     // ❌ Disabled
  const [isPosting, setIsPosting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [showBackDialog, setShowBackDialog] = useState(false);
  
  // Edit Cover states
  const [videoFrames, setVideoFrames] = useState<string[]>([]);
  const [selectedFrameIndex, setSelectedFrameIndex] = useState(0);
  const [isExtractingFrames, setIsExtractingFrames] = useState(false);
  
  // Hashtag suggestions
  const [hashtagSuggestions, setHashtagSuggestions] = useState<Array<{tag: string, count: number}>>([]);
  const [showHashtagSuggestions, setShowHashtagSuggestions] = useState(false);
  const [currentHashtagQuery, setCurrentHashtagQuery] = useState('');
  
  // Mention suggestions
  const [mentionSuggestions, setMentionSuggestions] = useState<any[]>([]);
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [currentMentionQuery, setCurrentMentionQuery] = useState('');
  
  // Tag people search
  const [tagSearchQuery, setTagSearchQuery] = useState('');
  const [tagSearchResults, setTagSearchResults] = useState<any[]>([]);
  
  // Location search
  const [locationSearchQuery, setLocationSearchQuery] = useState('');
  
  // Recent hashtags
  const [recentHashtags, setRecentHashtags] = useState<Array<{tag: string, useCount: number, lastUsed?: string}>>([]);
  
  // Advanced options (defaults set as per requirements)
  const [allowComments, setAllowComments] = useState(true);        // ✅ Enabled
  const [allowDownload, setAllowDownload] = useState(false);       // ❌ Disabled
  const [hideLikes, setHideLikes] = useState(false);               // ❌ Disabled (count visible)
  const [showCaptions, setShowCaptions] = useState(true);          // ✅ Enabled
  
  // Series linking
  const [linkToSeries, setLinkToSeries] = useState(false);
  const [recentGlimpses, setRecentGlimpses] = useState<any[]>([]);
  const [existingSeries, setExistingSeries] = useState<SeriesOption[]>([]);
  const [selectedPreviousId, setSelectedPreviousId] = useState<string | null>(null);
  const [seriesTitle, setSeriesTitle] = useState('');
  const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(null);

  // Generate cover preview
  useEffect(() => {
    if (coverBlob) {
      const url = URL.createObjectURL(coverBlob);
      setCoverPreview(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [coverBlob]);

  // Load user's glimpses for linking
  useEffect(() => {
    if (user && viewMode === 'linkGlimpse') {
      loadUserGlimpses();
    }
  }, [viewMode, user]);

  // Extract video frames when entering edit cover mode
  useEffect(() => {
    if (viewMode === 'editCover' && videoFrames.length === 0 && !isExtractingFrames) {
      extractVideoFrames(videoBlob);
    }
  }, [viewMode, videoFrames.length, isExtractingFrames]);

  // Load user's recent hashtags from localStorage
  useEffect(() => {
    const userHashtagHistory = JSON.parse(localStorage.getItem('user_hashtag_history') || '[]');
    // Sort by usage count and take top 8
    const sorted = userHashtagHistory.sort((a: any, b: any) => b.useCount - a.useCount).slice(0, 8);
    setRecentHashtags(sorted);
  }, []);

  const loadUserGlimpses = async () => {
    try {
      const glimpses = await glimpseService.getUserGlimpses(user!.userId, 10);
      setRecentGlimpses(glimpses);
    } catch (error) {
      console.error('Failed to load glimpses:', error);
    }
  };

  // Default hashtags if user has no history
  const defaultHashtags = ['viral', 'trending', 'fyp', 'explore', 'foryou', 'glimpses', 'music', 'love'];
  const suggestedHashtags = recentHashtags.length > 0 
    ? recentHashtags.map(h => h.tag) 
    : defaultHashtags;

  // Extract frames from video for cover selection
  const extractVideoFrames = async (videoFile: Blob) => {
    setIsExtractingFrames(true);
    const frames: string[] = [];
    
    try {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.src = URL.createObjectURL(videoFile);
      
      await new Promise((resolve) => {
        video.onloadedmetadata = resolve;
      });
      
      const duration = video.duration;
      const frameCount = Math.min(10, Math.floor(duration)); // Max 10 frames
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      for (let i = 0; i < frameCount; i++) {
        const time = (duration / frameCount) * i;
        video.currentTime = time;
        
        await new Promise((resolve) => {
          video.onseeked = resolve;
        });
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx?.drawImage(video, 0, 0);
        
        const frameData = canvas.toDataURL('image/jpeg', 0.8);
        frames.push(frameData);
      }
      
      URL.revokeObjectURL(video.src);
      setVideoFrames(frames);
    } catch (error) {
      console.error('Failed to extract frames:', error);
    } finally {
      setIsExtractingFrames(false);
    }
  };

  // Search hashtags with post count from Firestore
  const searchHashtags = async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 2) {
      setHashtagSuggestions([]);
      return;
    }
    
    try {
      // Query Firestore hashtags collection
      const hashtagsRef = collection(db, 'hashtags');
      const q = query(
        hashtagsRef,
        where('tag', '>=', searchQuery.toLowerCase()),
        where('tag', '<=', searchQuery.toLowerCase() + '\uf8ff'),
        orderBy('tag'),
        limit(10)
      );
      
      const snapshot = await getDocs(q);
      let results = snapshot.docs.map(doc => ({
        tag: doc.data().tag,
        count: doc.data().count || 0
      }));
      
      // If no results from Firestore, show the typed hashtag as suggestion
      if (results.length === 0) {
        results = [
          { tag: searchQuery.toLowerCase(), count: 0 },
          { tag: searchQuery.toLowerCase() + 'india', count: 0 },
          { tag: searchQuery.toLowerCase() + 'viral', count: 0 }
        ];
      }
      
      setHashtagSuggestions(results);
    } catch (error) {
      console.error('Failed to search hashtags:', error);
      // Show fallback suggestions even on error
      setHashtagSuggestions([
        { tag: searchQuery.toLowerCase(), count: 0 },
        { tag: searchQuery.toLowerCase() + 'india', count: 0 }
      ]);
    }
  };

  // Search users for mentions from Firestore
  const searchUsers = async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 2) {
      setMentionSuggestions([]);
      return;
    }
    
    try {
      // Query Firestore users collection
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef,
        where('username', '>=', searchQuery.toLowerCase()),
        where('username', '<=', searchQuery.toLowerCase() + '\uf8ff'),
        orderBy('username'),
        limit(10)
      );
      
      const snapshot = await getDocs(q);
      const results = snapshot.docs.map(doc => ({
        userId: doc.id,
        username: doc.data().username,
        displayName: doc.data().displayName || doc.data().username,
        avatarURL: doc.data().avatarURL || '',
        verified: doc.data().verified || false
      }));
      
      setMentionSuggestions(results);
    } catch (error) {
      console.error('Failed to search users:', error);
      setMentionSuggestions([]);
    }
  };

  const handleTagSearch = async (searchText: string) => {
    setTagSearchQuery(searchText);
    if (searchText.length < 2) {
      setTagSearchResults([]);
      return;
    }
    
    // Search users from Firestore
    try {
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef,
        where('username', '>=', searchText.toLowerCase()),
        where('username', '<=', searchText.toLowerCase() + '\uf8ff'),
        orderBy('username'),
        limit(20)
      );
      
      const snapshot = await getDocs(q);
      const results = snapshot.docs.map(doc => {
        const data = doc.data() as any;
        return {
          userId: doc.id,
          username: data.username,
          displayName: data.displayName || data.username,
          avatarURL: data.avatarURL || '',
          verified: data.verified || false
        };
      });
      
      setTagSearchResults(results);
    } catch (error) {
      console.error('Failed to search users:', error);
      setTagSearchResults([]);
    }
  };

  const toggleTag = (user: any) => {
    const isTagged = taggedUserObjects.find(u => u.userId === user.userId);
    if (isTagged) {
      setTaggedUserObjects(taggedUserObjects.filter(u => u.userId !== user.userId));
      setTaggedPeople(taggedPeople.filter(id => id !== user.userId));
    } else {
      setTaggedUserObjects([...taggedUserObjects, user]);
      setTaggedPeople([...taggedPeople, user.userId]);
    }
  };

  // Handle caption change with hashtag/mention detection
  const handleCaptionChange = (text: string) => {
    setCaption(text);
    
    // Detect hashtag typing
    const hashtagMatch = text.match(/#(\w+)$/);
    if (hashtagMatch) {
      setCurrentHashtagQuery(hashtagMatch[1]);
      setShowHashtagSuggestions(true);
      setShowMentionSuggestions(false);
      searchHashtags(hashtagMatch[1]);
    } 
    // Detect mention typing
    else if (text.match(/@(\w+)$/)) {
      const mentionMatch = text.match(/@(\w+)$/);
      if (mentionMatch) {
        setCurrentMentionQuery(mentionMatch[1]);
        setShowMentionSuggestions(true);
        setShowHashtagSuggestions(false);
        searchUsers(mentionMatch[1]);
      }
    } else {
      setShowHashtagSuggestions(false);
      setShowMentionSuggestions(false);
    }
  };

  // Insert hashtag suggestion
  const insertHashtag = (tag: string) => {
    const newCaption = caption.replace(/#\w*$/, '#' + tag + ' ');
    setCaption(newCaption);
    setShowHashtagSuggestions(false);
    
    // Save to user's hashtag history
    const history = JSON.parse(localStorage.getItem('user_hashtag_history') || '[]');
    const existing = history.find((h: any) => h.tag === tag);
    
    if (existing) {
      existing.useCount += 1;
      existing.lastUsed = new Date().toISOString();
    } else {
      history.push({
        tag,
        useCount: 1,
        lastUsed: new Date().toISOString()
      });
    }
    
    localStorage.setItem('user_hashtag_history', JSON.stringify(history));
    
    // Update state
    const sorted = history.sort((a: any, b: any) => b.useCount - a.useCount).slice(0, 8);
    setRecentHashtags(sorted);
  };

  // Insert mention suggestion
  const insertMention = (user: any) => {
    const newCaption = caption.replace(/@\w*$/, '@' + user.username + ' ');
    setCaption(newCaption);
    
    // Add to tagged users
    if (!taggedUserObjects.find(u => u.userId === user.userId)) {
      setTaggedUserObjects([...taggedUserObjects, user]);
      setTaggedPeople([...taggedPeople, user.userId]);
    }
    
    setShowMentionSuggestions(false);
  };

  const handleSaveDraft = async () => {
    setIsSavingDraft(true);
    
    try {
      const draftId = Date.now().toString();
      
      // Convert blobs to base64 for localStorage
      const videoBase64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(videoBlob);
      });
      
      const coverBase64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(currentCover);
      });
      
      // Create draft object
      const draft = {
        id: draftId,
        userId: user!.userId,
        videoBlob: videoBase64,
        coverBlob: coverBase64,
        caption,
        location,
        taggedPeople,
        taggedUserObjects,
        linkedGlimpseId,
        audience,
        shareToMoments,
        settings: {
          allowComments,
          allowDownload,
          hideLikes,
          showCaptions,
        },
        isDraft: true,
        savedAt: new Date().toISOString(),
      };
      
      // Save to localStorage
      const existingDrafts = JSON.parse(localStorage.getItem('glimpse_drafts') || '[]');
      existingDrafts.unshift(draft); // Add to beginning
      localStorage.setItem('glimpse_drafts', JSON.stringify(existingDrafts));
      
      setShowBackDialog(false);
      onBack();
    } catch (error) {
      console.error('Failed to save draft:', error);
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleDiscard = () => {
    setShowBackDialog(false);
    onBack();
  };

  const handleBackClick = () => {
    // Show dialog if user has made changes
    if (caption || taggedPeople.length > 0 || location || linkedGlimpseId) {
      setShowBackDialog(true);
    } else {
      onBack();
    }
  };

  const handlePublish = async () => {
    setIsPosting(true);
    try {
      // 1. Upload video to Supabase
      // const videoUrl = await uploadToSupabase(videoBlob, 'glimpses/videos');
      
      // 2. Upload cover to Supabase
      // const coverUrl = await uploadToSupabase(currentCover, 'glimpses/covers');
      
      // Pass all data to parent component for publishing
      const publishData: GlimpsePublishData = {
        caption,
        location,
        taggedPeople,
        linkedGlimpseId,
        audience,
        shareToMoments,
        settings: {
          allowComments,
          allowDownload,
          hideLikes,
          showCaptions,
        },
      };
      
      onPublish(publishData);
    } catch (error) {
      console.error('Failed to publish:', error);
    } finally {
      setIsPosting(false);
    }
  };

  // Main publish page
  if (viewMode === 'main') {
    return (
      <div className="fixed inset-0 bg-background z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <Button variant="ghost" size="icon" onClick={handleBackClick}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-semibold">New Glimpse</h1>
          <div className="w-10" /> {/* Spacer */}
        </div>

        {/* Back Confirmation Dialog */}
        {showBackDialog && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-background rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-border">
              <h3 className="text-lg font-semibold">Save your work?</h3>
              <p className="text-sm text-muted-foreground">
                Do you want to save this as a draft or discard it?
              </p>
              <div className="space-y-2">
                <Button
                  className="w-full"
                  onClick={handleSaveDraft}
                  disabled={isSavingDraft}
                >
                  {isSavingDraft ? 'Saving...' : 'Save as Draft'}
                </Button>
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={handleDiscard}
                >
                  Discard
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowBackDialog(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Cover Preview */}
          <div className="flex justify-center">
            <div className="relative w-44 h-56 rounded-xl overflow-hidden border-2 border-border shadow-lg">
              {coverPreview && (
                <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              <Button
                size="sm"
                className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/70 hover:bg-black/80 text-white border-0"
                onClick={() => setViewMode('editCover')}
              >
                <ImageIcon className="h-4 w-4 mr-1.5" />
                Edit cover
              </Button>
            </div>
          </div>

          {/* Caption Input */}
          <div className="relative">
            <Textarea
              value={caption}
              onChange={(e) => handleCaptionChange(e.target.value)}
              placeholder="Write a caption... Use # for hashtags, @ to tag people"
              className="min-h-[100px] resize-none"
              maxLength={2200}
            />
            
            {/* Hashtag Suggestions Dropdown */}
            {showHashtagSuggestions && hashtagSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-popover border rounded-lg shadow-lg max-h-48 overflow-y-auto z-50">
                {hashtagSuggestions.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => insertHashtag(item.tag)}
                    className="w-full px-4 py-2 text-left hover:bg-accent transition-colors flex items-center justify-between"
                  >
                    <span className="font-medium">#{item.tag}</span>
                    <span className="text-xs text-muted-foreground">
                      {item.count > 0 ? `${item.count.toLocaleString()} posts` : 'New'}
                    </span>
                  </button>
                ))}
              </div>
            )}
            
            {/* Mention Suggestions Dropdown */}
            {showMentionSuggestions && mentionSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-popover border rounded-lg shadow-lg max-h-48 overflow-y-auto z-50">
                {mentionSuggestions.map((user) => (
                  <button
                    key={user.userId}
                    onClick={() => insertMention(user)}
                    className="w-full px-4 py-2 text-left hover:bg-accent transition-colors flex items-center gap-3"
                  >
                    {user.avatarURL ? (
                      <img 
                        src={user.avatarURL} 
                        alt={user.username}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                        {user.username[0].toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-1">
                        <p className="font-medium text-sm">@{user.username}</p>
                        {user.verified && (
                          <BadgeCheck className="h-3.5 w-3.5 text-blue-500 fill-blue-500" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{user.displayName}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
            
            <div className="text-xs text-muted-foreground mt-1 text-right">
              {caption.length}/2200
            </div>
            
            {/* Tagged Users Display */}
            {taggedUserObjects.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {taggedUserObjects.map((user) => (
                  <div
                    key={user.userId}
                    className="flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-sm"
                  >
                    <span>@{user.username}</span>
                    <button
                      onClick={() => {
                        setTaggedUserObjects(taggedUserObjects.filter(u => u.userId !== user.userId));
                        setTaggedPeople(taggedPeople.filter(id => id !== user.userId));
                      }}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <Button 
              variant="outline" 
              size="sm"
              className="flex-shrink-0 rounded-full"
              onClick={() => {
                // Auto-insert # and focus caption
                const textarea = document.querySelector('textarea');
                if (textarea) {
                  const newCaption = caption + (caption && !caption.endsWith(' ') ? ' #' : '#');
                  setCaption(newCaption);
                  setTimeout(() => textarea.focus(), 100);
                }
              }}
            >
              <Hash className="h-4 w-4 mr-1.5" />
              Hashtags
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className="flex-shrink-0 rounded-full"
              onClick={() => setViewMode('linkGlimpse')}
            >
              <LinkIcon className="h-4 w-4 mr-1.5" />
              Link glimpse
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className="flex-shrink-0 rounded-full"
              onClick={() => setViewMode('moreOptions')}
            >
              <Settings className="h-4 w-4 mr-1.5" />
              Advanced
            </Button>
          </div>

          {/* Suggested Hashtags */}
          <div>
            <h3 className="text-sm font-semibold mb-3 text-foreground/80">
              {recentHashtags.length > 0 ? 'Your recent hashtags' : 'Suggested for you'}
            </h3>
            <div className="flex flex-wrap gap-2">
              {recentHashtags.length > 0 ? (
                recentHashtags.map(item => (
                  <button
                    key={item.tag}
                    onClick={() => setCaption(prev => `${prev}${prev ? ' ' : ''}#${item.tag}`)}
                    className="px-3 py-1.5 rounded-full bg-secondary hover:bg-secondary/80 text-sm font-medium transition-colors flex items-center gap-1.5"
                  >
                    <span>#{item.tag}</span>
                    <span className="text-xs opacity-60">({item.useCount})</span>
                  </button>
                ))
              ) : (
                suggestedHashtags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => setCaption(prev => `${prev}${prev ? ' ' : ''}#${tag}`)}
                    className="px-3 py-1.5 rounded-full bg-secondary hover:bg-secondary/80 text-sm font-medium transition-colors"
                  >
                    #{tag}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Interactive List Items */}
          <div className="space-y-0 border-y divide-y">
            {/* Tag People */}
            <button
              onClick={() => setViewMode('tagPeople')}
              className="w-full flex items-center justify-between p-4 hover:bg-accent/50 transition-all active:scale-[0.99]"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-medium">Tag people</span>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>

            {/* Add Location */}
            <button
              onClick={() => setViewMode('location')}
              className="w-full flex items-center justify-between p-4 hover:bg-accent/50 transition-all active:scale-[0.99]"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <MapPin className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-medium">{location || 'Add location'}</span>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>

            {/* Audience */}
            <button
              onClick={() => setViewMode('audience')}
              className="w-full flex items-center justify-between p-4 hover:bg-accent/50 transition-all active:scale-[0.99]"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">Audience</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground capitalize">{audience}</span>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </button>

            {/* Share to Story */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 flex items-center justify-center">
                  <div className="w-4 h-4 rounded-full border-2 border-white" />
                </div>
                <span className="text-sm font-medium">Also share to moments</span>
              </div>
              <Switch checked={shareToMoments} onCheckedChange={setShareToMoments} />
            </div>

            {/* More Options */}
            <button
              onClick={() => setViewMode('moreOptions')}
              className="w-full flex items-center justify-between p-4 hover:bg-accent transition-colors"
            >
              <div className="flex items-center gap-3">
                <Settings className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm">More options</span>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Bottom Action Buttons */}
        <div className="p-4 border-t bg-background/95 backdrop-blur-sm flex gap-3">
          <Button 
            variant="outline" 
            size="lg"
            className="flex-1 font-semibold"
            onClick={handleSaveDraft}
            disabled={isSavingDraft || isPosting}
          >
            {isSavingDraft ? 'Saving...' : 'Save draft'}
          </Button>
          <Button 
            size="lg"
            className="flex-1 font-semibold bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
            onClick={handlePublish}
            disabled={isPosting || isSavingDraft}
          >
            {isPosting ? 'Sharing...' : 'Share'}
          </Button>
        </div>
      </div>
    );
  }

  // Advanced Options View
  if (viewMode === 'moreOptions') {
    return (
      <div className="fixed inset-0 bg-background z-50 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <Button variant="ghost" size="icon" onClick={() => setViewMode('main')}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-semibold">Advanced Settings</h1>
          <Button onClick={() => setViewMode('main')}>Done</Button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Privacy & Interaction */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground/60 uppercase tracking-wide">Privacy & Interaction</h3>
            
            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
              <div>
                <p className="text-sm font-medium">Allow comments</p>
                <p className="text-xs text-muted-foreground">Let people comment on your glimpse</p>
              </div>
              <Switch checked={allowComments} onCheckedChange={setAllowComments} />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
              <div>
                <p className="text-sm font-medium">Hide like count</p>
                <p className="text-xs text-muted-foreground">Only you can see total likes</p>
              </div>
              <Switch checked={hideLikes} onCheckedChange={setHideLikes} />
            </div>
          </div>

          {/* Content Settings */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground/60 uppercase tracking-wide">Content Settings</h3>
            
            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
              <div>
                <p className="text-sm font-medium">Allow download</p>
                <p className="text-xs text-muted-foreground">Let people download with watermark</p>
              </div>
              <Switch checked={allowDownload} onCheckedChange={setAllowDownload} />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
              <div>
                <p className="text-sm font-medium">Show captions</p>
                <p className="text-xs text-muted-foreground">Display captions on your glimpse</p>
              </div>
              <Switch checked={showCaptions} onCheckedChange={setShowCaptions} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Audience Selection
  if (viewMode === 'audience') {
    const audienceOptions = [
      { value: 'everyone', label: 'Everyone', description: 'Share with all users' },
      { value: 'followers', label: 'Followers', description: 'Only people who follow you' },
      { value: 'closeFriends', label: 'Close Friends', description: 'Share with your close friends list' },
    ] as const;

    return (
      <div className="fixed inset-0 bg-background z-50 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <Button variant="ghost" size="icon" onClick={() => setViewMode('main')}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-semibold">Audience</h1>
          <Button onClick={() => setViewMode('main')}>Done</Button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {audienceOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                setAudience(option.value);
                setViewMode('main');
              }}
              className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                audience === option.value 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{option.label}</p>
                  <p className="text-sm text-muted-foreground">{option.description}</p>
                </div>
                {audience === option.value && (
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Location Search
  if (viewMode === 'location') {
    const recentLocations = ['Mumbai, India', 'Delhi, India', 'Bangalore, India'];
    
    return (
      <div className="fixed inset-0 bg-background z-50 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <Button variant="ghost" size="icon" onClick={() => setViewMode('main')}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-semibold">Add location</h1>
          <Button onClick={() => setViewMode('main')}>Done</Button>
        </div>
        
        <div className="p-4">
          <Input
            placeholder="Search location..."
            value={locationSearchQuery}
            onChange={(e) => setLocationSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>

        <div className="flex-1 overflow-y-auto px-4">
          <h3 className="text-sm font-semibold text-muted-foreground mb-2">Recent</h3>
          <div className="space-y-1">
            {recentLocations.map((loc) => (
              <button
                key={loc}
                onClick={() => {
                  setLocation(loc);
                  setViewMode('main');
                }}
                className="w-full p-3 text-left hover:bg-accent rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{loc}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Link Glimpse Selection
  if (viewMode === 'linkGlimpse') {
    return (
      <div className="fixed inset-0 bg-background z-50 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <Button variant="ghost" size="icon" onClick={() => setViewMode('main')}>
            <X className="h-5 w-5" />
          </Button>
          <h1 className="font-semibold">Link a glimpse</h1>
          <div className="w-10" />
        </div>
        
        <div className="flex-1 overflow-y-auto p-2">
          <div className="grid grid-cols-3 gap-1">
            {recentGlimpses.length > 0 ? (
              recentGlimpses.map((glimpse) => (
                <button
                  key={glimpse.id}
                  onClick={() => {
                    setLinkedGlimpseId(glimpse.id);
                    setViewMode('main');
                  }}
                  className={`relative aspect-[9/16] rounded-lg overflow-hidden border-2 ${
                    linkedGlimpseId === glimpse.id ? 'border-primary' : 'border-transparent'
                  }`}
                >
                  <img
                    src={glimpse.coverImageURL || glimpse.mediaURL}
                    alt="Glimpse"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2 flex items-center gap-1 text-white text-xs">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                    <span>{glimpse.views || 0}</span>
                  </div>
                </button>
              ))
            ) : (
              <div className="col-span-3 flex flex-col items-center justify-center p-8 text-center">
                <p className="text-muted-foreground">No glimpses yet</p>
                <p className="text-xs text-muted-foreground mt-1">Create your first glimpse to link</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Edit Cover - Frame Selection
  if (viewMode === 'editCover') {
    const handleFrameSelect = (index: number) => {
      setSelectedFrameIndex(index);
      // Convert data URL to blob
      fetch(videoFrames[index])
        .then(res => res.blob())
        .then(blob => {
          setCurrentCover(blob);
          const url = URL.createObjectURL(blob);
          setCoverPreview(url);
        });
    };

    const handleCustomCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && file.type.startsWith('image/')) {
        setCurrentCover(file);
        const url = URL.createObjectURL(file);
        setCoverPreview(url);
      }
    };

    return (
      <div className="fixed inset-0 bg-background z-50 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <Button variant="ghost" size="icon" onClick={() => setViewMode('main')}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-semibold">Edit cover</h1>
          <Button onClick={() => setViewMode('main')} className="text-primary">Done</Button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Instructions */}
          <p className="text-sm text-muted-foreground text-center">
            Select a cover image from your video frames or upload custom image
          </p>

          {/* Main Cover Preview */}
          <div className="flex justify-center">
            <div className="relative w-48 h-64 rounded-xl overflow-hidden border-2 border-primary shadow-lg">
              {coverPreview && (
                <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
              )}
            </div>
          </div>

          {/* Frame Timeline */}
          {isExtractingFrames ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-sm text-muted-foreground mt-2">Extracting frames...</p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Select from video</h3>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {videoFrames.map((frame, index) => (
                    <button
                      key={index}
                      onClick={() => handleFrameSelect(index)}
                      className={`relative flex-shrink-0 w-20 h-28 rounded-lg overflow-hidden border-2 transition-all ${
                        selectedFrameIndex === index 
                          ? 'border-primary scale-105' 
                          : 'border-border'
                      }`}
                    >
                      <img src={frame} alt={`Frame ${index + 1}`} className="w-full h-full object-cover" />
                      {selectedFrameIndex === index && (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                            <svg className="w-4 h-4 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Upload Custom Cover */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Or upload custom cover</h3>
                <label className="block">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCustomCoverUpload}
                    className="hidden"
                    id="custom-cover-upload"
                  />
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => document.getElementById('custom-cover-upload')?.click()}
                    type="button"
                  >
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Add from camera roll
                  </Button>
                </label>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // Tag People - Search Users
  if (viewMode === 'tagPeople') {
    return (
      <div className="fixed inset-0 bg-background z-50 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <Button variant="ghost" size="icon" onClick={() => setViewMode('main')}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-semibold">Tag people</h1>
          <Button onClick={() => setViewMode('main')}>Done</Button>
        </div>
        
        <div className="p-4">
          <Input
            placeholder="Search people..."
            value={tagSearchQuery}
            onChange={(e) => handleTagSearch(e.target.value)}
            className="w-full"
          />
        </div>

        {/* Tagged Users */}
        {taggedUserObjects.length > 0 && (
          <div className="px-4 pb-2">
            <h3 className="text-sm font-semibold mb-2">Tagged ({taggedUserObjects.length})</h3>
            <div className="flex flex-wrap gap-2">
              {taggedUserObjects.map((user) => (
                <div key={user.userId} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-sm">
                  <span className="font-medium">@{user.username}</span>
                  <button onClick={() => toggleTag(user)}>
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search Results */}
        <div className="flex-1 overflow-y-auto px-4">
          {tagSearchResults.length > 0 && (
            <div className="space-y-1">
              {tagSearchResults.map((user) => {
                const isTagged = taggedUserObjects.find(u => u.userId === user.userId);
                return (
                  <button
                    key={user.userId}
                    onClick={() => toggleTag(user)}
                    className="w-full p-3 flex items-center justify-between hover:bg-accent rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {user.avatarURL ? (
                        <img 
                          src={user.avatarURL} 
                          alt={user.username}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                          {user.username[0].toUpperCase()}
                        </div>
                      )}
                      <div className="text-left">
                        <div className="flex items-center gap-1">
                          <p className="font-medium text-sm">@{user.username}</p>
                          {user.verified && (
                            <BadgeCheck className="h-4 w-4 text-blue-500 fill-blue-500" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{user.displayName}</p>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      isTagged ? 'bg-primary border-primary' : 'border-muted-foreground'
                    }`}>
                      {isTagged && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Hashtags placeholder
  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <Button variant="ghost" size="icon" onClick={() => setViewMode('main')}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="font-semibold">Hashtags</h1>
        <Button onClick={() => setViewMode('main')}>Done</Button>
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
          <Hash className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold mb-2">Coming Soon</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Use # in caption to add hashtags
        </p>
        <Button onClick={() => setViewMode('main')}>Go Back</Button>
      </div>
    </div>
  );
}
