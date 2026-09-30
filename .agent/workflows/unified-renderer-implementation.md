---
description: Replace Native Viewer with Web Viewer for Consistent Coordinates
---

# Solution: Use Web Viewer in Native App

## Problem
- **Editor**: Web-based (Konva) with coordinates in canvas system (1080x1920)
- **Viewer**: React Native with different coordinate calculations
- **Result**: Widgets show at wrong positions

## Solution Options

### Option 1: WebView in React Native (EASIEST) ✅

Replace native viewer with WebView pointing to web viewer:

**File: `native/screens/StoryViewerWebBridge.tsx`**

```tsx
import React from 'react';
import { WebView } from 'react-native-webview';
import { View, ActivityIndicator } from 'react-native';

export default function StoryViewerWebBridge({ route, navigation }: any) {
  const { userId, storyId } = route.params || {};
  
  // Point to your web viewer URL
  const webViewerUrl = `http://localhost:5173/story/${userId}`;
  
  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <WebView
        source={{ uri: webViewerUrl }}
        style={{ flex: 1 }}
        startInLoadingState
        renderLoading={() => (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
            <ActivityIndicator size="large" color="#fff" />
          </View>
        )}
      />
    </View>
  );
}
```

**Update: `native/App.tsx`**

```tsx
// Replace line 76:
import StoryViewerWebBridge from './screens/StoryViewerWebBridge';

// Replace line 425:
<Stack.Screen name="StoryViewer" component={StoryViewerWebBridge} />
```

### Option 2: Fix Native Coordinate Calculation

Update `native/screens/StoryViewerScreenEnhanced.tsx` to use EXACT same logic as web:

**Copy these functions from web viewer:**

```tsx
// From client/utils/storyHelpers.ts
function calculateWidgetPosition(widget, canvasConfig, containerWidth, containerHeight) {
  let x = widget.x ?? widget.transform?.x ?? 0.5;
  let y = widget.y ?? widget.transform?.y ?? 0.5;

  // Normalize if in pixels
  if (x > 1) x = x / canvasConfig.width;
  if (y > 1) y = y / canvasConfig.height;

  const scale = widget.scale ?? widget.scaleX ?? widget.transform?.scale ?? 1;
  const rotation = widget.rotation ?? widget.transform?.rotation ?? 0;

  return {
    left: x * containerWidth,
    top: y * containerHeight,
    transform: [
      { translateX: -(scale * 100) / 2 },
      { translateY: -(scale * 100) / 2 },
      { rotate: `${rotation}deg` },
      { scale },
    ],
  };
}
```

**Then update widget rendering in StoryOverlayRenderer.tsx** to use this function.

## Recommendation

**Use Option 1 (WebView)** because:
- ✅ Editor aur Viewer SAME codebase use karenge
- ✅ No coordinate conversion needed
- ✅ Easy to maintain
- ✅ Consistent behavior guaranteed

## Testing Steps

1. Web viewer test karo: `http://localhost:5173/story/:userId`
2. Dekho widgets sahi position pe hain
3. Native app mein WebView add karo
4. Test karo - ab same dikh na chahiye

## Note

Abhi maine **web viewer fix kar diya hai** with proper canvasConfig support.
Bas ab tum decide karo ki native app mein:
- WebView use karna hai (Option 1) ✅ 
- Ya native rendering fix karni hai (Option 2)
