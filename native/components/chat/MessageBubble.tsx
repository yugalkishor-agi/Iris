import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Animated, LayoutAnimation, UIManager, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import MediaBubble from './MediaBubble';
import VoiceMessageBubble from './VoiceMessageBubble';
import PollBubble from './PollBubble';
import LocationBubble from './LocationBubble';
import SharedCard from './SharedCard';
import { SharedContentMessage } from './SharedContentMessage';
import { Avatar } from '../ui/Avatar';
import { Image } from 'expo-image';

type MessageBubbleProps = {
  item: any;
  replySource?: any;
  isMe: boolean;
  isLatestMine: boolean;
  latestSeenMineMessageId?: string | null;
  seenLabel?: string;
  seenReaders?: Array<{ userId: string; avatarURL?: string | null; fallbackText?: string }>; 
  isVisible: boolean;
  reaction?: string;
  reactions?: Record<string, string>;
  reactionUsersById?: Record<string, any | null>;
  isGroupConversation?: boolean;
  otherUserAvatar?: string;
  otherUserId?: string;
  showSenderAvatar?: boolean;
  senderLabel?: string;
  onSenderPress?: (msg: any) => void;
  formatTime: (ts: any) => string;
  canShowReadReceipts?: boolean;
  onBubbleTap: (msg: any) => void;
  onReactionPress?: (msg: any, reactions: Record<string, string>) => void;
  onReply?: (msg: any) => void;
  onPinToggle?: (msg: any) => void;
  onLongPressAction?: (msg: any, anchor?: { x: number; y: number; width: number; height: number; isMe: boolean }) => void;
  onQuickForward?: (msg: any) => void;
  onEditedPress?: (msg: any) => void;
  onCollaborationAccept?: (msg: any) => void;
  onCollaborationDecline?: (msg: any) => void;
  isEdited?: boolean;
  stylesRef: ReturnType<typeof StyleSheet.create> | any;
  isFirstInGroup?: boolean;
  isLastInGroup?: boolean;
  accentColor?: string;
  showTimelineTime?: boolean;
  timelineSwipeTranslateX?: Animated.AnimatedInterpolation<number> | Animated.Value | number;
  timelineTimeOpacity?: Animated.AnimatedInterpolation<number> | Animated.Value | number;
  enableReplySwipe?: boolean;
  onBubbleTouchStateChange?: (isTouching: boolean) => void;
  enableEntryAnimation?: boolean;
  simultaneousScrollRef?: any;
};

const alpha = (color: string, opacity: number) => {
  return `${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`;
};

const REPLY_SWIPE_LIMIT = 36;
const REPLY_TRIGGER_DISTANCE = 20;
const PRESS_IN_SCALE = 0.994;
const LONG_PRESS_SCALE = 0.978;

const MessageBubble: React.FC<MessageBubbleProps> = ({
  item,
  replySource,
  isMe,
  isLatestMine,
  latestSeenMineMessageId,
  seenLabel,
  seenReaders,
  isVisible,
  reaction,
  reactions,
  reactionUsersById,
  isGroupConversation = false,
  otherUserAvatar,
  otherUserId,
  showSenderAvatar = true,
  senderLabel,
  onSenderPress,
  formatTime,
  canShowReadReceipts = true,
  onBubbleTap,
  onReactionPress,
  onReply,
  onPinToggle,
  onLongPressAction,
  onEditedPress,
  onCollaborationAccept,
  onCollaborationDecline,
  isEdited,
  stylesRef,
  isFirstInGroup = true,
  isLastInGroup = true,
  accentColor = '#38bdf8',
  showTimelineTime = false,
  timelineSwipeTranslateX = 0,
  timelineTimeOpacity = 1,
  enableReplySwipe = true,
  onBubbleTouchStateChange,
  enableEntryAnimation = true,
  simultaneousScrollRef,
}) => {
  const [messageExpanded, setMessageExpanded] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'android') {
      UIManager.setLayoutAnimationEnabledExperimental?.(true);
    }
  }, []);

  const toggleMessageExpanded = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setMessageExpanded((prev) => !prev);
  }, []);
  const showAvatar = showSenderAvatar && !isMe && isLastInGroup;
  const s = stylesRef;
  const bubbleMeasureRef = useRef<View | null>(null);
  const hasAnimatedRef = useRef(false);
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(8)).current;
  const translateXAnim = useRef(new Animated.Value(isMe ? 10 : -10)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const replyDragAnim = useRef(new Animated.Value(0)).current;
  const tapPopAnim = useRef(new Animated.Value(1)).current;
  const longPressTriggeredRef = useRef(false);
  const reactionScaleAnim = useRef(new Animated.Value(0.78)).current;
  const reactionOpacityAnim = useRef(new Animated.Value(0)).current;
  const reactionLiftAnim = useRef(new Animated.Value(6)).current;
  const previousReactionRef = useRef<string>('');
  const isDeletedMessage = item.isDeleted === true;
  const resolvedReactions = useMemo(() => {
    if (reactions && typeof reactions === 'object' && !Array.isArray(reactions)) {
      return Object.entries(reactions)
        .filter(([uid, emo]) => !!uid && typeof emo === 'string' && emo.trim().length > 0)
        .reduce((acc, [uid, emo]) => {
          acc[uid] = emo;
          return acc;
        }, {} as Record<string, string>);
    }

    if (reaction && reaction.trim().length > 0) {
      return { __legacy: reaction } as Record<string, string>;
    }

    return {} as Record<string, string>;
  }, [reaction, reactions]);

  const reactionSummary = useMemo(() => {
    const entries = Object.entries(resolvedReactions);
    const total = entries.length;
    if (total === 0) {
      return { total: 0, text: '', map: resolvedReactions };
    }

    const counts: Record<string, number> = {};
    entries.forEach(([, emo]) => {
      counts[emo] = (counts[emo] || 0) + 1;
    });

    const ordered = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([emo]) => emo);
    const emojiRail = ordered.slice(0, 3).join(' ');
    const text = total > 1 ? `${emojiRail} ${total}` : emojiRail;

    return { total, text, map: resolvedReactions };
  }, [resolvedReactions]);

  const reactionBreakdown = useMemo(() => {
    const entries = Object.entries(resolvedReactions)
      .filter(([uid, emo]) => !!uid && typeof emo === 'string' && emo.trim().length > 0) as Array<[string, string]>;
    const byEmoji = new Map<string, string[]>();

    entries.forEach(([uid, emo]) => {
      const list = byEmoji.get(emo) || [];
      list.push(uid);
      byEmoji.set(emo, list);
    });

    const sortedGroups = Array.from(byEmoji.entries())
      .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));

    return {
      total: entries.length,
      groups: sortedGroups,
      isSingleEmoji: sortedGroups.length === 1,
      topEmoji: sortedGroups[0]?.[0] || '',
      topEmojiUserIds: sortedGroups[0]?.[1] || [],
      topEmojis: sortedGroups.map(([emoji]) => emoji),
      map: resolvedReactions,
    };
  }, [resolvedReactions]);

  const getReactionProfile = useCallback((uid: string) => {
    const profile = reactionUsersById?.[uid] || null;
    if (profile) {
      return {
        avatarURL: profile.avatarURL || null,
        label: profile.displayName || profile.username || uid,
      };
    }

    if (uid === otherUserId) {
      return {
        avatarURL: otherUserAvatar || null,
        label: otherUserId || uid,
      };
    }

    return {
      avatarURL: null,
      label: uid,
    };
  }, [otherUserAvatar, otherUserId, reactionUsersById]);

  const reactionAnimationKey = useMemo(() => {
    return Object.entries(resolvedReactions)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([uid, emo]) => `${uid}:${emo}`)
      .join('|');
  }, [resolvedReactions]);

  useEffect(() => {
    if (enableEntryAnimation || hasAnimatedRef.current) return;
    hasAnimatedRef.current = true;
    opacityAnim.setValue(1);
    translateYAnim.setValue(0);
    translateXAnim.setValue(0);
    scaleAnim.setValue(1);
  }, [enableEntryAnimation, opacityAnim, scaleAnim, translateXAnim, translateYAnim]);

  useEffect(() => {
    setMessageExpanded(false);
  }, [item.messageId]);

  useEffect(() => {
    if (enableEntryAnimation && isVisible && !hasAnimatedRef.current) {
      hasAnimatedRef.current = true;
      opacityAnim.setValue(0);
      translateYAnim.setValue(4);
      translateXAnim.setValue(isMe ? 4 : -4);
      scaleAnim.setValue(1);
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 96,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(translateYAnim, {
          toValue: 0,
          duration: 104,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(translateXAnim, {
          toValue: 0,
          duration: 104,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [enableEntryAnimation, isMe, isVisible, opacityAnim, scaleAnim, translateXAnim, translateYAnim]);


  useEffect(() => {
    const previousReaction = previousReactionRef.current;
    if (reactionSummary.total > 0 && reactionAnimationKey !== previousReaction) {
      reactionScaleAnim.setValue(0.78);
      reactionOpacityAnim.setValue(0);
      reactionLiftAnim.setValue(6);
      Animated.parallel([
        Animated.timing(reactionOpacityAnim, {
          toValue: 1,
          duration: 110,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.spring(reactionScaleAnim, {
            toValue: 1.12,
            tension: 240,
            friction: 10,
            useNativeDriver: true,
          }),
          Animated.spring(reactionScaleAnim, {
            toValue: 1,
            tension: 190,
            friction: 11,
            useNativeDriver: true,
          }),
        ]),
        Animated.spring(reactionLiftAnim, {
          toValue: 0,
          tension: 190,
          friction: 13,
          useNativeDriver: true,
        }),
      ]).start();
    }

    if (reactionSummary.total === 0) {
      reactionScaleAnim.setValue(0.78);
      reactionOpacityAnim.setValue(0);
      reactionLiftAnim.setValue(6);
    }

    previousReactionRef.current = reactionAnimationKey;
  }, [reactionAnimationKey, reactionLiftAnim, reactionOpacityAnim, reactionScaleAnim, reactionSummary.total]);
  const replyMeta = useMemo(() => {
    if (!item.replyTo) return null;
    const source = replySource || {};
    const username = item.replyTo?.senderUsername || source.senderUsername || 'User';
    let kind = source.type || '';
    if (kind === 'media') kind = source.mediaType || 'media';
    if (!kind && source.mediaType) kind = source.mediaType;
    if (kind === 'shared' && source.sharedContent?.type) kind = `shared_${source.sharedContent.type}`;

    const labelMap: Record<string, string> = {
      image: 'Photo',
      video: 'Video',
      audio: 'Voice message',
      gif: 'GIF',
      sticker: 'Sticker',
      shared_post: 'Post',
      shared_glimpse: 'Glimpse',
      shared_story: 'Story',
      story_reply: 'Story reply',
      glimpse_collab_request: 'Glimpse request',
      poll: 'Poll',
      location: 'Location',
    };
    const label = labelMap[kind] || '';

    let text = (item.replyTo?.text ?? source.text ?? '').trim();
    if (!text) {
      if (kind === 'poll' && source.poll?.question) {
        text = source.poll.question;
      } else if (kind === 'location' && source.location) {
        text = source.location.name || source.location.address || 'Location';
      } else if (label) {
        text = label;
      } else {
        text = 'Message';
      }
    }

    const thumbUrl =
      source.mediaURL ||
      source.thumbnailURL ||
      source.sharedContent?.coverImage ||
      source.sharedContent?.coverImageURL ||
      source.storyReply?.mediaURL ||
      source.glimpseMediaURL ||
      source.sharedContent?.coverImageURL ||
      source.sharedContent?.coverImage;

    return { username, text, label, thumbUrl, kind };
  }, [item.replyTo, replySource]);

  const replyText = replyMeta?.text || '';
  const replyMax = 90;
  const replyDisplay = replyText.length > replyMax ? `${replyText.slice(0, replyMax).trimEnd()}...` : replyText;
  const replyContextLabel = replyMeta
    ? `${isMe ? 'You replied to' : 'Replying to'} ${replyMeta.username}`
    : '';
  const normalizedMessageText = useMemo(() => {
    if (typeof item.text !== 'string') return '';
    if (item.type === 'system' || item.type === 'group_activity') {
      return item.text.trim();
    }
    const cleaned = item.text
      .replace(/\u2028|\u2029/g, ' ')
      .replace(/\r\n?/g, '\n')
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '')
      .replace(/[\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF]/g, '')
      .replace(/\u00A0/g, ' ')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n[ \t]+/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]{16,}/g, '        ')
      .replace(/^\n+|\n+$/g, '');
    const lines = cleaned.split('\n');
    const lineBreakCount = Math.max(0, lines.length - 1);
    const shortLineCount = lines.filter((line: string) => line.trim().length <= 1).length;
    const suspiciousLineBreaks =
      lineBreakCount > 10 ||
      (lineBreakCount > 0 && lineBreakCount >= Math.floor(cleaned.length * 0.35)) ||
      (lines.length >= 12 && shortLineCount / lines.length > 0.62);
    const stabilized = suspiciousLineBreaks
      ? cleaned.replace(/\n+/g, ' ').replace(/\s{2,}/g, ' ').trim()
      : cleaned;
    return stabilized.length > 1500 ? `${stabilized.slice(0, 1500)}...` : stabilized;
  }, [item.text]);

  const shouldCollapseMessage = !isDeletedMessage && normalizedMessageText.length > 300;
  const isCollapsedLongMessage = shouldCollapseMessage && !messageExpanded;
  const displayMessageText = normalizedMessageText;

  const renderedMessageParts = useMemo(() => {
    if (isDeletedMessage || !displayMessageText) {
      return [{ key: 'plain', text: displayMessageText, mention: false }];
    }

    const mentionToken = /^@(everyone|admin|owner|[a-zA-Z0-9._]+)$/;
    return displayMessageText
      .split(/(@(?:everyone|admin|owner|[a-zA-Z0-9._]+))/g)
      .filter((part: string) => part.length > 0)
      .map((part: string, index: number) => ({
        key: `${index}:${part}`,
        text: part,
        mention: mentionToken.test(part),
      }));
  }, [displayMessageText, isDeletedMessage]);

  const legacyGroupActivityText = typeof item.text === 'string' ? item.text.toLowerCase() : '';
  const isLegacyGroupActivity =
    isGroupConversation &&
    item.type === 'text' &&
    (
      /\badded\b.+\bto this group\b/.test(legacyGroupActivityText) ||
      /\bremoved\b.+\bfrom this group\b/.test(legacyGroupActivityText) ||
      /\bmuted\b.+\bin this group\b/.test(legacyGroupActivityText) ||
      /\bunmuted\b.+\bin this group\b/.test(legacyGroupActivityText) ||
      /\bleft this group\b/.test(legacyGroupActivityText) ||
      /\bapproved\b.+\bto join this group\b/.test(legacyGroupActivityText)
    );
  const isGroupActivityMessage = item.type === 'group_activity' || item.type === 'system' || isLegacyGroupActivity;

  const createdAtDate = useMemo(() => {
    const ts = item?.createdAt;
    if (!ts) return new Date();
    if (typeof ts?.toDate === 'function') return ts.toDate();
    if (typeof ts?.seconds === 'number') return new Date(ts.seconds * 1000 + Math.floor((ts.nanoseconds || 0) / 1000000));
    if (ts instanceof Date) return ts;
    const parsed = new Date(ts);
    return Number.isFinite(parsed.getTime()) ? parsed : new Date();
  }, [item?.createdAt]);

  if (isGroupActivityMessage) {
    const activityText = normalizedMessageText || String(item.text || '').trim() || 'Group activity';
    const activityActorLabel = typeof item.senderUsername === 'string' ? item.senderUsername.trim() : '';
    const activityActorPrefix = activityActorLabel ? activityActorLabel + ' ' : '';
    const canPressActor = !!activityActorLabel && activityText.startsWith(activityActorPrefix) && typeof onSenderPress === 'function';
    const activitySuffix = canPressActor ? activityText.slice(activityActorPrefix.length) : activityText;
    return (
      <Animated.View
        style={[
          localStyles.groupActivityRow,
          {
            opacity: opacityAnim,
            transform: [{ translateY: translateYAnim }, { scale: scaleAnim }],
          },
        ]}
      >
        <View style={localStyles.groupActivityChip}>
          <Text style={localStyles.groupActivityText}>
            {canPressActor ? (
              <>
                <Text style={localStyles.groupActivityUserText} onPress={() => onSenderPress?.(item)}>{activityActorLabel}</Text>
                <Text>{' ' + activitySuffix}</Text>
              </>
            ) : (
              activityText
            )}
          </Text>
        </View>
      </Animated.View>
    );
  }

  const renderBody = () => {
    const raw = item.type || 'text';
    const kind = raw === 'media' ? (item.mediaType || 'image') : raw;
    const resolvedUrl = item.mediaURL || item.mediaUrl || item.url || item.gif?.url || item.sticker?.url || item.imageUrl;
    const isGifUrl = typeof resolvedUrl === 'string' && resolvedUrl.toLowerCase().includes('.gif');
    const mediaKind = isGifUrl && kind === 'image' ? 'gif' : kind;

    if (['image', 'video', 'gif', 'sticker'].includes(mediaKind)) {
      if (typeof resolvedUrl !== 'string' || resolvedUrl.trim().length === 0) {
        return <Text style={[s.messageText, localStyles.messageTextContent, isMe && s.messageTextMe]}>Unsupported media</Text>;
      }
      return <MediaBubble url={resolvedUrl} type={mediaKind as any} items={Array.isArray(item.mediaItems) ? item.mediaItems : undefined} isVisible={isVisible} stylesRef={s} senderDisplayName={item.senderUsername || (isMe ? 'You' : 'User')} senderVerified={Boolean(item.senderVerified)} />;
    }
    if (kind === 'voice' || kind === 'audio') {
      const rawDuration = Number(item.duration ?? item.audioDuration ?? item.voiceDuration ?? 0);
      const duration = rawDuration > 1000 ? Math.round(rawDuration / 1000) : Math.max(0, Math.round(rawDuration));
      if (!resolvedUrl) {
        return <Text style={[s.messageText, isMe && s.messageTextMe]}>Voice message</Text>;
      }
      return (
        <VoiceMessageBubble
          audioUri={resolvedUrl}
          duration={duration}
          isOwn={isMe}
          timestamp={createdAtDate}
          isRead={Array.isArray(item.readBy) && !!otherUserId ? item.readBy.includes(otherUserId) : false}
          embedded
        />
      );
    }
    if (kind === 'poll') {
      const poll = item.poll || {};
      const question = item.question || poll.question || 'Poll';
      const options = item.options || poll.options || [];
      const totalVotes = item.totalVotes ?? poll.totalVotes ?? 0;
      return (
        <PollBubble
          question={question}
          options={options}
          totalVotes={totalVotes}
          selectedId={item.selectedPollOptionId}
          canVote={item.canVote}
          stylesRef={s}
          onVote={item.onVote}
        />
      );
    }
    if (kind === 'location') {
      const loc = item.location || {};
      const lat = item.lat ?? loc.latitude;
      const lng = item.lng ?? loc.longitude;
      const title = item.title || loc.name || loc.address || 'Shared location';
      return <LocationBubble title={title} lat={lat} lng={lng} onOpen={item.onOpen} stylesRef={s} />;
    }
    if (kind === 'shared_post' || kind === 'shared_glimpse' || kind === 'shared_story' || kind === 'story_reply') {
      const isStoryReply = kind === 'story_reply';
      const collaborationStatus = item.collaborationStatus || item.collaborationRequest?.status || (item.status === 'accepted' || item.status === 'rejected' ? item.status : 'pending');
      const storyReplyMeta = item.storyReply || {};
      const normalizedSharedType =
        isStoryReply
          ? 'story'
          : item.sharedContent?.type || (kind === 'shared_post' ? 'post' : kind === 'shared_glimpse' ? 'glimpse' : 'story');
      const normalizedSharedContent = isStoryReply
        ? {
            ...(item.sharedContent || {}),
            type: 'story',
            contentId: storyReplyMeta.storyId || item.sharedContent?.contentId || item.sharedContent?.id,
            authorId: storyReplyMeta.authorId || item.sharedContent?.authorId,
            username: storyReplyMeta.authorUsername || item.sharedContent?.username || item.sharedContent?.authorUsername,
            authorAvatarURL: storyReplyMeta.authorAvatar || item.sharedContent?.authorAvatarURL,
            mediaType: storyReplyMeta.mediaType || item.sharedContent?.mediaType || 'image',
            verified: storyReplyMeta.authorVerified ?? item.sharedContent?.verified,
            coverImage:
              storyReplyMeta.coverImage ||
              storyReplyMeta.thumbnailURL ||
              storyReplyMeta.mediaURL ||
              item.sharedContent?.coverImage ||
              item.sharedContent?.coverImageURL ||
              item.sharedContent?.thumbnailURL ||
              item.sharedContent?.thumbnail ||
              item.mediaURL ||
              item.mediaUrl ||
              item.imageUrl,
          }
        : {
            ...(item.sharedContent || {}),
            type: normalizedSharedType,
            coverImage:
              item.sharedContent?.coverImage ||
              item.sharedContent?.coverImageURL ||
              item.sharedContent?.thumbnailURL ||
              item.sharedContent?.thumbnail ||
              item.sharedContent?.posterURL ||
              item.sharedContent?.mediaURL ||
              item.mediaURL ||
              item.mediaUrl ||
              item.imageUrl,
          };
      const contextLabel = isStoryReply ? (isMe ? 'You replied to their story' : 'Replied to your story') : undefined;
      return (
        <SharedContentMessage
          sharedContent={normalizedSharedContent}
          message={item.text}
          contextLabel={contextLabel}
          collaboration={!isStoryReply && item.collaborationRequest ? { status: collaborationStatus, canRespond: !!item.canRespondToCollab } : undefined}
          onAccept={() => onCollaborationAccept?.(item)}
          onDecline={() => onCollaborationDecline?.(item)}
        />
      );
    }
    if (kind === 'shared') {
      return <SharedCard title={item.title || 'Shared content'} subtitle={item.subtitle} thumbnail={item.thumbnail} onOpen={item.onOpen} stylesRef={s} />;
    }
    return (
      <View style={localStyles.messageTextBlock}>
        <Text
          style={[s.messageText, localStyles.messageTextContent, isMe && s.messageTextMe, isDeletedMessage && s.messageTextDeleted, isPendingMessage && localStyles.pendingMessageText]}
          textBreakStrategy="highQuality"
          numberOfLines={isCollapsedLongMessage ? 6 : undefined}
          ellipsizeMode={isCollapsedLongMessage ? 'tail' : undefined}
        >
          {isDeletedMessage
            ? 'This message was unsent'
            : hasRenderableText
            ? renderedMessageParts.map((part: { key: string; text: string; mention: boolean }) => (
                <Text key={part.key} style={part.mention ? localStyles.mentionText : undefined}>
                  {part.text}
                </Text>
              ))
            : (item.replyTo ? 'Reply' : 'Message')}
        </Text>
        {shouldCollapseMessage ? (
          <TouchableOpacity
            style={localStyles.messageExpandButton}
            onPress={toggleMessageExpanded}
            activeOpacity={0.8}
          >
            <Text style={[localStyles.messageExpandText, { color: accentColor }]}>{messageExpanded ? 'Less' : 'Read more'}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  };
  const renderStatusIcon = () => {
    if (item.status === 'failed') return <Ionicons name="alert-circle" size={14} color="#ef4444" style={s.readIcon} />;
    if (item.status === 'pending' || item.status === 'pending_offline') return <Ionicons name="time" size={14} color="#9ca3af" style={s.readIcon} />;
    return null;
  };

  const shouldShowSeenLabel =
    isMe &&
    canShowReadReceipts &&
    !!otherUserId &&
    item.messageId === latestSeenMineMessageId &&
    Array.isArray(item.readBy) &&
    item.readBy.includes(otherUserId);
  const isFreshSeenLabel = seenLabel === 'Seen';
  const hasSeenReaders = Array.isArray(seenReaders) && seenReaders.length > 0;
  const baseKind = (item.type === 'media' ? item.mediaType : item.type) || item.mediaType || 'text';
  const isMediaBubble = ['image', 'video', 'gif', 'sticker'].includes(baseKind);
  const isSharedBubble = ['shared_post', 'shared_glimpse', 'shared_story', 'story_reply'].includes(baseKind);
  const mediaUrl = item.mediaURL || item.mediaUrl || item.url || item.gif?.url || item.sticker?.url || item.imageUrl;
  const isGifUrl = typeof mediaUrl === 'string' && mediaUrl.toLowerCase().includes('.gif');
  const isStickerOrGif = baseKind === 'gif' || baseKind === 'sticker' || item.mediaType === 'gif' || item.type === 'gif' || item.type === 'sticker' || isGifUrl;
  const isPollBubble = baseKind === 'poll';
  const isLocationBubble = baseKind === 'location';
  const isPendingMessage = item.status === 'pending' || item.status === 'pending_offline';
  const hasRenderableText = normalizedMessageText.length > 0;
  const shouldUseWideReplyBubble = !!item.replyTo && !isStickerOrGif && !isSharedBubble;
  const plainText = normalizedMessageText.trim();
  const isShortPlainTextBubble = false;
  const bubbleShape = {
    borderTopLeftRadius: !isMe && !isFirstInGroup ? 10 : 24,
    borderBottomLeftRadius: !isMe && !isLastInGroup ? 10 : 24,
    borderTopRightRadius: isMe && !isFirstInGroup ? 10 : 24,
    borderBottomRightRadius: isMe && !isLastInGroup ? 10 : 24,
  };
  const isDecoratedTextBubble = !isStickerOrGif && !isSharedBubble && !isMediaBubble && !isPollBubble && !isLocationBubble;
  const replyDirection = isMe ? -1 : 1;
  const limitedTranslateX = replyDragAnim.interpolate({
    inputRange: [-REPLY_SWIPE_LIMIT, 0, REPLY_SWIPE_LIMIT],
    outputRange: isMe ? [-REPLY_SWIPE_LIMIT, 0, 0] : [0, 0, REPLY_SWIPE_LIMIT],
    extrapolate: 'clamp',
  });
  const replyDistance = Animated.multiply(limitedTranslateX, replyDirection);
  const replyChipOpacity = replyDistance.interpolate({ inputRange: [0, 8, 20], outputRange: [0, 0.74, 1], extrapolate: 'clamp' });
  const replyChipScale = replyDistance.interpolate({ inputRange: [0, 14, 36], outputRange: [0.9, 0.97, 1], extrapolate: 'clamp' });
  const replyChipTranslate = replyDistance.interpolate({ inputRange: [0, 10, 36], outputRange: [isMe ? 8 : -8, 0, 0], extrapolate: 'clamp' });
  // Use scaleX instead of width for native animated support
  const replyProgressScale = replyDistance.interpolate({ inputRange: [0, 10, REPLY_SWIPE_LIMIT], outputRange: [0, 0.33, 1], extrapolate: 'clamp' });
  const replyBubbleScale = replyDistance.interpolate({ inputRange: [0, REPLY_SWIPE_LIMIT], outputRange: [1, 1.012], extrapolate: 'clamp' });
  const replyBubbleLift = replyDistance.interpolate({ inputRange: [0, REPLY_SWIPE_LIMIT], outputRange: [0, -2], extrapolate: 'clamp' });
  const replyChipConfirmOpacity = replyDistance.interpolate({ inputRange: [12, 18, 24], outputRange: [0, 0.55, 1], extrapolate: 'clamp' });

  const triggerSwipeHaptic = () => {
    if (Platform.OS === 'web') return;
    Haptics.impactAsync?.(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
  };

  const resetReplyDrag = () => {
    Animated.spring(replyDragAnim, {
      toValue: 0,
      damping: 15,
      stiffness: 220,
      mass: 0.78,
      useNativeDriver: true,
    }).start();
  };

  const handleReplySwipeStateChange = ({ nativeEvent }: any) => {
    if (nativeEvent.oldState !== State.ACTIVE) return;
    onBubbleTouchStateChange?.(false);
    const translationX = Number(nativeEvent.translationX || 0);
    const inwardDistance = Math.max(0, Math.min(REPLY_SWIPE_LIMIT, translationX * replyDirection));

    if (inwardDistance >= REPLY_TRIGGER_DISTANCE) {
      triggerSwipeHaptic();
      onReply?.(item);
      Animated.sequence([
        Animated.timing(replyDragAnim, {
          toValue: isMe ? -REPLY_SWIPE_LIMIT : REPLY_SWIPE_LIMIT,
          duration: 88,
          useNativeDriver: true,
        }),
        Animated.spring(replyDragAnim, {
          toValue: 0,
          damping: 16,
          stiffness: 230,
          mass: 0.8,
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    resetReplyDrag();
  };

  const handleReplySwipeGesture = Animated.event(
    [{ nativeEvent: { translationX: replyDragAnim } }],
    { useNativeDriver: true }
  );

  const handleLongPress = () => {
    longPressTriggeredRef.current = true;
    Animated.spring(tapPopAnim, {
      toValue: LONG_PRESS_SCALE,
      damping: 18,
      stiffness: 260,
      mass: 0.8,
      useNativeDriver: true,
    }).start();
    triggerSwipeHaptic();
    const node = bubbleMeasureRef.current as any;
    if (node?.measureInWindow) {
      node.measureInWindow((x: number, y: number, width: number, height: number) => {
        if (width > 0 && height > 0) {
          onLongPressAction?.(item, { x, y, width, height, isMe });
          return;
        }
        onLongPressAction?.(item, undefined);
      });
      return;
    }
    onLongPressAction?.(item, undefined);
  };

  const handlePressIn = () => {
    onBubbleTouchStateChange?.(true);
    Animated.spring(tapPopAnim, {
      toValue: PRESS_IN_SCALE,
      damping: 20,
      stiffness: 290,
      mass: 0.74,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    onBubbleTouchStateChange?.(false);
    if (longPressTriggeredRef.current) {
      setTimeout(() => {
        longPressTriggeredRef.current = false;
      }, 0);
    }
    Animated.spring(tapPopAnim, {
      toValue: 1,
      damping: 16,
      stiffness: 230,
      mass: 0.8,
      useNativeDriver: true,
    }).start();
  };

  const handleTapPress = () => {
    if (longPressTriggeredRef.current) {
      longPressTriggeredRef.current = false;
      return;
    }
    onBubbleTap(item);
  };
    const statusIcon = renderStatusIcon();
  const sameEmojiAvatarIds = reactionBreakdown.isSingleEmoji ? reactionBreakdown.topEmojiUserIds.slice(0, 2) : [];
  const sameEmojiExtraCount = reactionBreakdown.isSingleEmoji ? Math.max(0, reactionBreakdown.topEmojiUserIds.length - sameEmojiAvatarIds.length) : 0;
  const mixedEmojiRail = !reactionBreakdown.isSingleEmoji ? reactionBreakdown.topEmojis.slice(0, 2) : [];
  const mixedCountLabel = !reactionBreakdown.isSingleEmoji
    ? (reactionBreakdown.total > 2 ? `+${reactionBreakdown.total - 2}` : reactionBreakdown.total > 1 ? String(reactionBreakdown.total) : '')
    : '';
  const bubbleBody = (
    <View ref={bubbleMeasureRef} collapsable={false}>
      <Animated.View style={{ opacity: opacityAnim, transform: [{ translateX: translateXAnim }, { translateY: translateYAnim }, { scale: scaleAnim }] }}>
        {item.replyTo && replyMeta ? (
          <View
            style={[
              localStyles.replyFloatingLabelWrap,
              isMe ? localStyles.replyFloatingLabelWrapMe : localStyles.replyFloatingLabelWrapOther,
            ]}
          >
            <Text style={[s.replyContextLabel, localStyles.replyFloatingLabelText]} numberOfLines={1}>
              {replyContextLabel}
            </Text>
          </View>
        ) : null}
        {item.replyTo && replyMeta ? (
          <TouchableOpacity
            style={[
              localStyles.replyPreviewBubble,
              isMe ? localStyles.replyPreviewBubbleMe : localStyles.replyPreviewBubbleOther,
            ]}
            onPress={() => onReply?.(item.replyTo)}
            activeOpacity={0.85}
          >
            <View style={s.replySnippet}>
              {replyMeta.thumbUrl ? <Image source={{ uri: replyMeta.thumbUrl }} style={s.replyThumb} /> : null}
              <View style={s.replyTextWrap}>
                <Text style={s.replyText} numberOfLines={1}>
                  {replyDisplay}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ) : null}
        <Animated.View style={{ transform: [{ scale: tapPopAnim }] }}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleTapPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onLongPress={handleLongPress}
            delayLongPress={220}
            style={[
              s.messageBubble,
              isStickerOrGif || isSharedBubble
                ? s.messageBubbleBare
                : isMe
                ? (isMediaBubble ? s.messageBubbleMeMedia : (isPollBubble || isLocationBubble) ? s.messageBubbleMeCard : s.messageBubbleMe)
                : (isPollBubble || isLocationBubble) ? s.messageBubbleOtherCard : s.messageBubbleOther,
              shouldUseWideReplyBubble && s.messageBubbleWithReply,
              isShortPlainTextBubble && s.messageBubbleCompact,
              !isStickerOrGif && !isSharedBubble && isLatestMine && s.latestHighlight,
              (isPollBubble || isLocationBubble) && s.pollBubbleWide,
              bubbleShape,
              isPendingMessage && localStyles.pendingBubbleVisual,
            ]}
          >
            {isDecoratedTextBubble && isMe && (
              <>
                <LinearGradient
                  colors={[alpha('#FFFFFF', 0.2), alpha('#FFFFFF', 0.06), 'transparent']}
                  locations={[0, 0.34, 1]}
                  start={{ x: 0.08, y: 0 }}
                  end={{ x: 0.92, y: 0.92 }}
                  style={[StyleSheet.absoluteFill, bubbleShape]}
                />
                <LinearGradient
                  colors={['transparent', alpha('#020617', 0.18)]}
                  start={{ x: 0.5, y: 0.14 }}
                  end={{ x: 0.5, y: 1 }}
                  style={[StyleSheet.absoluteFill, bubbleShape]}
                />
              </>
            )}
            {isDecoratedTextBubble && !isMe && (
              <>
                <LinearGradient
                  colors={['rgba(255, 255, 255, 0.09)', 'rgba(255, 255, 255, 0.03)', 'rgba(255, 255, 255, 0.01)']}
                  locations={[0, 0.4, 1]}
                  start={{ x: 0.12, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[StyleSheet.absoluteFill, bubbleShape]}
                />
                <LinearGradient
                  colors={['transparent', 'rgba(2, 6, 23, 0.24)']}
                  start={{ x: 0.5, y: 0.2 }}
                  end={{ x: 0.5, y: 1 }}
                  style={[StyleSheet.absoluteFill, bubbleShape]}
                />
              </>
            )}
          {renderBody()}

          {statusIcon ? (
            isStickerOrGif ? (
              <View style={[s.messageFooter, s.messageFooterOverlay, isMe && s.messageFooterMe]}>
                {statusIcon}
              </View>
            ) : (
              <View
                pointerEvents="none"
                style={[
                  localStyles.statusIndicatorOverlay,
                  isMe ? localStyles.statusIndicatorOverlayMe : localStyles.statusIndicatorOverlayOther,
                ]}
              >
                {statusIcon}
              </View>
            )
          ) : null}

          {isEdited && (
            <TouchableOpacity style={s.editedLabelWrap} onPress={() => onEditedPress?.(item)}>
              <Text style={s.editedLabel}>edited</Text>
            </TouchableOpacity>
          )}

                    {reactionSummary.total > 0 ? (
            <Animated.View
              style={[
                s.reactionBadge,
                isMe ? s.reactionBadgeRight : s.reactionBadgeLeft,
                localStyles.reactionBadgeTransparent,
                {
                  opacity: reactionOpacityAnim,
                  transform: [{ translateY: reactionLiftAnim }, { scale: reactionScaleAnim }],
                },
              ]}
            >
              <TouchableOpacity
                activeOpacity={0.9}
                style={localStyles.reactionTapWrap}
                onPress={() => onReactionPress?.(item, reactionSummary.map)}
              >
                {isGroupConversation && reactionBreakdown.isSingleEmoji ? (
                  <View style={localStyles.reactionClusterPill}>
                    <Text style={localStyles.reactionEmojiPlain}>{reactionBreakdown.topEmoji}</Text>
                    <View style={localStyles.reactionAvatarStack}>
                      {sameEmojiAvatarIds.map((uid, index) => {
                        const profile = getReactionProfile(uid);
                        return (
                          <Avatar
                            key={`${uid}-${index}`}
                            source={profile.avatarURL}
                            size={16}
                            fallbackText={profile.label}
                            fallbackStyle={localStyles.reactionAvatarFallbackTransparent}
                            style={index > 0 ? localStyles.reactionAvatarMiniWithOverlap : localStyles.reactionAvatarMini}
                          />
                        );
                      })}
                    </View>
                    {sameEmojiExtraCount > 0 ? <Text style={localStyles.reactionCountText}>+{sameEmojiExtraCount}</Text> : null}
                  </View>
                ) : isGroupConversation ? (
                  <View style={localStyles.reactionClusterPill}>
                    <View style={localStyles.reactionEmojiRail}>
                      {mixedEmojiRail.map((emoji, index) => (
                        <Text key={`${emoji}-${index}`} style={[localStyles.reactionEmojiPlain, index > 0 && localStyles.reactionEmojiOffset]}>{emoji}</Text>
                      ))}
                    </View>
                    {mixedCountLabel ? <Text style={localStyles.reactionCountText}>{mixedCountLabel}</Text> : null}
                  </View>
                ) : (
                  <View style={localStyles.reactionClusterPill}>
                    <Text style={localStyles.reactionTextDark}>{reactionSummary.text}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </Animated.View>
          ) : null}

          {item.pinned && (
            <TouchableOpacity style={s.pinBadge} onPress={() => onPinToggle?.(item)}>
              <Ionicons name="bookmark" size={14} color="#38bdf8" />
            </TouchableOpacity>
          )}
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </View>
  );

  return (
    <View style={[s.messageRow, isMe && s.messageRowMe]}>
      <Animated.View
        style={[
          s.messageRowSwipeContent,
          isMe && s.messageRowSwipeContentMe,
          { transform: [{ translateX: timelineSwipeTranslateX as any }] },
        ]}
      >
        {!isMe ? (
          <View style={s.messageAvatarSlot}>
            {showAvatar ? (
              <Avatar source={otherUserAvatar} size={44} fallbackText={otherUserId || '?'} style={s.messageAvatar} />
            ) : null}
          </View>
        ) : null}
        <View style={[s.messageBubbleWrap, isMe && s.messageBubbleWrapMe]}>
          {!isMe && senderLabel ? (
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => onSenderPress?.(item)}
              hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
            >
              <Text style={localStyles.senderFloatingLabel} numberOfLines={1}>{senderLabel}</Text>
            </TouchableOpacity>
          ) : null}
          <View
            style={localStyles.replySwipeStage}
            pointerEvents="box-none"
          >
          <View pointerEvents="none" style={[localStyles.replyActionRail, isMe ? localStyles.replyActionRailMe : localStyles.replyActionRailOther]}>
            <Animated.View
              style={[
                localStyles.swipeActionChip,
                {
                  opacity: replyChipOpacity,
                  transform: [{ translateX: replyChipTranslate }, { scale: replyChipScale }],
                  borderColor: alpha(accentColor, 0.34),
                  shadowColor: accentColor,
                },
              ]}
            >
              <Animated.View style={[localStyles.swipeActionProgress, { 
                transform: [{ scaleX: replyProgressScale }],
                backgroundColor: alpha(accentColor, 0.14) 
              }]} />
              <View style={[localStyles.swipeActionIconWrap, { backgroundColor: alpha(accentColor, 0.18), borderColor: alpha(accentColor, 0.26) }]}>
                <Ionicons name="arrow-undo" size={16} color={accentColor} />
              </View>
              <View style={localStyles.swipeActionCopy}>
                <Text style={localStyles.swipeActionLabel}>Reply</Text>
              </View>
            </Animated.View>
          </View>

          <PanGestureHandler
            enabled={enableReplySwipe && !!onReply}
            activeOffsetX={isMe ? [-16, 999] : [-999, 16]}
            activeOffsetY={[-12, 12]}
            simultaneousHandlers={simultaneousScrollRef}
            shouldCancelWhenOutside={false}
            onGestureEvent={handleReplySwipeGesture}
            onHandlerStateChange={handleReplySwipeStateChange}
          >
            <Animated.View style={{ transform: [{ translateX: limitedTranslateX }, { translateY: replyBubbleLift }, { scale: replyBubbleScale }] }}>
              {bubbleBody}
            </Animated.View>
          </PanGestureHandler>
          </View>
          {hasSeenReaders ? (
            <View style={localStyles.seenReadersRow}>
              {(seenReaders || []).slice(0, 3).map((reader, idx) => (
                <Avatar
                  key={`${reader.userId}-${idx}`}
                  source={reader.avatarURL || null}
                  size={18}
                  fallbackText={reader.fallbackText || reader.userId}
                  style={idx > 0 ? localStyles.seenReaderAvatarWithOverlap : localStyles.seenReaderAvatar}
                />
              ))}
            </View>
          ) : shouldShowSeenLabel && seenLabel ? (
            <Text style={[s.seenLabel, isFreshSeenLabel ? s.seenLabelFresh : s.seenLabelAged]}>
              {seenLabel}
            </Text>
          ) : null}
        </View>
      </Animated.View>
      {showTimelineTime ? (
        <Animated.Text
          style={[s.threadTimelineTime, isMe ? s.threadTimelineTimeMe : s.threadTimelineTimeOther, { opacity: timelineTimeOpacity as any }]}
        >
          {formatTime(item.createdAt)}
        </Animated.Text>
      ) : null}
    </View>
  );
};

const readBySignature = (value: any): string =>
  Array.isArray(value) ? value.filter(Boolean).join('|') : '';

const reactionsSignature = (value: Record<string, string> | undefined): string => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return '';
  return Object.entries(value)
    .filter(([uid, emoji]) => !!uid && typeof emoji === 'string' && emoji.trim().length > 0)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([uid, emoji]) => `${uid}:${emoji}`)
    .join('|');
};

const toMillis = (timestamp: any): number => {
  if (!timestamp) return 0;
  if (typeof timestamp?.toMillis === 'function') return timestamp.toMillis();
  if (typeof timestamp?.toDate === 'function') return timestamp.toDate().getTime();
  if (typeof timestamp?.seconds === 'number') {
    return timestamp.seconds * 1000 + Math.floor((timestamp.nanoseconds || 0) / 1000000);
  }
  if (timestamp instanceof Date) return timestamp.getTime();
  const parsed = new Date(timestamp).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
};

const messageRenderSignature = (item: any): string => {
  if (!item) return '';
  const text = typeof item?.text === 'string' ? item.text : String(item?.text ?? '');
  const trimmedText = text.length > 160 ? `${text.slice(0, 80)}::${text.slice(-40)}` : text;
  return [
    String(item?.messageId || ''),
    String(item?.status || ''),
    item?.isDeleted === true ? '1' : '0',
    String(item?.type || ''),
    String(item?.mediaType || ''),
    String(item?.mediaURL || item?.mediaUrl || item?.url || item?.imageUrl || ''),
    String(item?.replyTo?.messageId || ''),
    String(item?.replyTo?.text || ''),
    readBySignature(item?.readBy),
    reactionsSignature(item?.reactions),
    trimmedText,
    String(toMillis(item?.createdAt) || 0),
    String(toMillis(item?.updatedAt) || 0),
    item?.pinned ? '1' : '0',
  ].join('::');
};

const replySourceSignature = (replySource: any): string => {
  if (!replySource) return '';
  const text = typeof replySource?.text === 'string' ? replySource.text : String(replySource?.text ?? '');
  const clippedText = text.length > 120 ? `${text.slice(0, 60)}::${text.slice(-20)}` : text;
  return [
    String(replySource?.messageId || ''),
    String(replySource?.senderId || ''),
    String(replySource?.senderUsername || ''),
    String(replySource?.type || ''),
    String(replySource?.mediaType || ''),
    String(replySource?.mediaURL || replySource?.thumbnailURL || ''),
    clippedText,
  ].join('::');
};

const seenReadersSignature = (readers: Array<{ userId: string; avatarURL?: string | null; fallbackText?: string }> | undefined): string => {
  if (!Array.isArray(readers) || readers.length === 0) return '';
  return readers
    .map((reader) => `${reader.userId}:${String(reader.avatarURL || '')}:${String(reader.fallbackText || '')}`)
    .join('|');
};

const profileSignature = (profile: any): string => {
  if (!profile) return '';
  return `${String(profile?.avatarURL || '')}:${String(profile?.displayName || '')}:${String(profile?.username || '')}`;
};

const areMessageBubblePropsEqual = (prev: MessageBubbleProps, next: MessageBubbleProps): boolean => {
  if (prev.item?.messageId !== next.item?.messageId) return false;
  if (messageRenderSignature(prev.item) !== messageRenderSignature(next.item)) return false;
  if (replySourceSignature(prev.replySource) !== replySourceSignature(next.replySource)) return false;
  if (prev.reaction !== next.reaction) return false;
  if (reactionsSignature(prev.reactions) !== reactionsSignature(next.reactions)) return false;
  if (seenReadersSignature(prev.seenReaders) !== seenReadersSignature(next.seenReaders)) return false;

  if (prev.isMe !== next.isMe) return false;
  if (prev.isLatestMine !== next.isLatestMine) return false;
  if (prev.latestSeenMineMessageId !== next.latestSeenMineMessageId) return false;
  if (prev.seenLabel !== next.seenLabel) return false;
  if (prev.isVisible !== next.isVisible) return false;
  if (prev.isGroupConversation !== next.isGroupConversation) return false;
  if (prev.otherUserAvatar !== next.otherUserAvatar) return false;
  if (prev.otherUserId !== next.otherUserId) return false;
  if (prev.showSenderAvatar !== next.showSenderAvatar) return false;
  if (prev.senderLabel !== next.senderLabel) return false;
  if (prev.canShowReadReceipts !== next.canShowReadReceipts) return false;
  if (prev.isEdited !== next.isEdited) return false;
  if (prev.isFirstInGroup !== next.isFirstInGroup) return false;
  if (prev.isLastInGroup !== next.isLastInGroup) return false;
  if (prev.accentColor !== next.accentColor) return false;
  if (prev.showTimelineTime !== next.showTimelineTime) return false;
  if (prev.timelineSwipeTranslateX !== next.timelineSwipeTranslateX) return false;
  if (prev.timelineTimeOpacity !== next.timelineTimeOpacity) return false;
  if (prev.enableReplySwipe !== next.enableReplySwipe) return false;
  if (prev.enableEntryAnimation !== next.enableEntryAnimation) return false;
  if (prev.stylesRef !== next.stylesRef) return false;

  const ids = new Set<string>([
    ...Object.keys(prev.reactions || {}),
    ...Object.keys(next.reactions || {}),
  ]);
  for (const uid of ids) {
    if (!uid) continue;
    if (profileSignature(prev.reactionUsersById?.[uid]) !== profileSignature(next.reactionUsersById?.[uid])) {
      return false;
    }
  }

  return true;
};

export default memo(MessageBubble, areMessageBubblePropsEqual);

const localStyles = StyleSheet.create({
  groupActivityRow: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  groupActivityChip: {
    maxWidth: '88%',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(10, 19, 36, 0.68)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.18)',
  },
  groupActivityText: {
    textAlign: 'center',
    color: 'rgba(241, 245, 249, 0.88)',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  groupActivityUserText: {
    color: '#f8fafc',
    fontWeight: '800',
  },
  replySwipeStage: {
    position: 'relative',
    overflow: 'visible',
  },
  replyActionRail: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    zIndex: 0,
  },
  replyActionRailOther: {
    left: 0,
    alignItems: 'flex-start',
  },
  replyActionRailMe: {
    right: 0,
    alignItems: 'flex-end',
  },
  swipeActionChip: {
    minWidth: 66,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    backgroundColor: 'rgba(7, 14, 28, 0.92)',
    shadowOpacity: 0.24,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  swipeActionProgress: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 84, // Max width - will be scaled from 0 to 1
    borderRadius: 18,
    transformOrigin: 'left',
  },
  swipeActionIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swipeActionCopy: {
    marginLeft: 8,
  },
  swipeActionLabel: {
    color: '#e5edf8',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  messageTextBlock: {
    maxWidth: '100%',
    minWidth: 0,
    alignSelf: 'stretch',
  },
  messageExpandButton: {
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  messageExpandText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  messageTextContent: {
    flexShrink: 1,
    flexGrow: 0,
    minWidth: 0,
    maxWidth: '100%',
    flexWrap: 'wrap',
    alignSelf: 'flex-start',
  },
  statusIndicatorOverlay: {
    position: 'absolute',
    bottom: 8,
    zIndex: 3,
  },
  statusIndicatorOverlayMe: {
    right: -8,
  },
  statusIndicatorOverlayOther: {
    left: -18,
  },
  pendingBubbleVisual: {
    opacity: 0.72,
  },
  pendingMessageText: {
    color: 'rgba(226, 232, 240, 0.86)',
  },
  mentionText: {
    color: '#f5d0fe',
    fontWeight: '800',
  },
  replyPreviewBubble: {
    maxWidth: '76%',
    marginBottom: 10,
  },
  replyPreviewBubbleMe: {
    alignSelf: 'flex-end',
  },
  replyPreviewBubbleOther: {
    alignSelf: 'flex-start',
  },
  senderFloatingLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(248, 250, 252, 0.92)',
    marginBottom: 4,
    marginLeft: 10,
    letterSpacing: 0.2,
    textShadowColor: 'rgba(2, 6, 23, 0.55)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  replyFloatingLabelWrap: {
    marginBottom: 6,
    maxWidth: '100%',
  },
  replyFloatingLabelWrapMe: {
    alignSelf: 'flex-end',
    paddingRight: 2,
  },
  replyFloatingLabelWrapOther: {
    alignSelf: 'flex-start',
    paddingLeft: 2,
  },
  replyFloatingLabelText: {
    color: 'rgba(241, 245, 249, 0.78)',
    marginBottom: 0,
    fontSize: 11,
    lineHeight: 14,
    textShadowRadius: 2,
  },
  reactionBadgeTransparent: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    paddingHorizontal: 0,
    paddingVertical: 0,
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  reactionTapWrap: {
    borderRadius: 14,
    paddingHorizontal: 1,
    paddingVertical: 1,
  },
  reactionClusterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 22,
    paddingHorizontal: 4,
    paddingVertical: 0,
    borderRadius: 14,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  reactionEmojiRail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reactionEmojiPlain: {
    fontSize: 15,
    lineHeight: 17,
    color: '#f8fafc',
    backgroundColor: 'transparent',
  },
  reactionEmojiOffset: {
    marginLeft: 4,
  },
  reactionAvatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 4,
  },
  reactionAvatarMini: {
    borderWidth: 1,
    borderColor: 'transparent',
  },
  reactionAvatarFallbackTransparent: {
    backgroundColor: 'transparent',
  },
  reactionAvatarMiniOverlap: {
    marginLeft: -5,
  },
  reactionAvatarMiniWithOverlap: {
    borderWidth: 1,
    borderColor: 'transparent',
    marginLeft: -4,
  },
  reactionCountText: {
    marginLeft: 5,
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '700',
    color: 'rgba(226, 232, 240, 0.88)',
  },
  reactionTextDark: {
    fontSize: 13,
    color: '#e2e8f0',
    fontWeight: '700',
  },
  seenReadersRow: {
    marginTop: 8,
    marginRight: 10,
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
  },
  seenReaderAvatar: {
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.74)',
  },
  seenReaderAvatarWithOverlap: {
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.74)',
    marginLeft: -6,
  },
  swipeActionStage: {
    color: '#a5b4fc',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 1,
  },
});






































































