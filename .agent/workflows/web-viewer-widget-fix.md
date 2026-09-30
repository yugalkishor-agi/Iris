---
description: Fix Web Story Viewer Widget Rendering
---

# Web Story Viewer Widget Rendering Fix

## Problem
Editor और Web Viewer में widgets (poll, quiz, slider, etc.) के positions match नहीं हो रहे क्योंकि:
1. Web viewer में widget rendering code missing है
2. Web viewer `canvasConfig` का use नहीं करता jo editor save करता है

## Solution Steps

### 1. Create Widget Components for Web Viewer

Create `client/components/story/widgets/` directory and add these files:

**PollWidget.tsx** - Poll display
**QuizWidget.tsx** - Quiz display  
**SliderWidget.tsx** - Slider display
**QuestionWidget.tsx** - Question/Ask widget display
**MentionWidget.tsx** - Already exists as MentionSticker
**HashtagWidget.tsx** - Hashtag display
**TimeWidget.tsx** - Time display
**RatingWidget.tsx** - Rating display

### 2. Add canvasConfig Support in Web Viewer

In `client/pages/StoryViewer.tsx`:

```typescript
// Add after line 23
import { calculateWidgetPosition } from '@/utils/storyHelpers';

// Add state for canvas config (around line 54)
const [canvasConfig, setCanvasConfig] = useState({
  width: 1080,
  height: 1920,
  aspectRatio: 1080 / 1920
});

// Load canvasConfig from story data (in useEffect after line 76)
useEffect(() => {
  if (stories[currentStory]?.canvasConfig) {
    setCanvasConfig(stories[currentStory].canvasConfig);
  }
}, [currentStory, stories]);
```

### 3. Create Position Calculator Utility

Create `client/utils/storyHelpers.ts`:

```typescript
export function calculateWidgetPosition(
  widget: any,
  canvasConfig: { width: number; height: number },
  containerWidth: number,
  containerHeight: number
) {
  // Normalize positions from 0-1 if they are in pixels
  const normalizedX = widget.x > 1 ? widget.x / canvasConfig.width : widget.x;
  const normalizedY = widget.y > 1 ? widget.y / canvasConfig.height : widget.y;
  
  // Calculate position in current screen coordinates
  return {
    left: `${normalizedX * 100}%`,
    top: `${normalizedY * 100}%`,
    transform: `translate(-50%, -50%) rotate(${widget.rotation || 0}deg) scale(${widget.scale || widget.scaleX || 1})`,
  };
}
```

### 4. Render Widgets in StoryViewer

In `client/pages/StoryViewer.tsx`, after mention stickers rendering (line 768):

```typescript
{/* Widget Overlays */}
{stories[currentStory].widgets?.map((widget: any) => (
  <div
    key={widget.id}
    className="absolute z-20"
    style={calculateWidgetPosition(
      widget,
      canvasConfig,
      window.innerWidth,
      window.innerHeight
    )}
  >
    {widget.type === 'poll' || widget.kind === 'poll' ? (
      <PollWidget widget={widget} />
    ) : widget.type === 'quiz' || widget.kind === 'quiz' ? (
      <QuizWidget widget={widget} />
    ) : widget.type === 'slider' || widget.kind === 'slider' ? (
      <SliderWidget widget={widget} />
    ) : widget.type === 'question' || widget.kind === 'ask' || widget.kind === 'suggest' ? (
      <QuestionWidget widget={widget} />
    ) : null}
  </div>
))}
```

### 5. Test Both Platforms

1. Create a story in web editor with widgets
2. View it in web viewer - widgets should match editor positions
3. View same story in native app - should also match

## Expected Result

✅ Editor में जहां widget place करोगे, viewer में वहीं दिखेगा
✅ Both web and native viewers में consistent positioning
✅ Database में सब सही है (verified)
