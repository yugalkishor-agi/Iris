import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography, borderRadius } from '../styles/theme';
import { ScreenSkeleton } from '../components/ui/LoadingSkeleton';
import { useAuth } from '../contexts/AuthContext';
import { FlashList } from '@shopify/flash-list';

interface Device {
  id: string;
  name: string;
  type: 'mobile' | 'desktop' | 'tablet';
  os: string;
  browser?: string;
  location: string;
  lastActive: Date;
  isCurrent: boolean;
  ipAddress: string;
}

export default function DevicesScreen() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();
  const { user } = useAuth();

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    try {
      setLoading(true);
      
      // Mock devices data - in production, this would come from auth service
      const mockDevices: Device[] = [
        {
          id: '1',
          name: 'iPhone 15 Pro',
          type: 'mobile',
          os: 'iOS 17.1',
          location: 'New York, NY',
          lastActive: new Date(),
          isCurrent: true,
          ipAddress: '192.168.1.100',
        },
        {
          id: '2',
          name: 'MacBook Pro',
          type: 'desktop',
          os: 'macOS Sonoma',
          browser: 'Chrome 119',
          location: 'New York, NY',
          lastActive: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
          isCurrent: false,
          ipAddress: '192.168.1.101',
        },
        {
          id: '3',
          name: 'iPad Air',
          type: 'tablet',
          os: 'iPadOS 17.1',
          location: 'Brooklyn, NY',
          lastActive: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
          isCurrent: false,
          ipAddress: '192.168.1.102',
        },
        {
          id: '4',
          name: 'Windows PC',
          type: 'desktop',
          os: 'Windows 11',
          browser: 'Edge 119',
          location: 'Queens, NY',
          lastActive: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
          isCurrent: false,
          ipAddress: '192.168.1.103',
        },
      ];

      setDevices(mockDevices);
    } catch (error) {
      console.error('Failed to load devices:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDeviceIcon = (type: Device['type']) => {
    switch (type) {
      case 'mobile':
        return 'phone-portrait';
      case 'tablet':
        return 'tablet-portrait';
      case 'desktop':
        return 'desktop';
      default:
        return 'hardware-chip';
    }
  };

  const formatLastActive = (lastActive: Date) => {
    const now = new Date();
    const diff = now.getTime() - lastActive.getTime();
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 1) {
      return 'Active now';
    } else if (minutes < 60) {
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else if (days < 7) {
      return `${days}d ago`;
    } else {
      return lastActive.toLocaleDateString();
    }
  };

  const handleRemoveDevice = (device: Device) => {
    if (device.isCurrent) {
      Alert.alert(
        'Cannot Remove Device',
        'You cannot remove the device you are currently using.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Remove Device',
      `Are you sure you want to remove "${device.name}"? This will sign out this device from your account.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            // In production, this would call the auth service to revoke the device
            setDevices(devices.filter(d => d.id !== device.id));
            Alert.alert('Device Removed', `${device.name} has been signed out.`);
          },
        },
      ]
    );
  };

  const handleRemoveAllOtherDevices = () => {
    const otherDevices = devices.filter(d => !d.isCurrent);
    
    if (otherDevices.length === 0) {
      Alert.alert(
        'No Other Devices',
        'There are no other devices to remove.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Remove All Other Devices',
      `This will sign out ${otherDevices.length} other device${otherDevices.length > 1 ? 's' : ''} from your account.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove All',
          style: 'destructive',
          onPress: () => {
            // In production, this would call the auth service to revoke all other devices
            setDevices(devices.filter(d => d.isCurrent));
            Alert.alert('Devices Removed', 'All other devices have been signed out.');
          },
        },
      ]
    );
  };

  const renderDevice = ({ item }: { item: Device }) => (
    <View style={styles.deviceItem}>
      <View style={styles.deviceIcon}>
        <Ionicons 
          name={getDeviceIcon(item.type) as any} 
          size={24} 
          color={item.isCurrent ? colors.accent.primary : colors.text.secondary} 
        />
      </View>
      
      <View style={styles.deviceInfo}>
        <View style={styles.deviceHeader}>
          <Text style={styles.deviceName}>{item.name}</Text>
          {item.isCurrent && (
            <View style={styles.currentBadge}>
              <Text style={styles.currentBadgeText}>Current</Text>
            </View>
          )}
        </View>
        
        <Text style={styles.deviceOS}>
          {item.os}{item.browser && ` • ${item.browser}`}
        </Text>
        
        <View style={styles.deviceMeta}>
          <Text style={styles.deviceLocation}>{item.location}</Text>
          <Text style={styles.metaSeparator}>•</Text>
          <Text style={styles.deviceLastActive}>{formatLastActive(item.lastActive)}</Text>
        </View>
        
        <Text style={styles.deviceIP}>IP: {item.ipAddress}</Text>
      </View>
      
      {!item.isCurrent && (
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemoveDevice(item)}
        >
          <Ionicons name="close" size={20} color={colors.text.secondary} />
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Devices</Text>
          <View style={{ width: 24 }} />
        </View>
        <ScreenSkeleton variant="cards" rows={6} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Devices</Text>
        <TouchableOpacity onPress={handleRemoveAllOtherDevices}>
          <Text style={styles.removeAllText}>Remove All</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoCard}>
        <Ionicons name="shield-checkmark" size={24} color={colors.accent.primary} />
        <View style={styles.infoContent}>
          <Text style={styles.infoTitle}>Manage your devices</Text>
          <Text style={styles.infoDescription}>
            These are the devices that are currently signed in to your account. Remove any devices that you don't recognize.
          </Text>
        </View>
      </View>

      <FlashList estimatedItemSize={100}
        data={devices}
        renderItem={renderDevice}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.devicesList as any}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="hardware-chip-outline" size={48} color={colors.text.secondary} />
            <Text style={styles.emptyText}>No devices found</Text>
            <Text style={styles.emptySubtext}>Your signed-in devices will appear here</Text>
          </View>
        }
      />

      <View style={styles.footer}>
        <View style={styles.footerInfo}>
          <Ionicons name="information-circle" size={16} color={colors.text.secondary} />
          <Text style={styles.footerText}>
            If you see a device you don't recognize, remove it immediately and change your password.
          </Text>
        </View>
      </View>
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
  removeAllText: {
    fontSize: typography.fontSize.base,
    color: '#EF4444',
    fontWeight: typography.fontWeight.semibold as any,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.background.secondary,
    margin: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    gap: spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  infoDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  devicesList: {
    paddingHorizontal: spacing.lg,
  },
  deviceItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.background.secondary,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  deviceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deviceInfo: {
    flex: 1,
  },
  deviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
    gap: spacing.sm,
  },
  deviceName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
  },
  currentBadge: {
    backgroundColor: colors.accent.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  currentBadgeText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.inverse,
    fontWeight: typography.fontWeight.semibold as any,
  },
  deviceOS: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  deviceMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
    gap: spacing.xs,
  },
  deviceLocation: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  metaSeparator: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  deviceLastActive: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  deviceIP: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    fontFamily: 'monospace',
  },
  removeButton: {
    padding: spacing.sm,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  footerInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  footerText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 18,
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


