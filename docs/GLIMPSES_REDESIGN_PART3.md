# 🎬 Glimpses Redesign - Part 3: Publishing & Series Linking

## 📤 Publishing Flow

### 1. Cover Image Selection

```typescript
interface CoverImagePicker {
  mode: 'video-frame' | 'gallery' | 'auto-generate';
  
  // Video frame mode
  videoFrames: VideoFrame[];
  selectedFrame: number;
  
  // Gallery mode
  uploadedImage: File | null;
  
  // Auto-generate mode
  aiThumbnail: string;
}

interface VideoFrame {
  timestamp: number;             // Position in video (ms)
  imageUrl: string;              // Frame as image
  thumbnail: string;             // Small preview
}
```

**UI Layout:**
```
┌─────────────────────────────────────┐
│     Select Cover Image              │
├─────────────────────────────────────┤
│                                     │
│  [From Video] [Gallery] [Auto]     │
│                                     │
│  ┌─────────────────────────────┐   │
│  │                             │   │
│  │     Selected Cover          │   │
│  │                             │   │
│  └─────────────────────────────┘   │
│                                     │
│  Frame Selection:                  │
│  ┌─┬─┬─┬─┬─┬─┬─┬─┬─┬─┐            │
│  │ │ │█│ │ │ │ │ │ │ │            │
│  └─┴─┴─┴─┴─┴─┴─┴─┴─┴─┘            │
│  [← Prev] [Next →]                 │
│                                     │
│  [Cancel]              [Confirm]   │
└─────────────────────────────────────┘
```

**Implementation:**
```typescript
// components/glimpse/publish/CoverImagePicker.tsx

export function CoverImagePicker({ videoUrl, onSelect }: Props) {
  const [mode, setMode] = useState<'video-frame' | 'gallery' | 'auto'>('video-frame');
  const [frames, setFrames] = useState<VideoFrame[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  useEffect(() => {
    if (mode === 'video-frame') {
      extractFrames();
    }
  }, [mode, videoUrl]);
  
  const extractFrames = async () => {
    // Extract frames every 1 second
    const extractedFrames = await videoEditorService.extractFrames(videoUrl, 1);
    setFrames(extractedFrames);
  };
  
  const handleSelect = () => {
    if (mode === 'video-frame') {
      onSelect(frames[selectedIndex].imageUrl);
    } else if (mode === 'gallery') {
      // Handle gallery upload
    } else {
      // Handle AI-generated thumbnail
    }
  };
  
  return (
    <div className="cover-picker">
      {/* Mode selector */}
      <div className="mode-tabs">
        <button onClick={() => setMode('video-frame')}>From Video</button>
        <button onClick={() => setMode('gallery')}>Gallery</button>
        <button onClick={() => setMode('auto')}>Auto</button>
      </div>
      
      {/* Preview */}
      <div className="cover-preview">
        <img src={frames[selectedIndex]?.imageUrl} alt="Cover" />
      </div>
      
      {/* Frame selector */}
      {mode === 'video-frame' && (
        <div className="frame-selector">
          {frames.map((frame, index) => (
            <button
              key={index}
              onClick={() => setSelectedIndex(index)}
              className={selectedIndex === index ? 'selected' : ''}
            >
              <img src={frame.thumbnail} alt={`Frame ${index}`} />
            </button>
          ))}
        </div>
      )}
      
      {/* Actions */}
      <div className="actions">
        <button onClick={onCancel}>Cancel</button>
        <button onClick={handleSelect}>Confirm</button>
      </div>
    </div>
  );
}
```

---

### 2. Caption Editor

```typescript
interface CaptionData {
  text: string;
  hashtags: string[];
  mentions: string[];
  location?: {
    name: string;
    coordinates: { lat: number; lng: number };
  };
}
```

**UI Layout:**
```
┌─────────────────────────────────────┐
│     Add Caption                     │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────┐   │
│  │ Write a caption...          │   │
│  │                             │   │
│  │ #trending #viral @user      │   │
│  │                             │   │
│  └─────────────────────────────┘   │
│  [😊] [#] [@]          2200/2200   │
│                                     │
│  Suggested Hashtags:               │
│  [#viral] [#trending] [#fyp]       │
│                                     │
│  Add Location: [Search...]         │
│                                     │
│  [Back]                    [Next]  │
└─────────────────────────────────────┘
```

**Implementation:**
```typescript
// components/glimpse/publish/CaptionEditor.tsx

export function CaptionEditor({ onNext }: Props) {
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [mentions, setMentions] = useState<string[]>([]);
  const [location, setLocation] = useState<Location | null>(null);
  const [suggestedHashtags, setSuggestedHashtags] = useState<string[]>([]);
  
  useEffect(() => {
    // Generate hashtag suggestions based on caption
    const suggestions = generateHashtagSuggestions(caption);
    setSuggestedHashtags(suggestions);
  }, [caption]);
  
  const handleCaptionChange = (text: string) => {
    setCaption(text);
    
    // Extract hashtags
    const hashtagMatches = text.match(/#\w+/g);
    if (hashtagMatches) {
      setHashtags(hashtagMatches.map(tag => tag.slice(1)));
    }
    
    // Extract mentions
    const mentionMatches = text.match(/@\w+/g);
    if (mentionMatches) {
      setMentions(mentionMatches.map(mention => mention.slice(1)));
    }
  };
  
  const addHashtag = (tag: string) => {
    setCaption(prev => `${prev} #${tag}`);
  };
  
  return (
    <div className="caption-editor">
      <textarea
        value={caption}
        onChange={(e) => handleCaptionChange(e.target.value)}
        placeholder="Write a caption..."
        maxLength={2200}
      />
      
      <div className="tools">
        <button onClick={() => setShowEmojiPicker(true)}>😊</button>
        <button onClick={() => setShowHashtagPicker(true)}>#</button>
        <button onClick={() => setShowMentionPicker(true)}>@</button>
        <span className="char-count">{caption.length}/2200</span>
      </div>
      
      <div className="suggested-hashtags">
        <p>Suggested Hashtags:</p>
        {suggestedHashtags.map(tag => (
          <button key={tag} onClick={() => addHashtag(tag)}>
            #{tag}
          </button>
        ))}
      </div>
      
      <div className="location-picker">
        <input
          type="text"
          placeholder="Add location..."
          onChange={(e) => searchLocation(e.target.value)}
        />
      </div>
      
      <div className="actions">
        <button onClick={onBack}>Back</button>
        <button onClick={() => onNext({ caption, hashtags, mentions, location })}>
          Next
        </button>
      </div>
    </div>
  );
}
```

---

## 🔗 Glimpses Linking System

### Database Schema

```typescript
interface Glimpse {
  id: string;
  userId: string;
  videoURL: string;
  thumbnailURL: string;
  caption: string;
  hashtags: string[];
  mentions: string[];
  
  // Series linking
  seriesId: string | null;
  previousGlimpseId: string | null;
  nextGlimpseId: string | null;
  partNumber: number | null;
  
  // Metadata
  duration: number;
  resolution: string;
  aspectRatio: string;
  
  // Stats
  views: number;
  likes: number;
  comments: number;
  shares: number;
  
  createdAt: Date;
  updatedAt: Date;
}

interface GlimpseSeries {
  id: string;
  title: string;
  description: string;
  creatorId: string;
  glimpseIds: string[];           // Ordered list
  totalParts: number;
  coverImageURL: string;
  
  // Stats
  totalViews: number;
  totalLikes: number;
  
  createdAt: Date;
  updatedAt: Date;
}
```

### Linking UI

```
┌─────────────────────────────────────┐
│     Link to Series (Optional)       │
├─────────────────────────────────────┤
│                                     │
│  Is this part of a series?         │
│  ○ No, standalone glimpse          │
│  ● Yes, part of a series           │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ Select Previous Part:       │   │
│  │                             │   │
│  │ ┌───────────────────────┐   │   │
│  │ │ [📹] Part 1: Intro    │   │   │
│  │ │ 2 days ago            │   │   │
│  │ └───────────────────────┘   │   │
│  │                             │   │
│  │ [+ Create New Series]       │   │
│  └─────────────────────────────┘   │
│                                     │
│  Series Title:                     │
│  ┌─────────────────────────────┐   │
│  │ My Travel Vlog              │   │
│  └─────────────────────────────┘   │
│                                     │
│  This will be: Part 2              │
│                                     │
│  [Skip]                  [Confirm] │
└─────────────────────────────────────┘
```

### Implementation

```typescript
// components/glimpse/publish/GlimpseLinkSelector.tsx

export function GlimpseLinkSelector({ userId, onComplete }: Props) {
  const [linkToSeries, setLinkToSeries] = useState(false);
  const [recentGlimpses, setRecentGlimpses] = useState<Glimpse[]>([]);
  const [selectedPrevious, setSelectedPrevious] = useState<string | null>(null);
  const [seriesTitle, setSeriesTitle] = useState('');
  const [existingSeries, setExistingSeries] = useState<GlimpseSeries[]>([]);
  
  useEffect(() => {
    loadRecentGlimpses();
    loadExistingSeries();
  }, [userId]);
  
  const loadRecentGlimpses = async () => {
    const glimpses = await glimpseService.getUserGlimpses(userId, 10);
    setRecentGlimpses(glimpses);
  };
  
  const loadExistingSeries = async () => {
    const series = await seriesService.getUserSeries(userId);
    setExistingSeries(series);
  };
  
  const handleCreateSeries = async () => {
    if (!selectedPrevious || !seriesTitle) return;
    
    const previousGlimpse = recentGlimpses.find(g => g.id === selectedPrevious);
    
    // Create new series
    const series = await seriesService.createSeries({
      title: seriesTitle,
      creatorId: userId,
      glimpseIds: [selectedPrevious],
    });
    
    // Update previous glimpse
    await glimpseService.updateGlimpse(selectedPrevious, {
      seriesId: series.id,
      partNumber: 1,
    });
    
    onComplete({
      seriesId: series.id,
      previousGlimpseId: selectedPrevious,
      partNumber: 2,
    });
  };
  
  const handleAddToExistingSeries = async (seriesId: string) => {
    const series = await seriesService.getSeries(seriesId);
    const lastGlimpseId = series.glimpseIds[series.glimpseIds.length - 1];
    
    onComplete({
      seriesId: series.id,
      previousGlimpseId: lastGlimpseId,
      partNumber: series.totalParts + 1,
    });
  };
  
  return (
    <div className="glimpse-link-selector">
      <div className="series-toggle">
        <label>
          <input
            type="radio"
            checked={!linkToSeries}
            onChange={() => setLinkToSeries(false)}
          />
          No, standalone glimpse
        </label>
        <label>
          <input
            type="radio"
            checked={linkToSeries}
            onChange={() => setLinkToSeries(true)}
          />
          Yes, part of a series
        </label>
      </div>
      
      {linkToSeries && (
        <>
          {/* Existing series */}
          {existingSeries.length > 0 && (
            <div className="existing-series">
              <h3>Add to Existing Series:</h3>
              {existingSeries.map(series => (
                <button
                  key={series.id}
                  onClick={() => handleAddToExistingSeries(series.id)}
                  className="series-card"
                >
                  <img src={series.coverImageURL} alt={series.title} />
                  <div>
                    <h4>{series.title}</h4>
                    <p>{series.totalParts} parts</p>
                  </div>
                </button>
              ))}
            </div>
          )}
          
          {/* Create new series */}
          <div className="new-series">
            <h3>Create New Series:</h3>
            
            <div className="previous-glimpse-selector">
              <p>Select Previous Part:</p>
              {recentGlimpses.map(glimpse => (
                <button
                  key={glimpse.id}
                  onClick={() => setSelectedPrevious(glimpse.id)}
                  className={selectedPrevious === glimpse.id ? 'selected' : ''}
                >
                  <img src={glimpse.thumbnailURL} alt="Glimpse" />
                  <div>
                    <p>{glimpse.caption.slice(0, 50)}...</p>
                    <span>{formatDate(glimpse.createdAt)}</span>
                  </div>
                </button>
              ))}
            </div>
            
            <input
              type="text"
              placeholder="Series Title"
              value={seriesTitle}
              onChange={(e) => setSeriesTitle(e.target.value)}
            />
            
            <p>This will be: Part 2</p>
          </div>
        </>
      )}
      
      <div className="actions">
        <button onClick={() => onComplete(null)}>Skip</button>
        <button onClick={handleCreateSeries} disabled={!linkToSeries || !selectedPrevious}>
          Confirm
        </button>
      </div>
    </div>
  );
}
```

---

## 👁️ Viewer Experience

### Series Navigation UI

```
┌─────────────────────────────────────┐
│  ← Part 1                  Part 3 → │
│                                     │
│  ┌─────────────────────────────┐   │
│  │                             │   │
│  │     Glimpse Video           │   │
│  │     (Part 2)                │   │
│  │                             │   │
│  └─────────────────────────────┘   │
│                                     │
│  📚 My Travel Vlog - Part 2 of 5   │
│                                     │
│  [◄ Previous] [Watch All] [Next ►] │
│                                     │
│  Series Timeline:                  │
│  [✓] [✓] [●] [ ] [ ]              │
│   P1  P2  P3  P4  P5               │
│                                     │
│  [❤️ 1.2K] [💬 45] [↗️ Share]      │
└─────────────────────────────────────┘
```

### Implementation

```typescript
// components/glimpse/series/SeriesNavigator.tsx

export function SeriesNavigator({ glimpse }: Props) {
  const [series, setSeries] = useState<GlimpseSeries | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  useEffect(() => {
    if (glimpse.seriesId) {
      loadSeries();
    }
  }, [glimpse.seriesId]);
  
  const loadSeries = async () => {
    const seriesData = await seriesService.getSeries(glimpse.seriesId!);
    setSeries(seriesData);
    
    // Find current glimpse index
    const index = seriesData.glimpseIds.indexOf(glimpse.id);
    setCurrentIndex(index);
  };
  
  const navigateTo = (direction: 'prev' | 'next') => {
    if (!series) return;
    
    const newIndex = direction === 'prev' ? currentIndex - 1 : currentIndex + 1;
    
    if (newIndex >= 0 && newIndex < series.glimpseIds.length) {
      const glimpseId = series.glimpseIds[newIndex];
      navigate(`/glimpses/${glimpseId}`);
    }
  };
  
  const watchAll = () => {
    // Navigate to series view showing all parts
    navigate(`/series/${series!.id}`);
  };
  
  return (
    <div className="series-navigator">
      {/* Navigation arrows */}
      <div className="nav-arrows">
        <button
          onClick={() => navigateTo('prev')}
          disabled={currentIndex === 0}
        >
          ← Part {currentIndex}
        </button>
        <button
          onClick={() => navigateTo('next')}
          disabled={currentIndex === series!.glimpseIds.length - 1}
        >
          Part {currentIndex + 2} →
        </button>
      </div>
      
      {/* Series info */}
      <div className="series-info">
        <h3>
          📚 {series!.title} - Part {currentIndex + 1} of {series!.totalParts}
        </h3>
      </div>
      
      {/* Action buttons */}
      <div className="actions">
        <button onClick={() => navigateTo('prev')} disabled={currentIndex === 0}>
          ◄ Previous
        </button>
        <button onClick={watchAll}>Watch All</button>
        <button
          onClick={() => navigateTo('next')}
          disabled={currentIndex === series!.glimpseIds.length - 1}
        >
          Next ►
        </button>
      </div>
      
      {/* Timeline */}
      <div className="series-timeline">
        {series!.glimpseIds.map((id, index) => (
          <button
            key={id}
            onClick={() => navigate(`/glimpses/${id}`)}
            className={index === currentIndex ? 'current' : index < currentIndex ? 'watched' : ''}
          >
            {index < currentIndex ? '✓' : index === currentIndex ? '●' : ' '}
            <span>P{index + 1}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
```

---

## 📊 Series Management

### Creator Dashboard

```typescript
// pages/GlimpseSeriesManager.tsx

export default function GlimpseSeriesManager() {
  const { user } = useAuth();
  const [series, setSeries] = useState<GlimpseSeries[]>([]);
  
  useEffect(() => {
    loadSeries();
  }, [user]);
  
  const loadSeries = async () => {
    const userSeries = await seriesService.getUserSeries(user!.userId);
    setSeries(userSeries);
  };
  
  return (
    <div className="series-manager">
      <h1>My Series</h1>
      
      <div className="series-grid">
        {series.map(s => (
          <SeriesCard key={s.id} series={s} />
        ))}
      </div>
      
      <button onClick={() => navigate('/glimpse-create')}>
        Create New Glimpse
      </button>
    </div>
  );
}
```

---

## 🚀 Implementation Roadmap

### Phase 1: Basic Editor (2-3 weeks)
- ✅ Media selection
- ✅ Text editor with round frames
- ✅ Music selector (Audius)
- ✅ Filter panel
- ✅ Sticker panel
- ✅ Download functionality

### Phase 2: Advanced Editor (4-6 weeks)
- ✅ Timeline component
- ✅ Multi-track support
- ✅ Clip trimming
- ✅ Audio mixer
- ✅ Voice over recording
- ✅ Color grading
- ✅ Transitions
- ✅ Media library (APIs)
- ✅ Undo/Redo system

### Phase 3: Publishing (1-2 weeks)
- ✅ Cover image picker
- ✅ Caption editor
- ✅ Hashtag suggestions
- ✅ Location picker

### Phase 4: Series Linking (2-3 weeks)
- ✅ Database schema
- ✅ Link selector UI
- ✅ Series creation
- ✅ Navigation UI
- ✅ Series dashboard
- ✅ Analytics

### Phase 5: Testing & Polish (2 weeks)
- ✅ Performance optimization
- ✅ Mobile responsiveness
- ✅ Bug fixes
- ✅ User testing

**Total Estimated Time: 11-16 weeks**

---

## 📝 Summary

This redesign transforms Glimpses into a **professional video creation platform** with:

1. **Quick Editing**: Instagram Story-style basic editor
2. **Pro Tools**: CapCut-level advanced editing
3. **Smart Publishing**: Cover selection, captions, hashtags
4. **Series Support**: Link glimpses for episodic content
5. **Creator Tools**: Series management and analytics

**Next Steps:**
1. Review and approve design
2. Set up development environment
3. Begin Phase 1 implementation
4. Iterate based on user feedback

🎬 **Ready to build the future of short-form video!**
