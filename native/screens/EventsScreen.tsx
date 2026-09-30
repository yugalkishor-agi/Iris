import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, SafeAreaView, RefreshControl, ScrollView, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { VerifiedBadge } from '../components/ui/VerifiedBadge';
import { useAuth } from '../contexts/AuthContext';
import { colors, spacing, typography } from '../styles/theme';
import { Image } from 'expo-image';
import { FlashList } from '@shopify/flash-list';

const { width } = Dimensions.get('window');

interface Event {
  id: string;
  title: string;
  description: string;
  imageURL: string;
  category: string;
  date: Date;
  time: string;
  location: {
    name: string;
    address: string;
    coordinates: { lat: number; lng: number };
  };
  organizer: {
    userId: string;
    username: string;
    displayName: string;
    avatarURL?: string;
    verified?: boolean;
  };
  stats: {
    attendees: number;
    interested: number;
    capacity: number;
  };
  price: {
    amount: number;
    currency: string;
    isFree: boolean;
  };
  tags: string[];
  isAttending?: boolean;
  isInterested?: boolean;
  status: 'upcoming' | 'ongoing' | 'ended';
}

export default function EventsScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'discover' | 'attending' | 'hosting'>('discover');

  useEffect(() => {
    loadEvents();
  }, [activeTab]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      
      // Mock events data
      const mockEvents: Event[] = [
        {
          id: '1',
          title: 'Tech Meetup: AI & Machine Learning',
          description: 'Join us for an exciting discussion about the latest trends in AI and ML. Network with fellow developers and learn from industry experts.',
          imageURL: 'https://via.placeholder.com/400x200',
          category: 'Technology',
          date: new Date(Date.now() + 86400000 * 3), // 3 days from now
          time: '6:00 PM - 9:00 PM',
          location: {
            name: 'Tech Hub',
            address: '123 Innovation Street, Tech City',
            coordinates: { lat: 37.7749, lng: -122.4194 }
          },
          organizer: {
            userId: 'org1',
            username: 'techhub',
            displayName: 'Tech Hub Community',
            avatarURL: 'https://via.placeholder.com/100',
            verified: true,
          },
          stats: { attendees: 45, interested: 120, capacity: 100 },
          price: { amount: 0, currency: 'USD', isFree: true },
          tags: ['AI', 'ML', 'Tech', 'Networking'],
          status: 'upcoming',
        },
        {
          id: '2',
          title: 'Photography Workshop: Street Photography',
          description: 'Learn the art of street photography with professional photographer Jane Doe. Hands-on workshop with real-world practice.',
          imageURL: 'https://via.placeholder.com/400x200',
          category: 'Photography',
          date: new Date(Date.now() + 86400000 * 7), // 1 week from now
          time: '10:00 AM - 4:00 PM',
          location: {
            name: 'Downtown Art Center',
            address: '456 Creative Avenue, Art District',
            coordinates: { lat: 37.7849, lng: -122.4094 }
          },
          organizer: {
            userId: 'org2',
            username: 'jane_photographer',
            displayName: 'Jane Doe Photography',
            avatarURL: 'https://via.placeholder.com/100',
            verified: false,
          },
          stats: { attendees: 12, interested: 35, capacity: 20 },
          price: { amount: 75, currency: 'USD', isFree: false },
          tags: ['Photography', 'Workshop', 'Street', 'Art'],
          status: 'upcoming',
        },
        {
          id: '3',
          title: 'Startup Pitch Night',
          description: 'Watch innovative startups pitch their ideas to investors. Great networking opportunity for entrepreneurs and investors.',
          imageURL: 'https://via.placeholder.com/400x200',
          category: 'Business',
          date: new Date(Date.now() + 86400000 * 14), // 2 weeks from now
          time: '7:00 PM - 10:00 PM',
          location: {
            name: 'Business Center',
            address: '789 Entrepreneur Blvd, Business District',
            coordinates: { lat: 37.7649, lng: -122.4294 }
          },
          organizer: {
            userId: 'org3',
            username: 'startup_hub',
            displayName: 'Startup Hub',
            avatarURL: 'https://via.placeholder.com/100',
            verified: true,
          },
          stats: { attendees: 89, interested: 200, capacity: 150 },
          price: { amount: 25, currency: 'USD', isFree: false },
          tags: ['Startup', 'Pitch', 'Networking', 'Business'],
          status: 'upcoming',
        },
      ];
      
      // Filter based on active tab
      let filteredEvents = mockEvents;
      switch (activeTab) {
        case 'attending':
          filteredEvents = mockEvents.filter(e => e.isAttending);
          break;
        case 'hosting':
          filteredEvents = mockEvents.filter(e => e.organizer.userId === user?.userId);
          break;
        default:
          filteredEvents = mockEvents;
      }
      
      setEvents(filteredEvents);
      console.log('📅 Loaded events:', filteredEvents.length);
      
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadEvents();
    setRefreshing(false);
  };

  const handleEventPress = (event: Event) => {
    (navigation as any).navigate('EventDetails', { eventId: event.id });
  };

  const handleAttendEvent = (eventId: string) => {
    setEvents(prev => prev.map(e => 
      e.id === eventId 
        ? { 
            ...e, 
            isAttending: !e.isAttending,
            stats: { 
              ...e.stats, 
              attendees: e.isAttending ? e.stats.attendees - 1 : e.stats.attendees + 1 
            }
          }
        : e
    ));
  };

  const handleInterestedEvent = (eventId: string) => {
    setEvents(prev => prev.map(e => 
      e.id === eventId 
        ? { 
            ...e, 
            isInterested: !e.isInterested,
            stats: { 
              ...e.stats, 
              interested: e.isInterested ? e.stats.interested - 1 : e.stats.interested + 1 
            }
          }
        : e
    ));
  };

  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('en-US', options);
  };

  const renderEvent = ({ item }: { item: Event }) => (
    <TouchableOpacity 
      style={styles.eventCard}
      onPress={() => handleEventPress(item)}
    >
      <Image source={{ uri: item.imageURL }} style={styles.eventImage} />
      
      {/* Event Info Overlay */}
      <View style={styles.eventOverlay}>
        <View style={styles.eventHeader}>
          <View style={styles.dateContainer}>
            <Text style={styles.dateText}>{formatDate(item.date)}</Text>
          </View>
          
          {!item.price.isFree && (
            <View style={styles.priceContainer}>
              <Text style={styles.priceText}>${item.price.amount}</Text>
            </View>
          )}
        </View>
      </View>
      
      <View style={styles.eventDetails}>
        <View style={styles.categoryContainer}>
          <Text style={styles.categoryText}>{item.category}</Text>
        </View>
        
        <Text style={styles.eventTitle} numberOfLines={2}>{item.title}</Text>
        
        <View style={styles.locationContainer}>
          <Ionicons name="location-outline" size={16} color={colors.text.secondary} />
          <Text style={styles.locationText} numberOfLines={1}>{item.location.name}</Text>
        </View>
        
        <View style={styles.timeContainer}>
          <Ionicons name="time-outline" size={16} color={colors.text.secondary} />
          <Text style={styles.timeText}>{item.time}</Text>
        </View>
        
        <View style={styles.organizerContainer}>
          <Image source={{ uri: item.organizer.avatarURL }} style={styles.organizerAvatar} />
          <View style={styles.organizerInfo}>
            <View style={styles.organizerNameRow}>
              <Text style={styles.organizerName} numberOfLines={1}>{item.organizer.displayName}</Text>
              {item.organizer.verified && (
                <VerifiedBadge size={14} />
              )}
            </View>
          </View>
        </View>
        
        <View style={styles.eventStats}>
          <View style={styles.statItem}>
            <Ionicons name="people-outline" size={16} color={colors.text.secondary} />
            <Text style={styles.statText}>{item.stats.attendees} attending</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="heart-outline" size={16} color={colors.text.secondary} />
            <Text style={styles.statText}>{item.stats.interested} interested</Text>
          </View>
        </View>
        
        <View style={styles.eventActions}>
          <TouchableOpacity 
            style={[styles.actionButton, item.isInterested && styles.interestedButton]}
            onPress={() => handleInterestedEvent(item.id)}
          >
            <Ionicons 
              name={item.isInterested ? "heart" : "heart-outline"} 
              size={18} 
              color={item.isInterested ? "#fff" : colors.text.primary} 
            />
            <Text style={[styles.actionText, item.isInterested && styles.interestedText]}>
              Interested
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.attendButton, item.isAttending && styles.attendingButton]}
            onPress={() => handleAttendEvent(item.id)}
          >
            <Ionicons 
              name={item.isAttending ? "checkmark" : "add"} 
              size={18} 
              color="#fff" 
            />
            <Text style={styles.attendText}>
              {item.isAttending ? 'Attending' : 'Attend'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Events</Text>
        <TouchableOpacity onPress={() => (navigation as any).navigate('CreateEvent')}>
          <Ionicons name="add" size={28} color={colors.text.primary} />
        </TouchableOpacity>
      </View>
      
      {/* Tabs */}
      <View style={styles.tabs}>
        {[
          { key: 'discover', label: 'Discover' },
          { key: 'attending', label: 'Attending' },
          { key: 'hosting', label: 'Hosting' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.activeTab]}
            onPress={() => setActiveTab(tab.key as any)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent.primary} />
          <Text style={styles.loadingText}>Loading events...</Text>
        </View>
      ) : events.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={64} color={colors.text.secondary} />
          <Text style={styles.emptyTitle}>No events found</Text>
          <Text style={styles.emptySubtitle}>
            {activeTab === 'discover' 
              ? 'Check back later for new events' 
              : activeTab === 'attending'
              ? 'You\'re not attending any events yet'
              : 'You haven\'t created any events yet'
            }
          </Text>
        </View>
      ) : (
        <FlashList estimatedItemSize={100}
          data={events}
          renderItem={renderEvent}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.eventsList as any}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          showsVerticalScrollIndicator={false}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginVertical: spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: colors.accent.primary,
  },
  tabText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium as any,
    color: colors.text.secondary,
  },
  activeTabText: {
    color: colors.accent.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
    marginTop: spacing.md,
  },
  emptySubtitle: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  eventsList: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  eventCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  eventImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  eventOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: spacing.md,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  dateContainer: {
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
  },
  dateText: {
    color: '#fff',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold as any,
  },
  priceContainer: {
    backgroundColor: colors.accent.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
  },
  priceText: {
    color: '#fff',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold as any,
  },
  eventDetails: {
    padding: spacing.md,
  },
  categoryContainer: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accent.primary + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    marginBottom: spacing.sm,
  },
  categoryText: {
    color: colors.accent.primary,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold as any,
  },
  eventTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    lineHeight: 24,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
    gap: spacing.xs,
  },
  locationText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    flex: 1,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  timeText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  organizerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  organizerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: spacing.sm,
  },
  organizerInfo: {
    flex: 1,
  },
  organizerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  organizerName: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium as any,
    color: colors.text.primary,
    flex: 1,
  },
  eventStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  eventActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: 8,
    backgroundColor: colors.background.primary,
    gap: spacing.xs,
  },
  interestedButton: {
    backgroundColor: '#ff3040',
  },
  attendButton: {
    backgroundColor: colors.accent.primary,
  },
  attendingButton: {
    backgroundColor: '#10b981',
  },
  actionText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium as any,
    color: colors.text.primary,
  },
  interestedText: {
    color: '#fff',
  },
  attendText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium as any,
    color: '#fff',
  },
});
