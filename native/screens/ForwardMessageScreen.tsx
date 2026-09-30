import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VerifiedBadge } from '../components/ui/VerifiedBadge';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors, spacing, typography, borderRadius } from '../styles/theme';
import { Avatar } from '../components/ui/Avatar';
import { userService } from '../services/user.service';
import { useAuth } from '../contexts/AuthContext';
import { FlashList } from '@shopify/flash-list';

interface Contact {
  userId: string;
  username: string;
  displayName: string;
  avatarURL?: string;
  isVerified: boolean;
  isOnline: boolean;
}

export default function ForwardMessageScreen() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const { messageId, messageContent } = (route.params as any) || {};

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Load user's contacts (following users)
      const following = await userService.getFollowing(user.userId);
      const contactsData = await Promise.all(
        following.map(async (userId: string) => {
          const userData = await userService.getUser(userId);
          if (!userData) return null;
          return {
            userId: userData.userId,
            username: userData.username,
            displayName: userData.displayName || userData.username,
            avatarURL: userData.avatarURL,
            isVerified: userData.verified || false,
            isOnline: Math.random() > 0.5, // Mock online status
          };
        })
      );
      
      setContacts(contactsData.filter(contact => contact !== null));
    } catch (error) {
      console.error('Failed to load contacts:', error);
      
      // Fallback mock data
      const mockContacts: Contact[] = [
        {
          userId: 'user1',
          username: 'sarah_j',
          displayName: 'Sarah Johnson',
          avatarURL: 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=150&h=150&fit=crop&crop=face',
          isVerified: true,
          isOnline: true,
        },
        {
          userId: 'user2',
          username: 'mike_chen',
          displayName: 'Mike Chen',
          avatarURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
          isVerified: false,
          isOnline: false,
        },
        {
          userId: 'user3',
          username: 'alex_kim',
          displayName: 'Alex Kim',
          avatarURL: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
          isVerified: true,
          isOnline: true,
        },
      ];
      
      setContacts(mockContacts);
    } finally {
      setLoading(false);
    }
  };

  const filteredContacts = contacts.filter(contact =>
    contact.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleContactSelection = (userId: string) => {
    const newSelection = new Set(selectedContacts);
    if (newSelection.has(userId)) {
      newSelection.delete(userId);
    } else {
      newSelection.add(userId);
    }
    setSelectedContacts(newSelection);
  };

  const handleForward = async () => {
    if (selectedContacts.size === 0) {
      Alert.alert('No Recipients', 'Please select at least one person to forward to');
      return;
    }

    try {
      // In production, this would forward the message to selected contacts
      const selectedUsernames = Array.from(selectedContacts).map(userId => {
        const contact = contacts.find(c => c.userId === userId);
        return contact?.username || '';
      }).filter(Boolean);

      Alert.alert(
        'Message Forwarded',
        `Message forwarded to ${selectedUsernames.join(', ')}`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Failed to forward message:', error);
      Alert.alert('Error', 'Failed to forward message');
    }
  };

  const renderContact = ({ item }: { item: Contact }) => {
    const isSelected = selectedContacts.has(item.userId);
    
    return (
      <TouchableOpacity
        style={[styles.contactItem, isSelected && styles.selectedContact]}
        onPress={() => toggleContactSelection(item.userId)}
        activeOpacity={0.7}
      >
        <View style={styles.contactInfo}>
          <View style={styles.avatarContainer}>
            <Avatar source={item.avatarURL} size={40} fallbackText={item.displayName} />
            {item.isOnline && <View style={styles.onlineIndicator} />}
          </View>
          <View style={styles.contactDetails}>
            <View style={styles.nameContainer}>
              <Text style={styles.displayName} numberOfLines={1}>
                {item.displayName}
              </Text>
              {item.isVerified && (
                <VerifiedBadge size={14} />
              )}
            </View>
            <Text style={styles.username} numberOfLines={1}>
              @{item.username}
            </Text>
          </View>
        </View>
        
        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
          {isSelected && (
            <Ionicons name="checkmark" size={16} color="white" />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Forward Message</Text>
        <TouchableOpacity 
          onPress={handleForward}
          disabled={selectedContacts.size === 0}
          style={[
            styles.forwardButton,
            selectedContacts.size === 0 && styles.forwardButtonDisabled
          ]}
        >
          <Text style={[
            styles.forwardButtonText,
            selectedContacts.size === 0 && styles.forwardButtonTextDisabled
          ]}>
            Forward
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={colors.text.secondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search contacts..."
            placeholderTextColor={colors.text.secondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {selectedContacts.size > 0 && (
        <View style={styles.selectedCount}>
          <Text style={styles.selectedCountText}>
            {selectedContacts.size} {selectedContacts.size === 1 ? 'person' : 'people'} selected
          </Text>
        </View>
      )}

      <FlashList estimatedItemSize={100}
        data={filteredContacts}
        renderItem={renderContact}
        keyExtractor={(item) => item.userId}
        contentContainerStyle={styles.contactsList as any}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={48} color={colors.text.secondary} />
            <Text style={styles.emptyText}>
              {searchQuery ? 'No contacts found' : 'No contacts available'}
            </Text>
            <Text style={styles.emptySubtext}>
              {searchQuery ? 'Try searching with different keywords' : 'Follow people to see them here'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
  },
  forwardButton: {
    backgroundColor: colors.accent.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  forwardButtonDisabled: {
    backgroundColor: colors.background.secondary,
  },
  forwardButtonText: {
    color: colors.text.inverse,
    fontWeight: typography.fontWeight.semibold as any,
  },
  forwardButtonTextDisabled: {
    color: colors.text.secondary,
  },
  searchContainer: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
  },
  selectedCount: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background.secondary,
  },
  selectedCountText: {
    fontSize: typography.fontSize.sm,
    color: colors.accent.primary,
    fontWeight: typography.fontWeight.semibold as any,
  },
  contactsList: {
    padding: spacing.lg,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  selectedContact: {
    backgroundColor: colors.background.secondary,
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.md,
  },
  avatarContainer: {
    position: 'relative',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: colors.background.primary,
  },
  contactDetails: {
    flex: 1,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 2,
  },
  displayName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
  },
  username: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border.subtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: colors.accent.primary,
    borderColor: colors.accent.primary,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
    gap: spacing.md,
  },
  emptyText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.secondary,
  },
  emptySubtext: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
