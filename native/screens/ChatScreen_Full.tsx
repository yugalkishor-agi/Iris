import { InlineLoadingSkeleton, ButtonLoadingSkeleton } from '../components/ui/LoadingSkeleton';
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { VerifiedBadge } from '../components/ui/VerifiedBadge';
import { Avatar } from '../components/ui/Avatar';
import { ChatProfileDrawer } from '../components/chat/ChatProfileDrawer';
import { colors, spacing, typography, borderRadius } from '../styles/theme';
import { useAuth } from '../contexts/AuthContext';
import { messageService } from '../services/message.service';
import { clearConversationMessageCache } from '../hooks/useMessages';
import { userService } from '../services/user.service';
import { onSnapshot, collection, query, where, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Image } from 'expo-image';
import { FlashList } from '@shopify/flash-list';

interface Message {
  messageId: string;
  text: string;
  senderId: string;
  timestamp: any;
  type: 'text' | 'image' | 'gif';
  mediaURL?: string;
  read?: boolean;
  reactions?: { [userId: string]: string };
}

export default function ChatScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { userId: otherUserId } = route.params as any;
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [otherUser, setOtherUser] = useState<any>(null);
  const [conversationId, setConversationId] = useState('');
  const [showProfileDrawer, setShowProfileDrawer] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const flatListRef = useRef<FlashList<any>>(null);

  useEffect(() => {
    if (!otherUserId || !user) return;

    const initChat = async () => {
      try {
        setLoading(true);

        // Load other user's data
        const userData = await userService.getUser(otherUserId);
        setOtherUser(userData);

        // Get or create conversation
        const convoId = await messageService.getOrCreateDirectConversation(
          user.userId,
          otherUserId
        );
        setConversationId(convoId);

        // Real-time listener for messages
        const messagesRef = collection(db, 'conversations', convoId, 'messages');
        const q = query(messagesRef, orderBy('timestamp', 'asc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
          const msgs = snapshot.docs.map(doc => ({
            messageId: doc.id,
            ...doc.data()
          })) as Message[];
          
          setMessages(msgs);
          setLoading(false);

          // Mark messages as read
          if (msgs.length > 0) {
            messageService.markConversationAsRead(convoId, user.userId);
          }

          // Scroll to bottom
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Failed to initialize chat:', error);
        setLoading(false);
      }
    };

    initChat();
  }, [otherUserId, user]);

  const handleSend = async () => {
    if (!messageText.trim() || !conversationId || sending) return;

    const textToSend = messageText.trim();
    setMessageText('');
    setSending(true);

    try {
      await messageService.sendMessage(conversationId, {
        senderId: user!.userId,
        senderUsername: user!.username,
        senderAvatarURL: user!.avatarURL,
        text: textToSend,
        type: 'text',
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessageText(textToSend);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isMe = item.senderId === user?.userId;
    const prevMessage = index > 0 ? messages[index - 1] : null;
    const showAvatar = !isMe && (!prevMessage || prevMessage.senderId !== item.senderId);

    return (
      <View
        style={[
          styles.messageContainer,
          isMe ? styles.myMessageContainer : styles.otherMessageContainer,
        ]}
      >
        {showAvatar && !isMe && (
          <Avatar
            source={otherUser?.avatarURL}
            size={32}
            fallbackText={otherUser?.username}
            style={styles.messageAvatar}
          />
        )}
        {!showAvatar && !isMe && <View style={styles.avatarSpacer} />}

        <View
          style={[
            styles.messageBubble,
            isMe ? styles.myMessageBubble : styles.otherMessageBubble,
          ]}
        >
          {item.type === 'image' && item.mediaURL && (
            <Image
              source={{ uri: item.mediaURL }}
              style={styles.messageImage}
              contentFit="cover"
            />
          )}
          {item.text && (
            <Text style={[styles.messageText, isMe && styles.myMessageText]}>
              {item.text}
            </Text>
          )}
          <Text style={[styles.messageTime, isMe && styles.myMessageTime]}>
            {formatTime(item.timestamp)}
            {isMe && item.read && (
              <Ionicons name="checkmark-done" size={12} color={colors.accent.primary} />
            )}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.headerUser}
          onPress={() => (navigation as any).navigate('Profile', { userId: otherUser?.userId })}
        >
          <Avatar
            source={otherUser?.avatarURL ?? undefined}
            size={36}
          />
          <View style={styles.headerUserInfo}>
            <View style={styles.headerNameRow}>
              <Text style={styles.headerUsername} numberOfLines={1}>
                {otherUser?.displayName || otherUser?.username}
              </Text>
              {otherUser?.verified && (
                <VerifiedBadge size={16} />
              )}
            </View>
            {otherUser?.isOnline && (
              <Text style={styles.onlineStatus}>Active now</Text>
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => setShowProfileDrawer(true)}
        >
          <Ionicons name="information-circle-outline" size={24} color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlashList estimatedItemSize={100}
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.messageId}
        contentContainerStyle={styles.messagesList as any}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
      />

      {/* Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.inputButton}>
            <Ionicons name="add-circle-outline" size={28} color={colors.accent.primary} />
          </TouchableOpacity>

          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Message..."
              placeholderTextColor={colors.text.secondary}
              value={messageText}
              onChangeText={setMessageText}
              multiline
              maxLength={1000}
            />
            
            <TouchableOpacity style={styles.emojiButton}>
              <Ionicons name="happy-outline" size={24} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>

          {messageText.trim() ? (
            <TouchableOpacity
              style={styles.sendButton}
              onPress={handleSend}
              disabled={sending}
            >
              {sending ? (
                <InlineLoadingSkeleton />
              ) : (
                <Ionicons name="send" size={24} color={colors.accent.primary} />
              )}
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity style={styles.inputButton}>
                <Ionicons name="mic-outline" size={28} color={colors.text.secondary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.inputButton}>
                <Ionicons name="image-outline" size={28} color={colors.text.secondary} />
              </TouchableOpacity>
            </>
          )}
        </View>
      </KeyboardAvoidingView>

      {/* Chat Profile Drawer */}
      {otherUser && (
        <ChatProfileDrawer
          visible={showProfileDrawer}
          onClose={() => setShowProfileDrawer(false)}
          otherUser={{
            userId: otherUser.userId,
            username: otherUser.username,
            displayName: otherUser.displayName,
            avatarURL: otherUser.avatarURL,
            verified: otherUser.verified,
            bio: otherUser.bio,
          }}
          onViewProfile={() => {
            setShowProfileDrawer(false);
            (navigation as any).navigate('Profile', { userId: otherUser.userId });
          }}
          onCreateGroup={() => {
            setShowProfileDrawer(false);
            Alert.alert('Create Group', 'This feature is coming soon!');
          }}
          onMute={() => {
            setIsMuted(!isMuted);
            Alert.alert('Success', isMuted ? 'Chat unmuted' : 'Chat muted');
          }}
          onBlock={() => {
            Alert.alert(
              'Block User',
              `Block @${otherUser.username}?`,
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Block',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await userService.blockUser(user!.userId, otherUser.userId);
                      Alert.alert('Blocked', `@${otherUser.username} has been blocked`);
                      navigation.goBack();
                    } catch (error) {
                      Alert.alert('Error', 'Failed to block user');
                    }
                  },
                },
              ]
            );
          }}
          onUnblock={() => {
            Alert.alert('Unblock', 'User unblocked');
          }}
          onReport={() => {
            setShowProfileDrawer(false);
            Alert.alert('Report', 'Report feature coming soon');
          }}
          onDelete={() => {
            Alert.alert(
              'Delete Chat',
              'Delete this conversation?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await messageService.deleteConversation(conversationId, user!.userId);
                      await clearConversationMessageCache(conversationId, user!.userId);
                      navigation.goBack();
                    } catch (error) {
                      Alert.alert('Error', 'Failed to delete chat');
                    }
                  },
                },
              ]
            );
          }}
          onPin={() => {
            setIsPinned(!isPinned);
            Alert.alert('Success', isPinned ? 'Chat unpinned' : 'Chat pinned');
          }}
          onUnpin={() => {
            setIsPinned(false);
            Alert.alert('Success', 'Chat unpinned');
          }}
          isPinned={isPinned}
          isMuted={isMuted}
          conversationId={conversationId}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    gap: spacing.sm,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerUser: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerUserInfo: {
    flex: 1,
  },
  headerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerUsername: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
  },
  onlineStatus: {
    fontSize: typography.fontSize.xs,
    color: colors.accent.success,
  },
  headerButton: {
    padding: spacing.xs,
  },
  messagesList: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
    alignItems: 'flex-end',
  },
  myMessageContainer: {
    justifyContent: 'flex-end',
  },
  otherMessageContainer: {
    justifyContent: 'flex-start',
  },
  messageAvatar: {
    marginRight: spacing.xs,
  },
  avatarSpacer: {
    width: 40,
  },
  messageBubble: {
    maxWidth: '75%',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  myMessageBubble: {
    backgroundColor: colors.accent.primary,
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    backgroundColor: colors.background.tertiary,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    lineHeight: typography.lineHeight.normal,
  },
  myMessageText: {
    color: colors.text.inverse,
  },
  messageTime: {
    fontSize: typography.fontSize.xs,
    color: colors.text.muted,
    marginTop: spacing.xs,
  },
  myMessageTime: {
    color: 'rgba(255,255,255,0.7)',
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    gap: spacing.sm,
  },
  inputButton: {
    padding: spacing.xs,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    minHeight: 40,
    maxHeight: 100,
  },
  input: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    paddingVertical: spacing.sm,
  },
  emojiButton: {
    padding: spacing.xs,
  },
  sendButton: {
    padding: spacing.xs,
  },
});



