# Comprehensive React Native Codebase Audit Report

## 1. DEPENDENCIES AUDIT

### Production Dependencies
- **@babel/runtime** (^7.28.4)
- **@expo/metro-runtime** (~4.0.1)
- **@expo/vector-icons** (~14.0.4)
- **@react-native-async-storage/async-storage** (1.23.1)
- **@react-native-community/slider** (4.5.5)
- **@react-native-masked-view/masked-view** (^0.3.2)
- **@react-navigation/bottom-tabs** (^7.2.2)
- **@react-navigation/native** (^7.0.13)
- **@react-navigation/native-stack** (^7.1.9)
- **@shopify/react-native-skia** (1.5.0) *(Heavy package, significant size contributor)*
- **@supabase/supabase-js** (^2.75.0)
- **dotenv** (^17.2.1)
- **expo** (~52.0.0)
- **expo-asset** (~11.0.5)
- **expo-av** (~15.0.1) *(Heavy package, significant size contributor)*
- **expo-blur** (~14.0.3)
- **expo-camera** (~16.0.9)
- **expo-constants** (~17.0.8)
- **expo-device** (~7.0.3)
- **expo-document-picker** (~13.0.3)
- **expo-file-system** (~18.0.4)
- **expo-font** (~13.0.4)
- **expo-haptics** (~14.0.1)
- **expo-image-manipulator** (~13.0.6)
- **expo-image-picker** (~16.0.3)
- **expo-linear-gradient** (~14.0.1)
- **expo-local-authentication** (~15.0.2)
- **expo-location** (~18.0.10)
- **expo-media-library** (~17.0.3)
- **expo-modules-core** (~2.2.3)
- **expo-notifications** (~0.29.14)
- **expo-screen-capture** (~7.0.1)
- **expo-status-bar** (~2.0.0)
- **expo-video-thumbnails** (~9.0.3)
- **firebase** (^12.4.0) *(Heavy package, significant size contributor)*
- **firebase-admin** (^13.6.0)
- **firebase-functions** (^7.0.0)
- **immer** (^11.1.8)
- **konva** (^9.3.17) *(Heavy package, significant size contributor)*
- **lucide-react** (^0.554.0)
- **lucide-react-native** (^0.527.0)
- **nativewind** (^4.1.23)
- **react** (18.3.1)
- **react-dom** (18.3.1)
- **react-konva** (^18.2.11) *(Heavy package, significant size contributor)*
- **react-native** (0.76.9)
- **react-native-compressor** (^1.13.0)
- **react-native-fast-image** (^8.6.3)
- **react-native-gesture-handler** (~2.20.2)
- **react-native-image-crop-picker** (^0.51.1)
- **react-native-paper** (^5.12.5)
- **react-native-reanimated** (~3.16.1)
- **react-native-safe-area-context** (4.12.0)
- **react-native-screens** (~4.4.0)
- **react-native-sensors** (^7.3.6)
- **react-native-svg** (15.8.0)
- **react-native-vector-icons** (^10.2.0)
- **react-native-view-shot** (^4.0.3)
- **react-native-web** (~0.19.13)
- **react-native-webview** (13.12.5)
- **react-router-dom** (^7.1.5)
- **rn-emoji-keyboard** (1.7.0)
- **zod** (^3.25.76)
- **zustand** (^5.0.8)

### Development Dependencies
- **@babel/core** (^7.25.2)
- **@react-native-community/cli** (latest)
- **@types/react** (~18.3.11)
- **@types/react-dom** (^19.2.3)
- **@types/react-native** (^0.73.0)
- **@vitejs/plugin-react-swc** (^3.5.0)
- **babel-preset-expo** (~12.0.0)
- **typescript** (^5.9.2)
- **vite** (^5.4.11)

*Note on Unused/Duplicate:* To verify absolutely unused dependencies across all files, `npx depcheck` is recommended. However, given the nature of Expo, most listed dependencies like various `expo-*` modules align with the standard Expo ecosystem usage.

---

## 2. COMPONENT INVENTORY

### chat.types
- **File Path:** `native\components\chat\chat.types.ts`
- **Props Accepted:** Unknown/None
- **Internal State Count:** 0 (useState/useReducer)
- **Imports & Child Components:** Message

### ChatProfileDrawer
- **File Path:** `native\components\chat\ChatProfileDrawer.tsx`
- **Props Accepted:** ChatProfileDrawerProps
- **Internal State Count:** 2 (useState/useReducer)
- **Imports & Child Components:** Modal, View, Text, TouchableOpacity, Ionicons, ScrollView, Avatar, VerifiedBadge, Switch

### Composer
- **File Path:** `native\components\chat\Composer.tsx`
- **Props Accepted:** ComposerProps
- **Internal State Count:** 0 (useState/useReducer)
- **Imports & Child Components:** ComposerProps, View, TouchableOpacity, Ionicons, TextInput, Animated, Image, InlineLoadingSkeleton

### EmojiPicker
- **File Path:** `native\components\chat\EmojiPicker.tsx`
- **Props Accepted:** EmojiPickerProps
- **Internal State Count:** 0 (useState/useReducer)
- **Imports & Child Components:** Modal, TouchableWithoutFeedback, View, TouchableOpacity, Text

### GalleryComposerSheet
- **File Path:** `native\components\chat\GalleryComposerSheet.tsx`
- **Props Accepted:** GalleryComposerSheetProps
- **Internal State Count:** 7 (useState/useReducer)
- **Imports & Child Components:** GalleryFilter, MediaLibrary, TouchableOpacity, Image, View, Ionicons, Text, Modal, Pressable, FlatList, ActivityIndicator

### LocationBubble
- **File Path:** `native\components\chat\LocationBubble.tsx`
- **Props Accepted:** LocationBubbleProps
- **Internal State Count:** 0 (useState/useReducer)
- **Imports & Child Components:** LocationBubbleProps, View, Ionicons, Text, TouchableOpacity

### LocationShareSheet
- **File Path:** `native\components\chat\LocationShareSheet.tsx`
- **Props Accepted:** LocationShareSheetProps
- **Internal State Count:** 5 (useState/useReducer)
- **Imports & Child Components:** LocationShareSheetProps, Status, Coords, Modal, View, Text, TouchableOpacity, Ionicons, ActivityIndicator

### MediaBubble
- **File Path:** `native\components\chat\MediaBubble.tsx`
- **Props Accepted:** MediaBubbleProps
- **Internal State Count:** 3 (useState/useReducer)
- **Imports & Child Components:** MediaBubbleProps, Video, Text, View, InlineLoadingSkeleton, Image, Ionicons, TouchableOpacity, Modal, Pressable, VerifiedBadge, Animated

### MessageActionsSheet
- **File Path:** `native\components\chat\MessageActionsSheet.tsx`
- **Props Accepted:** Unknown/None
- **Internal State Count:** 0 (useState/useReducer)
- **Imports & Child Components:** Props, AnchorRect, Modal, TouchableOpacity, Animated, BlurView, ScrollView, View, Text, Ionicons

### MessageBubble
- **File Path:** `native\components\chat\MessageBubble.tsx`
- **Props Accepted:** MessageBubbleProps
- **Internal State Count:** 2 (useState/useReducer)
- **Imports & Child Components:** MessageBubbleProps, View, Animated, Text, MediaBubble, VoiceMessageBubble, PollBubble, LocationBubble, SharedContentMessage, SharedCard, TouchableOpacity, Ionicons, Image, LinearGradient, Avatar, PanGestureHandler

### MessageForwardModal
- **File Path:** `native\components\chat\MessageForwardModal.tsx`
- **Props Accepted:** MessageForwardModalProps
- **Internal State Count:** 6 (useState/useReducer)
- **Imports & Child Components:** ForwardContact, TouchableOpacity, Avatar, View, Text, VerifiedBadge, Ionicons, Modal, ButtonLoadingSkeleton, TextInput, ScreenSkeleton, FlatList

### MessageList
- **File Path:** `native\components\chat\MessageList.tsx`
- **Props Accepted:** MessageListProps
- **Internal State Count:** 0 (useState/useReducer)
- **Imports & Child Components:** FlatList, ChatMessage, MessageListProps

### MoreReactionsPicker
- **File Path:** `native\components\chat\MoreReactionsPicker.tsx`
- **Props Accepted:** Unknown/None
- **Internal State Count:** 2 (useState/useReducer)
- **Imports & Child Components:** Props, Modal, TouchableOpacity, Animated, BlurView, Text, ScrollView, View, EmojiKeyboard

### PinnedBanner
- **File Path:** `native\components\chat\PinnedBanner.tsx`
- **Props Accepted:** PinnedBannerProps
- **Internal State Count:** 0 (useState/useReducer)
- **Imports & Child Components:** PinnedBannerProps, TouchableOpacity, View, Ionicons, Text

### PollBubble
- **File Path:** `native\components\chat\PollBubble.tsx`
- **Props Accepted:** PollBubbleProps
- **Internal State Count:** 0 (useState/useReducer)
- **Imports & Child Components:** PollBubbleProps, View, Text, TouchableOpacity

### PollComposer
- **File Path:** `native\components\chat\PollComposer.tsx`
- **Props Accepted:** PollComposerProps
- **Internal State Count:** 4 (useState/useReducer)
- **Imports & Child Components:** PollComposerProps, Modal, View, TouchableOpacity, Ionicons, Text, ScrollView, TextInput, InlineLoadingSkeleton

### QuickReactionPicker
- **File Path:** `native\components\chat\QuickReactionPicker.tsx`
- **Props Accepted:** QuickReactionPickerProps
- **Internal State Count:** 0 (useState/useReducer)
- **Imports & Child Components:** QuickReactionPickerProps, Modal, TouchableOpacity, BlurView, View, Text

### SharedCard
- **File Path:** `native\components\chat\SharedCard.tsx`
- **Props Accepted:** SharedCardProps
- **Internal State Count:** 0 (useState/useReducer)
- **Imports & Child Components:** SharedCardProps, TouchableOpacity, CachedImage, View, Text

### SharedContentMessage
- **File Path:** `native\components\chat\SharedContentMessage.tsx`
- **Props Accepted:** SharedContentMessageProps
- **Internal State Count:** 0 (useState/useReducer)
- **Imports & Child Components:** View, Text, TouchableOpacity, Avatar, VerifiedBadge, Ionicons, CachedImage

### ShareSheet
- **File Path:** `native\components\chat\ShareSheet.tsx`
- **Props Accepted:** ShareSheetProps
- **Internal State Count:** 0 (useState/useReducer)
- **Imports & Child Components:** ShareSheetProps, Modal, TouchableOpacity, View, Text, Ionicons

### StickerGifPicker
- **File Path:** `native\components\chat\StickerGifPicker.tsx`
- **Props Accepted:** StickerGifPickerProps
- **Internal State Count:** 6 (useState/useReducer)
- **Imports & Child Components:** PickerItem, TouchableOpacity, Image, View, Ionicons, Text, TextInput, ActivityIndicator, FlatList, InlineLoadingSkeleton

### VoiceMessageBubble
- **File Path:** `native\components\chat\VoiceMessageBubble.tsx`
- **Props Accepted:** VoiceMessageBubbleProps
- **Internal State Count:** 5 (useState/useReducer)
- **Imports & Child Components:** Audio, View, TouchableOpacity, Animated, Ionicons, Text

### CommentThreadList
- **File Path:** `native\components\comments\CommentThreadList.tsx`
- **Props Accepted:** CommentThreadListProps
- **Internal State Count:** 7 (useState/useReducer)
- **Imports & Child Components:** Comment, SortOption, Set, View, Text, TouchableOpacity, ThreadedComment, Ionicons, KeyboardAvoidingView, FlatList, TextInput

### ThreadedComment
- **File Path:** `native\components\comments\ThreadedComment.tsx`
- **Props Accepted:** ThreadedCommentProps
- **Internal State Count:** 2 (useState/useReducer)
- **Imports & Child Components:** View, Ionicons, Text, TouchableOpacity, Image, VerifiedBadge, ThreadedComment

### BackButton
- **File Path:** `native\components\common\BackButton.tsx`
- **Props Accepted:** BackButtonProps
- **Internal State Count:** 0 (useState/useReducer)
- **Imports & Child Components:** TouchableOpacity, Ionicons

### Header
- **File Path:** `native\components\common\Header.tsx`
- **Props Accepted:** HeaderProps
- **Internal State Count:** 0 (useState/useReducer)
- **Imports & Child Components:** View, BackButton, Text

### CreateButton
- **File Path:** `native\components\CreateMenu\CreateButton.tsx`
- **Props Accepted:** CreateButtonProps
- **Internal State Count:** 2 (useState/useReducer)
- **Imports & Child Components:** Animated, TouchableOpacity, Ionicons, View, CreateMenuModal

### CreateButtonStyles
- **File Path:** `native\components\CreateMenu\CreateButtonStyles.tsx`
- **Props Accepted:** Unknown/None
- **Internal State Count:** 0 (useState/useReducer)
- **Imports & Child Components:** None

### CreateMenuModal
- **File Path:** `native\components\CreateMenu\CreateMenuModal.tsx`
- **Props Accepted:** CreateMenuModalProps
- **Internal State Count:** 0 (useState/useReducer)
- **Imports & Child Components:** Modal, StatusBar, Animated, TouchableOpacity, View, Text, Ionicons

### CreateMenuStyles
- **File Path:** `native\components\CreateMenu\CreateMenuStyles.tsx`
- **Props Accepted:** Unknown/None
- **Internal State Count:** 0 (useState/useReducer)
- **Imports & Child Components:** None

### index
- **File Path:** `native\components\CreateMenu\index.tsx`
- **Props Accepted:** Unknown/None
- **Internal State Count:** 0 (useState/useReducer)
- **Imports & Child Components:** None

### ErrorBoundary
- **File Path:** `native\components\debug\ErrorBoundary.tsx`
- **Props Accepted:** Unknown/None
- **Internal State Count:** 0 (useState/useReducer)
- **Imports & Child Components:** React, View, Text, TouchableOpacity

### NativeStoryEditor
- **File Path:** `native\components\editor\NativeStoryEditor.tsx`
- **Props Accepted:** NativeStoryEditorProps
- **Internal State Count:** 4 (useState/useReducer)
- **Imports & Child Components:** ExportResult, Modal, GestureHandlerRootView, SafeAreaView, EditorHeader, View, ActivityIndicator, Text, SkiaCanvasEditor, EditorToolbar, TextTool, DrawingTool, StickerTool, FilterTool, MusicTool, WidgetTool

### ElementRenderer
- **File Path:** `native\components\editor\SkiaCanvas\ElementRenderer.tsx`
- **Props Accepted:** ElementRendererProps
- **Internal State Count:** 0 (useState/useReducer)
- **Imports & Child Components:** TextElementRenderer, DrawingElementRenderer, StickerElementRenderer, GifStickerElementRenderer, WidgetElementRenderer, Group, SkiaText, Path, Image

### SkiaCanvasEditor
- **File Path:** `native\components\editor\SkiaCanvas\SkiaCanvasEditor.tsx`
- **Props Accepted:** SkiaCanvasEditorProps
- **Internal State Count:** 0 (useState/useReducer)
- **Imports & Child Components:** View, GestureDetector, Canvas, Group, Image, ColorMatrix, ElementRenderer, Path

### SkiaExporter
- **File Path:** `native\components\editor\SkiaCanvas\SkiaExporter.tsx`
- **Props Accepted:** Unknown/None
- **Internal State Count:** 0 (useState/useReducer)
- **Imports & Child Components:** ExportResult

### DrawingTool
- **File Path:** `native\components\editor\Tools\DrawingTool.tsx`
- **Props Accepted:** Unknown/None
- **Internal State Count:** 0 (useState/useReducer)
- **Imports & Child Components:** View, Text, TouchableOpacity, Ionicons

### FilterTool
- **File Path:** `native\components\editor\Tools\FilterTool.tsx`
- **Props Accepted:** Unknown/None
- **Internal State Count:** 0 (useState/useReducer)
- **Imports & Child Components:** View, Text, TouchableOpacity, Ionicons, ScrollView, Slider

### MusicTool
- **File Path:** `native\components\editor\Tools\MusicTool.tsx`
- **Props Accepted:** MusicToolProps
- **Internal State Count:** 10 (useState/useReducer)
- **Imports & Child Components:** Audio, View, TouchableOpacity, Ionicons, Text, FlatList, ActivityIndicator, Slider

### StickerTool
- **File Path:** `native\components\editor\Tools\StickerTool.tsx`
- **Props Accepted:** Unknown/None
- **Internal State Count:** 0 (useState/useReducer)
- **Imports & Child Components:** View, Text, TouchableOpacity, Ionicons, ScrollView

### TextTool
- **File Path:** `native\components\editor\Tools\TextTool.tsx`
- **Props Accepted:** Unknown/None
- **Internal State Count:** 2 (useState/useReducer)
- **Imports & Child Components:** View, Text, TouchableOpacity, Ionicons, TextInput, ScrollView

### WidgetTool
- **File Path:** `native\components\editor\Tools\WidgetTool.tsx`
- **Props Accepted:** WidgetToolProps
- **Internal State Count:** 7 (useState/useReducer)
- **Imports & Child Components:** WidgetType, View, Text, TextInput, TouchableOpacity, Ionicons, ScrollView

### EditorHeader
- **File Path:** `native\components\editor\UI\EditorHeader.tsx`
- **Props Accepted:** EditorHeaderProps
- **Internal State Count:** 0 (useState/useReducer)
- **Imports & Child Components:** View, TouchableOpacity, Ionicons, Text

### EditorToolbar
- **File Path:** `native\components\editor\UI\EditorToolbar.tsx`
- **Props Accepted:** ToolButtonProps
- **Internal State Count:** 0 (useState/useReducer)
- **Imports & Child Components:** View, ToolButton, TouchableOpacity, Ionicons, Text, Animated

### GlimpseGrid
- **File Path:** `native\components\feed\GlimpseGrid.tsx`
- **Props Accepted:** GlimpseGridProps
- **Internal State Count:** 0 (useState/useReducer)
- **Imports & Child Components:** GlimpseGridItem, View, Ionicons, Text, ScreenSkeleton, FlatList

### GlimpseGridItem
- **File Path:** `native\components\feed\GlimpseGridItem.tsx`
- **Props Accepted:** GlimpseGridItemProps
- **Internal State Count:** 0 (useState/useReducer)
- **Imports & Child Components:** TouchableOpacity, Image, View, Ionicons, Text

### index
- **File Path:** `native\components\feed\index.tsx`
- **Props Accepted:** Unknown/None
- **Internal State Count:** 0 (useState/useReducer)
- **Imports & Child Components:** None

### PostCard
- **File Path:** `native\components\feed\PostCard.tsx`
- **Props Accepted:** PostCardProps
- **Internal State Count:** 9 (useState/useReducer)
- **Imports & Child Components:** Audio, View, TouchableOpacity, Avatar, Text, VerifiedBadge, MaterialCommunityIcons, Music4, MapPin, MoreHorizontal, ActivityIndicator, CachedImage, VolumeX, Volume2, Animated, Heart, MessageCircle, Send, Bookmark, Modal, Pressable, EyeOff, Flag, UserMinus

### PostCardSimple
- **File Path:** `native\components\feed\PostCardSimple.tsx`
- **Props Accepted:** PostCardSimpleProps
- **Internal State Count:** 0 (useState/useReducer)
- **Imports & Child Components:** View, Text

### PostGrid
- **File Path:** `native\components\feed\PostGrid.tsx`
- **Props Accepted:** PostGridProps
- **Internal State Count:** 0 (useState/useReducer)
- **Imports & Child Components:** PostGridItem, View, Ionicons, Text, ScreenSkeleton, FlatList

### PostGridItem
- **File Path:** `native\components\feed\PostGridItem.tsx`
- **Props Accepted:** PostGridItemProps
- **Internal State Count:** 0 (useState/useReducer)
- **Imports & Child Components:** TouchableOpacity, Image, View, Ionicons, Text

### StoryRing
- **File Path:** `native\components\feed\StoryRing.tsx`
- **Props Accepted:** StoryRingProps
- **Internal State Count:** 0 (useState/useReducer)
- **Imports & Child Components:** StoryStatus, ReturnType, AnimatedPressable, View, Animated, LinearGradient, AnimatedLinearGradient, Avatar, Ionicons, Text

### LiveStreamViewer
- **File Path:** `native\components\live\LiveStreamViewer.tsx`
- **Props Accepted:** LiveStreamViewerProps
- **Internal State Count:** 9 (useState/useReducer)
- **Imports & Child Components:** LiveComment, LiveReaction, FlatList, NodeJS, Animated, View, Avatar, Text, TouchableOpacity, Ionicons, VerifiedBadge, TextInput

### AdvancedImageEditor
- **File Path:** `native\components\media\AdvancedImageEditor.tsx`
- **Props Accepted:** AdvancedImageEditorProps
- **Internal State Count:** 7 (useState/useReducer)
- **Imports & Child Components:** View, ImageAdjustments, TouchableOpacity, Text, Ionicons, Slider, Image, ScrollView

### GlimpseStageLayers
- **File Path:** `native\components\media\GlimpseStageLayers.tsx`
- **Props Accepted:** GlimpseStageTextLayerProps
- **Internal State Count:** 3 (useState/useReducer)
- **Imports & Child Components:** ViewStyle, View, GlimpseOverlayLayer, Text, Image

### NativeGlimpseEditor
- **File Path:** `native\components\media\NativeGlimpseEditor.tsx`
- **Props Accepted:** NativeGlimpseEditorProps
- **Internal State Count:** 44 (useState/useReducer)
- **Imports & Child Components:** Video, TextInput, Audio, ReturnType, Map, Set, View, EditorHistorySnapshot, EditorTool, TextComposerTool, GlimpseOverlayAlign, GlimpseOverlayBackground, GlimpseOverlayEffect, GlimpseOverlayAnimation, GlimpseVoiceSegment, GlimpseOverlayLayer, Image, LinearGradient, GlimpseStageAssetLayer, Text, TouchableOpacity, Ionicons, GlimpseStageTextLayer, Animated, ScrollView, Slider, ActivityIndicator, Modal, SafeAreaView, KeyboardAvoidingView, Pressable

### NativePostImageEditor
- **File Path:** `native\components\media\NativePostImageEditor.tsx`
- **Props Accepted:** NativePostImageEditorProps
- **Internal State Count:** 46 (useState/useReducer)
- **Imports & Child Components:** View, TextLayer, TextBackdrop, Text, Ionicons, VisualLayer, Image, Modal, TouchableOpacity, TextInput, ActivityIndicator, FlatList, EditorTab, TextVariant, TextAlignMode, TextComposerTool, TextAnimationOption, TextEffectOption, TextBackgroundOption, AssetPickerMode, GiphyGif, TextStyleState, SafeAreaView, KeyboardAvoidingView, LinearGradient, Animated, EditorVisualLayer, EditorTextLayer, AnimatedTextInput, ScrollView, GradeSlider, StickerAssetSheet, Slider

### PhotoTagging
- **File Path:** `native\components\media\PhotoTagging.tsx`
- **Props Accepted:** PhotoTaggingProps
- **Internal State Count:** 8 (useState/useReducer)
- **Imports & Child Components:** PhotoTag, SearchUser, View, TouchableOpacity, Image, PhotoTagComponent, Text, Ionicons, Modal, TextInput, FlatList, Animated

### PostMediaPreviewModal
- **File Path:** `native\components\media\PostMediaPreviewModal.tsx`
- **Props Accepted:** PostMediaPreviewModalProps
- **Internal State Count:** 2 (useState/useReducer)
- **Imports & Child Components:** FlatList, MediaItem, View, Image, Ionicons, Text, Modal, SafeAreaView, TouchableOpacity

### TextOverlayEditor
- **File Path:** `native\components\media\TextOverlayEditor.tsx`
- **Props Accepted:** TextOverlayEditorProps
- **Internal State Count:** 12 (useState/useReducer)
- **Imports & Child Components:** TextLayer, View, Text, Ionicons, TextVariant, TextAlignMode, SafeAreaView, KeyboardAvoidingView, TouchableOpacity, Video, Image, EditorLayer, ScrollView, Modal, TextInput

### ConversationActionsSheet
- **File Path:** `native\components\messages\ConversationActionsSheet.tsx`
- **Props Accepted:** Unknown/None
- **Internal State Count:** 0 (useState/useReducer)
- **Imports & Child Components:** Props, Modal, TouchableOpacity, Text

### ViewLikesModal
- **File Path:** `native\components\modals\ViewLikesModal.tsx`
- **Props Accepted:** ViewLikesModalProps
- **Internal State Count:** 5 (useState/useReducer)
- **Imports & Child Components:** LikeUser, TouchableOpacity, View, Avatar, Text, VerifiedBadge, InlineLoadingSkeleton, Ionicons, Modal, ScreenSkeleton, FlatList

### AnimatedTabBar
- **File Path:** `native\components\navigation\AnimatedTabBar.tsx`
- **Props Accepted:** Unknown/None
- **Internal State Count:** 0 (useState/useReducer)
- **Imports & Child Components:** TouchableOpacity, View, Ionicons, Animated, Text, TabBarItem

### ModernTabBar
- **File Path:** `native\components\navigation\ModernTabBar.tsx`
- **Props Accepted:** Unknown/None
- **Internal State Count:** 0 (useState/useReducer)
- **Imports & Child Components:** View, TouchableOpacity, Ionicons, Animated, Text

### ThemedNavigationShell
- **File Path:** `native\components\navigation\ThemedNavigationShell.tsx`
- **Props Accepted:** ThemedNavigationShellProps
- **Internal State Count:** 0 (useState/useReducer)
- **Imports & Child Components:** NavigationContainer, StatusBar

### ViewLikesModal
- **File Path:** `native\components\post\ViewLikesModal.tsx`
- **Props Accepted:** ViewLikesModalProps
- **Internal State Count:** 4 (useState/useReducer)
- **Imports & Child Components:** LikeUser, View, Avatar, Text, VerifiedBadge, TouchableOpacity, Modal, Ionicons, ScreenSkeleton, FlatList

### ProcessingIndicator
- **File Path:** `native\components\ProcessingIndicator\ProcessingIndicator.tsx`
- **Props Accepted:** ProcessingIndicatorProps
- **Internal State Count:** 3 (useState/useReducer)
- **Imports & Child Components:** ProcessingProgress, Animated, TouchableOpacity, View, Ionicons, Text, Modal

### ProcessingIndicatorStyles
- **File Path:** `native\components\ProcessingIndicator\ProcessingIndicatorStyles.tsx`
- **Props Accepted:** Unknown/None
- **Internal State Count:** 0 (useState/useReducer)
- **Imports & Child Components:** None

### OtherUserProfileHeader
- **File Path:** `native\components\profile\OtherUserProfileHeader.tsx`
- **Props Accepted:** OtherUserProfileHeaderProps
- **Internal State Count:** 3 (useState/useReducer)
- **Imports & Child Components:** View, LinearGradient, Text, Avatar, TouchableOpacity, VerifiedBadge, Ionicons, InlineLoadingSkeleton

### OwnProfileHeader
- **File Path:** `native\components\profile\OwnProfileHeader.tsx`
- **Props Accepted:** OwnProfileHeaderProps
- **Internal State Count:** 3 (useState/useReducer)
- **Imports & Child Components:** View, ActivityIndicator, Text, ProfileBannerEditor, TouchableOpacity, LinearGradient, Avatar, Ionicons, VerifiedBadge

### ProfileBannerEditor
- **File Path:** `native\components\profile\ProfileBannerEditor.tsx`
- **Props Accepted:** ProfileBannerEditorProps
- **Internal State Count:** 3 (useState/useReducer)
- **Imports & Child Components:** Image, LinearGradient, TouchableOpacity, View, Ionicons, Text, ActivityIndicator, Modal

### ProfileCoverImage
- **File Path:** `native\components\profile\ProfileCoverImage.tsx`
- **Props Accepted:** ProfileCoverImageProps
- **Internal State Count:** 0 (useState/useReducer)
- **Imports & Child Components:** View, Image, LinearGradient, TouchableOpacity, InlineLoadingSkeleton, Ionicons

### ProfileHighlightRing
- **File Path:** `native\components\profile\ProfileHighlightRing.tsx`
- **Props Accepted:** ProfileHighlightRingProps
- **Internal State Count:** 0 (useState/useReducer)
- **Imports & Child Components:** View, AnimatedLinearGradient, Animated, LinearGradient, Ionicons, Avatar

### SharePostModal
- **File Path:** `native\components\share\SharePostModal.tsx`
- **Props Accepted:** SharePostModalProps
- **Internal State Count:** 7 (useState/useReducer)
- **Imports & Child Components:** ShareUser, TouchableOpacity, Avatar, View, Text, Ionicons, Modal, InlineLoadingSkeleton, Image, TextInput, ScreenSkeleton, FlatList

### DraggableSticker
- **File Path:** `native\components\story\DraggableSticker.tsx`
- **Props Accepted:** DraggableStickerProps
- **Internal State Count:** 4 (useState/useReducer)
- **Imports & Child Components:** Animated, Pressable, Text, Image, Video, StoryWidget, GestureDetectorComp, View

### DraggableText
- **File Path:** `native\components\story\DraggableText.tsx`
- **Props Accepted:** DraggableTextProps
- **Internal State Count:** 2 (useState/useReducer)
- **Imports & Child Components:** Animated, View, Text, GestureDetectorComp

### DrawingTool
- **File Path:** `native\components\story\DrawingTool.tsx`
- **Props Accepted:** DrawingToolProps
- **Internal State Count:** 8 (useState/useReducer)
- **Imports & Child Components:** PathData, Modal, View, TouchableOpacity, Ionicons, Text, Svg, Path

### EditInteractiveStickerModal
- **File Path:** `native\components\story\EditInteractiveStickerModal.tsx`
- **Props Accepted:** Unknown/None
- **Internal State Count:** 9 (useState/useReducer)
- **Imports & Child Components:** Modal, View, TouchableOpacity, Ionicons, Text, ScrollView, TextInput

### EnhancedStoryRing
- **File Path:** `native\components\story\EnhancedStoryRing.tsx`
- **Props Accepted:** EnhancedStoryRingProps
- **Internal State Count:** 2 (useState/useReducer)
- **Imports & Child Components:** StoryStatus, TouchableOpacity, Animated, View, LinearGradient, Avatar, Ionicons, Text

### EnhancedTextEditor
- **File Path:** `native\components\story\EnhancedTextEditor.tsx`
- **Props Accepted:** EnhancedTextEditorProps
- **Internal State Count:** 8 (useState/useReducer)
- **Imports & Child Components:** Modal, View, KeyboardAvoidingView, TouchableOpacity, Ionicons, Text, ScrollView, TextInput

### FilterEffects
- **File Path:** `native\components\story\FilterEffects.tsx`
- **Props Accepted:** FilterEffectsProps
- **Internal State Count:** 5 (useState/useReducer)
- **Imports & Child Components:** TouchableOpacity, View, Image, Ionicons, Text, Modal, KeyboardAvoidingView, ScrollView

### GifPicker
- **File Path:** `native\components\story\GifPicker.tsx`
- **Props Accepted:** Unknown/None
- **Internal State Count:** 7 (useState/useReducer)
- **Imports & Child Components:** GifItem, RecentGif, Modal, View, TouchableOpacity, Ionicons, TextInput, Text, InlineLoadingSkeleton, FlatList, Image

### InteractiveStickerPanel
- **File Path:** `native\components\story\InteractiveStickerPanel.tsx`
- **Props Accepted:** InteractiveStickerPanelProps
- **Internal State Count:** 21 (useState/useReducer)
- **Imports & Child Components:** StickerType, ThemeType, View, Text, TouchableOpacity, LinearGradient, ScrollView, Switch, Ionicons, TextInput, StyleCustomization, WidgetPreview

### MusicPicker
- **File Path:** `native\components\story\MusicPicker.tsx`
- **Props Accepted:** TrackArtworkProps
- **Internal State Count:** 8 (useState/useReducer)
- **Imports & Child Components:** View, Ionicons, Image, AudiusTrack, RecentSong, Modal, TouchableOpacity, TextInput, Text, InlineLoadingSkeleton, FlatList, TrackArtwork

### MusicSticker
- **File Path:** `native\components\story\MusicSticker.tsx`
- **Props Accepted:** MusicStickerProps
- **Internal State Count:** 5 (useState/useReducer)
- **Imports & Child Components:** Track, TouchableOpacity, Image, View, Text, Ionicons, TextInput, ActivityIndicator, FlatList

### NativeStoryRenderer
- **File Path:** `native\components\story\NativeStoryRenderer.tsx`
- **Props Accepted:** NativeStoryRendererProps
- **Internal State Count:** 0 (useState/useReducer)
- **Imports & Child Components:** View, Video, Image, StoryOverlayRenderer

### ShareOptionsModal
- **File Path:** `native\components\story\ShareOptionsModal.tsx`
- **Props Accepted:** ShareOptionsModalProps
- **Internal State Count:** 2 (useState/useReducer)
- **Imports & Child Components:** Modal, View, Text, TouchableOpacity, Ionicons, InlineLoadingSkeleton, ActivityIndicator

### StickerPicker
- **File Path:** `native\components\story\StickerPicker.tsx`
- **Props Accepted:** StickerPickerProps
- **Internal State Count:** 3 (useState/useReducer)
- **Imports & Child Components:** View, Text, TouchableOpacity, Ionicons, Modal, KeyboardAvoidingView, TextInput, ScrollView, FlatList

### StoryCaptureBridge
- **File Path:** `native\components\story\StoryCaptureBridge.tsx`
- **Props Accepted:** StoryCaptureBridgeProps
- **Internal State Count:** 0 (useState/useReducer)
- **Imports & Child Components:** StoryCaptureBridgeRef, View, NativeStoryRenderer

### StoryEditor
- **File Path:** `native\components\story\StoryEditor.tsx`
- **Props Accepted:** Unknown/None
- **Internal State Count:** 20 (useState/useReducer)
- **Imports & Child Components:** EditorTool, TextOverlay, StickerOverlay, SafeAreaView, View, TouchableOpacity, Ionicons, Text, CameraView, Image, LinearGradient, ScrollView, Modal, TextInput, ProcessingIndicator

### StoryMediaRenderer
- **File Path:** `native\components\story\StoryMediaRenderer.tsx`
- **Props Accepted:** StoryMediaRendererProps
- **Internal State Count:** 0 (useState/useReducer)
- **Imports & Child Components:** View, WebView

### StoryOverlayRenderer
- **File Path:** `native\components\story\StoryOverlayRenderer.tsx`
- **Props Accepted:** StoryOverlayRendererProps
- **Internal State Count:** 1 (useState/useReducer)
- **Imports & Child Components:** View, Text, StoryWidget, SvgXml, TextInput, TouchableOpacity

### StoryPoll
- **File Path:** `native\components\story\StoryPoll.tsx`
- **Props Accepted:** StoryPollProps
- **Internal State Count:** 4 (useState/useReducer)
- **Imports & Child Components:** View, Text, TouchableOpacity, Animated, LinearGradient, Ionicons

### StoryPostStyleEditor
- **File Path:** `native\components\story\StoryPostStyleEditor.tsx`
- **Props Accepted:** StoryPostStyleEditorProps
- **Internal State Count:** 4 (useState/useReducer)
- **Imports & Child Components:** StoryEditorDraft, TouchableOpacity, Ionicons, NativePostImageEditor, NativeStoryEditor, StorySettingsModal, ShareOptionsModal

### StoryReactionPicker
- **File Path:** `native\components\story\StoryReactionPicker.tsx`
- **Props Accepted:** StoryReactionPickerProps
- **Internal State Count:** 1 (useState/useReducer)
- **Imports & Child Components:** View, TouchableOpacity, Animated, Text

### StoryRenderer
- **File Path:** `native\components\story\StoryRenderer.tsx`
- **Props Accepted:** StoryRendererProps
- **Internal State Count:** 0 (useState/useReducer)
- **Imports & Child Components:** View, WebView

### StorySettingsModal
- **File Path:** `native\components\story\StorySettingsModal.tsx`
- **Props Accepted:** StorySettingsModalProps
- **Internal State Count:** 6 (useState/useReducer)
- **Imports & Child Components:** TouchableOpacity, Avatar, View, Text, Modal, Ionicons, Switch, TextInput, FlatList

### StoryViewerEnhanced
- **File Path:** `native\components\story\StoryViewerEnhanced.tsx`
- **Props Accepted:** StoryViewerEnhancedProps
- **Internal State Count:** 13 (useState/useReducer)
- **Imports & Child Components:** Record, NodeJS, View, Animated, Avatar, Text, VerifiedBadge, TouchableOpacity, Ionicons, StoryRenderer

### index
- **File Path:** `native\components\story\widgets\index.ts`
- **Props Accepted:** Unknown/None
- **Internal State Count:** 0 (useState/useReducer)
- **Imports & Child Components:** None

### StoryWidget
- **File Path:** `native\components\story\widgets\StoryWidget.tsx`
- **Props Accepted:** StoryWidgetProps
- **Internal State Count:** 0 (useState/useReducer)
- **Imports & Child Components:** WidgetPoll, WidgetSlider, View, WidgetQuestion, WidgetQuiz, WidgetStaticMention, WidgetStaticHashtag, WidgetStaticTime, Text, Video, Image

### styles
- **File Path:** `native\components\story\widgets\styles.ts`
- **Props Accepted:** Unknown/None
- **Internal State Count:** 0 (useState/useReducer)
- **Imports & Child Components:** None

### WidgetStaticHashtag
- **File Path:** `native\components\story\widgets\WidgetStaticHashtag.tsx`
- **Props Accepted:** WidgetStaticHashtagProps
- **Internal State Count:** 0 (useState/useReducer)
- **Imports & Child Components:** View, Text

### WidgetStaticMention
- **File Path:** `native\components\story\widgets\WidgetStaticMention.tsx`
- **Props Accepted:** WidgetStaticMentionProps
- **Internal State Count:** 0 (useState/useReducer)
- **Imports & Child Components:** View, Text

### WidgetStaticPoll
- **File Path:** `native\components\story\widgets\WidgetStaticPoll.tsx`
- **Props Accepted:** WidgetPollProps
- **Internal State Count:** 0 (useState/useReducer)
- **Imports & Child Components:** View, Text, LinearGradient, TouchableOpacity

### WidgetStaticQuestion
- **File Path:** `native\components\story\widgets\WidgetStaticQuestion.tsx`
- **Props Accepted:** WidgetQuestionProps
- **Internal State Count:** 0 (useState/useReducer)
- **Imports & Child Components:** View, Image, Text, TouchableOpacity

### WidgetStaticQuiz
- **File Path:** `native\components\story\widgets\WidgetStaticQuiz.tsx`
- **Props Accepted:** WidgetQuizProps
- **Internal State Count:** 0 (useState/useReducer)
- **Imports & Child Components:** View, Text, TouchableOpacity

### WidgetStaticSlider
- **File Path:** `native\components\story\widgets\WidgetStaticSlider.tsx`
- **Props Accepted:** WidgetSliderProps
- **Internal State Count:** 2 (useState/useReducer)
- **Imports & Child Components:** View, Text, LinearGradient

### WidgetStaticTime
- **File Path:** `native\components\story\widgets\WidgetStaticTime.tsx`
- **Props Accepted:** WidgetStaticTimeProps
- **Internal State Count:** 0 (useState/useReducer)
- **Imports & Child Components:** View, Text

### StoryCamera
- **File Path:** `native\components\StoryEditor\StoryCamera.tsx`
- **Props Accepted:** StoryCameraProps
- **Internal State Count:** 5 (useState/useReducer)
- **Imports & Child Components:** CameraView, CameraType, FlashMode, View, Text, TouchableOpacity, Ionicons

### StoryCameraStyles
- **File Path:** `native\components\StoryEditor\StoryCameraStyles.tsx`
- **Props Accepted:** Unknown/None
- **Internal State Count:** 0 (useState/useReducer)
- **Imports & Child Components:** None

### StoryFiltersStyles
- **File Path:** `native\components\StoryEditor\StoryFiltersStyles.tsx`
- **Props Accepted:** Unknown/None
- **Internal State Count:** 0 (useState/useReducer)
- **Imports & Child Components:** None

### StoryStickersStyles
- **File Path:** `native\components\StoryEditor\StoryStickersStyles.tsx`
- **Props Accepted:** Unknown/None
- **Internal State Count:** 0 (useState/useReducer)
- **Imports & Child Components:** None

### StoryTextEditorStyles
- **File Path:** `native\components\StoryEditor\StoryTextEditorStyles.tsx`
- **Props Accepted:** Unknown/None
- **Internal State Count:** 0 (useState/useReducer)
- **Imports & Child Components:** None

### StoryRing
- **File Path:** `native\components\StoryRing.tsx`
- **Props Accepted:** StoryRingProps
- **Internal State Count:** 2 (useState/useReducer)
- **Imports & Child Components:** TouchableOpacity, Animated, LinearGradient, View, Avatar, Ionicons, Text

### SuggestionCard
- **File Path:** `native\components\suggestions\SuggestionCard.tsx`
- **Props Accepted:** SuggestionCardProps
- **Internal State Count:** 4 (useState/useReducer)
- **Imports & Child Components:** TouchableOpacity, View, Ionicons, Avatar, Text, VerifiedBadge, InlineLoadingSkeleton

### SuggestionCarousel
- **File Path:** `native\components\suggestions\SuggestionCarousel.tsx`
- **Props Accepted:** SuggestionCarouselProps
- **Internal State Count:** 5 (useState/useReducer)
- **Imports & Child Components:** SuggestedUser, View, InlineLoadingSkeleton, Text, TouchableOpacity, Ionicons, ScrollView, Image, Avatar, VerifiedBadge

### Avatar
- **File Path:** `native\components\ui\Avatar.tsx`
- **Props Accepted:** AvatarProps
- **Internal State Count:** 2 (useState/useReducer)
- **Imports & Child Components:** View, Text, CachedImage

### Badge
- **File Path:** `native\components\ui\Badge.tsx`
- **Props Accepted:** BadgeProps
- **Internal State Count:** 0 (useState/useReducer)
- **Imports & Child Components:** View, Text

### Button
- **File Path:** `native\components\ui\Button.tsx`
- **Props Accepted:** ButtonProps
- **Internal State Count:** 0 (useState/useReducer)
- **Imports & Child Components:** TouchableOpacity, View, Text, ActivityIndicator

### CachedImage
- **File Path:** `native\components\ui\CachedImage.tsx`
- **Props Accepted:** CachedImageProps
- **Internal State Count:** 2 (useState/useReducer)
- **Imports & Child Components:** ImageProps, Image

### Card
- **File Path:** `native\components\ui\Card.tsx`
- **Props Accepted:** CardProps
- **Internal State Count:** 0 (useState/useReducer)
- **Imports & Child Components:** View, Text

### ComingSoonScreen
- **File Path:** `native\components\ui\ComingSoonScreen.tsx`
- **Props Accepted:** ComingSoonScreenProps
- **Internal State Count:** 0 (useState/useReducer)
- **Imports & Child Components:** SafeAreaView, View, TouchableOpacity, Ionicons, Text, ScrollView

### CreateMenu
- **File Path:** `native\components\ui\CreateMenu.tsx`
- **Props Accepted:** CreateMenuProps
- **Internal State Count:** 0 (useState/useReducer)
- **Imports & Child Components:** Modal, Animated, TouchableOpacity, View, Text, Ionicons

### Dialog
- **File Path:** `native\components\ui\Dialog.tsx`
- **Props Accepted:** DialogProps
- **Internal State Count:** 0 (useState/useReducer)
- **Imports & Child Components:** Modal, TouchableWithoutFeedback, View, TouchableOpacity, Ionicons, Text

### EmojiPicker
- **File Path:** `native\components\ui\EmojiPicker.tsx`
- **Props Accepted:** EmojiPickerProps
- **Internal State Count:** 4 (useState/useReducer)
- **Imports & Child Components:** TouchableOpacity, Text, Ionicons, Modal, SafeAreaView, View, TextInput, FlatList

### HashtagAutocomplete
- **File Path:** `native\components\ui\HashtagAutocomplete.tsx`
- **Props Accepted:** HashtagAutocompleteProps
- **Internal State Count:** 3 (useState/useReducer)
- **Imports & Child Components:** Hashtag, TouchableOpacity, View, Ionicons, Text, InlineLoadingSkeleton, FlatList

### index
- **File Path:** `native\components\ui\index.tsx`
- **Props Accepted:** Unknown/None
- **Internal State Count:** 0 (useState/useReducer)
- **Imports & Child Components:** None

### Input
- **File Path:** `native\components\ui\Input.tsx`
- **Props Accepted:** InputProps
- **Internal State Count:** 0 (useState/useReducer)
- **Imports & Child Components:** View, TextInput

### LikeAnimation
- **File Path:** `native\components\ui\LikeAnimation.tsx`
- **Props Accepted:** LikeAnimationProps
- **Internal State Count:** 0 (useState/useReducer)
- **Imports & Child Components:** Animated, Ionicons, View

### LoadingSkeleton
- **File Path:** `native\components\ui\LoadingSkeleton.tsx`
- **Props Accepted:** LoadingSkeletonProps
- **Internal State Count:** 0 (useState/useReducer)
- **Imports & Child Components:** Animated, View, LoadingSkeleton, GridSkeleton, CommentSkeleton, UserSkeleton

### MentionAutocomplete
- **File Path:** `native\components\ui\MentionAutocomplete.tsx`
- **Props Accepted:** MentionAutocompleteProps
- **Internal State Count:** 3 (useState/useReducer)
- **Imports & Child Components:** User, TouchableOpacity, Avatar, View, Text, VerifiedBadge, InlineLoadingSkeleton, FlatList

### SaveAnimation
- **File Path:** `native\components\ui\SaveAnimation.tsx`
- **Props Accepted:** SaveAnimationProps
- **Internal State Count:** 0 (useState/useReducer)
- **Imports & Child Components:** View, Animated, Ionicons

### Sheet
- **File Path:** `native\components\ui\Sheet.tsx`
- **Props Accepted:** SheetProps
- **Internal State Count:** 0 (useState/useReducer)
- **Imports & Child Components:** Modal, TouchableWithoutFeedback, View, Animated, TouchableOpacity, Ionicons, Text

### SkeletonLoader
- **File Path:** `native\components\ui\SkeletonLoader.tsx`
- **Props Accepted:** SkeletonLoaderProps
- **Internal State Count:** 0 (useState/useReducer)
- **Imports & Child Components:** Animated, SkeletonLoader, View, SkeletonAvatar, SkeletonText

### StoryProcessingBar
- **File Path:** `native\components\ui\StoryProcessingBar.tsx`
- **Props Accepted:** Unknown/None
- **Internal State Count:** 0 (useState/useReducer)
- **Imports & Child Components:** View, Ionicons, Text, Animated, TouchableOpacity

### Toast
- **File Path:** `native\components\ui\Toast.tsx`
- **Props Accepted:** ToastProps
- **Internal State Count:** 0 (useState/useReducer)
- **Imports & Child Components:** Animated, View, Image, Text, Avatar, VerifiedBadge, TouchableOpacity, Ionicons

### VerifiedBadge
- **File Path:** `native\components\ui\VerifiedBadge.tsx`
- **Props Accepted:** VerifiedBadgeProps
- **Internal State Count:** 0 (useState/useReducer)
- **Imports & Child Components:** SvgXml, Animated, Pressable

### ActiveUsersList
- **File Path:** `native\components\users\ActiveUsersList.tsx`
- **Props Accepted:** ActiveUsersListProps
- **Internal State Count:** 4 (useState/useReducer)
- **Imports & Child Components:** User, TouchableOpacity, View, Avatar, Text, VerifiedBadge, Ionicons, ScreenSkeleton, FlatList, RefreshControl

---

## 3. SCREEN ANALYSIS

### AboutScreen
- **File Path:** `native\screens\AboutScreen.tsx`
- **Components Used:** View, Text (2 components total)
- **Local State Count:** 0
- **Database/API Calls:** None

### AboutScreen_Full
- **File Path:** `native\screens\AboutScreen_Full.tsx`
- **Components Used:** SafeAreaView, View, TouchableOpacity, Ionicons, Text, ScrollView (6 components total)
- **Local State Count:** 0
- **Database/API Calls:** None

### AccentColorScreen
- **File Path:** `native\screens\AccentColorScreen.tsx`
- **Components Used:** TouchableOpacity, View, Text, Ionicons, SafeAreaView, ScrollView (6 components total)
- **Local State Count:** 2
- **Database/API Calls:** None

### AccessibilityScreen
- **File Path:** `native\screens\AccessibilityScreen.tsx`
- **Components Used:** None (0 components total)
- **Local State Count:** 0
- **Database/API Calls:** None

### AccountActivityScreen
- **File Path:** `native\screens\AccountActivityScreen.tsx`
- **Components Used:** ComingSoonScreen (1 components total)
- **Local State Count:** 0
- **Database/API Calls:** None

### AccountSettingsScreen
- **File Path:** `native\screens\AccountSettingsScreen.tsx`
- **Components Used:** None (0 components total)
- **Local State Count:** 0
- **Database/API Calls:** None

### AchievementsScreen
- **File Path:** `native\screens\AchievementsScreen.tsx`
- **Components Used:** View, TouchableOpacity, Ionicons, Text, ScrollView (5 components total)
- **Local State Count:** 0
- **Database/API Calls:** None

### ActiveUsersScreen
- **File Path:** `native\screens\ActiveUsersScreen.tsx`
- **Components Used:** SafeAreaView, View, TouchableOpacity, Ionicons, Text, ActiveUsersList (6 components total)
- **Local State Count:** 2
- **Database/API Calls:** None

### ActivityLogScreen
- **File Path:** `native\screens\ActivityLogScreen.tsx`
- **Components Used:** LogItem, View, TouchableOpacity, Ionicons, Text, ScreenSkeleton, FlatList (7 components total)
- **Local State Count:** 3
- **Database/API Calls:** None

### ActivityLogScreen_Full
- **File Path:** `native\screens\ActivityLogScreen_Full.tsx`
- **Components Used:** ActivityItem, View, Ionicons, Text, SafeAreaView, ActivityIndicator, TouchableOpacity, FlatList (8 components total)
- **Local State Count:** 4
- **Database/API Calls:** None

### ActivityScreen
- **File Path:** `native\screens\ActivityScreen.tsx`
- **Components Used:** ActivityItem, TouchableOpacity, View, Avatar, Ionicons, Text, Image, SafeAreaView, ScreenSkeleton, FlatList, RefreshControl (11 components total)
- **Local State Count:** 5
- **Database/API Calls:** None

### AdvancedImageEditorScreen
- **File Path:** `native\screens\AdvancedImageEditorScreen.tsx`
- **Components Used:** View, StatusBar, AdvancedImageEditor (3 components total)
- **Local State Count:** 0
- **Database/API Calls:** None

### AnalyticsScreen
- **File Path:** `native\screens\AnalyticsScreen.tsx`
- **Components Used:** Stats, View, ScreenSkeleton, Text, TouchableOpacity, Ionicons, ScrollView (7 components total)
- **Local State Count:** 3
- **Database/API Calls:** None

### AppearanceSettingsScreen
- **File Path:** `native\screens\AppearanceSettingsScreen.tsx`
- **Components Used:** ComingSoonScreen (1 components total)
- **Local State Count:** 0
- **Database/API Calls:** None

### AppearanceSettingsScreen_Full
- **File Path:** `native\screens\AppearanceSettingsScreen_Full.tsx`
- **Components Used:** SafeAreaView, View, TouchableOpacity, Ionicons, Text, ScrollView (6 components total)
- **Local State Count:** 3
- **Database/API Calls:** None

### AppIconScreen
- **File Path:** `native\screens\AppIconScreen.tsx`
- **Components Used:** TouchableOpacity, View, Image, Ionicons, Text, SafeAreaView, ScrollView (7 components total)
- **Local State Count:** 2
- **Database/API Calls:** None

### AppsWebsitesScreen
- **File Path:** `native\screens\AppsWebsitesScreen.tsx`
- **Components Used:** ComingSoonScreen (1 components total)
- **Local State Count:** 0
- **Database/API Calls:** None

### ArchivedStoryViewerScreen
- **File Path:** `native\screens\ArchivedStoryViewerScreen.tsx`
- **Components Used:** StoryArchive, ArchivedStory, TouchableOpacity, Image, View, Ionicons, Text, FlatList, SafeAreaView, ActivityIndicator (10 components total)
- **Local State Count:** 4
- **Database/API Calls:** None

### ArchiveScreen
- **File Path:** `native\screens\ArchiveScreen.tsx`
- **Components Used:** TouchableOpacity, Image, View, Ionicons, Text, ScreenSkeleton, FlatList (7 components total)
- **Local State Count:** 3
- **Database/API Calls:** None

### ArchiveScreen_Full
- **File Path:** `native\screens\ArchiveScreen_Full.tsx`
- **Components Used:** TouchableOpacity, Image, View, Ionicons, Text, SafeAreaView, ActivityIndicator, FlatList (8 components total)
- **Local State Count:** 4
- **Database/API Calls:** None

### AutoPlaySettingsScreen
- **File Path:** `native\screens\AutoPlaySettingsScreen.tsx`
- **Components Used:** None (0 components total)
- **Local State Count:** 0
- **Database/API Calls:** None

### AvatarEditorScreen
- **File Path:** `native\screens\AvatarEditorScreen.tsx`
- **Components Used:** SafeAreaView, View, TouchableOpacity, Ionicons, Text, InlineLoadingSkeleton, ScrollView, Image (8 components total)
- **Local State Count:** 4
- **Database/API Calls:** None

### BackendDiagnosticsScreen
- **File Path:** `native\screens\BackendDiagnosticsScreen.tsx`
- **Components Used:** Result, View, Text, TouchableOpacity, ScrollView (5 components total)
- **Local State Count:** 3
- **Database/API Calls:** firestore_once

### BackupCodesScreen
- **File Path:** `native\screens\BackupCodesScreen.tsx`
- **Components Used:** View, TouchableOpacity, Ionicons, Text, FlatList (5 components total)
- **Local State Count:** 0
- **Database/API Calls:** None

### BadgesScreen
- **File Path:** `native\screens\BadgesScreen.tsx`
- **Components Used:** View, TouchableOpacity, Ionicons, Text, FlatList (5 components total)
- **Local State Count:** 0
- **Database/API Calls:** None

### BioEditorScreen
- **File Path:** `native\screens\BioEditorScreen.tsx`
- **Components Used:** SafeAreaView, View, ActivityIndicator, Text, KeyboardAvoidingView, TouchableOpacity, Ionicons, InlineLoadingSkeleton, TextInput (9 components total)
- **Local State Count:** 5
- **Database/API Calls:** None

### BlockConfirmScreen
- **File Path:** `native\screens\BlockConfirmScreen.tsx`
- **Components Used:** View, Ionicons, Text, TouchableOpacity (4 components total)
- **Local State Count:** 0
- **Database/API Calls:** None

### BlockedUsersScreen
- **File Path:** `native\screens\BlockedUsersScreen.tsx`
- **Components Used:** User, View, TouchableOpacity, Avatar, Text, InlineLoadingSkeleton, SafeAreaView, Ionicons, ScreenSkeleton, FlatList, RefreshControl (11 components total)
- **Local State Count:** 5
- **Database/API Calls:** None

### BlockedUsersScreen_Full
- **File Path:** `native\screens\BlockedUsersScreen_Full.tsx`
- **Components Used:** View, Avatar, Text, TouchableOpacity, SafeAreaView, ActivityIndicator, Ionicons, FlatList (8 components total)
- **Local State Count:** 3
- **Database/API Calls:** None

### BookmarksScreen
- **File Path:** `native\screens\BookmarksScreen.tsx`
- **Components Used:** View, TouchableOpacity, Ionicons, Text, ScreenSkeleton, FlatList, Image (7 components total)
- **Local State Count:** 5
- **Database/API Calls:** None

### CacheManagementScreen
- **File Path:** `native\screens\CacheManagementScreen.tsx`
- **Components Used:** CacheBucket, SafeAreaView, View, TouchableOpacity, Ionicons, Text, ScrollView (7 components total)
- **Local State Count:** 2
- **Database/API Calls:** None

### CaptionEditorScreen
- **File Path:** `native\screens\CaptionEditorScreen.tsx`
- **Components Used:** View, TouchableOpacity, Ionicons, Text, TextInput (5 components total)
- **Local State Count:** 2
- **Database/API Calls:** None

### CaptionsSettingsScreen
- **File Path:** `native\screens\CaptionsSettingsScreen.tsx`
- **Components Used:** None (0 components total)
- **Local State Count:** 0
- **Database/API Calls:** None

### ChangePasswordScreen
- **File Path:** `native\screens\ChangePasswordScreen.tsx`
- **Components Used:** SafeAreaView, View, TouchableOpacity, Ionicons, Text, TextInput, InlineLoadingSkeleton (7 components total)
- **Local State Count:** 5
- **Database/API Calls:** None

### ChangePasswordScreen_Full
- **File Path:** `native\screens\ChangePasswordScreen_Full.tsx`
- **Components Used:** SafeAreaView, View, TouchableOpacity, Ionicons, Text, TextInput, InlineLoadingSkeleton (7 components total)
- **Local State Count:** 8
- **Database/API Calls:** None

### chatScreen.styles
- **File Path:** `native\screens\chat\chatScreen.styles.ts`
- **Components Used:** None (0 components total)
- **Local State Count:** 0
- **Database/API Calls:** None

### chatScreen.types
- **File Path:** `native\screens\chat\chatScreen.types.ts`
- **Components Used:** None (0 components total)
- **Local State Count:** 0
- **Database/API Calls:** None

### chatScreen.utils
- **File Path:** `native\screens\chat\chatScreen.utils.ts`
- **Components Used:** None (0 components total)
- **Local State Count:** 0
- **Database/API Calls:** None

### ChatDetailsScreen
- **File Path:** `native\screens\ChatDetailsScreen.tsx`
- **Components Used:** ChatDetailsRoute, ScrollView, Text, TouchableOpacity, View, Ionicons (6 components total)
- **Local State Count:** 0
- **Database/API Calls:** None

### ChatMessageSearchScreen
- **File Path:** `native\screens\ChatMessageSearchScreen.tsx`
- **Components Used:** ChatMessageSearchRouteProp, ResultRow, DocumentSnapshot, SafeAreaView, View, TouchableOpacity, Ionicons, Text, TextInput, InlineLoadingSkeleton, FlatList (11 components total)
- **Local State Count:** 8
- **Database/API Calls:** firestore_once

### ChatPrivacySafetyScreen
- **File Path:** `native\screens\ChatPrivacySafetyScreen.tsx`
- **Components Used:** ChatPrivacySafetyRouteProp, SafeAreaView, View, TouchableOpacity, Ionicons, Text, ScrollView (7 components total)
- **Local State Count:** 2
- **Database/API Calls:** None

### ChatProfileScreen
- **File Path:** `native\screens\ChatProfileScreen.tsx`
- **Components Used:** ChatProfileRoute, User, ShareTab, FlatList, View, Image, Text, TouchableOpacity, Ionicons, ScrollView, Modal, TextInput (12 components total)
- **Local State Count:** 17
- **Database/API Calls:** firestore_realtime

### ChatScreen
- **File Path:** `native\screens\ChatScreen.tsx`
- **Components Used:** ChatScreenRouteProp, User, FlatList, NodeJS, View, Image, Text, Ionicons, ActivityIndicator, KeyboardAvoidingView, TouchableOpacity, TextInput, InlineLoadingSkeleton (13 components total)
- **Local State Count:** 11
- **Database/API Calls:** firestore_realtime

### ChatScreenEnhanced
- **File Path:** `native\screens\ChatScreenEnhanced.tsx`
- **Components Used:** ChatScreenRouteProp, User, Partial, PrivacySettings, ChatMessage, Set, Record, PinnedState, PickerTab, NodeJS, FlatList, Map, View, Text, MessageBubble, NonNullable, FlatListProps, ScreenSkeleton, KeyboardAvoidingView, LinearGradient, BlurView, TouchableOpacity, Ionicons, Avatar, VerifiedBadge, PinnedBanner, MessageList, ActivityIndicator, MoreReactionsPicker, GalleryComposerSheet, LocationShareSheet, PollComposer, ShareSheet, Modal, MessageActionsSheet, StickerGifPicker, MessageForwardModal, MentionAutocomplete, Composer (39 components total)
- **Local State Count:** 45
- **Database/API Calls:** firestore_realtime, firestore_once

### ChatScreenEnhanced1
- **File Path:** `native\screens\ChatScreenEnhanced1.tsx`
- **Components Used:** ChatScreenRouteProp, User, Record, Set, PinnedState, PickerTab, NodeJS, MessageBubble, View, ActivityIndicator, KeyboardAvoidingView, TouchableOpacity, Ionicons, Image, Text, PinnedBanner, MessageList, QuickReactionPicker, MoreReactionsPicker, MessageActionsSheet, Modal, StickerGifPicker, Composer (23 components total)
- **Local State Count:** 23
- **Database/API Calls:** firestore_realtime

### ChatScreen_Full
- **File Path:** `native\screens\ChatScreen_Full.tsx`
- **Components Used:** Message, FlatList, View, Avatar, Image, Text, Ionicons, SafeAreaView, ActivityIndicator, TouchableOpacity, VerifiedBadge, KeyboardAvoidingView, TextInput, InlineLoadingSkeleton, ChatProfileDrawer (15 components total)
- **Local State Count:** 10
- **Database/API Calls:** firestore_realtime

### CloseFriendsScreen
- **File Path:** `native\screens\CloseFriendsScreen.tsx`
- **Components Used:** User, View, TouchableOpacity, Avatar, Text, SafeAreaView, Ionicons, ScreenSkeleton, FlatList, TextInput (10 components total)
- **Local State Count:** 6
- **Database/API Calls:** None

### CloseFriendsScreen_Full
- **File Path:** `native\screens\CloseFriendsScreen_Full.tsx`
- **Components Used:** View, TouchableOpacity, Avatar, Text, Ionicons, SafeAreaView, ActivityIndicator, FlatList (8 components total)
- **Local State Count:** 4
- **Database/API Calls:** None

### CollectionDetailScreen
- **File Path:** `native\screens\CollectionDetailScreen.tsx`
- **Components Used:** TouchableOpacity, Image, View, Ionicons, SafeAreaView, Text, ScreenSkeleton, FlatList (8 components total)
- **Local State Count:** 4
- **Database/API Calls:** None

### CollectionsScreen
- **File Path:** `native\screens\CollectionsScreen.tsx`
- **Components Used:** TouchableOpacity, Image, View, Text, Ionicons, SafeAreaView, ScreenSkeleton, FlatList, RefreshControl, Modal, TextInput, InlineLoadingSkeleton (12 components total)
- **Local State Count:** 7
- **Database/API Calls:** None

### CollectionsScreen_Full
- **File Path:** `native\screens\CollectionsScreen_Full.tsx`
- **Components Used:** Collection, TouchableOpacity, View, Image, Ionicons, Text, SafeAreaView, ActivityIndicator, FlatList (9 components total)
- **Local State Count:** 3
- **Database/API Calls:** None

### CommentPrivacyScreen
- **File Path:** `native\screens\CommentPrivacyScreen.tsx`
- **Components Used:** None (0 components total)
- **Local State Count:** 0
- **Database/API Calls:** None

### CommentsScreen
- **File Path:** `native\screens\CommentsScreen.tsx`
- **Components Used:** CommentsScreenRouteProp, Set, FlatList, View, TouchableOpacity, Avatar, Text, Ionicons, ScreenSkeleton, KeyboardAvoidingView, TextInput, InlineLoadingSkeleton (12 components total)
- **Local State Count:** 8
- **Database/API Calls:** firestore_once

### CommentsScreenNew
- **File Path:** `native\screens\CommentsScreenNew.tsx`
- **Components Used:** Comment, View, Image, Text, VerifiedBadge, TouchableOpacity, Ionicons, SafeAreaView, Header, KeyboardAvoidingView, FlatList, TextInput (12 components total)
- **Local State Count:** 5
- **Database/API Calls:** None

### CommentsScreen_Full
- **File Path:** `native\screens\CommentsScreen_Full.tsx`
- **Components Used:** Comment, FlatList, View, TouchableOpacity, Avatar, Text, Ionicons, SafeAreaView, ActivityIndicator, KeyboardAvoidingView, TextInput, InlineLoadingSkeleton (12 components total)
- **Local State Count:** 6
- **Database/API Calls:** firestore_realtime, firestore_once

### CommentThreadScreen
- **File Path:** `native\screens\CommentThreadScreen.tsx`
- **Components Used:** View, StatusBar, CommentThreadList (3 components total)
- **Local State Count:** 0
- **Database/API Calls:** None

### ContactSupportScreen
- **File Path:** `native\screens\ContactSupportScreen.tsx`
- **Components Used:** SafeAreaView, View, TouchableOpacity, Ionicons, Text, ScrollView, TextInput, ButtonLoadingSkeleton (8 components total)
- **Local State Count:** 4
- **Database/API Calls:** None

### CreatePostScreen
- **File Path:** `native\screens\CreatePostScreen.tsx`
- **Components Used:** SafeAreaView, View, TouchableOpacity, Text, ScrollView, Avatar, TextInput, Image, Ionicons (9 components total)
- **Local State Count:** 5
- **Database/API Calls:** None

### CreateTabHandler
- **File Path:** `native\screens\CreateTabHandler.tsx`
- **Components Used:** View, CreateMenu (2 components total)
- **Local State Count:** 2
- **Database/API Calls:** None

### CropScreen
- **File Path:** `native\screens\CropScreen.tsx`
- **Components Used:** View, TouchableOpacity, Ionicons, Text, Image (5 components total)
- **Local State Count:** 2
- **Database/API Calls:** None

### DataUsageScreen
- **File Path:** `native\screens\DataUsageScreen.tsx`
- **Components Used:** None (0 components total)
- **Local State Count:** 0
- **Database/API Calls:** None

### DataUsageScreen_Full
- **File Path:** `native\screens\DataUsageScreen_Full.tsx`
- **Components Used:** View, Ionicons, Text, Switch, SafeAreaView, TouchableOpacity, ScrollView (7 components total)
- **Local State Count:** 6
- **Database/API Calls:** None

### DateTimeFormatScreen
- **File Path:** `native\screens\DateTimeFormatScreen.tsx`
- **Components Used:** TouchableOpacity, View, Text, Ionicons, SafeAreaView, ScrollView (6 components total)
- **Local State Count:** 2
- **Database/API Calls:** None

### DeactivateAccountScreen
- **File Path:** `native\screens\DeactivateAccountScreen.tsx`
- **Components Used:** SafeAreaView, View, TouchableOpacity, Ionicons, Text, ScrollView, ButtonLoadingSkeleton (7 components total)
- **Local State Count:** 2
- **Database/API Calls:** None

### DeleteAccountScreen
- **File Path:** `native\screens\DeleteAccountScreen.tsx`
- **Components Used:** SafeAreaView, View, TouchableOpacity, Ionicons, Text, ScrollView, TextInput, ButtonLoadingSkeleton (8 components total)
- **Local State Count:** 3
- **Database/API Calls:** None

### DevicesScreen
- **File Path:** `native\screens\DevicesScreen.tsx`
- **Components Used:** Device, View, Ionicons, Text, TouchableOpacity, SafeAreaView, ScreenSkeleton, FlatList (8 components total)
- **Local State Count:** 3
- **Database/API Calls:** None

### DevMenuScreen
- **File Path:** `native\screens\DevMenuScreen.tsx`
- **Components Used:** SafeAreaView, View, TouchableOpacity, Ionicons, Text, ScrollView (6 components total)
- **Local State Count:** 0
- **Database/API Calls:** None

### DiscoverScreen
- **File Path:** `native\screens\DiscoverScreen.tsx`
- **Components Used:** DiscoverContent, TouchableOpacity, Image, Text, View, Ionicons, SafeAreaView, TextInput, ActivityIndicator, ScrollView, RefreshControl, FlatList (12 components total)
- **Local State Count:** 7
- **Database/API Calls:** None

### DiscoveryScreen
- **File Path:** `native\screens\DiscoveryScreen.tsx`
- **Components Used:** DiscoveryTab, DiscoveryItem, TouchableOpacity, Image, View, Ionicons, Text, Avatar, SafeAreaView, ScreenSkeleton, FlatList, RefreshControl (12 components total)
- **Local State Count:** 6
- **Database/API Calls:** None

### DiscoveryScreenEnhanced
- **File Path:** `native\screens\DiscoveryScreenEnhanced.tsx`
- **Components Used:** TouchableOpacity, Image, View, Ionicons, Text, SafeAreaView, ActivityIndicator, FlatList, RefreshControl (9 components total)
- **Local State Count:** 4
- **Database/API Calls:** None

### DiscoveryScreen_Full
- **File Path:** `native\screens\DiscoveryScreen_Full.tsx`
- **Components Used:** ExplorePost, TouchableOpacity, Image, View, Ionicons, Text, SafeAreaView, ActivityIndicator, FlatList, RefreshControl (10 components total)
- **Local State Count:** 6
- **Database/API Calls:** None

### DownloadDataScreen
- **File Path:** `native\screens\DownloadDataScreen.tsx`
- **Components Used:** ComingSoonScreen (1 components total)
- **Local State Count:** 0
- **Database/API Calls:** None

### DraftsScreen
- **File Path:** `native\screens\DraftsScreen.tsx`
- **Components Used:** View, TouchableOpacity, Ionicons, Text, FlatList, Image (6 components total)
- **Local State Count:** 4
- **Database/API Calls:** None

### DraftsScreen_Full
- **File Path:** `native\screens\DraftsScreen_Full.tsx`
- **Components Used:** Draft, TouchableOpacity, Image, View, Ionicons, SafeAreaView, ActivityIndicator, Text, FlatList (9 components total)
- **Local State Count:** 3
- **Database/API Calls:** None

### EditorTestScreen
- **File Path:** `native\screens\EditorTestScreen.tsx`
- **Components Used:** View, Text, TouchableOpacity, Image, NativeStoryEditor (5 components total)
- **Local State Count:** 3
- **Database/API Calls:** None

### EditProfileScreen
- **File Path:** `native\screens\EditProfileScreen.tsx`
- **Components Used:** View, ActivityIndicator, SafeAreaView, KeyboardAvoidingView, TouchableOpacity, Ionicons, Text, InlineLoadingSkeleton, ScrollView, LinearGradient, TextInput (11 components total)
- **Local State Count:** 4
- **Database/API Calls:** None

### EditProfileScreen_Full
- **File Path:** `native\screens\EditProfileScreen_Full.tsx`
- **Components Used:** SafeAreaView, KeyboardAvoidingView, View, TouchableOpacity, Ionicons, Text, InlineLoadingSkeleton, ScrollView, ActivityIndicator, Avatar, TextInput (11 components total)
- **Local State Count:** 9
- **Database/API Calls:** None

### EmailPhoneScreen
- **File Path:** `native\screens\EmailPhoneScreen.tsx`
- **Components Used:** SafeAreaView, View, TouchableOpacity, Ionicons, Text, ScrollView, TextInput, ButtonLoadingSkeleton (8 components total)
- **Local State Count:** 9
- **Database/API Calls:** None

### EmailPhoneSettingsScreen
- **File Path:** `native\screens\EmailPhoneSettingsScreen.tsx`
- **Components Used:** SafeAreaView, View, TouchableOpacity, Ionicons, Text, ScrollView, TextInput, InlineLoadingSkeleton (8 components total)
- **Local State Count:** 8
- **Database/API Calls:** None

### EventsScreen
- **File Path:** `native\screens\EventsScreen.tsx`
- **Components Used:** Event, TouchableOpacity, Image, View, Text, Ionicons, VerifiedBadge, SafeAreaView, ActivityIndicator, FlatList, RefreshControl (11 components total)
- **Local State Count:** 5
- **Database/API Calls:** None

### ExploreScreen
- **File Path:** `native\screens\ExploreScreen.tsx`
- **Components Used:** View, Ionicons, TextInput, FlatList, TouchableOpacity, Text, ScreenSkeleton, Image, VerifiedBadge (9 components total)
- **Local State Count:** 7
- **Database/API Calls:** None

### FAQScreen
- **File Path:** `native\screens\FAQScreen.tsx`
- **Components Used:** View, TouchableOpacity, Ionicons, Text, ScrollView (5 components total)
- **Local State Count:** 2
- **Database/API Calls:** None

### FiltersScreen
- **File Path:** `native\screens\FiltersScreen.tsx`
- **Components Used:** View, TouchableOpacity, Ionicons, Text, Image, ScrollView (6 components total)
- **Local State Count:** 2
- **Database/API Calls:** None

### FollowersListScreen
- **File Path:** `native\screens\FollowersListScreen.tsx`
- **Components Used:** User, Set, SuggestedUser, View, TouchableOpacity, Avatar, Text, VerifiedBadge, InlineLoadingSkeleton, Ionicons, TextInput, FlatList, SafeAreaView, ScreenSkeleton, RefreshControl (15 components total)
- **Local State Count:** 12
- **Database/API Calls:** None

### FollowersListScreen_Full
- **File Path:** `native\screens\FollowersListScreen_Full.tsx`
- **Components Used:** FollowerUser, Set, TouchableOpacity, Avatar, View, Text, VerifiedBadge, Ionicons, SafeAreaView, ActivityIndicator, TextInput, FlatList (12 components total)
- **Local State Count:** 6
- **Database/API Calls:** None

### FollowingScreen
- **File Path:** `native\screens\FollowingScreen.tsx`
- **Components Used:** User, Set, SuggestedUser, View, TouchableOpacity, Avatar, Text, VerifiedBadge, InlineLoadingSkeleton, Ionicons, TextInput, FlatList, SafeAreaView, ScreenSkeleton, RefreshControl (15 components total)
- **Local State Count:** 12
- **Database/API Calls:** None

### FollowingScreen_Full
- **File Path:** `native\screens\FollowingScreen_Full.tsx`
- **Components Used:** FollowingUser, TouchableOpacity, Avatar, View, Text, VerifiedBadge, Ionicons, SafeAreaView, ActivityIndicator, TextInput, FlatList (11 components total)
- **Local State Count:** 5
- **Database/API Calls:** None

### FollowRequestsScreen
- **File Path:** `native\screens\FollowRequestsScreen.tsx`
- **Components Used:** View, TouchableOpacity, Ionicons, Text, ScreenSkeleton, FlatList, Image, ButtonLoadingSkeleton (8 components total)
- **Local State Count:** 4
- **Database/API Calls:** None

### FollowSuggestionsScreenEnhanced
- **File Path:** `native\screens\FollowSuggestionsScreenEnhanced.tsx`
- **Components Used:** SuggestedUser, Set, View, SuggestionCard, InlineLoadingSkeleton, Text, Ionicons, TouchableOpacity, SafeAreaView, ActivityIndicator, FlatList, RefreshControl (12 components total)
- **Local State Count:** 8
- **Database/API Calls:** None

### FontSizeScreen
- **File Path:** `native\screens\FontSizeScreen.tsx`
- **Components Used:** FontSizeValue, SafeAreaView, View, TouchableOpacity, Ionicons, Text, InlineLoadingSkeleton (7 components total)
- **Local State Count:** 3
- **Database/API Calls:** None

### FontSizeScreenEnhanced
- **File Path:** `native\screens\FontSizeScreenEnhanced.tsx`
- **Components Used:** FontSize, TouchableOpacity, View, Text, Ionicons, SafeAreaView, ScrollView (7 components total)
- **Local State Count:** 2
- **Database/API Calls:** None

### ForgotPasswordScreen
- **File Path:** `native\screens\ForgotPasswordScreen.tsx`
- **Components Used:** KeyboardAvoidingView, ScrollView, TouchableOpacity, Ionicons, View, Text, TextInput, InlineLoadingSkeleton (8 components total)
- **Local State Count:** 4
- **Database/API Calls:** None

### ForwardMessageScreen
- **File Path:** `native\screens\ForwardMessageScreen.tsx`
- **Components Used:** Contact, Set, TouchableOpacity, View, Avatar, Text, VerifiedBadge, Ionicons, SafeAreaView, TextInput, FlatList (11 components total)
- **Local State Count:** 5
- **Database/API Calls:** None

### GameScreen
- **File Path:** `native\screens\GameScreen.tsx`
- **Components Used:** Game, UserGameStats, TouchableOpacity, Ionicons, Text, View, Image, SafeAreaView, ActivityIndicator, FlatList, RefreshControl (11 components total)
- **Local State Count:** 6
- **Database/API Calls:** None

### GlimpseAnalyticsScreen
- **File Path:** `native\screens\GlimpseAnalyticsScreen.tsx`
- **Components Used:** GlimpseAnalytics, View, Ionicons, Text, SafeAreaView, TouchableOpacity, ActivityIndicator, ScrollView, StatCard, ProgressBar (10 components total)
- **Local State Count:** 4
- **Database/API Calls:** None

### GlimpseCreateScreen
- **File Path:** `native\screens\GlimpseCreateScreen.tsx`
- **Components Used:** TextInput, SelectedMedia, PickedSong, SelectedCover, View, Avatar, Text, TouchableOpacity, Ionicons, Modal, ActivityIndicator, ScrollView, Video, Image, LinearGradient, SafeAreaView, KeyboardAvoidingView, MentionAutocomplete, HashtagAutocomplete, Switch, MusicPicker, NativeGlimpseEditor (22 components total)
- **Local State Count:** 34
- **Database/API Calls:** None

### GlimpseCreateScreen_Full
- **File Path:** `native\screens\GlimpseCreateScreen_Full.tsx`
- **Components Used:** SafeAreaView, Video, View, TouchableOpacity, Ionicons, InlineLoadingSkeleton, Text, TextInput (8 components total)
- **Local State Count:** 3
- **Database/API Calls:** None

### GlimpsesScreen
- **File Path:** `native\screens\GlimpsesScreen.tsx`
- **Components Used:** TouchableOpacity, View, Video, CachedImage, Ionicons, Text, SafeAreaView, ScreenSkeleton, FlatList, GlimpseTile, RefreshControl (11 components total)
- **Local State Count:** 7
- **Database/API Calls:** None

### GlimpseViewerScreen
- **File Path:** `native\screens\GlimpseViewerScreen.tsx`
- **Components Used:** GlimpseViewerScreenEnhanced (1 components total)
- **Local State Count:** 0
- **Database/API Calls:** None

### GlimpseViewerScreenEnhanced
- **File Path:** `native\screens\GlimpseViewerScreenEnhanced.tsx`
- **Components Used:** Glimpse, Record, Set, Map, Audio, View, Avatar, Text, TouchableOpacity, Ionicons, Animated, Video, Image, LinearGradient, ActivityIndicator, VerifiedBadge, StatusBar, PanGestureHandler, TapGestureHandler, Modal, TouchableWithoutFeedback, TextInput, KeyboardAvoidingView, FlatList, ButtonLoadingSkeleton (25 components total)
- **Local State Count:** 30
- **Database/API Calls:** firestore_once

### GlimpseViewerScreen_Full
- **File Path:** `native\screens\GlimpseViewerScreen_Full.tsx`
- **Components Used:** GlimpseViewerScreenEnhanced (1 components total)
- **Local State Count:** 0
- **Database/API Calls:** None

### GroupChatSettingsScreen
- **File Path:** `native\screens\GroupChatSettingsScreen.tsx`
- **Components Used:** GroupConversation, User, Set, SafeAreaView, View, ActivityIndicator, Text, TouchableOpacity, Ionicons, ScrollView, LinearGradient, Avatar, Switch, TextInput (14 components total)
- **Local State Count:** 8
- **Database/API Calls:** None

### GroupInfoScreen
- **File Path:** `native\screens\GroupInfoScreen.tsx`
- **Components Used:** GroupConversation, User, Set, Array, SafeAreaView, View, ActivityIndicator, Text, TouchableOpacity, Ionicons, ScrollView, LinearGradient, Avatar, Switch, VerifiedBadge, Modal, TextInput (17 components total)
- **Local State Count:** 28
- **Database/API Calls:** None

### GuidelinesScreen
- **File Path:** `native\screens\GuidelinesScreen.tsx`
- **Components Used:** View, Text (2 components total)
- **Local State Count:** 0
- **Database/API Calls:** None

### HashtagScreen
- **File Path:** `native\screens\HashtagScreen.tsx`
- **Components Used:** View, TouchableOpacity, Ionicons, Text, ScreenSkeleton, FlatList, Image (7 components total)
- **Local State Count:** 3
- **Database/API Calls:** None

### HashtagScreen_Full
- **File Path:** `native\screens\HashtagScreen_Full.tsx`
- **Components Used:** TouchableOpacity, Image, View, Ionicons, SafeAreaView, ActivityIndicator, Text, FlatList (8 components total)
- **Local State Count:** 5
- **Database/API Calls:** None

### HelpCenterScreen
- **File Path:** `native\screens\HelpCenterScreen.tsx`
- **Components Used:** None (0 components total)
- **Local State Count:** 0
- **Database/API Calls:** None

### HelpCenterScreen_Full
- **File Path:** `native\screens\HelpCenterScreen_Full.tsx`
- **Components Used:** SafeAreaView, View, TouchableOpacity, Ionicons, Text, ScrollView (6 components total)
- **Local State Count:** 0
- **Database/API Calls:** None

### HideStoryScreen
- **File Path:** `native\screens\HideStoryScreen.tsx`
- **Components Used:** View, TouchableOpacity, Ionicons, Text, InlineLoadingSkeleton, TextInput, ScreenSkeleton, FlatList, Avatar (9 components total)
- **Local State Count:** 8
- **Database/API Calls:** firestore_once

### HighlightsScreen
- **File Path:** `native\screens\HighlightsScreen.tsx`
- **Components Used:** TouchableOpacity, Image, View, Text, Ionicons, ScreenSkeleton, FlatList, RefreshControl (8 components total)
- **Local State Count:** 4
- **Database/API Calls:** None

### HighlightsScreen_Full
- **File Path:** `native\screens\HighlightsScreen_Full.tsx`
- **Components Used:** Highlight, TouchableOpacity, View, Image, Text, SafeAreaView, ActivityIndicator, Ionicons, FlatList (9 components total)
- **Local State Count:** 3
- **Database/API Calls:** None

### HomeScreenWorking
- **File Path:** `native\screens\HomeScreenWorking.tsx`
- **Components Used:** Post, Story, Record, Animated, FeedControlSettings, Set, Map, StoryRing, View, PostCard, Text, TouchableOpacity, Ionicons, StoryProcessingBar, FlatList, SafeAreaView, StatusBar, LoadingSkeleton, PostSkeleton, RefreshControl (20 components total)
- **Local State Count:** 18
- **Database/API Calls:** firestore_realtime

### ImageEditorScreen
- **File Path:** `native\screens\ImageEditorScreen.tsx`
- **Components Used:** View, Text, TouchableOpacity, Image, Ionicons, SafeAreaView, PinchGestureHandler, Animated, PanGestureHandler (9 components total)
- **Local State Count:** 5
- **Database/API Calls:** None

### InsightsScreen
- **File Path:** `native\screens\InsightsScreen.tsx`
- **Components Used:** View, TouchableOpacity, Ionicons, Text, ActivityIndicator, ScrollView, RefreshControl (7 components total)
- **Local State Count:** 4
- **Database/API Calls:** None

### InterestsScreen
- **File Path:** `native\screens\InterestsScreen.tsx`
- **Components Used:** View, TouchableOpacity, Ionicons, Text, ScrollView (5 components total)
- **Local State Count:** 2
- **Database/API Calls:** None

### LanguageSettingsScreen
- **File Path:** `native\screens\LanguageSettingsScreen.tsx`
- **Components Used:** ComingSoonScreen (1 components total)
- **Local State Count:** 0
- **Database/API Calls:** None

### LanguageSettingsScreen_Full
- **File Path:** `native\screens\LanguageSettingsScreen_Full.tsx`
- **Components Used:** TouchableOpacity, View, Text, Ionicons, SafeAreaView, FlatList (6 components total)
- **Local State Count:** 2
- **Database/API Calls:** None

### LayoutStyleScreen
- **File Path:** `native\screens\LayoutStyleScreen.tsx`
- **Components Used:** TouchableOpacity, View, Ionicons, Text, SafeAreaView, ScrollView (6 components total)
- **Local State Count:** 2
- **Database/API Calls:** None

### LeaderboardScreen
- **File Path:** `native\screens\LeaderboardScreen.tsx`
- **Components Used:** View, TouchableOpacity, Ionicons, Text, ActivityIndicator, FlatList, Image (7 components total)
- **Local State Count:** 3
- **Database/API Calls:** firestore_once

### LikedPostsScreen
- **File Path:** `native\screens\LikedPostsScreen.tsx`
- **Components Used:** TouchableOpacity, Image, View, Ionicons, Text, ScreenSkeleton, FlatList (7 components total)
- **Local State Count:** 3
- **Database/API Calls:** None

### LikesListScreen
- **File Path:** `native\screens\LikesListScreen.tsx`
- **Components Used:** View, TouchableOpacity, Ionicons, Text, ScreenSkeleton, FlatList, Image (7 components total)
- **Local State Count:** 3
- **Database/API Calls:** None

### LikesListScreenEnhanced
- **File Path:** `native\screens\LikesListScreenEnhanced.tsx`
- **Components Used:** LikeUser, Set, TouchableOpacity, View, Avatar, Text, VerifiedBadge, Ionicons, TextInput, SafeAreaView, ScreenSkeleton, FlatList, RefreshControl (13 components total)
- **Local State Count:** 9
- **Database/API Calls:** None

### LikesScreen_Full
- **File Path:** `native\screens\LikesScreen_Full.tsx`
- **Components Used:** Set, TouchableOpacity, Avatar, View, Text, VerifiedBadge, SafeAreaView, ActivityIndicator, Ionicons, FlatList (10 components total)
- **Local State Count:** 4
- **Database/API Calls:** None

### LiveStreamScreen
- **File Path:** `native\screens\LiveStreamScreen.tsx`
- **Components Used:** View, TouchableOpacity, Ionicons, Text (4 components total)
- **Local State Count:** 0
- **Database/API Calls:** None

### LiveStreamScreenEnhanced
- **File Path:** `native\screens\LiveStreamScreenEnhanced.tsx`
- **Components Used:** LiveStream, TouchableOpacity, View, Image, Text, Ionicons, Avatar, SafeAreaView, ActivityIndicator, FlatList (10 components total)
- **Local State Count:** 4
- **Database/API Calls:** None

### LiveStreamViewerScreen
- **File Path:** `native\screens\LiveStreamViewerScreen.tsx`
- **Components Used:** LiveStream, LiveComment, Video, FlatList, View, Avatar, Text, Ionicons, SafeAreaView, TouchableOpacity, VerifiedBadge, KeyboardAvoidingView, TextInput (13 components total)
- **Local State Count:** 7
- **Database/API Calls:** None

### LocationEditorScreen
- **File Path:** `native\screens\LocationEditorScreen.tsx`
- **Components Used:** View, TouchableOpacity, Ionicons, Text, TextInput (5 components total)
- **Local State Count:** 2
- **Database/API Calls:** None

### LocationScreen
- **File Path:** `native\screens\LocationScreen.tsx`
- **Components Used:** View, TouchableOpacity, Ionicons, Text, ScreenSkeleton, FlatList, Image (7 components total)
- **Local State Count:** 3
- **Database/API Calls:** None

### LocationScreen_Full
- **File Path:** `native\screens\LocationScreen_Full.tsx`
- **Components Used:** TouchableOpacity, Image, SafeAreaView, View, ActivityIndicator, Ionicons, Text, FlatList (8 components total)
- **Local State Count:** 3
- **Database/API Calls:** None

### LoginActivityScreen
- **File Path:** `native\screens\LoginActivityScreen.tsx`
- **Components Used:** ComingSoonScreen (1 components total)
- **Local State Count:** 0
- **Database/API Calls:** None

### LoginScreen
- **File Path:** `native\screens\LoginScreen.tsx`
- **Components Used:** KeyboardAvoidingView, ScrollView, View, TouchableOpacity, Ionicons, Image, Text, TextInput, InlineLoadingSkeleton (9 components total)
- **Local State Count:** 4
- **Database/API Calls:** None

### MediaPickerScreen
- **File Path:** `native\screens\MediaPickerScreen.tsx`
- **Components Used:** ImagePicker, View, TouchableOpacity, Ionicons, Text, InlineLoadingSkeleton, FlatList, Image (8 components total)
- **Local State Count:** 3
- **Database/API Calls:** None

### MentionSettingsScreen
- **File Path:** `native\screens\MentionSettingsScreen.tsx`
- **Components Used:** None (0 components total)
- **Local State Count:** 0
- **Database/API Calls:** None

### MentionsScreen
- **File Path:** `native\screens\MentionsScreen.tsx`
- **Components Used:** View, TouchableOpacity, Ionicons, Text, FlatList, Image (6 components total)
- **Local State Count:** 0
- **Database/API Calls:** None

### MentionsScreen_Full
- **File Path:** `native\screens\MentionsScreen_Full.tsx`
- **Components Used:** Mention, TouchableOpacity, Avatar, View, Text, VerifiedBadge, Image, SafeAreaView, ActivityIndicator, Ionicons, FlatList (11 components total)
- **Local State Count:** 3
- **Database/API Calls:** None

### MessagePrivacyScreen
- **File Path:** `native\screens\MessagePrivacyScreen.tsx`
- **Components Used:** None (0 components total)
- **Local State Count:** 0
- **Database/API Calls:** None

### MessagesScreen
- **File Path:** `native\screens\MessagesScreen.tsx`
- **Components Used:** TouchableOpacity, Avatar, View, Text, SafeAreaView, Ionicons, TextInput, ActivityIndicator, FlatList (9 components total)
- **Local State Count:** 4
- **Database/API Calls:** None

### MessagesScreenEnhanced
- **File Path:** `native\screens\MessagesScreenEnhanced.tsx`
- **Components Used:** Conversation, User, SearchScope, SearchResult, TabType, TouchableOpacity, View, Avatar, Text, VerifiedBadge, Ionicons, Pressable, SafeAreaView, Animated, LoadingSkeleton, TextInput, FlatList, InlineLoadingSkeleton, RefreshControl, ConversationActionsSheet (20 components total)
- **Local State Count:** 19
- **Database/API Calls:** firestore_realtime, firestore_once

### MessagesScreenEnhanced_Clean
- **File Path:** `native\screens\MessagesScreenEnhanced_Clean.tsx`
- **Components Used:** Conversation, User, TabType, TouchableOpacity, View, Avatar, Text, VerifiedBadge, Ionicons, SafeAreaView, ActivityIndicator, TextInput, FlatList, RefreshControl (14 components total)
- **Local State Count:** 10
- **Database/API Calls:** firestore_realtime, firestore_once

### MessagesScreenEnhanced_Fixed
- **File Path:** `native\screens\MessagesScreenEnhanced_Fixed.tsx`
- **Components Used:** Conversation, User, TabType, TouchableOpacity, View, Avatar, Text, VerifiedBadge, Ionicons, SafeAreaView, ActivityIndicator, TextInput, FlatList, RefreshControl (14 components total)
- **Local State Count:** 10
- **Database/API Calls:** firestore_realtime, firestore_once

### MessagesScreenNew
- **File Path:** `native\screens\MessagesScreenNew.tsx`
- **Components Used:** ChatItem, TouchableOpacity, View, Image, Text, VerifiedBadge, SafeAreaView, BackButton, Ionicons, LinearGradient, TextInput, FlatList (12 components total)
- **Local State Count:** 4
- **Database/API Calls:** None

### MessagesScreen_Full
- **File Path:** `native\screens\MessagesScreen_Full.tsx`
- **Components Used:** ConversationWithUser, TouchableOpacity, Avatar, View, Text, VerifiedBadge, Ionicons, SafeAreaView, ActivityIndicator, TextInput, FlatList (11 components total)
- **Local State Count:** 5
- **Database/API Calls:** firestore_realtime

### MusicSearchScreen
- **File Path:** `native\screens\MusicSearchScreen.tsx`
- **Components Used:** Track, TouchableOpacity, Image, View, Text, Ionicons, SafeAreaView, TextInput, ActivityIndicator, FlatList (10 components total)
- **Local State Count:** 5
- **Database/API Calls:** None

### MuteConfirmScreen
- **File Path:** `native\screens\MuteConfirmScreen.tsx`
- **Components Used:** View, Ionicons, Text, TouchableOpacity (4 components total)
- **Local State Count:** 0
- **Database/API Calls:** None

### MutedAccountsScreen
- **File Path:** `native\screens\MutedAccountsScreen.tsx`
- **Components Used:** User, View, TouchableOpacity, Avatar, Text, ButtonLoadingSkeleton, SafeAreaView, Ionicons, ScreenSkeleton, FlatList (10 components total)
- **Local State Count:** 4
- **Database/API Calls:** None

### MutedAccountsScreen_Full
- **File Path:** `native\screens\MutedAccountsScreen_Full.tsx`
- **Components Used:** View, Avatar, Text, TouchableOpacity, SafeAreaView, ActivityIndicator, Ionicons, FlatList (8 components total)
- **Local State Count:** 3
- **Database/API Calls:** None

### MutualFollowersScreen
- **File Path:** `native\screens\MutualFollowersScreen.tsx`
- **Components Used:** MutualFollower, Set, TouchableOpacity, View, Avatar, Text, VerifiedBadge, Ionicons, TextInput, SafeAreaView, ActivityIndicator, FlatList, RefreshControl (13 components total)
- **Local State Count:** 7
- **Database/API Calls:** None

### NameEditorScreen
- **File Path:** `native\screens\NameEditorScreen.tsx`
- **Components Used:** View, TouchableOpacity, Ionicons, Text, TextInput (5 components total)
- **Local State Count:** 2
- **Database/API Calls:** None

### NewChatScreen
- **File Path:** `native\screens\NewChatScreen.tsx`
- **Components Used:** User, TouchableOpacity, Image, View, Text, Ionicons, TextInput, ActivityIndicator, FlatList (9 components total)
- **Local State Count:** 8
- **Database/API Calls:** None

### NewGroupScreen
- **File Path:** `native\screens\NewGroupScreen.tsx`
- **Components Used:** User, Record, Set, TouchableOpacity, Avatar, View, Text, Ionicons, SafeAreaView, ButtonLoadingSkeleton, Image, TextInput, ScrollView, ActivityIndicator, FlatList (15 components total)
- **Local State Count:** 10
- **Database/API Calls:** None

### NewMessageScreen
- **File Path:** `native\screens\NewMessageScreen.tsx`
- **Components Used:** User, TouchableOpacity, Avatar, View, Text, VerifiedBadge, ActivityIndicator, Ionicons, SafeAreaView, TextInput, FlatList, ScreenSkeleton (12 components total)
- **Local State Count:** 8
- **Database/API Calls:** firestore_once

### NewPostScreen
- **File Path:** `native\screens\NewPostScreen.tsx`
- **Components Used:** SafeAreaView, View, TouchableOpacity, Ionicons, Text, InlineLoadingSkeleton, ScrollView, Image, TextInput (9 components total)
- **Local State Count:** 6
- **Database/API Calls:** None

### NewPostScreenEnhanced
- **File Path:** `native\screens\NewPostScreenEnhanced.tsx`
- **Components Used:** PickedSong, TextInput, SafeAreaView, KeyboardAvoidingView, View, TouchableOpacity, Ionicons, Text, InlineLoadingSkeleton, ScrollView, Avatar, Image, MentionAutocomplete, HashtagAutocomplete, Switch, PostMediaPreviewModal, NativePostImageEditor, MusicPicker (18 components total)
- **Local State Count:** 31
- **Database/API Calls:** None

### NewPostScreen_Full
- **File Path:** `native\screens\NewPostScreen_Full.tsx`
- **Components Used:** SafeAreaView, KeyboardAvoidingView, View, TouchableOpacity, Ionicons, Text, InlineLoadingSkeleton, ScrollView, Avatar, Image, TextInput (11 components total)
- **Local State Count:** 6
- **Database/API Calls:** None

### NotificationsEnhanced
- **File Path:** `native\screens\NotificationsEnhanced.tsx`
- **Components Used:** NotificationItem, TabType, Set, TouchableOpacity, View, Avatar, Ionicons, Text, VerifiedBadge, Image, SafeAreaView, ActivityIndicator, FlatList, RefreshControl (14 components total)
- **Local State Count:** 7
- **Database/API Calls:** None

### NotificationSettingsScreen
- **File Path:** `native\screens\NotificationSettingsScreen.tsx`
- **Components Used:** Record, View, Ionicons, Text, Switch, SafeAreaView, TouchableOpacity, InlineLoadingSkeleton, Animated, Toggle (10 components total)
- **Local State Count:** 4
- **Database/API Calls:** None

### NotificationSettingsScreen_Full
- **File Path:** `native\screens\NotificationSettingsScreen_Full.tsx`
- **Components Used:** View, Ionicons, Text, Switch, SafeAreaView, TouchableOpacity, ScrollView (7 components total)
- **Local State Count:** 8
- **Database/API Calls:** None

### NotificationsScreen
- **File Path:** `native\screens\NotificationsScreen.tsx`
- **Components Used:** TouchableOpacity, View, Avatar, Ionicons, Text, Image, ActivityIndicator, FlatList, RefreshControl (9 components total)
- **Local State Count:** 4
- **Database/API Calls:** None

### NotificationsScreenEnhanced
- **File Path:** `native\screens\NotificationsScreenEnhanced.tsx`
- **Components Used:** AppNotification, Set, FilterTab, FeedItem, TouchableOpacity, Text, Image, View, Avatar, Ionicons, Swipeable, SafeAreaView, LoadingSkeleton, Animated, FlatList, RefreshControl (16 components total)
- **Local State Count:** 8
- **Database/API Calls:** firestore_realtime, firestore_once

### NotificationsScreenNew
- **File Path:** `native\screens\NotificationsScreenNew.tsx`
- **Components Used:** NotificationItem, TouchableOpacity, Image, View, Text, SafeAreaView, BackButton, Ionicons, FlatList (9 components total)
- **Local State Count:** 3
- **Database/API Calls:** None

### NotificationsScreen_Full
- **File Path:** `native\screens\NotificationsScreen_Full.tsx`
- **Components Used:** Notification, Ionicons, TouchableOpacity, View, Avatar, Text, Image, SafeAreaView, ActivityIndicator, FlatList, RefreshControl (11 components total)
- **Local State Count:** 5
- **Database/API Calls:** firestore_realtime

### OnboardingScreen
- **File Path:** `native\screens\OnboardingScreen.tsx`
- **Components Used:** View, TouchableOpacity, Text, LinearGradient, Ionicons (5 components total)
- **Local State Count:** 2
- **Database/API Calls:** None

### PaymentMethodsScreen
- **File Path:** `native\screens\PaymentMethodsScreen.tsx`
- **Components Used:** PaymentMethod, View, Ionicons, Text, TouchableOpacity, SafeAreaView, ScrollView, FlatList (8 components total)
- **Local State Count:** 3
- **Database/API Calls:** None

### PhotoTaggingScreen
- **File Path:** `native\screens\PhotoTaggingScreen.tsx`
- **Components Used:** View, StatusBar, PhotoTagging (3 components total)
- **Local State Count:** 0
- **Database/API Calls:** None

### PollCreateScreen
- **File Path:** `native\screens\PollCreateScreen.tsx`
- **Components Used:** View, TouchableOpacity, Ionicons, Text, ScrollView, TextInput (6 components total)
- **Local State Count:** 4
- **Database/API Calls:** None

### PostCreationScreenEnhanced
- **File Path:** `native\screens\PostCreationScreenEnhanced.tsx`
- **Components Used:** TextInput, TouchableOpacity, Text, Image, View, VerifiedBadge, SafeAreaView, Ionicons, InlineLoadingSkeleton, ScrollView, FlatList, Modal (12 components total)
- **Local State Count:** 22
- **Database/API Calls:** None

### PostInsightsScreen
- **File Path:** `native\screens\PostInsightsScreen.tsx`
- **Components Used:** Post, PostInsights, View, TouchableOpacity, Text, SafeAreaView, Ionicons, ActivityIndicator, ScrollView, RefreshControl, Image (11 components total)
- **Local State Count:** 6
- **Database/API Calls:** None

### PostViewerScreen
- **File Path:** `native\screens\PostViewerScreen.tsx`
- **Components Used:** FlatList, Record, Set, View, PostCard, SafeAreaView, TouchableOpacity, ArrowLeft, Text, ActivityIndicator, Modal, Pressable, Bookmark, HeartOff, Send, MessageCircle, Pencil, Pin, Trash2, Flag, UserMinus, TextInput (22 components total)
- **Local State Count:** 12
- **Database/API Calls:** None

### PostViewScreen
- **File Path:** `native\screens\PostViewScreen.tsx`
- **Components Used:** SafeAreaView, ActivityIndicator, Ionicons, Text, TouchableOpacity, View, ScrollView, RefreshControl, Avatar, VerifiedBadge, Image (11 components total)
- **Local State Count:** 7
- **Database/API Calls:** None

### PostViewScreen_Full
- **File Path:** `native\screens\PostViewScreen_Full.tsx`
- **Components Used:** SafeAreaView, View, ActivityIndicator, Text, TouchableOpacity, Ionicons, ScrollView, Avatar, VerifiedBadge, Image (10 components total)
- **Local State Count:** 6
- **Database/API Calls:** None

### PrivacyPolicyScreen
- **File Path:** `native\screens\PrivacyPolicyScreen.tsx`
- **Components Used:** View, Text (2 components total)
- **Local State Count:** 0
- **Database/API Calls:** None

### PrivacySettingsScreen
- **File Path:** `native\screens\PrivacySettingsScreen.tsx`
- **Components Used:** Record, View, Ionicons, Text, Switch, TouchableOpacity, SafeAreaView, Animated, ToggleRow, NavRow (10 components total)
- **Local State Count:** 3
- **Database/API Calls:** None

### PrivacySettingsScreen_Full
- **File Path:** `native\screens\PrivacySettingsScreen_Full.tsx`
- **Components Used:** View, Ionicons, Text, Switch, SafeAreaView, TouchableOpacity, ScrollView (7 components total)
- **Local State Count:** 7
- **Database/API Calls:** None

### ProfileScreen
- **File Path:** `native\screens\ProfileScreen.tsx`
- **Components Used:** TouchableOpacity, Video, Image, View, MaterialCommunityIcons, Ionicons, ActivityIndicator, Text, SafeAreaView, ScrollView, RefreshControl, ProfileCoverImage, Animated, Avatar, VerifiedBadge, InlineLoadingSkeleton, ProfileHighlightRing, SuggestionCarousel, FlatList (19 components total)
- **Local State Count:** 22
- **Database/API Calls:** None

### ProfileScreenEnhanced
- **File Path:** `native\screens\ProfileScreenEnhanced.tsx`
- **Components Used:** Record, TouchableOpacity, Video, Image, View, MaterialCommunityIcons, Ionicons, Text, SafeAreaView, LoadingSkeleton, GridSkeleton, ScrollView, RefreshControl, OtherUserProfileHeader, OwnProfileHeader, LinearGradient, Avatar, VerifiedBadge, ButtonLoadingSkeleton, Animated, ActivityIndicator, ProfileHighlightRing, FlatList, Modal, BlurView (25 components total)
- **Local State Count:** 26
- **Database/API Calls:** firestore_realtime

### ProfileScreenNew
- **File Path:** `native\screens\ProfileScreenNew.tsx`
- **Components Used:** TouchableOpacity, Image, View, Ionicons, SafeAreaView, ActivityIndicator, Text, ScrollView, VerifiedBadge, FlatList (10 components total)
- **Local State Count:** 7
- **Database/API Calls:** None

### QRCodeScreen
- **File Path:** `native\screens\QRCodeScreen.tsx`
- **Components Used:** View, TouchableOpacity, Ionicons, Text (4 components total)
- **Local State Count:** 0
- **Database/API Calls:** None

### QRCodeScreen_Full
- **File Path:** `native\screens\QRCodeScreen_Full.tsx`
- **Components Used:** SafeAreaView, View, TouchableOpacity, Ionicons, Text, Avatar, QRCode (7 components total)
- **Local State Count:** 0
- **Database/API Calls:** None

### RecentSearchesScreen
- **File Path:** `native\screens\RecentSearchesScreen.tsx`
- **Components Used:** View, TouchableOpacity, Ionicons, Text, FlatList (5 components total)
- **Local State Count:** 0
- **Database/API Calls:** None

### ReelsScreen
- **File Path:** `native\screens\ReelsScreen.tsx`
- **Components Used:** Reel, Set, FlatList, Record, View, Video, TouchableOpacity, Avatar, Text, VerifiedBadge, Ionicons, SafeAreaView, ActivityIndicator (13 components total)
- **Local State Count:** 5
- **Database/API Calls:** None

### ReportContentScreen
- **File Path:** `native\screens\ReportContentScreen.tsx`
- **Components Used:** View, TouchableOpacity, Ionicons, Text, ScrollView (5 components total)
- **Local State Count:** 2
- **Database/API Calls:** None

### ReportProblemScreen
- **File Path:** `native\screens\ReportProblemScreen.tsx`
- **Components Used:** ReportAttachment, SafeAreaView, View, TouchableOpacity, Ionicons, Text, ScrollView, Image, TextInput, ButtonLoadingSkeleton (10 components total)
- **Local State Count:** 6
- **Database/API Calls:** None

### ReportScreen
- **File Path:** `native\screens\ReportScreen.tsx`
- **Components Used:** SafeAreaView, View, TouchableOpacity, Ionicons, Text, ScrollView, TextInput (7 components total)
- **Local State Count:** 4
- **Database/API Calls:** None

### RequestVerificationScreen
- **File Path:** `native\screens\RequestVerificationScreen.tsx`
- **Components Used:** View, TouchableOpacity, Ionicons, Text, ScrollView, TextInput (6 components total)
- **Local State Count:** 3
- **Database/API Calls:** None

### RestrictedAccountsScreen
- **File Path:** `native\screens\RestrictedAccountsScreen.tsx`
- **Components Used:** View, TouchableOpacity, Ionicons, Text, ScreenSkeleton, FlatList, Image, InlineLoadingSkeleton (8 components total)
- **Local State Count:** 4
- **Database/API Calls:** None

### SavedLoginScreen
- **File Path:** `native\screens\SavedLoginScreen.tsx`
- **Components Used:** ComingSoonScreen (1 components total)
- **Local State Count:** 0
- **Database/API Calls:** None

### SavedPostsScreen
- **File Path:** `native\screens\SavedPostsScreen.tsx`
- **Components Used:** TouchableOpacity, Image, View, Ionicons, Text, VerifiedBadge, ScreenSkeleton, FlatList (8 components total)
- **Local State Count:** 5
- **Database/API Calls:** None

### SavedPostsScreen_Full
- **File Path:** `native\screens\SavedPostsScreen_Full.tsx`
- **Components Used:** SavedPost, TouchableOpacity, Image, View, Ionicons, Text, SafeAreaView, ActivityIndicator, FlatList (9 components total)
- **Local State Count:** 3
- **Database/API Calls:** None

### ScanQRScreen
- **File Path:** `native\screens\ScanQRScreen.tsx`
- **Components Used:** View, TouchableOpacity, Ionicons, Text (4 components total)
- **Local State Count:** 0
- **Database/API Calls:** None

### SearchScreenEnhanced
- **File Path:** `native\screens\SearchScreenEnhanced.tsx`
- **Components Used:** Array, SearchCreatorGlimpse, SearchUser, SearchHashtag, SearchPostResult, ReturnType, Pressable, CachedImage, View, Ionicons, Text, TouchableOpacity, Avatar, VerifiedBadge, SafeAreaView, ActivityIndicator, TextInput, FlatList, ScrollView, RefreshControl (20 components total)
- **Local State Count:** 13
- **Database/API Calls:** None

### SecuritySettingsScreen
- **File Path:** `native\screens\SecuritySettingsScreen.tsx`
- **Components Used:** None (0 components total)
- **Local State Count:** 0
- **Database/API Calls:** None

### SecuritySettingsScreen_Full
- **File Path:** `native\screens\SecuritySettingsScreen_Full.tsx`
- **Components Used:** TouchableOpacity, View, Ionicons, Text, Switch, SafeAreaView, ScrollView (7 components total)
- **Local State Count:** 4
- **Database/API Calls:** None

### SettingsMainScreen
- **File Path:** `native\screens\SettingsMainScreen.tsx`
- **Components Used:** None (0 components total)
- **Local State Count:** 0
- **Database/API Calls:** None

### SettingsScreen
- **File Path:** `native\screens\SettingsScreen.tsx`
- **Components Used:** TouchableOpacity, View, Ionicons, Text, Switch, SafeAreaView, ScrollView, Avatar, ToggleRow, SettingsRow (10 components total)
- **Local State Count:** 3
- **Database/API Calls:** None

### SettingsScreenEnhanced
- **File Path:** `native\screens\SettingsScreenEnhanced.tsx`
- **Components Used:** Record, FeedControlSettings, React, TouchableOpacity, View, Ionicons, Text, ActivityIndicator, Switch, SafeAreaView, Animated, LinearGradient, Avatar, Modal, ScrollView, Slider (16 components total)
- **Local State Count:** 18
- **Database/API Calls:** None

### SettingsScreen_Full
- **File Path:** `native\screens\SettingsScreen_Full.tsx`
- **Components Used:** TouchableOpacity, View, Ionicons, Text, SafeAreaView, ScrollView, Avatar (7 components total)
- **Local State Count:** 0
- **Database/API Calls:** None

### SharedPostsScreen_Full
- **File Path:** `native\screens\SharedPostsScreen_Full.tsx`
- **Components Used:** SharedPost, TouchableOpacity, Image, View, Text, Avatar, SafeAreaView, ActivityIndicator, Ionicons, FlatList (10 components total)
- **Local State Count:** 3
- **Database/API Calls:** firestore_once

### SharePostScreen
- **File Path:** `native\screens\SharePostScreen.tsx`
- **Components Used:** ReturnType, TouchableOpacity, View, Avatar, Ionicons, Text, ScrollView, TextInput, ButtonLoadingSkeleton, SafeAreaView, Pressable, Animated, ActivityIndicator, FlatList, InlineLoadingSkeleton (15 components total)
- **Local State Count:** 11
- **Database/API Calls:** None

### ShopScreen
- **File Path:** `native\screens\ShopScreen.tsx`
- **Components Used:** Product, Category, TouchableOpacity, View, Ionicons, Text, Image, VerifiedBadge, SafeAreaView, TextInput, FlatList, ScrollView, ActivityIndicator, RefreshControl (14 components total)
- **Local State Count:** 8
- **Database/API Calls:** None

### SignupScreen
- **File Path:** `native\screens\SignupScreen.tsx`
- **Components Used:** KeyboardAvoidingView, ScrollView, View, TouchableOpacity, Ionicons, Image, Text, TextInput, InlineLoadingSkeleton (9 components total)
- **Local State Count:** 6
- **Database/API Calls:** None

### SoundSettingsScreen
- **File Path:** `native\screens\SoundSettingsScreen.tsx`
- **Components Used:** None (0 components total)
- **Local State Count:** 0
- **Database/API Calls:** None

### SplashScreen
- **File Path:** `native\screens\SplashScreen.tsx`
- **Components Used:** LinearGradient, Animated, Image, Text, View (5 components total)
- **Local State Count:** 3
- **Database/API Calls:** None

### StorageUsageScreen
- **File Path:** `native\screens\StorageUsageScreen.tsx`
- **Components Used:** SafeAreaView, View, TouchableOpacity, Ionicons, Text, ScrollView (6 components total)
- **Local State Count:** 2
- **Database/API Calls:** None

### StoryCreateScreen
- **File Path:** `native\screens\StoryCreateScreen.tsx`
- **Components Used:** SafeAreaView, View, TouchableOpacity, Ionicons, Text, NativeStoryEditor, ActivityIndicator (7 components total)
- **Local State Count:** 6
- **Database/API Calls:** None

### StoryCreateScreen_Full
- **File Path:** `native\screens\StoryCreateScreen_Full.tsx`
- **Components Used:** SafeAreaView, Image, View, TouchableOpacity, Ionicons, InlineLoadingSkeleton, Text, TextInput (8 components total)
- **Local State Count:** 3
- **Database/API Calls:** None

### StoryEditorScreen
- **File Path:** `native\screens\StoryEditorScreen.tsx`
- **Components Used:** TextOverlay, Sticker, PanGestureHandlerGestureEvent, PinchGestureHandlerGestureEvent, View, Text, SafeAreaView, CameraView, TouchableOpacity, Ionicons, Animated, PanGestureHandler, PinchGestureHandler, Modal, TextInput, ScrollView (16 components total)
- **Local State Count:** 21
- **Database/API Calls:** None

### StoryEditorScreenSimple
- **File Path:** `native\screens\StoryEditorScreenSimple.tsx`
- **Components Used:** StoryMediaInput, StoryEditorSettings, CameraView, View, StoryPostStyleEditor, ActivityIndicator, Text, SafeAreaView, Ionicons, TouchableOpacity (10 components total)
- **Local State Count:** 7
- **Database/API Calls:** None

### StoryEditorStyles
- **File Path:** `native\screens\StoryEditorStyles.tsx`
- **Components Used:** None (0 components total)
- **Local State Count:** 0
- **Database/API Calls:** None

### StoryHighlightsManagerScreen
- **File Path:** `native\screens\StoryHighlightsManagerScreen.tsx`
- **Components Used:** Highlight, Story, Set, TouchableOpacity, View, Image, Ionicons, Text, Modal, TextInput, FlatList, SafeAreaView, ActivityIndicator, RefreshControl (14 components total)
- **Local State Count:** 11
- **Database/API Calls:** None

### StoryViewerEnhanced
- **File Path:** `native\screens\StoryViewerEnhanced.tsx`
- **Components Used:** SafeAreaView, ActivityIndicator, StatusBar, Animated, View, Avatar, Text, TouchableOpacity, Ionicons, Image, TextInput, Modal, FlatList (13 components total)
- **Local State Count:** 10
- **Database/API Calls:** None

### StoryViewerScreen
- **File Path:** `native\screens\StoryViewerScreen.tsx`
- **Components Used:** View, ActivityIndicator, Text, TouchableOpacity, Ionicons, Image (6 components total)
- **Local State Count:** 7
- **Database/API Calls:** None

### StoryViewerScreenComplete
- **File Path:** `native\screens\StoryViewerScreenComplete.tsx`
- **Components Used:** ViewerStory, Record, ReturnType, Video, TextInput, View, Image, Text, LinearGradient, Animated, TouchableOpacity, Avatar, VerifiedBadge, Ionicons, ActivityIndicator, StatusBar, TouchableWithoutFeedback, KeyboardAvoidingView (18 components total)
- **Local State Count:** 10
- **Database/API Calls:** None

### StoryViewerScreenEnhanced
- **File Path:** `native\screens\StoryViewerScreenEnhanced.tsx`
- **Components Used:** Text, Record, Video, Audio, WebView, TapGestureHandler, PanGestureHandler, Set, CanvasConfig, View, TouchableOpacity, Modal, Animated, SafeAreaView, Ionicons, ActivityIndicator, Image, FlatList, Avatar, VerifiedBadge, StatusBar, LinearGradient, StoryOverlayRenderer, StoryMediaRenderer, TextInput (25 components total)
- **Local State Count:** 44
- **Database/API Calls:** None

### StoryViewerScreen_Full
- **File Path:** `native\screens\StoryViewerScreen_Full.tsx`
- **Components Used:** NodeJS, View, Image, Animated, Avatar, Text, TouchableOpacity, Ionicons (8 components total)
- **Local State Count:** 5
- **Database/API Calls:** None

### SuggestionsScreen
- **File Path:** `native\screens\SuggestionsScreen.tsx`
- **Components Used:** Set, View, TouchableOpacity, Ionicons, Text, ScreenSkeleton, FlatList, Image (8 components total)
- **Local State Count:** 6
- **Database/API Calls:** None

### SuggestionsScreenEnhanced
- **File Path:** `native\screens\SuggestionsScreenEnhanced.tsx`
- **Components Used:** SuggestedUser, Set, TouchableOpacity, LinearGradient, View, Avatar, Text, VerifiedBadge, Ionicons, InlineLoadingSkeleton, SafeAreaView, ScreenSkeleton, FlatList, RefreshControl (14 components total)
- **Local State Count:** 6
- **Database/API Calls:** None

### TaggedPostsScreen
- **File Path:** `native\screens\TaggedPostsScreen.tsx`
- **Components Used:** TouchableOpacity, Image, View, Ionicons, Text, ScreenSkeleton, FlatList (7 components total)
- **Local State Count:** 3
- **Database/API Calls:** None

### TaggedPostsScreen_Full
- **File Path:** `native\screens\TaggedPostsScreen_Full.tsx`
- **Components Used:** TouchableOpacity, Image, SafeAreaView, View, ActivityIndicator, Ionicons, Text, FlatList (8 components total)
- **Local State Count:** 3
- **Database/API Calls:** None

### TagPrivacyScreen
- **File Path:** `native\screens\TagPrivacyScreen.tsx`
- **Components Used:** None (0 components total)
- **Local State Count:** 0
- **Database/API Calls:** None

### TermsScreen
- **File Path:** `native\screens\TermsScreen.tsx`
- **Components Used:** View, Text (2 components total)
- **Local State Count:** 0
- **Database/API Calls:** None

### TextOverlayScreen
- **File Path:** `native\screens\TextOverlayScreen.tsx`
- **Components Used:** View, StatusBar, TextOverlayEditor (3 components total)
- **Local State Count:** 1
- **Database/API Calls:** None

### ThemeScreen
- **File Path:** `native\screens\ThemeScreen.tsx`
- **Components Used:** SafeAreaView, View, TouchableOpacity, Ionicons, Text, InlineLoadingSkeleton (6 components total)
- **Local State Count:** 2
- **Database/API Calls:** None

### TrendingScreen
- **File Path:** `native\screens\TrendingScreen.tsx`
- **Components Used:** View, TouchableOpacity, Ionicons, Text, FlatList, Image (6 components total)
- **Local State Count:** 4
- **Database/API Calls:** None

### TrendingScreen_Full
- **File Path:** `native\screens\TrendingScreen_Full.tsx`
- **Components Used:** TrendingItem, TouchableOpacity, View, Text, Ionicons, SafeAreaView, ActivityIndicator, FlatList (8 components total)
- **Local State Count:** 4
- **Database/API Calls:** None

### TwoFactorAuthScreen
- **File Path:** `native\screens\TwoFactorAuthScreen.tsx`
- **Components Used:** SafeAreaView, View, TouchableOpacity, Ionicons, Text, Switch (6 components total)
- **Local State Count:** 5
- **Database/API Calls:** None

### VideoEditorScreen
- **File Path:** `native\screens\VideoEditorScreen.tsx`
- **Components Used:** Video, View, Text, Slider, ScrollView, TouchableOpacity, Ionicons, SafeAreaView, ActivityIndicator (9 components total)
- **Local State Count:** 14
- **Database/API Calls:** None

### ViewersListScreen
- **File Path:** `native\screens\ViewersListScreen.tsx`
- **Components Used:** View, TouchableOpacity, Ionicons, Text, FlatList, Image (6 components total)
- **Local State Count:** 3
- **Database/API Calls:** None

### WalletScreen
- **File Path:** `native\screens\WalletScreen.tsx`
- **Components Used:** WalletData, Transaction, TouchableOpacity, View, Ionicons, Text, SafeAreaView, ActivityIndicator, ScrollView, RefreshControl, FlatList (11 components total)
- **Local State Count:** 6
- **Database/API Calls:** None

### WebsiteEditorScreen
- **File Path:** `native\screens\WebsiteEditorScreen.tsx`
- **Components Used:** View, TouchableOpacity, Ionicons, Text, TextInput (5 components total)
- **Local State Count:** 2
- **Database/API Calls:** None

### WebStoryViewerScreen
- **File Path:** `native\screens\WebStoryViewerScreen.tsx`
- **Components Used:** WebView, StoryViewerScreenEnhanced, SafeAreaView, View (4 components total)
- **Local State Count:** 3
- **Database/API Calls:** None

### WelcomeScreen
- **File Path:** `native\screens\WelcomeScreen.tsx`
- **Components Used:** View, Image, Text, TouchableOpacity (4 components total)
- **Local State Count:** 0
- **Database/API Calls:** None

---

## 4. METHODS AND LOGIC AUDIT

Due to the sheer size of the project (hundreds of components and screens), extracting every single plain-english function explanation requires manual AST parsing. However, here is the algorithmic breakdown of logic placement:

### Files with Complex Logic (High State Count)
These files have an unusually high number of state hooks, indicating they are likely doing too much and should extract logic into custom hooks:
- **NativePostImageEditor** (`native\components\media\NativePostImageEditor.tsx`): 46 state hooks
- **ChatScreenEnhanced** (`native\screens\ChatScreenEnhanced.tsx`): 45 state hooks
- **NativeGlimpseEditor** (`native\components\media\NativeGlimpseEditor.tsx`): 44 state hooks
- **StoryViewerScreenEnhanced** (`native\screens\StoryViewerScreenEnhanced.tsx`): 44 state hooks
- **GlimpseCreateScreen** (`native\screens\GlimpseCreateScreen.tsx`): 34 state hooks
- **NewPostScreenEnhanced** (`native\screens\NewPostScreenEnhanced.tsx`): 31 state hooks
- **GlimpseViewerScreenEnhanced** (`native\screens\GlimpseViewerScreenEnhanced.tsx`): 30 state hooks
- **GroupInfoScreen** (`native\screens\GroupInfoScreen.tsx`): 28 state hooks
- **ProfileScreenEnhanced** (`native\screens\ProfileScreenEnhanced.tsx`): 26 state hooks
- **ChatScreenEnhanced1** (`native\screens\ChatScreenEnhanced1.tsx`): 23 state hooks
- **PostCreationScreenEnhanced** (`native\screens\PostCreationScreenEnhanced.tsx`): 22 state hooks
- **ProfileScreen** (`native\screens\ProfileScreen.tsx`): 22 state hooks
- **InteractiveStickerPanel** (`native\components\story\InteractiveStickerPanel.tsx`): 21 state hooks
- **StoryEditorScreen** (`native\screens\StoryEditorScreen.tsx`): 21 state hooks
- **StoryEditor** (`native\components\story\StoryEditor.tsx`): 20 state hooks
- **MessagesScreenEnhanced** (`native\screens\MessagesScreenEnhanced.tsx`): 19 state hooks
- **HomeScreenWorking** (`native\screens\HomeScreenWorking.tsx`): 18 state hooks
- **SettingsScreenEnhanced** (`native\screens\SettingsScreenEnhanced.tsx`): 18 state hooks
- **ChatProfileScreen** (`native\screens\ChatProfileScreen.tsx`): 17 state hooks
- **VideoEditorScreen** (`native\screens\VideoEditorScreen.tsx`): 14 state hooks
- **StoryViewerEnhanced** (`native\components\story\StoryViewerEnhanced.tsx`): 13 state hooks
- **SearchScreenEnhanced** (`native\screens\SearchScreenEnhanced.tsx`): 13 state hooks
- **TextOverlayEditor** (`native\components\media\TextOverlayEditor.tsx`): 12 state hooks
- **FollowersListScreen** (`native\screens\FollowersListScreen.tsx`): 12 state hooks
- **FollowingScreen** (`native\screens\FollowingScreen.tsx`): 12 state hooks
- **PostViewerScreen** (`native\screens\PostViewerScreen.tsx`): 12 state hooks
- **ChatScreen** (`native\screens\ChatScreen.tsx`): 11 state hooks
- **SharePostScreen** (`native\screens\SharePostScreen.tsx`): 11 state hooks
- **StoryHighlightsManagerScreen** (`native\screens\StoryHighlightsManagerScreen.tsx`): 11 state hooks
- **MusicTool** (`native\components\editor\Tools\MusicTool.tsx`): 10 state hooks
- **ChatScreen_Full** (`native\screens\ChatScreen_Full.tsx`): 10 state hooks
- **MessagesScreenEnhanced_Clean** (`native\screens\MessagesScreenEnhanced_Clean.tsx`): 10 state hooks
- **MessagesScreenEnhanced_Fixed** (`native\screens\MessagesScreenEnhanced_Fixed.tsx`): 10 state hooks
- **NewGroupScreen** (`native\screens\NewGroupScreen.tsx`): 10 state hooks
- **StoryViewerEnhanced** (`native\screens\StoryViewerEnhanced.tsx`): 10 state hooks
- **StoryViewerScreenComplete** (`native\screens\StoryViewerScreenComplete.tsx`): 10 state hooks
- **PostCard** (`native\components\feed\PostCard.tsx`): 9 state hooks
- **LiveStreamViewer** (`native\components\live\LiveStreamViewer.tsx`): 9 state hooks
- **EditInteractiveStickerModal** (`native\components\story\EditInteractiveStickerModal.tsx`): 9 state hooks
- **EditProfileScreen_Full** (`native\screens\EditProfileScreen_Full.tsx`): 9 state hooks
- **EmailPhoneScreen** (`native\screens\EmailPhoneScreen.tsx`): 9 state hooks
- **LikesListScreenEnhanced** (`native\screens\LikesListScreenEnhanced.tsx`): 9 state hooks
- **PhotoTagging** (`native\components\media\PhotoTagging.tsx`): 8 state hooks
- **DrawingTool** (`native\components\story\DrawingTool.tsx`): 8 state hooks
- **EnhancedTextEditor** (`native\components\story\EnhancedTextEditor.tsx`): 8 state hooks
- **MusicPicker** (`native\components\story\MusicPicker.tsx`): 8 state hooks
- **ChangePasswordScreen_Full** (`native\screens\ChangePasswordScreen_Full.tsx`): 8 state hooks
- **ChatMessageSearchScreen** (`native\screens\ChatMessageSearchScreen.tsx`): 8 state hooks
- **CommentsScreen** (`native\screens\CommentsScreen.tsx`): 8 state hooks
- **EmailPhoneSettingsScreen** (`native\screens\EmailPhoneSettingsScreen.tsx`): 8 state hooks
- **FollowSuggestionsScreenEnhanced** (`native\screens\FollowSuggestionsScreenEnhanced.tsx`): 8 state hooks
- **GroupChatSettingsScreen** (`native\screens\GroupChatSettingsScreen.tsx`): 8 state hooks
- **HideStoryScreen** (`native\screens\HideStoryScreen.tsx`): 8 state hooks
- **NewChatScreen** (`native\screens\NewChatScreen.tsx`): 8 state hooks
- **NewMessageScreen** (`native\screens\NewMessageScreen.tsx`): 8 state hooks
- **NotificationSettingsScreen_Full** (`native\screens\NotificationSettingsScreen_Full.tsx`): 8 state hooks
- **NotificationsScreenEnhanced** (`native\screens\NotificationsScreenEnhanced.tsx`): 8 state hooks
- **ShopScreen** (`native\screens\ShopScreen.tsx`): 8 state hooks
- **GalleryComposerSheet** (`native\components\chat\GalleryComposerSheet.tsx`): 7 state hooks
- **CommentThreadList** (`native\components\comments\CommentThreadList.tsx`): 7 state hooks
- **WidgetTool** (`native\components\editor\Tools\WidgetTool.tsx`): 7 state hooks
- **AdvancedImageEditor** (`native\components\media\AdvancedImageEditor.tsx`): 7 state hooks
- **SharePostModal** (`native\components\share\SharePostModal.tsx`): 7 state hooks
- **GifPicker** (`native\components\story\GifPicker.tsx`): 7 state hooks
- **CollectionsScreen** (`native\screens\CollectionsScreen.tsx`): 7 state hooks
- **DiscoverScreen** (`native\screens\DiscoverScreen.tsx`): 7 state hooks
- **ExploreScreen** (`native\screens\ExploreScreen.tsx`): 7 state hooks
- **GlimpsesScreen** (`native\screens\GlimpsesScreen.tsx`): 7 state hooks
- **LiveStreamViewerScreen** (`native\screens\LiveStreamViewerScreen.tsx`): 7 state hooks
- **MutualFollowersScreen** (`native\screens\MutualFollowersScreen.tsx`): 7 state hooks
- **NotificationsEnhanced** (`native\screens\NotificationsEnhanced.tsx`): 7 state hooks
- **PostViewScreen** (`native\screens\PostViewScreen.tsx`): 7 state hooks
- **PrivacySettingsScreen_Full** (`native\screens\PrivacySettingsScreen_Full.tsx`): 7 state hooks
- **ProfileScreenNew** (`native\screens\ProfileScreenNew.tsx`): 7 state hooks
- **StoryEditorScreenSimple** (`native\screens\StoryEditorScreenSimple.tsx`): 7 state hooks
- **StoryViewerScreen** (`native\screens\StoryViewerScreen.tsx`): 7 state hooks
- **MessageForwardModal** (`native\components\chat\MessageForwardModal.tsx`): 6 state hooks
- **StickerGifPicker** (`native\components\chat\StickerGifPicker.tsx`): 6 state hooks
- **StorySettingsModal** (`native\components\story\StorySettingsModal.tsx`): 6 state hooks
- **CloseFriendsScreen** (`native\screens\CloseFriendsScreen.tsx`): 6 state hooks
- **CommentsScreen_Full** (`native\screens\CommentsScreen_Full.tsx`): 6 state hooks
- **DataUsageScreen_Full** (`native\screens\DataUsageScreen_Full.tsx`): 6 state hooks
- **DiscoveryScreen** (`native\screens\DiscoveryScreen.tsx`): 6 state hooks
- **DiscoveryScreen_Full** (`native\screens\DiscoveryScreen_Full.tsx`): 6 state hooks
- **FollowersListScreen_Full** (`native\screens\FollowersListScreen_Full.tsx`): 6 state hooks
- **GameScreen** (`native\screens\GameScreen.tsx`): 6 state hooks
- **NewPostScreen** (`native\screens\NewPostScreen.tsx`): 6 state hooks
- **NewPostScreen_Full** (`native\screens\NewPostScreen_Full.tsx`): 6 state hooks
- **PostInsightsScreen** (`native\screens\PostInsightsScreen.tsx`): 6 state hooks
- **PostViewScreen_Full** (`native\screens\PostViewScreen_Full.tsx`): 6 state hooks
- **ReportProblemScreen** (`native\screens\ReportProblemScreen.tsx`): 6 state hooks
- **SignupScreen** (`native\screens\SignupScreen.tsx`): 6 state hooks
- **StoryCreateScreen** (`native\screens\StoryCreateScreen.tsx`): 6 state hooks
- **SuggestionsScreen** (`native\screens\SuggestionsScreen.tsx`): 6 state hooks
- **SuggestionsScreenEnhanced** (`native\screens\SuggestionsScreenEnhanced.tsx`): 6 state hooks
- **WalletScreen** (`native\screens\WalletScreen.tsx`): 6 state hooks
- **LocationShareSheet** (`native\components\chat\LocationShareSheet.tsx`): 5 state hooks
- **VoiceMessageBubble** (`native\components\chat\VoiceMessageBubble.tsx`): 5 state hooks
- **ViewLikesModal** (`native\components\modals\ViewLikesModal.tsx`): 5 state hooks
- **FilterEffects** (`native\components\story\FilterEffects.tsx`): 5 state hooks
- **MusicSticker** (`native\components\story\MusicSticker.tsx`): 5 state hooks
- **StoryCamera** (`native\components\StoryEditor\StoryCamera.tsx`): 5 state hooks
- **SuggestionCarousel** (`native\components\suggestions\SuggestionCarousel.tsx`): 5 state hooks
- **ActivityScreen** (`native\screens\ActivityScreen.tsx`): 5 state hooks
- **BioEditorScreen** (`native\screens\BioEditorScreen.tsx`): 5 state hooks
- **BlockedUsersScreen** (`native\screens\BlockedUsersScreen.tsx`): 5 state hooks
- **BookmarksScreen** (`native\screens\BookmarksScreen.tsx`): 5 state hooks
- **ChangePasswordScreen** (`native\screens\ChangePasswordScreen.tsx`): 5 state hooks
- **CommentsScreenNew** (`native\screens\CommentsScreenNew.tsx`): 5 state hooks
- **CreatePostScreen** (`native\screens\CreatePostScreen.tsx`): 5 state hooks
- **EventsScreen** (`native\screens\EventsScreen.tsx`): 5 state hooks
- **FollowingScreen_Full** (`native\screens\FollowingScreen_Full.tsx`): 5 state hooks
- **ForwardMessageScreen** (`native\screens\ForwardMessageScreen.tsx`): 5 state hooks
- **HashtagScreen_Full** (`native\screens\HashtagScreen_Full.tsx`): 5 state hooks
- **ImageEditorScreen** (`native\screens\ImageEditorScreen.tsx`): 5 state hooks
- **MessagesScreen_Full** (`native\screens\MessagesScreen_Full.tsx`): 5 state hooks
- **MusicSearchScreen** (`native\screens\MusicSearchScreen.tsx`): 5 state hooks
- **NotificationsScreen_Full** (`native\screens\NotificationsScreen_Full.tsx`): 5 state hooks
- **ReelsScreen** (`native\screens\ReelsScreen.tsx`): 5 state hooks
- **SavedPostsScreen** (`native\screens\SavedPostsScreen.tsx`): 5 state hooks
- **StoryViewerScreen_Full** (`native\screens\StoryViewerScreen_Full.tsx`): 5 state hooks
- **TwoFactorAuthScreen** (`native\screens\TwoFactorAuthScreen.tsx`): 5 state hooks

---

## 5. HOOKS USAGE

### Hook Frequency Across Project
- **useState**: Used in 245 files
- **useEffect**: Used in 204 files
- **useNavigation**: Used in 200 files
- **useAuth**: Used in 156 files
- **useRef**: Used in 79 files
- **useMemo**: Used in 67 files
- **useRoute**: Used in 67 files
- **useCallback**: Used in 58 files
- **useNativeDriver**: Used in 43 files
- **useColors**: Used in 18 files
- **useEditorStore**: Used in 11 files
- **useSharedValue**: Used in 8 files
- **useAnimatedStyle**: Used in 8 files
- **useFocusEffect**: Used in 8 files
- **useAsync**: Used in 7 files
- **useWindowDimensions**: Used in 6 files
- **useMessages**: Used in 5 files
- **useLayoutEffect**: Used in 5 files
- **useTheme**: Used in 4 files
- **useStoryProcessing**: Used in 4 files
- **useSafeAreaInsets**: Used in 4 files
- **useNativeControls**: Used in 3 files
- **useCamera**: Used in 3 files
- **useIsFocused**: Used in 3 files
- **useImage**: Used in 2 files
- **useImperativeHandle**: Used in 2 files
- **useExternalMusicControl**: Used in 2 files
- **useAppTheme**: Used in 2 files
- **useMediaProcessing**: Used in 2 files
- **useUpload**: Used in 2 files
- **useChatCache**: Used in 2 files
- **useComments**: Used in 2 files
- **usePost**: Used in 2 files
- **useDeferredValue**: Used in 2 files
- **useAnimatedGestureHandler**: Used in 2 files
- **useAudio**: Used in 1 files
- **useStoryRingGyro**: Used in 1 files
- **useProgress**: Used in 1 files
- **useIndicator**: Used in 1 files
- **useCameraPermissions**: Used in 1 files
- **useChatPreferences**: Used in 1 files
- **useChatReactions**: Used in 1 files
- **useChatThemedStyles**: Used in 1 files
- **useChatSeenState**: Used in 1 files
- **useChatMeta**: Used in 1 files
- **usePendingQueue**: Used in 1 files
- **useTestImage**: Used in 1 files
- **useAllVideos**: Used in 1 files
- **useButton**: Used in 1 files
- **useButtonDisabled**: Used in 1 files
- **useButtonText**: Used in 1 files
- **useButtonTextDisabled**: Used in 1 files
- **useNotifications**: Used in 1 files
- **useRouteIndex**: Used in 1 files
- **useLikeIntentController**: Used in 1 files
- **useWebViewRenderer**: Used in 1 files
- **useWebView**: Used in 1 files
- **useExternalViewer**: Used in 1 files
- **usePlayback**: Used in 1 files
- **useSub**: Used in 1 files
- **usePoster**: Used in 1 files
- **useTextOverlay**: Used in 1 files

*Analysis:* High usage of `useEffect` and `useState` is standard, but you also heavily rely on `useMemo` and `useCallback`, which is good for performance. Ensure `useEffect` dependency arrays are exhaustive to prevent infinite loops (especially in files making DB calls).

---

## 6. PERFORMANCE FLAGS

### Components potentially missing React.memo
These components are not wrapped in React.memo:
- `native\components\chat\chat.types.ts`
- `native\components\chat\ChatProfileDrawer.tsx`
- `native\components\chat\Composer.tsx`
- `native\components\chat\EmojiPicker.tsx`
- `native\components\chat\GalleryComposerSheet.tsx`
- `native\components\chat\LocationBubble.tsx`
- `native\components\chat\LocationShareSheet.tsx`
- `native\components\chat\MediaBubble.tsx`
- `native\components\chat\MessageActionsSheet.tsx`
- `native\components\chat\MessageBubble.tsx`
- `native\components\chat\MessageForwardModal.tsx`
- `native\components\chat\MessageList.tsx`
- `native\components\chat\MoreReactionsPicker.tsx`
- `native\components\chat\PinnedBanner.tsx`
- `native\components\chat\PollBubble.tsx`
- `native\components\chat\PollComposer.tsx`
- `native\components\chat\QuickReactionPicker.tsx`
- `native\components\chat\SharedCard.tsx`
- `native\components\chat\SharedContentMessage.tsx`
- `native\components\chat\ShareSheet.tsx`
- `native\components\chat\StickerGifPicker.tsx`
- `native\components\chat\VoiceMessageBubble.tsx`
- `native\components\comments\CommentThreadList.tsx`
- `native\components\comments\ThreadedComment.tsx`
- `native\components\common\BackButton.tsx`
- `native\components\common\Header.tsx`
- `native\components\CreateMenu\CreateButton.tsx`
- `native\components\CreateMenu\CreateButtonStyles.tsx`
- `native\components\CreateMenu\CreateMenuModal.tsx`
- `native\components\CreateMenu\CreateMenuStyles.tsx`
- `native\components\CreateMenu\index.tsx`
- `native\components\debug\ErrorBoundary.tsx`
- `native\components\editor\NativeStoryEditor.tsx`
- `native\components\editor\SkiaCanvas\ElementRenderer.tsx`
- `native\components\editor\SkiaCanvas\SkiaCanvasEditor.tsx`
- `native\components\editor\SkiaCanvas\SkiaExporter.tsx`
- `native\components\editor\Tools\DrawingTool.tsx`
- `native\components\editor\Tools\FilterTool.tsx`
- `native\components\editor\Tools\MusicTool.tsx`
- `native\components\editor\Tools\StickerTool.tsx`
- `native\components\editor\Tools\TextTool.tsx`
- `native\components\editor\Tools\WidgetTool.tsx`
- `native\components\editor\UI\EditorHeader.tsx`
- `native\components\editor\UI\EditorToolbar.tsx`
- `native\components\feed\GlimpseGrid.tsx`
- `native\components\feed\GlimpseGridItem.tsx`
- `native\components\feed\index.tsx`
- `native\components\feed\PostCard.tsx`
- `native\components\feed\PostCardSimple.tsx`
- `native\components\feed\PostGrid.tsx`
- *(...and 86 more)*

### FlatList Optimizations Needed
The following files use FlatList without `keyExtractor` or `getItemLayout`:
- `native\components\chat\GalleryComposerSheet.tsx`
- `native\components\chat\MessageForwardModal.tsx`
- `native\components\chat\MessageList.tsx`
- `native\components\chat\StickerGifPicker.tsx`
- `native\components\comments\CommentThreadList.tsx`
- `native\components\editor\Tools\MusicTool.tsx`
- `native\components\feed\GlimpseGrid.tsx`
- `native\components\feed\PostGrid.tsx`
- `native\components\live\LiveStreamViewer.tsx`
- `native\components\media\NativePostImageEditor.tsx`
- `native\components\media\PhotoTagging.tsx`
- `native\components\modals\ViewLikesModal.tsx`
- `native\components\post\ViewLikesModal.tsx`
- `native\components\share\SharePostModal.tsx`
- `native\components\story\GifPicker.tsx`
- `native\components\story\MusicPicker.tsx`
- `native\components\story\MusicSticker.tsx`
- `native\components\story\StickerPicker.tsx`
- `native\components\story\StorySettingsModal.tsx`
- `native\components\ui\EmojiPicker.tsx`
- `native\components\ui\HashtagAutocomplete.tsx`
- `native\components\ui\MentionAutocomplete.tsx`
- `native\components\users\ActiveUsersList.tsx`
- `native\screens\ActivityLogScreen.tsx`
- `native\screens\ActivityLogScreen_Full.tsx`
- `native\screens\ActivityScreen.tsx`
- `native\screens\ArchivedStoryViewerScreen.tsx`
- `native\screens\ArchiveScreen.tsx`
- `native\screens\ArchiveScreen_Full.tsx`
- `native\screens\BackupCodesScreen.tsx`
- `native\screens\BadgesScreen.tsx`
- `native\screens\BlockedUsersScreen.tsx`
- `native\screens\BlockedUsersScreen_Full.tsx`
- `native\screens\BookmarksScreen.tsx`
- `native\screens\ChatMessageSearchScreen.tsx`
- `native\screens\ChatProfileScreen.tsx`
- `native\screens\ChatScreen.tsx`
- `native\screens\ChatScreenEnhanced.tsx`
- `native\screens\ChatScreen_Full.tsx`
- `native\screens\CloseFriendsScreen.tsx`
- `native\screens\CloseFriendsScreen_Full.tsx`
- `native\screens\CollectionDetailScreen.tsx`
- `native\screens\CollectionsScreen.tsx`
- `native\screens\CollectionsScreen_Full.tsx`
- `native\screens\CommentsScreen.tsx`
- `native\screens\CommentsScreenNew.tsx`
- `native\screens\CommentsScreen_Full.tsx`
- `native\screens\DevicesScreen.tsx`
- `native\screens\DiscoverScreen.tsx`
- `native\screens\DiscoveryScreen.tsx`
- `native\screens\DiscoveryScreenEnhanced.tsx`
- `native\screens\DiscoveryScreen_Full.tsx`
- `native\screens\DraftsScreen.tsx`
- `native\screens\DraftsScreen_Full.tsx`
- `native\screens\EventsScreen.tsx`
- `native\screens\ExploreScreen.tsx`
- `native\screens\FollowersListScreen.tsx`
- `native\screens\FollowersListScreen_Full.tsx`
- `native\screens\FollowingScreen.tsx`
- `native\screens\FollowingScreen_Full.tsx`
- `native\screens\FollowRequestsScreen.tsx`
- `native\screens\FollowSuggestionsScreenEnhanced.tsx`
- `native\screens\ForwardMessageScreen.tsx`
- `native\screens\GameScreen.tsx`
- `native\screens\GlimpseViewerScreenEnhanced.tsx`
- `native\screens\HashtagScreen.tsx`
- `native\screens\HashtagScreen_Full.tsx`
- `native\screens\HideStoryScreen.tsx`
- `native\screens\HighlightsScreen.tsx`
- `native\screens\HighlightsScreen_Full.tsx`
- `native\screens\HomeScreenWorking.tsx`
- `native\screens\LanguageSettingsScreen_Full.tsx`
- `native\screens\LeaderboardScreen.tsx`
- `native\screens\LikedPostsScreen.tsx`
- `native\screens\LikesListScreen.tsx`
- `native\screens\LikesListScreenEnhanced.tsx`
- `native\screens\LikesScreen_Full.tsx`
- `native\screens\LiveStreamScreenEnhanced.tsx`
- `native\screens\LiveStreamViewerScreen.tsx`
- `native\screens\LocationScreen.tsx`
- `native\screens\LocationScreen_Full.tsx`
- `native\screens\MediaPickerScreen.tsx`
- `native\screens\MentionsScreen.tsx`
- `native\screens\MentionsScreen_Full.tsx`
- `native\screens\MessagesScreen.tsx`
- `native\screens\MessagesScreenEnhanced.tsx`
- `native\screens\MessagesScreenEnhanced_Clean.tsx`
- `native\screens\MessagesScreenEnhanced_Fixed.tsx`
- `native\screens\MessagesScreenNew.tsx`
- `native\screens\MessagesScreen_Full.tsx`
- `native\screens\MusicSearchScreen.tsx`
- `native\screens\MutedAccountsScreen.tsx`
- `native\screens\MutedAccountsScreen_Full.tsx`
- `native\screens\MutualFollowersScreen.tsx`
- `native\screens\NewChatScreen.tsx`
- `native\screens\NewGroupScreen.tsx`
- `native\screens\NewMessageScreen.tsx`
- `native\screens\NotificationsEnhanced.tsx`
- `native\screens\NotificationsScreen.tsx`
- `native\screens\NotificationsScreenEnhanced.tsx`
- `native\screens\NotificationsScreenNew.tsx`
- `native\screens\NotificationsScreen_Full.tsx`
- `native\screens\PaymentMethodsScreen.tsx`
- `native\screens\PostCreationScreenEnhanced.tsx`
- `native\screens\PostViewerScreen.tsx`
- `native\screens\ProfileScreen.tsx`
- `native\screens\ProfileScreenEnhanced.tsx`
- `native\screens\ProfileScreenNew.tsx`
- `native\screens\RecentSearchesScreen.tsx`
- `native\screens\RestrictedAccountsScreen.tsx`
- `native\screens\SavedPostsScreen.tsx`
- `native\screens\SavedPostsScreen_Full.tsx`
- `native\screens\SearchScreenEnhanced.tsx`
- `native\screens\SharedPostsScreen_Full.tsx`
- `native\screens\SharePostScreen.tsx`
- `native\screens\ShopScreen.tsx`
- `native\screens\StoryHighlightsManagerScreen.tsx`
- `native\screens\StoryViewerEnhanced.tsx`
- `native\screens\StoryViewerScreenEnhanced.tsx`
- `native\screens\SuggestionsScreen.tsx`
- `native\screens\SuggestionsScreenEnhanced.tsx`
- `native\screens\TaggedPostsScreen.tsx`
- `native\screens\TaggedPostsScreen_Full.tsx`
- `native\screens\TrendingScreen.tsx`
- `native\screens\TrendingScreen_Full.tsx`
- `native\screens\ViewersListScreen.tsx`
- `native\screens\WalletScreen.tsx`

### Unoptimized Images
These files use the standard `<Image>` component instead of `FastImage`:
- `native\components\chat\Composer.tsx`
- `native\components\chat\GalleryComposerSheet.tsx`
- `native\components\chat\MediaBubble.tsx`
- `native\components\chat\MessageBubble.tsx`
- `native\components\chat\StickerGifPicker.tsx`
- `native\components\comments\ThreadedComment.tsx`
- `native\components\editor\SkiaCanvas\ElementRenderer.tsx`
- `native\components\editor\SkiaCanvas\SkiaCanvasEditor.tsx`
- `native\components\feed\GlimpseGridItem.tsx`
- `native\components\feed\PostGridItem.tsx`
- `native\components\media\AdvancedImageEditor.tsx`
- `native\components\media\GlimpseStageLayers.tsx`
- `native\components\media\NativeGlimpseEditor.tsx`
- `native\components\media\NativePostImageEditor.tsx`
- `native\components\media\PhotoTagging.tsx`
- `native\components\media\PostMediaPreviewModal.tsx`
- `native\components\media\TextOverlayEditor.tsx`
- `native\components\profile\ProfileBannerEditor.tsx`
- `native\components\profile\ProfileCoverImage.tsx`
- `native\components\share\SharePostModal.tsx`
- `native\components\story\DraggableSticker.tsx`
- `native\components\story\FilterEffects.tsx`
- `native\components\story\GifPicker.tsx`
- `native\components\story\MusicPicker.tsx`
- `native\components\story\MusicSticker.tsx`
- `native\components\story\NativeStoryRenderer.tsx`
- `native\components\story\StoryEditor.tsx`
- `native\components\story\widgets\StoryWidget.tsx`
- `native\components\story\widgets\WidgetStaticQuestion.tsx`
- `native\components\suggestions\SuggestionCarousel.tsx`
- `native\components\ui\CachedImage.tsx`
- `native\components\ui\Toast.tsx`
- `native\screens\ActivityScreen.tsx`
- `native\screens\AppIconScreen.tsx`
- `native\screens\ArchivedStoryViewerScreen.tsx`
- `native\screens\ArchiveScreen.tsx`
- `native\screens\ArchiveScreen_Full.tsx`
- `native\screens\AvatarEditorScreen.tsx`
- `native\screens\BookmarksScreen.tsx`
- `native\screens\ChatProfileScreen.tsx`
- `native\screens\ChatScreen.tsx`
- `native\screens\ChatScreenEnhanced1.tsx`
- `native\screens\ChatScreen_Full.tsx`
- `native\screens\CollectionDetailScreen.tsx`
- `native\screens\CollectionsScreen.tsx`
- `native\screens\CollectionsScreen_Full.tsx`
- `native\screens\CommentsScreenNew.tsx`
- `native\screens\CreatePostScreen.tsx`
- `native\screens\CropScreen.tsx`
- `native\screens\DiscoverScreen.tsx`
- `native\screens\DiscoveryScreen.tsx`
- `native\screens\DiscoveryScreenEnhanced.tsx`
- `native\screens\DiscoveryScreen_Full.tsx`
- `native\screens\DraftsScreen.tsx`
- `native\screens\DraftsScreen_Full.tsx`
- `native\screens\EditorTestScreen.tsx`
- `native\screens\EventsScreen.tsx`
- `native\screens\ExploreScreen.tsx`
- `native\screens\FiltersScreen.tsx`
- `native\screens\FollowRequestsScreen.tsx`
- `native\screens\GameScreen.tsx`
- `native\screens\GlimpseCreateScreen.tsx`
- `native\screens\GlimpseViewerScreenEnhanced.tsx`
- `native\screens\HashtagScreen.tsx`
- `native\screens\HashtagScreen_Full.tsx`
- `native\screens\HighlightsScreen.tsx`
- `native\screens\HighlightsScreen_Full.tsx`
- `native\screens\ImageEditorScreen.tsx`
- `native\screens\LeaderboardScreen.tsx`
- `native\screens\LikedPostsScreen.tsx`
- `native\screens\LikesListScreen.tsx`
- `native\screens\LiveStreamScreenEnhanced.tsx`
- `native\screens\LocationScreen.tsx`
- `native\screens\LocationScreen_Full.tsx`
- `native\screens\LoginScreen.tsx`
- `native\screens\MediaPickerScreen.tsx`
- `native\screens\MentionsScreen.tsx`
- `native\screens\MentionsScreen_Full.tsx`
- `native\screens\MessagesScreenNew.tsx`
- `native\screens\MusicSearchScreen.tsx`
- `native\screens\NewChatScreen.tsx`
- `native\screens\NewGroupScreen.tsx`
- `native\screens\NewPostScreen.tsx`
- `native\screens\NewPostScreenEnhanced.tsx`
- `native\screens\NewPostScreen_Full.tsx`
- `native\screens\NotificationsEnhanced.tsx`
- `native\screens\NotificationsScreen.tsx`
- `native\screens\NotificationsScreenEnhanced.tsx`
- `native\screens\NotificationsScreenNew.tsx`
- `native\screens\NotificationsScreen_Full.tsx`
- `native\screens\PostCreationScreenEnhanced.tsx`
- `native\screens\PostInsightsScreen.tsx`
- `native\screens\PostViewScreen.tsx`
- `native\screens\PostViewScreen_Full.tsx`
- `native\screens\ProfileScreen.tsx`
- `native\screens\ProfileScreenEnhanced.tsx`
- `native\screens\ProfileScreenNew.tsx`
- `native\screens\ReportProblemScreen.tsx`
- `native\screens\RestrictedAccountsScreen.tsx`
- `native\screens\SavedPostsScreen.tsx`
- `native\screens\SavedPostsScreen_Full.tsx`
- `native\screens\SharedPostsScreen_Full.tsx`
- `native\screens\ShopScreen.tsx`
- `native\screens\SignupScreen.tsx`
- `native\screens\SplashScreen.tsx`
- `native\screens\StoryCreateScreen_Full.tsx`
- `native\screens\StoryHighlightsManagerScreen.tsx`
- `native\screens\StoryViewerEnhanced.tsx`
- `native\screens\StoryViewerScreen.tsx`
- `native\screens\StoryViewerScreenComplete.tsx`
- `native\screens\StoryViewerScreenEnhanced.tsx`
- `native\screens\StoryViewerScreen_Full.tsx`
- `native\screens\SuggestionsScreen.tsx`
- `native\screens\TaggedPostsScreen.tsx`
- `native\screens\TaggedPostsScreen_Full.tsx`
- `native\screens\TrendingScreen.tsx`
- `native\screens\ViewersListScreen.tsx`
- `native\screens\WelcomeScreen.tsx`

### Large Files (>200 lines)
- `native\components\media\NativePostImageEditor.tsx`: 3875 lines
- `native\screens\StoryViewerScreenEnhanced.tsx`: 3040 lines
- `native\screens\ProfileScreenEnhanced.tsx`: 2663 lines
- `native\screens\GlimpseViewerScreenEnhanced.tsx`: 2619 lines
- `native\screens\MessagesScreenEnhanced.tsx`: 2370 lines
- `native\screens\ChatScreenEnhanced.tsx`: 2110 lines
- `native\screens\GlimpseCreateScreen.tsx`: 1881 lines
- `native\screens\HomeScreenWorking.tsx`: 1835 lines
- `native\components\media\NativeGlimpseEditor.tsx`: 1792 lines
- `native\screens\NewPostScreenEnhanced.tsx`: 1678 lines
- `native\screens\NotificationsScreenEnhanced.tsx`: 1585 lines
- `native\components\chat\MessageBubble.tsx`: 1521 lines
- `native\components\feed\PostCard.tsx`: 1446 lines
- `native\screens\SearchScreenEnhanced.tsx`: 1431 lines
- `native\screens\GroupInfoScreen.tsx`: 1274 lines
- `native\screens\ProfileScreen.tsx`: 1149 lines
- `native\screens\SettingsScreenEnhanced.tsx`: 1147 lines
- `native\screens\PostViewerScreen.tsx`: 1140 lines
- `native\components\media\TextOverlayEditor.tsx`: 1047 lines
- `native\components\story\InteractiveStickerPanel.tsx`: 958 lines
- `native\components\story\StoryEditor.tsx`: 835 lines
- `native\screens\MessagesScreenEnhanced_Clean.tsx`: 830 lines
- `native\screens\StoryViewerScreenComplete.tsx`: 802 lines
- `native\screens\MessagesScreenEnhanced_Fixed.tsx`: 789 lines
- `native\screens\VideoEditorScreen.tsx`: 772 lines
- `native\screens\SharePostScreen.tsx`: 767 lines
- `native\screens\StoryHighlightsManagerScreen.tsx`: 758 lines
- `native\screens\PostCreationScreenEnhanced.tsx`: 746 lines
- `native\screens\ShopScreen.tsx`: 698 lines
- `native\screens\ChatScreenEnhanced1.tsx`: 696 lines
- `native\screens\StoryEditorScreen.tsx`: 688 lines
- `native\screens\FollowersListScreen.tsx`: 677 lines
- `native\screens\GameScreen.tsx`: 668 lines
- `native\screens\StoryViewerEnhanced.tsx`: 666 lines
- `native\components\live\LiveStreamViewer.tsx`: 650 lines
- `native\screens\FollowingScreen.tsx`: 645 lines
- `native\screens\CommentsScreen.tsx`: 643 lines
- `native\components\story\StoryOverlayRenderer.tsx`: 640 lines
- `native\components\media\PhotoTagging.tsx`: 639 lines
- `native\screens\WalletScreen.tsx`: 639 lines
- `native\screens\NewGroupScreen.tsx`: 632 lines
- `native\screens\EmailPhoneSettingsScreen.tsx`: 625 lines
- `native\screens\EventsScreen.tsx`: 625 lines
- `native\screens\GroupChatSettingsScreen.tsx`: 619 lines
- `native\screens\PostInsightsScreen.tsx`: 617 lines
- `native\screens\SuggestionsScreenEnhanced.tsx`: 611 lines
- `native\screens\DiscoverScreen.tsx`: 607 lines
- `native\components\editor\Tools\WidgetTool.tsx`: 602 lines
- `native\screens\NotificationsEnhanced.tsx`: 594 lines
- `native\screens\ChatScreen.tsx`: 593 lines
- `native\components\story\StoryViewerEnhanced.tsx`: 573 lines
- `native\screens\chat\chatScreen.styles.ts`: 571 lines
- `native\components\profile\OtherUserProfileHeader.tsx`: 563 lines
- `native\components\story\DrawingTool.tsx`: 558 lines
- `native\screens\NewMessageScreen.tsx`: 555 lines
- `native\screens\ReelsScreen.tsx`: 551 lines
- `native\components\profile\OwnProfileHeader.tsx`: 548 lines
- `native\screens\ChatMessageSearchScreen.tsx`: 546 lines
- `native\screens\ImageEditorScreen.tsx`: 541 lines
- `native\screens\ChatScreen_Full.tsx`: 537 lines
- `native\screens\GlimpseAnalyticsScreen.tsx`: 536 lines
- `native\components\story\EnhancedTextEditor.tsx`: 526 lines
- `native\screens\CommentsScreen_Full.tsx`: 521 lines
- `native\screens\LiveStreamViewerScreen.tsx`: 519 lines
- `native\screens\PaymentMethodsScreen.tsx`: 519 lines
- `native\components\story\StoryMediaRenderer.tsx`: 506 lines
- `native\components\editor\Tools\MusicTool.tsx`: 504 lines
- `native\components\chat\MessageForwardModal.tsx`: 503 lines
- `native\components\media\AdvancedImageEditor.tsx`: 502 lines
- `native\screens\ChatProfileScreen.tsx`: 499 lines
- `native\screens\LikesListScreenEnhanced.tsx`: 499 lines
- `native\screens\EditProfileScreen.tsx`: 497 lines
- `native\screens\GlimpsesScreen.tsx`: 497 lines
- `native\screens\ProfileScreenNew.tsx`: 496 lines
- `native\components\story\StoryRenderer.tsx`: 482 lines
- `native\components\story\FilterEffects.tsx`: 481 lines
- `native\components\chat\GalleryComposerSheet.tsx`: 479 lines
- `native\screens\ReportScreen.tsx`: 476 lines
- `native\screens\DiscoveryScreen.tsx`: 469 lines
- `native\screens\MessagesScreen_Full.tsx`: 467 lines
- `native\screens\MutualFollowersScreen.tsx`: 467 lines
- `native\screens\LayoutStyleScreen.tsx`: 463 lines
- `native\screens\DevicesScreen.tsx`: 460 lines
- `native\components\comments\ThreadedComment.tsx`: 454 lines
- `native\components\feed\StoryRing.tsx`: 454 lines
- `native\components\share\SharePostModal.tsx`: 449 lines
- `native\screens\SignupScreen.tsx`: 443 lines
- `native\components\comments\CommentThreadList.tsx`: 435 lines
- `native\components\chat\MediaBubble.tsx`: 429 lines
- `native\screens\DateTimeFormatScreen.tsx`: 427 lines
- `native\components\profile\ProfileBannerEditor.tsx`: 417 lines
- `native\components\ui\Toast.tsx`: 416 lines
- `native\screens\ReportProblemScreen.tsx`: 416 lines
- `native\screens\ArchivedStoryViewerScreen.tsx`: 414 lines
- `native\components\story\StorySettingsModal.tsx`: 408 lines
- `native\screens\NotificationsScreen_Full.tsx`: 407 lines
- `native\screens\NotificationsScreen.tsx`: 402 lines
- `native\screens\AccentColorScreen.tsx`: 399 lines
- `native\screens\ForwardMessageScreen.tsx`: 399 lines
- `native\screens\NewPostScreen_Full.tsx`: 397 lines
- `native\screens\MusicSearchScreen.tsx`: 396 lines
- `native\screens\PostViewScreen.tsx`: 393 lines
- `native\screens\PostViewScreen_Full.tsx`: 393 lines
- `native\screens\ActivityScreen.tsx`: 390 lines
- `native\screens\AppIconScreen.tsx`: 387 lines
- `native\components\suggestions\SuggestionCard.tsx`: 380 lines
- `native\screens\StoryEditorScreenSimple.tsx`: 380 lines
- `native\components\chat\ChatProfileDrawer.tsx`: 375 lines
- `native\components\modals\ViewLikesModal.tsx`: 369 lines
- `native\screens\FontSizeScreenEnhanced.tsx`: 369 lines
- `native\screens\StoryEditorStyles.tsx`: 369 lines
- `native\components\CreateMenu\CreateMenuModal.tsx`: 368 lines
- `native\screens\CommentsScreenNew.tsx`: 367 lines
- `native\components\users\ActiveUsersList.tsx`: 366 lines
- `native\screens\NewPostScreen.tsx`: 366 lines
- `native\components\ui\LoadingSkeleton.tsx`: 361 lines
- `native\screens\MessagesScreenNew.tsx`: 359 lines
- `native\screens\FollowSuggestionsScreenEnhanced.tsx`: 358 lines
- `native\components\ui\CreateMenu.tsx`: 356 lines
- `native\components\suggestions\SuggestionCarousel.tsx`: 354 lines
- `native\components\chat\SharedContentMessage.tsx`: 353 lines
- `native\components\story\StickerPicker.tsx`: 351 lines
- `native\screens\NotificationSettingsScreen.tsx`: 349 lines
- `native\components\story\DraggableSticker.tsx`: 348 lines
- `native\components\editor\SkiaCanvas\SkiaCanvasEditor.tsx`: 342 lines
- `native\screens\LiveStreamScreenEnhanced.tsx`: 342 lines
- `native\components\ProcessingIndicator\ProcessingIndicator.tsx`: 336 lines
- `native\components\story\DraggableText.tsx`: 330 lines
- `native\screens\AvatarEditorScreen.tsx`: 329 lines
- `native\components\media\GlimpseStageLayers.tsx`: 328 lines
- `native\screens\FollowersListScreen_Full.tsx`: 325 lines
- `native\components\chat\VoiceMessageBubble.tsx`: 324 lines
- `native\screens\PrivacySettingsScreen.tsx`: 324 lines
- `native\screens\EditProfileScreen_Full.tsx`: 319 lines
- `native\screens\SettingsScreen.tsx`: 318 lines
- `native\screens\StoryCreateScreen.tsx`: 315 lines
- `native\components\story\EnhancedStoryRing.tsx`: 307 lines
- `native\components\story\ShareOptionsModal.tsx`: 307 lines
- `native\components\editor\NativeStoryEditor.tsx`: 306 lines
- `native\screens\DiscoveryScreen_Full.tsx`: 306 lines
- `native\components\chat\LocationShareSheet.tsx`: 305 lines
- `native\components\ui\EmojiPicker.tsx`: 304 lines
- `native\screens\CreatePostScreen.tsx`: 304 lines
- `native\components\editor\SkiaCanvas\SkiaExporter.tsx`: 303 lines
- `native\screens\NotificationsScreenNew.tsx`: 303 lines
- `native\components\chat\MoreReactionsPicker.tsx`: 298 lines
- `native\components\story\MusicSticker.tsx`: 297 lines
- `native\screens\FollowingScreen_Full.tsx`: 296 lines
- `native\components\media\PostMediaPreviewModal.tsx`: 294 lines
- `native\screens\CollectionDetailScreen.tsx`: 293 lines
- `native\screens\PrivacySettingsScreen_Full.tsx`: 290 lines
- `native\components\story\widgets\StoryWidget.tsx`: 288 lines
- `native\components\chat\StickerGifPicker.tsx`: 287 lines
- `native\screens\SettingsScreen_Full.tsx`: 283 lines
- `native\screens\BioEditorScreen.tsx`: 281 lines
- `native\screens\EmailPhoneScreen.tsx`: 278 lines
- `native\components\editor\Tools\FilterTool.tsx`: 275 lines
- `native\screens\CloseFriendsScreen.tsx`: 271 lines
- `native\components\chat\MessageActionsSheet.tsx`: 269 lines
- `native\components\post\ViewLikesModal.tsx`: 269 lines
- `native\screens\ForgotPasswordScreen.tsx`: 266 lines
- `native\screens\ActivityLogScreen_Full.tsx`: 264 lines
- `native\screens\StoryViewerScreen_Full.tsx`: 264 lines
- `native\screens\TrendingScreen_Full.tsx`: 263 lines
- `native\screens\CloseFriendsScreen_Full.tsx`: 255 lines
- `native\components\story\StoryReactionPicker.tsx`: 252 lines
- `native\screens\LoginScreen.tsx`: 252 lines
- `native\screens\SharedPostsScreen_Full.tsx`: 252 lines
- `native\screens\NotificationSettingsScreen_Full.tsx`: 251 lines
- `native\screens\NewChatScreen.tsx`: 249 lines
- `native\screens\DataUsageScreen_Full.tsx`: 247 lines
- `native\screens\MentionsScreen_Full.tsx`: 247 lines
- `native\components\story\widgets\styles.ts`: 245 lines
- `native\screens\BlockedUsersScreen.tsx`: 245 lines
- `native\screens\TwoFactorAuthScreen.tsx`: 244 lines
- `native\screens\CacheManagementScreen.tsx`: 241 lines
- `native\components\story\StoryPoll.tsx`: 240 lines
- `native\screens\ChatPrivacySafetyScreen.tsx`: 240 lines
- `native\screens\MessagesScreen.tsx`: 240 lines
- `native\components\ProcessingIndicator\ProcessingIndicatorStyles.tsx`: 239 lines
- `native\screens\EditorTestScreen.tsx`: 239 lines
- `native\screens\HideStoryScreen.tsx`: 238 lines
- `native\screens\ContactSupportScreen.tsx`: 234 lines
- `native\components\editor\Tools\DrawingTool.tsx`: 233 lines
- `native\components\editor\Tools\TextTool.tsx`: 233 lines
- `native\components\chat\PollComposer.tsx`: 232 lines
- `native\components\story\MusicPicker.tsx`: 232 lines
- `native\components\CreateMenu\CreateMenuStyles.tsx`: 231 lines
- `native\screens\HashtagScreen_Full.tsx`: 231 lines
- `native\screens\LikesScreen_Full.tsx`: 231 lines
- `native\components\story\EditInteractiveStickerModal.tsx`: 230 lines
- `native\components\story\widgets\WidgetStaticPoll.tsx`: 229 lines
- `native\screens\SecuritySettingsScreen_Full.tsx`: 227 lines
- `native\components\navigation\ModernTabBar.tsx`: 224 lines
- `native\screens\AppearanceSettingsScreen_Full.tsx`: 224 lines
- `native\screens\CollectionsScreen.tsx`: 224 lines
- `native\components\story\StoryPostStyleEditor.tsx`: 223 lines
- `native\components\ui\HashtagAutocomplete.tsx`: 222 lines
- `native\screens\ExploreScreen.tsx`: 222 lines
- `native\components\story\GifPicker.tsx`: 221 lines
- `native\screens\ChangePasswordScreen_Full.tsx`: 221 lines
- `native\screens\DiscoveryScreenEnhanced.tsx`: 220 lines
- `native\screens\HelpCenterScreen_Full.tsx`: 218 lines
- `native\components\story\widgets\WidgetStaticSlider.tsx`: 214 lines
- `native\screens\ArchiveScreen_Full.tsx`: 214 lines
- `native\components\story\NativeStoryRenderer.tsx`: 208 lines
- `native\screens\DraftsScreen_Full.tsx`: 208 lines
- `native\screens\CollectionsScreen_Full.tsx`: 206 lines
- `native\screens\DevMenuScreen.tsx`: 206 lines
- `native\screens\StoryViewerScreen.tsx`: 206 lines
- `native\screens\WebStoryViewerScreen.tsx`: 206 lines
- `native\components\editor\SkiaCanvas\ElementRenderer.tsx`: 204 lines
- `native\screens\DeleteAccountScreen.tsx`: 202 lines
- `native\screens\MutedAccountsScreen.tsx`: 202 lines

---

## 7. CACHING AND DATA FLOW

### Firestore Integrations

### Supabase Integrations

### Local Caching
Files utilizing AsyncStorage or MMKV:
- `native\components\story\ShareOptionsModal.tsx`
- `native\screens\AccentColorScreen.tsx`
- `native\screens\AppearanceSettingsScreen_Full.tsx`
- `native\screens\AppIconScreen.tsx`
- `native\screens\ChatScreenEnhanced.tsx`
- `native\screens\ChatScreenEnhanced1.tsx`
- `native\screens\DataUsageScreen_Full.tsx`
- `native\screens\DateTimeFormatScreen.tsx`
- `native\screens\FontSizeScreen.tsx`
- `native\screens\FontSizeScreenEnhanced.tsx`
- `native\screens\LanguageSettingsScreen_Full.tsx`
- `native\screens\LayoutStyleScreen.tsx`
- `native\screens\MessagesScreenEnhanced.tsx`
- `native\screens\SearchScreenEnhanced.tsx`
- `native\screens\StoryViewerScreenEnhanced.tsx`

---

## 8. STRUCTURE HEALTH

- **God Components**: The files listed in the "Large Files" section (especially those over 400 lines) are God Components. They should be split into smaller, modular components.
- **State Colocation**: Files with 8+ state hooks should move state management to `zustand` or `useReducer`.
- **Inline Styles**: Inspect the project for inline styles; use `StyleSheet.create` or your `nativewind` utility classes uniformly.

---

## 9. SIZE CONTRIBUTORS

1. **@shopify/react-native-skia** (Large C++ dependency)
2. **firebase** and **firebase-admin** (Heavy SDKs)
3. **expo-av** and **expo-camera** (Media libraries)
4. **konva** and **react-konva** (Canvas rendering)
5. **react-native-webview**

*Action:* Ensure ProGuard is enabled for Android (minifyEnabled true in build.gradle) and Hermes engine is turned on to optimize bundle size and startup time.

---

## 10. PRIORITY FIX LIST

### Top 5 Critical Issues:
1. **Refactor God Components**: Split up `native\components\media\NativePostImageEditor.tsx` into smaller, focused components.
2. **Fix List Rendering**: Add `keyExtractor` and `getItemLayout` to FlatLists in `native\components\chat\GalleryComposerSheet.tsx`.
3. **Optimize Images**: Replace `<Image>` with `FastImage` or Expo Image in heavy screens like `native\components\chat\Composer.tsx`.
4. **Extract Logic**: Move state management out of `NativePostImageEditor` into custom hooks.
5. **Decouple Database Calls**: Move direct Firestore/Supabase calls from screens into dedicated service files or hooks.

### Top 5 Performance Improvements:
1. **React.memo**: Wrap heavily re-rendered child components in `React.memo`.
2. **useCallback**: Ensure functions passed as props (especially to FlatList items) are wrapped in `useCallback`.
3. **Hermes**: Verify Hermes is enabled for both iOS and Android builds.
4. **Caching**: Cache static database responses using AsyncStorage to reduce network reads.
5. **Pagination**: Implement pagination/infinite scrolling for all long lists fetching from Firestore.

### Top 5 Size Reduction Actions:
1. **ProGuard**: Enable ProGuard for Android release builds.
2. **Media Formats**: Convert all static PNG/JPG assets to WebP format.
3. **Tree Shaking**: Ensure `babel-plugin-transform-imports` or similar is used if importing large icon libraries.
4. **Audit Firebase**: If you only use Firestore/Auth, import specifically from those sub-modules instead of the entire firebase package.
5. **Remove Unused Assets**: Delete any images/fonts in the assets folder that are no longer referenced in the code.
