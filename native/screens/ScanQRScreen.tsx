import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function ScanQRScreen() {
  const navigation = useNavigation();

  const handleScan = () => {
    Alert.alert('Scanned', 'QR code scanned successfully!');
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Scan QR Code</Text>
        <View style={{ width: 28 }} />
      </View>
      <View style={styles.scanner}>
        <View style={styles.scanArea}>
          <View style={styles.corner} />
          <View style={[styles.corner, styles.cornerTopRight]} />
          <View style={[styles.corner, styles.cornerBottomLeft]} />
          <View style={[styles.corner, styles.cornerBottomRight]} />
        </View>
        <Text style={styles.instruction}>
          Position QR code within the frame
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  title: { fontSize: 18, fontWeight: '600', color: '#fff' },
  scanner: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scanArea: { width: 250, height: 250, position: 'relative' },
  corner: { position: 'absolute', width: 40, height: 40, borderTopWidth: 4, borderLeftWidth: 4, borderColor: '#3b82f6', top: 0, left: 0 },
  cornerTopRight: { borderTopWidth: 4, borderRightWidth: 4, borderLeftWidth: 0, right: 0, left: 'auto' },
  cornerBottomLeft: { borderBottomWidth: 4, borderLeftWidth: 4, borderTopWidth: 0, bottom: 0, top: 'auto' },
  cornerBottomRight: { borderBottomWidth: 4, borderRightWidth: 4, borderTopWidth: 0, borderLeftWidth: 0, bottom: 0, right: 0, top: 'auto', left: 'auto' },
  instruction: { color: '#fff', fontSize: 16, marginTop: 32 },
});
