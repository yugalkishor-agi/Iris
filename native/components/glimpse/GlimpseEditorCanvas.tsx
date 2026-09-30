import React from 'react';
import { View, StyleSheet, Pressable, Text, TextInput, Animated } from 'react-native';
import { Image } from 'expo-image';
import { Video, ResizeMode } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { GlimpseStageAssetLayer } from '../media/GlimpseStageLayers';
import { GlimpseStageTextLayer } from '../media/GlimpseStageLayers';
import { formatDuration } from '../../utils/glimpse/glimpseEditorCalculations';
import { GlimpseStylePreset, GlimpseOverlayLayer } from '../../utils/glimpse/glimpseEditorTypes';
import { typography, spacing } from '../../styles/theme';

interface GlimpseEditorCanvasProps {
  mediaType: 'image' | 'video';
  mediaUri: string;
  videoRef: React.RefObject<Video>;
  canvasRef: React.RefObject<View>;
  inputRef: React.RefObject<TextInput>;
  muted: boolean;
  internalVolume: number;
  selectedStyle: GlimpseStylePreset;
  overlayLayers: GlimpseOverlayLayer[];
  selectedCanvasLayer: string | null;
  canvasFrame: { width: number; height: number };
  stageWindowOffset: { x: number; y: number };
  handleSelectOverlayLayer: (id: string) => void;
  handleUpdateOverlayLayer: (id: string, updates: Partial<GlimpseOverlayLayer>) => void;
  currentPosition: number;
  effectiveTrimEnd: number;
  isPlaying: boolean;
  togglePlayback: () => void;
  toggleMuted: () => void;
  setVideoLoaded: (val: boolean) => void;
  setVideoError: (err: string | null) => void;
  handlePlaybackStatusUpdate: (status: any) => void;
  videoError: string | null;
  videoLoaded: boolean;
  clearCanvasSelection: () => void;
  
  // Text preview props
  displayedOverlayText: string;
  composerVisible: boolean;
  textOffset: { x: number; y: number };
  textScale: number;
  textRotation: number;
  getTextBackground: () => any;
  handleSelectTextLayer: () => void;
  handleTextPositionChange: (x: number, y: number) => void;
  handleTextScaleChange: (scale: number) => void;
  handleTextRotationChange: (rotation: number) => void;
  animatedTextWrapStyle: any;
  textColor: string;
  overlayFont: string;
  fontSize: number;
  overlayAlign: 'left' | 'center' | 'right';
  getTextShadow: () => any;
  overlayText: string;
  setOverlayText: (val: string) => void;
  overlayColor: string;
}

export function GlimpseEditorCanvas({
  mediaType, mediaUri, videoRef, canvasRef, inputRef, muted, internalVolume,
  selectedStyle, overlayLayers, selectedCanvasLayer, canvasFrame, stageWindowOffset,
  handleSelectOverlayLayer, handleUpdateOverlayLayer, currentPosition, effectiveTrimEnd,
  isPlaying, togglePlayback, toggleMuted, setVideoLoaded, setVideoError,
  handlePlaybackStatusUpdate, videoError, videoLoaded, clearCanvasSelection,
  displayedOverlayText, composerVisible, textOffset, textScale, textRotation,
  getTextBackground, handleSelectTextLayer, handleTextPositionChange, handleTextScaleChange,
  handleTextRotationChange, animatedTextWrapStyle, textColor, overlayFont, fontSize,
  overlayAlign, getTextShadow, overlayText, setOverlayText, overlayColor
}: GlimpseEditorCanvasProps) {

  const renderTextPreview = () => {
    const value = displayedOverlayText.trim() || (composerVisible ? 'Type text' : '');
    if (!value) return null;
    return (
      <GlimpseStageTextLayer
        text={value}
        x={textOffset.x}
        y={textOffset.y}
        scale={textScale}
        rotation={textRotation}
        selected={selectedCanvasLayer === 'text'}
        editable={composerVisible}
        canvasWidth={canvasFrame.width}
        canvasHeight={canvasFrame.height}
        stageWindowOffset={stageWindowOffset}
        shellStyle={getTextBackground()}
        onSelect={handleSelectTextLayer}
        onChangePosition={handleTextPositionChange}
        onChangeScale={handleTextScaleChange}
        onChangeRotation={handleTextRotationChange}
        input={(
          <Animated.View style={animatedTextWrapStyle || undefined}>
            <TextInput
              ref={inputRef}
              style={[styles.textInput, { color: textColor, fontFamily: overlayFont, fontSize, textAlign: overlayAlign }, getTextShadow()]}
              value={overlayText}
              onChangeText={setOverlayText}
              placeholder="Type text"
              placeholderTextColor="rgba(255,255,255,0.52)"
              multiline={false}
              numberOfLines={1}
              autoCorrect={false}
              autoCapitalize="sentences"
              blurOnSubmit={false}
              scrollEnabled={false}
              returnKeyType="done"
              maxLength={120}
            />
          </Animated.View>
        )}
        output={(
          <Animated.View style={animatedTextWrapStyle || undefined}>
            <Text style={[styles.textValue, { color: textColor, fontFamily: overlayFont, fontSize, textAlign: overlayAlign }, getTextShadow()]} numberOfLines={1} ellipsizeMode="clip" adjustsFontSizeToFit minimumFontScale={0.32}>
              {value}
            </Text>
          </Animated.View>
        )}
      />
    );
  };

  return (
    <View style={styles.stageShell}>
      <View ref={canvasRef} style={styles.canvas} onLayout={(event) => { /* Layout handling lifted to parent */ }}>
        <Pressable style={StyleSheet.absoluteFill} onPress={clearCanvasSelection} />
        {mediaType === 'video' ? (
          <Video
            ref={videoRef}
            source={{ uri: mediaUri }}
            pointerEvents="none"
            style={styles.canvasMedia}
            resizeMode={ResizeMode.COVER}
            shouldPlay={false}
            isMuted={muted}
            volume={muted ? 0 : internalVolume}
            isLooping={false}
            progressUpdateIntervalMillis={80}
            onLoad={() => { setVideoLoaded(true); setVideoError(null); }}
            onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
            onError={(error) => { setVideoError(String(error)); }}
          />
        ) : (
          <Image source={{ uri: mediaUri }} style={styles.canvasMedia} contentFit="cover" />
        )}
        {selectedStyle.tintColor ? <View pointerEvents="none" style={[styles.tint, { backgroundColor: selectedStyle.tintColor, opacity: selectedStyle.tintOpacity || 0 }]} /> : null}
        <LinearGradient pointerEvents="none" colors={selectedStyle.gradient} style={[styles.gradient, { opacity: selectedStyle.overlayOpacity }]} />
        {selectedStyle.shadowColor ? <View pointerEvents="none" style={[styles.shadow, { backgroundColor: selectedStyle.shadowColor, opacity: selectedStyle.shadowOpacity || 0 }]} /> : null}
        
        {overlayLayers.map((layer) => (
          <GlimpseStageAssetLayer
            key={layer.id}
            layer={layer}
            selected={selectedCanvasLayer === layer.id}
            canvasWidth={canvasFrame.width}
            canvasHeight={canvasFrame.height}
            stageWindowOffset={stageWindowOffset}
            onSelect={handleSelectOverlayLayer}
            onUpdate={handleUpdateOverlayLayer}
          />
        ))}

        <View pointerEvents="none" style={styles.stageTop}><Text style={styles.stageBadge}>{selectedStyle.label}</Text></View>
        
        {renderTextPreview()}
        
        {videoError ? <View pointerEvents="none" style={styles.statusPill}><Text style={styles.statusText}>Video preview issue. Keep editing and save.</Text></View> : null}
        {mediaType === 'video' && !videoLoaded && !videoError ? <View pointerEvents="none" style={styles.statusPill}><Text style={styles.statusText}>Preparing video...</Text></View> : null}
        
        {mediaType === 'video' ? (
          <View style={styles.previewControls}>
            <View style={styles.previewTimePill}><Text style={styles.previewTimeText}>{formatDuration(currentPosition)} / {formatDuration(effectiveTrimEnd)}</Text></View>
            <Pressable style={styles.previewButton} onPress={togglePlayback}>
              <Ionicons name={isPlaying ? 'pause' : 'play'} size={16} color="#FFFFFF" />
            </Pressable>
            <Pressable style={styles.previewButton} onPress={toggleMuted}>
              <Ionicons name={muted ? 'volume-mute-outline' : 'volume-high-outline'} size={16} color="#FFFFFF" />
            </Pressable>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stageShell: { flex: 1, backgroundColor: '#02040A', marginHorizontal: spacing.md, marginBottom: spacing.md, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  canvas: { flex: 1, position: 'relative', overflow: 'hidden' },
  canvasMedia: { ...StyleSheet.absoluteFillObject },
  tint: { ...StyleSheet.absoluteFillObject },
  gradient: { ...StyleSheet.absoluteFillObject },
  shadow: { ...StyleSheet.absoluteFillObject },
  stageTop: { position: 'absolute', top: 12, left: 12, right: 12, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', zIndex: 5 },
  stageBadge: { backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, color: '#FFFFFF', fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold as any, textTransform: 'uppercase', letterSpacing: 0.5 },
  statusPill: { position: 'absolute', bottom: 64, left: 24, right: 24, backgroundColor: 'rgba(0,0,0,0.8)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  statusText: { color: '#FFFFFF', fontSize: typography.fontSize.sm },
  previewControls: { position: 'absolute', bottom: 16, left: 16, right: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 5 },
  previewTimePill: { backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  previewTimeText: { color: '#FFFFFF', fontSize: 13, fontWeight: typography.fontWeight.semibold as any },
  previewButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  textInput: { minWidth: 120 },
  textValue: { minWidth: 120 },
});
