import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

type LocationShareSheetProps = {
  visible: boolean;
  onClose: () => void;
  onShare: (payload: { latitude: number; longitude: number; name?: string; address?: string }) => Promise<void> | void;
};

type Coords = { latitude: number; longitude: number };

type Status = 'idle' | 'loading' | 'ready' | 'denied' | 'error';

const LocationShareSheet: React.FC<LocationShareSheetProps> = ({ visible, onClose, onShare }) => {
  const [status, setStatus] = useState<Status>('idle');
  const [coords, setCoords] = useState<Coords | null>(null);
  const [name, setName] = useState<string | undefined>(undefined);
  const [address, setAddress] = useState<string | undefined>(undefined);

  const reset = () => {
    setStatus('idle');
    setCoords(null);
    setName(undefined);
    setAddress(undefined);
  };

  const loadLocation = async () => {
    setStatus('loading');
    try {
      const currentPerm = await Location.getForegroundPermissionsAsync();
      let status = currentPerm.status;
      if (status !== 'granted') {
        const req = await Location.requestForegroundPermissionsAsync();
        status = req.status;
      }
      if (status !== 'granted') {
        setStatus('denied');
        return;
      }

      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const nextCoords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      setCoords(nextCoords);

      const geo = await Location.reverseGeocodeAsync(nextCoords);
      const first = geo[0];
      if (first) {
        const nameParts = [first.name, first.street].filter(Boolean).join(', ');
        const addrParts = [first.city, first.region, first.postalCode, first.country].filter(Boolean).join(', ');
        setName(nameParts || undefined);
        setAddress(addrParts || undefined);
      }
      setStatus('ready');
    } catch (err: any) {
      if (err?.code === 1) {
        setStatus('denied');
        return;
      }
      setStatus('error');
    }
  };

  useEffect(() => {
    if (visible) {
      reset();
      loadLocation();
    } else {
      reset();
    }
  }, [visible]);

  const handleOpenSettings = async () => {
    try {
      await Linking.openSettings();
    } catch {
      Alert.alert('Error', 'Unable to open settings.');
    }
  };

  const handleShare = async () => {
    if (!coords) return;
    try {
      await onShare({
        latitude: coords.latitude,
        longitude: coords.longitude,
        name,
        address,
      });
      onClose();
    } catch {
      Alert.alert('Error', 'Failed to send location.');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Share Location</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color="#e2e8f0" />
            </TouchableOpacity>
          </View>

          {status === 'loading' && (
            <View style={styles.center}>
              <ActivityIndicator size="large" color="#38bdf8" />
              <Text style={styles.helperText}>Finding your location...</Text>
            </View>
          )}

          {status === 'denied' && (
            <View style={styles.center}>
              <Ionicons name="location-outline" size={28} color="#f97316" />
              <Text style={styles.helperText}>Location permission is required.</Text>
              <View style={styles.deniedActions}>
                <TouchableOpacity style={styles.retryBtn} onPress={loadLocation}>
                  <Text style={styles.retryText}>Try again</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.settingsBtn} onPress={handleOpenSettings}>
                  <Text style={styles.settingsText}>Open Settings</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {status === 'error' && (
            <View style={styles.center}>
              <Ionicons name="warning" size={28} color="#f97316" />
              <Text style={styles.helperText}>Unable to fetch location.</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={loadLocation}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          {status === 'ready' && coords && (
            <View style={styles.content}>
              <View style={styles.row}>
                <Ionicons name="location" size={18} color="#38bdf8" />
                <Text style={styles.locationName}>{name || 'Current location'}</Text>
              </View>
              {address ? <Text style={styles.locationAddress}>{address}</Text> : null}
              <Text style={styles.coordsText}>
                {coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}
              </Text>
              <View style={styles.actions}>
                <TouchableOpacity style={styles.secondaryBtn} onPress={loadLocation}>
                  <Ionicons name="refresh" size={16} color="#94a3b8" />
                  <Text style={styles.secondaryText}>Refresh</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.primaryBtn} onPress={handleShare}>
                  <Text style={styles.primaryText}>Share</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.7)',
    justifyContent: 'center',
    padding: 20,
  },
  sheet: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1f2937',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  title: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '700',
  },
  closeBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    alignItems: 'center',
    padding: 24,
    gap: 12,
  },
  helperText: {
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center',
  },
  deniedActions: {
    flexDirection: 'row',
    gap: 10,
  },
  retryBtn: {
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.4)',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  retryText: {
    color: '#f97316',
    fontSize: 13,
    fontWeight: '700',
  },
  settingsBtn: {
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  settingsText: {
    color: '#38bdf8',
    fontSize: 13,
    fontWeight: '700',
  },
  content: {
    padding: 16,
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationName: {
    color: '#e2e8f0',
    fontSize: 15,
    fontWeight: '600',
  },
  locationAddress: {
    color: '#94a3b8',
    fontSize: 13,
  },
  coordsText: {
    color: '#64748b',
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#1f2937',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  secondaryText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },
  primaryBtn: {
    backgroundColor: '#38bdf8',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  primaryText: {
    color: '#0b1220',
    fontSize: 13,
    fontWeight: '700',
  },
});

export default LocationShareSheet;

