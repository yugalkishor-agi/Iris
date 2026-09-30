import { InlineLoadingSkeleton, ButtonLoadingSkeleton } from '../components/ui/LoadingSkeleton';
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, Keyboard, Alert } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { onSnapshot, doc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useMessages } from '../hooks/useMessages';
import { userService } from '../services/user.service';
import { settingsService } from '../services/settings.service';
import { messageService } from '../services/message.service';
import type { User } from '../types/database';
import { Image } from 'expo-image';
import { FlashList } from '@shopify/flash-list';

type ChatScreenRouteProp = RouteProp<{ Chat: { userId: string } }, 'Chat'>;

export default function ChatScreen() {
  const route = useRoute<ChatScreenRouteProp>();
  const navigation = useNavigation();
  const { user } = useAuth();
  const otherUserId = route.params?.userId;

  const [conversationId, setConversationId] = useState('');
  const { messages: chatMessages, loading, sendMessage: sendMsg, markAsRead } = useMessages(conversationId, {
    initialLimit: 6,
    pageSize: 12,
  });
  
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [canMessage, setCanMessage] = useState(true);
  const [requestMode, setRequestMode] = useState(false);
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  
  const flatListRef = useRef<FlashList<any>>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize chat and fetch user data
  useEffect(() => {
    const initializeChat = async () => {
      if (!otherUserId || !user) return;
      
      try {
        setLoadingUser(true);
        
        // Fetch user data immediately
        const userDataPromise = userService.getUser(otherUserId);
        userDataPromise.then(userData => {
          setOtherUser(userData);
          setLoadingUser(false);
        });
        
        // Check privacy and following status
        const [userData, privacy, myFollowing, theirFollowing] = await Promise.all([
          userDataPromise,
          settingsService.getPrivacySettings(otherUserId),
          userService.getFollowing(user.userId),
          userService.getFollowing(otherUserId),
        ]);
        
        const iFollow = myFollowing.includes(otherUserId);
        const theyFollowMe = theirFollowing.includes(user.userId);
        const mutualFollowers = iFollow && theyFollowMe;
        
        const messagePerm = privacy.whoCanMessage || 'everyone';
        const privacyAllowed = messagePerm === 'everyone' || (messagePerm === 'followers' && iFollow);
        
        const allowed = privacyAllowed && mutualFollowers;
        setCanMessage(allowed);
        setRequestMode(!allowed);

        // Get or create conversation
        const convId = await messageService.getOrCreateDirectConversation(user.userId, otherUserId);
        setConversationId(convId);
      } catch (error) {
        console.error('Failed to initialize chat:', error);
      } finally {
        setLoadingUser(false);
      }
    };
    
    initializeChat();

    // Real-time listener for other user
    const setupListeners = () => {
      if (!otherUserId) return;
      
      const userUnsubscribe = onSnapshot(doc(db, 'users', otherUserId), (userDoc) => {
        if (userDoc.exists()) {
          const userData = userDoc.data() as User;
          setOtherUser(userData);
        }
      });

      let conversationUnsubscribe = () => {};
      if (conversationId) {
        conversationUnsubscribe = onSnapshot(doc(db, 'conversations', conversationId), (convDoc) => {
          if (convDoc.exists()) {
            const convData = convDoc.data();
            const typingData = convData?.typing || {};
            const otherUserTypingTimestamp = typingData[otherUserId];
            
            if (otherUserTypingTimestamp) {
              const now = Date.now();
              const typingTime = otherUserTypingTimestamp.toMillis ? otherUserTypingTimestamp.toMillis() : 0;
              setOtherUserTyping(now - typingTime < 3000);
            } else {
              setOtherUserTyping(false);
            }
          }
        });
      }

      return () => {
        userUnsubscribe();
        conversationUnsubscribe();
      };
    };
    
    const cleanup = setupListeners();
    return cleanup;
  }, [otherUserId, user, conversationId]);

  // Auto scroll to bottom on new messages
  useEffect(() => {
    if (chatMessages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [chatMessages]);

  // Mark messages as read
  useEffect(() => {
    if (chatMessages.length > 0 && conversationId && user) {
      const unreadMessages = chatMessages.filter(
        msg => msg.senderId !== user.userId && (!msg.readBy || !msg.readBy.includes(user.userId))
      );
      
      if (unreadMessages.length > 0) {
        markAsRead();
      }
    }
  }, [chatMessages, conversationId, user]);

  // Typing indicator handler
  const handleTyping = (text: string) => {
    setMessageText(text);
    
    if (!conversationId || !user || !otherUserId) return;
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    if (text.length > 0) {
      userService.setTypingStatus(conversationId, user.userId, true);
      typingTimeoutRef.current = setTimeout(() => {
        userService.setTypingStatus(conversationId, user.userId, false);
      }, 3000);
    } else {
      userService.setTypingStatus(conversationId, user.userId, false);
    }
  };

  // Send message handler
  const handleSendMessage = async () => {
    if (!messageText.trim() || !user || !conversationId) return;
    
    const text = messageText.trim();
    const replyPayload = replyingTo ? {
      messageId: replyingTo.messageId,
      text: replyingTo.text,
      senderId: replyingTo.senderId,
      senderUsername: replyingTo.senderUsername
    } : undefined;
    setMessageText('');
    Keyboard.dismiss();
    
    // Clear reply + typing immediately so text send feels instant.
    setReplyingTo(null);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    userService.setTypingStatus(conversationId, user.userId, false);
    
    try {
      await sendMsg(text, undefined, replyPayload);
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessageText(text);
      if (replyPayload) {
        setReplyingTo(replyPayload);
      }
    }
  };

  // Format timestamp
  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  // Render message item
  const renderMessage = ({ item }: { item: any }) => {
    const isMe = item.senderId === user?.userId;
    const showAvatar = !isMe;

    return (
      <View style={[styles.messageRow, isMe && styles.messageRowMe]}>
        {showAvatar && (
          <Image
                  source={{ uri: otherUser?.avatarURL || '' }}
            style={styles.messageAvatar}
          />
        )}
        <View style={[styles.messageBubble, isMe ? styles.messageBubbleMe : styles.messageBubbleOther]}>
          {item.replyTo && (
            <View style={styles.replyPreview}>
              <Text style={styles.replyText} numberOfLines={1}>
                {item.replyTo.text}
              </Text>
            </View>
          )}
          <Text style={[styles.messageText, isMe && styles.messageTextMe]}>
            {item.text}
          </Text>
          <View style={styles.messageFooter}>
            <Text style={[styles.messageTime, isMe && styles.messageTimeMe]}>
              {formatTime(item.createdAt)}
            </Text>
            {isMe && (
              <Ionicons
                name={item.readBy?.includes(otherUserId) ? 'checkmark-done' : 'checkmark'}
                size={14}
                color={item.readBy?.includes(otherUserId) ? '#3b82f6' : '#9ca3af'}
                style={styles.readIcon}
              />
            )}
          </View>
        </View>
      </View>
    );
  };

  if (loadingUser) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.headerUser}
          onPress={() => (navigation as any).navigate('Profile', { userId: otherUserId })}
        >
          <Image
                source={{ uri: otherUser?.avatarURL || '' }}
            style={styles.headerAvatar}
          />
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>{otherUser?.displayName || otherUser?.username}</Text>
            {otherUserTyping ? (
              <Text style={styles.typingIndicator}>typing...</Text>
            ) : otherUser?.isOnline ? (
              <Text style={styles.onlineStatus}>Active now</Text>
            ) : null}
          </View>
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="call-outline" size={22} color="#3b82f6" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="videocam-outline" size={24} color="#3b82f6" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="information-circle-outline" size={24} color="#3b82f6" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Request Mode Banner */}
      {requestMode && (
        <View style={styles.requestBanner}>
          <Ionicons name="warning-outline" size={20} color="#f59e0b" />
          <Text style={styles.requestText}>
            This conversation will appear in their message requests
          </Text>
        </View>
      )}

      {/* Messages List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : (
        <FlashList estimatedItemSize={100}
          ref={flatListRef}
          data={chatMessages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.messageId}
          contentContainerStyle={styles.messagesList as any}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />
      )}

      {/* Reply Preview */}
      {replyingTo && (
        <View style={styles.replyContainer}>
          <View style={styles.replyContent}>
            <Text style={styles.replyLabel}>Replying to</Text>
            <Text style={styles.replyText} numberOfLines={1}>
              {replyingTo.text}
            </Text>
          </View>
          <TouchableOpacity onPress={() => setReplyingTo(null)}>
            <Ionicons name="close" size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>
      )}

      {/* Input Area */}
      <View style={styles.inputContainer}>
        <TouchableOpacity style={styles.inputButton}>
          <Ionicons name="add-circle-outline" size={28} color="#3b82f6" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.inputButton}>
          <Ionicons name="camera-outline" size={26} color="#3b82f6" />
        </TouchableOpacity>
        <View style={styles.textInputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder={canMessage ? 'Type a message...' : 'Cannot send messages'}
            placeholderTextColor="#9ca3af"
            value={messageText}
            onChangeText={handleTyping}
            multiline
            maxLength={1000}
            editable={canMessage && !sending}
          />
          <TouchableOpacity style={styles.emojiButton}>
            <Ionicons name="happy-outline" size={22} color="#6b7280" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={[styles.sendButton, (!messageText.trim() || sending) && styles.sendButtonDisabled]}
          onPress={handleSendMessage}
          disabled={!messageText.trim() || sending}
        >
          {sending ? (
            <InlineLoadingSkeleton />
          ) : (
            <Ionicons name="send" size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  backButton: {
    padding: 4,
    marginRight: 8,
  },
  headerUser: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  typingIndicator: {
    fontSize: 12,
    color: '#3b82f6',
    marginTop: 2,
  },
  onlineStatus: {
    fontSize: 12,
    color: '#10b981',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerButton: {
    padding: 4,
  },
  requestBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  requestText: {
    flex: 1,
    fontSize: 13,
    color: '#92400e',
  },
  messagesList: {
    padding: 16,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  messageRowMe: {
    justifyContent: 'flex-end',
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  messageBubble: {
    maxWidth: '75%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  messageBubbleMe: {
    backgroundColor: '#3b82f6',
  },
  messageBubbleOther: {
    backgroundColor: '#f3f4f6',
  },
  replyPreview: {
    borderLeftWidth: 3,
    borderLeftColor: 'rgba(255,255,255,0.5)',
    paddingLeft: 8,
    marginBottom: 6,
  },
  replyText: {
    fontSize: 12,
    color: '#6b7280',
  },
  messageText: {
    fontSize: 15,
    color: '#1f2937',
    lineHeight: 20,
  },
  messageTextMe: {
    color: '#fff',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  messageTime: {
    fontSize: 11,
    color: '#9ca3af',
  },
  messageTimeMe: {
    color: 'rgba(255,255,255,0.8)',
  },
  readIcon: {
    marginLeft: 2,
  },
  replyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#f9fafb',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  replyContent: {
    flex: 1,
  },
  replyLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3b82f6',
    marginBottom: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 8,
  },
  inputButton: {
    padding: 6,
  },
  textInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    maxHeight: 100,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#000',
    maxHeight: 80,
  },
  emojiButton: {
    padding: 4,
    marginLeft: 4,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});

