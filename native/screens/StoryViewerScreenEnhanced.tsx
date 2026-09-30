import React, { useRef, useState, useMemo } from 'react';
import {
  View,
  Dimensions,
  StatusBar,
  Animated,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
  Text
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Video, ResizeMode, Audio } from 'expo-av';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { StoryMediaRenderer } from '../components/story/StoryMediaRenderer';
import { StoryOverlayRenderer } from '../components/story/StoryOverlayRenderer';
import { getDefaultCanvasConfig, calculatePositionScale } from '../constants/storyCanvas';
import { useStoryViewerStore } from "./StoryViewerScreenEnhanced/useStoryViewerStore";
import { styles } from "./StoryViewerScreenEnhanced/styles";
import { STORY_DURATION } from "./StoryViewerScreenEnhanced/constants";

// Hooks
import { useStoryViewerInitialization } from './StoryViewerScreenEnhanced/hooks/useStoryViewerInitialization';
import { useStoryViewerWebFallback } from './StoryViewerScreenEnhanced/hooks/useStoryViewerWebFallback';
import { useStoryViewerPlayback } from './StoryViewerScreenEnhanced/hooks/useStoryViewerPlayback';
import { useStoryViewerInteractions } from './StoryViewerScreenEnhanced/hooks/useStoryViewerInteractions';
import { useStoryViewerNavigation } from './StoryViewerScreenEnhanced/hooks/useStoryViewerNavigation';
import { useStoryViewerGestures } from './StoryViewerScreenEnhanced/hooks/useStoryViewerGestures';
import { useStoryViewerWidgets } from './StoryViewerScreenEnhanced/hooks/useStoryViewerWidgets';

// Components
import { StoryViewerHeader } from './StoryViewerScreenEnhanced/components/StoryViewerHeader';
import { StoryViewerFooter } from './StoryViewerScreenEnhanced/components/StoryViewerFooter';
import { StoryViewerModals } from './StoryViewerScreenEnhanced/components/StoryViewerModals';
import { StoryViewerGestures } from './StoryViewerScreenEnhanced/components/StoryViewerGestures';

const { width, height } = Dimensions.get('window');

export default function StoryViewerScreenEnhanced({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { userId, storyIndex = 0, storyId, startFromEnd = false } = route.params || {};
  const { user: currentUser } = useAuth();

  // Store selections
  const stories = useStoryViewerStore(s => s.stories);
  const currentStory = useStoryViewerStore(s => s.currentStory);
  const storyUser = useStoryViewerStore(s => s.storyUser);
  const loading = useStoryViewerStore(s => s.loading);
  const isPaused = useStoryViewerStore(s => s.isPaused);
  const setIsPaused = useStoryViewerStore(s => s.setIsPaused);
  const isTyping = useStoryViewerStore(s => s.isTyping);
  const setIsTyping = useStoryViewerStore(s => s.setIsTyping);
  const isLiked = useStoryViewerStore(s => s.isLiked);
  const replyText = useStoryViewerStore(s => s.replyText);
  const setReplyText = useStoryViewerStore(s => s.setReplyText);
  const showInsights = useStoryViewerStore(s => s.showInsights);
  const setShowInsights = useStoryViewerStore(s => s.setShowInsights);
  const loadingInsights = useStoryViewerStore(s => s.loadingInsights);
  const insightsUsers = useStoryViewerStore(s => s.insightsUsers);
  const viewersData = useStoryViewerStore(s => s.viewersData);
  const likersData = useStoryViewerStore(s => s.likersData);
  const showMoreMenu = useStoryViewerStore(s => s.showMoreMenu);
  const setShowMoreMenu = useStoryViewerStore(s => s.setShowMoreMenu);
  const setShowDeleteDialog = useStoryViewerStore(s => s.setShowDeleteDialog);
  const mediaNaturalSize = useStoryViewerStore(s => s.mediaNaturalSize);
  const setMediaNaturalSize = useStoryViewerStore(s => s.setMediaNaturalSize);
  const widgetsOverlays = useStoryViewerStore(s => s.widgetsOverlays);
  const webRendererReady = useStoryViewerStore(s => s.webRendererReady);

  const questionModal = useStoryViewerStore(s => s.questionModal);
  const setQuestionModal = useStoryViewerStore(s => s.setQuestionModal);
  const questionRepliesModal = useStoryViewerStore(s => s.questionRepliesModal);
  const setQuestionRepliesModal = useStoryViewerStore(s => s.setQuestionRepliesModal);
  const questionReplies = useStoryViewerStore(s => s.questionReplies);
  const sentToastText = useStoryViewerStore(s => s.sentToastText);

  const pollResults = useStoryViewerStore(s => s.pollResults);
  const myPollVote = useStoryViewerStore(s => s.myPollVote);
  const sliderStats = useStoryViewerStore(s => s.sliderStats);
  const mySliderValue = useStoryViewerStore(s => s.mySliderValue);
  const sliderWidths = useStoryViewerStore(s => s.sliderWidths);
  const setSliderWidths = useStoryViewerStore(s => s.setSliderWidths);
  const quizResults = useStoryViewerStore(s => s.quizResults);
  const myQuizAnswer = useStoryViewerStore(s => s.myQuizAnswer);
  const questionCounts = useStoryViewerStore(s => s.questionCounts);
  const activeQuestion = useStoryViewerStore(s => s.activeQuestion);

  const currentStoryData = stories[currentStory];
  const isOwnStory = currentUser?.userId === (currentStoryData?.authorId || userId);
  const canReply = !isOwnStory && (currentStoryData?.allowReplies !== false);
  const canShare = isOwnStory || currentStoryData?.allowSharing !== false;

  const audioSoundRef = useRef<any>(null);
  const videoRef = useRef<any>(null);
  const tapRef = useRef(null);
  const doubleTapRef = useRef(null);
  const panRef = useRef(null);
  const interactingRef = useRef(false);
  const trimWindowRef = useRef({ startMs: 0, endMs: 0 });
  const externalViewerRef = useRef<any>(null);

  // Initialize Data
  useStoryViewerInitialization(userId, storyId, storyIndex, startFromEnd, currentUser, navigation);

  // Web Fallback Logic
  const viewerUrl = `https://native-glimpse-web-viewer.app/?storyId=${currentStoryData?.storyId}`;
  const { useWebView, useExternalViewer, handleViewerMessage, handleWebViewFailure, preferSoftwareLayer, webViewKey } = useStoryViewerWebFallback(currentStoryData, viewerUrl);

  // Navigation Logic
  const { handleNext, handlePrevious } = useStoryViewerNavigation(currentUser, currentStoryData, userId, navigation, audioSoundRef);

  // Playback Logic
  const { progressAnim, shouldPausePlayback } = useStoryViewerPlayback(currentStoryData, handleNext);

  // Interactions (Like, Share, Reply)
  const { handleLike, handleShare, handleSendReply, sendQuickReaction, toggleCurrentStorySetting, handleDoubleTap, handleDeleteStory, likeBurstOpacity, likeBurstScale, toastOpacity } = useStoryViewerInteractions(currentUser, currentStoryData, isOwnStory, canReply, canShare, storyUser, userId, navigation);

  // Gestures
  const { handleMediaPress, handleLongPress, handlePressIn, handlePressOut, handleGlobalTouchStart, handleGlobalTouchEnd, handleSwipeDown, togglePausePlayback } = useStoryViewerGestures(navigation, handleNext, handlePrevious, handleDoubleTap, interactingRef);

  // Widgets
  const { handlePollVote, handleSliderSet, handleQuizAnswer, openQuestionReplies, sendInlineQuestionReply, sendQuestionReply } = useStoryViewerWidgets(currentUser, currentStoryData, isOwnStory, canReply, interactingRef);

  const openCurrentStorySettings = () => {
    // simple pass through
    toggleCurrentStorySetting('allowReplies');
  };

  const canvasConfig = useMemo(() => getDefaultCanvasConfig(), [width, height]);
  // @ts-ignore
  const positionSpace = useMemo(() => calculatePositionScale(width, height, mediaNaturalSize?.width, mediaNaturalSize?.height), [width, height, mediaNaturalSize]);
  
  const ownerAudiencePreview = useMemo(() => insightsUsers.slice(0, 3), [insightsUsers]);
  const stickersToRender = useMemo(() => {
    const sId = currentStoryData?.storyId;
    if (sId && currentStoryData?.hasWidgets && Array.isArray(widgetsOverlays[sId])) return widgetsOverlays[sId];
    return Array.isArray(currentStoryData?.stickers) ? currentStoryData.stickers : [];
  }, [currentStoryData, widgetsOverlays]);

  if (loading || (!loading && stories.length === 0)) {
    return (
      <View style={styles.loadingContainer}>
        {loading ? <ActivityIndicator size="large" color="#0af" /> : <Text style={styles.loadingText}>No active stories</Text>}
      </View>
    );
  }

  return (
    <View style={styles.container} onTouchStart={handleGlobalTouchStart} onTouchEnd={handleGlobalTouchEnd} onTouchCancel={handleGlobalTouchEnd}>
      <StatusBar barStyle="light-content" backgroundColor="black" />
      
      <StoryViewerHeader
        insets={insets}
        stories={stories}
        currentStory={currentStory}
        progressAnim={progressAnim}
        storyUser={storyUser}
        currentStoryData={currentStoryData}
        isPaused={isPaused}
        togglePausePlayback={togglePausePlayback}
        setShowMoreMenu={setShowMoreMenu}
      />

      <StoryViewerGestures
        useWebView={useWebView}
        tapRef={tapRef}
        doubleTapRef={doubleTapRef}
        panRef={panRef}
        setIsPaused={setIsPaused}
        handleDoubleTap={handleDoubleTap}
        handleSwipeDown={handleSwipeDown}
      >
        <Animated.View style={styles.storyContent} onTouchStart={() => setIsPaused(true)} onTouchEnd={() => setIsPaused(false)} onTouchCancel={() => setIsPaused(false)}>
          <TouchableOpacity style={styles.storyMedia} onPressIn={handlePressIn} onLongPress={handleLongPress} onPressOut={handlePressOut} activeOpacity={1} onPress={handleMediaPress}>
            {useWebView && currentStoryData ? (
              useExternalViewer ? (
                <WebView
                  ref={externalViewerRef}
                  key={webViewKey}
                  originWhitelist={["*"]}
                  source={{ uri: viewerUrl }}
                  onMessage={handleViewerMessage}
                  onError={() => handleWebViewFailure('onError')}
                  style={{ flex: 1, backgroundColor: '#000' }}
                />
              ) : (
                <StoryMediaRenderer
                  mediaURL={currentStoryData.mediaURL}
                  mediaType={currentStoryData.mediaType || 'image'}
                  storyData={{
                    textElements: currentStoryData.textElements,
                    stickers: stickersToRender,
                    drawings: currentStoryData.drawings,
                    filters: currentStoryData.filters,
                    audioOverlay: currentStoryData?.audioOverlay,
                    mediaWidth: currentStoryData.mediaWidth,
                    mediaHeight: currentStoryData.mediaHeight,
                    // @ts-ignore
                    positionSpace: positionSpace,
                  }}
                  isPaused={shouldPausePlayback}
                />
              )
            ) : (
              currentStoryData?.mediaType === 'video' ? (
                <Video
                  ref={videoRef}
                  source={{ uri: currentStoryData.mediaURL }}
                  style={styles.storyImage as any}
                  resizeMode={ResizeMode.CONTAIN}
                  shouldPlay={!shouldPausePlayback}
                  onPlaybackStatusUpdate={(s: any) => {
                    if (s?.isLoaded && s.positionMillis >= (s.durationMillis || 15000) - 50) handleNext();
                  }}
                />
              ) : (
                <Image source={{ uri: currentStoryData?.mediaURL }} style={styles.storyImage as any} contentFit="contain" />
              )
            )}

            {!useWebView && (
              <StoryOverlayRenderer
                containerWidth={width}
                containerHeight={height}
                mediaWidth={mediaNaturalSize?.width}
                mediaHeight={mediaNaturalSize?.height}
                // @ts-ignore
                positionSpace={positionSpace}
                canvasConfig={canvasConfig}
                textElements={currentStoryData?.textElements || []}
                stickers={stickersToRender}
                drawings={currentStoryData?.drawings || []}
                isInteractive={true}
                isPaused={shouldPausePlayback}
                isOwnStory={isOwnStory}
                pollResults={pollResults}
                myPollVote={myPollVote}
                onPollVote={handlePollVote}
                sliderStats={sliderStats}
                mySliderValue={mySliderValue}
                onSliderSet={handleSliderSet}
                sliderWidths={sliderWidths}
                onSliderLayout={(id, w) => setSliderWidths((p: any) => ({ ...p, [id]: w }))}
                quizResults={quizResults}
                myQuizAnswer={myQuizAnswer}
                onQuizAnswer={handleQuizAnswer}
                questionCounts={questionCounts}
                activeQuestion={activeQuestion as any}
                onQuestionPress={() => {}}
                onQuestionTextChange={() => {}}
                onQuestionSubmit={sendInlineQuestionReply}
                onQuestionCancel={() => setIsPaused(false)}
                onViewQuestionReplies={openQuestionReplies}
              />
            )}

            <Animated.View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', opacity: likeBurstOpacity, transform: [{ scale: likeBurstScale }] }}>
              <Ionicons name="heart" size={54} color="rgba(255,64,102,0.95)" />
            </Animated.View>
          </TouchableOpacity>
        </Animated.View>
      </StoryViewerGestures>

      <StoryViewerFooter
        insets={insets}
        isOwnStory={isOwnStory}
        canReply={canReply}
        isTyping={isTyping}
        setIsTyping={setIsTyping}
        setIsPaused={setIsPaused}
        replyText={replyText}
        setReplyText={setReplyText}
        handleSendReply={handleSendReply}
        sendQuickReaction={sendQuickReaction}
        handleLike={handleLike}
        isLiked={isLiked}
        heartButtonScale={new Animated.Value(1)}
        ownerAudiencePreview={ownerAudiencePreview}
        viewersData={viewersData}
        openInsights={() => { setShowInsights(true); setIsPaused(true); }}
        handleShare={handleShare}
        setShowMoreMenu={setShowMoreMenu}
        navigation={navigation}
        storyUser={storyUser}
      />

      {!!sentToastText && (
        <Animated.View pointerEvents="none" style={[styles.sentToastWrap, { opacity: toastOpacity }]}>
          <Text style={styles.sentToastText}>{sentToastText}</Text>
        </Animated.View>
      )}

      <StoryViewerModals
        isOwnStory={isOwnStory}
        canReply={canReply}
        showInsights={showInsights}
        setShowInsights={setShowInsights}
        loadingInsights={loadingInsights}
        insightsUsers={insightsUsers}
        viewersData={viewersData}
        likersData={likersData}
        setIsPaused={setIsPaused}
        showMoreMenu={showMoreMenu}
        setShowMoreMenu={setShowMoreMenu}
        setShowDeleteDialog={setShowDeleteDialog}
        openCurrentStorySettings={openCurrentStorySettings}
        handleShare={handleShare}
        navigation={navigation}
        userId={userId}
        questionModal={questionModal as any}
        setQuestionModal={setQuestionModal}
        sendQuestionReply={sendQuestionReply}
        questionRepliesModal={questionRepliesModal as any}
        setQuestionRepliesModal={setQuestionRepliesModal}
        questionReplies={questionReplies}
      />
    </View>
  );
}
