import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../../styles/theme';

interface SearchRecentOverlayProps {
  recentSearches: string[];
  setQuery: (val: string) => void;
  clearAllRecentSearches: () => void;
  removeRecentSearch: (val: string) => void;
}

export function SearchRecentOverlay({
  recentSearches,
  setQuery,
  clearAllRecentSearches,
  removeRecentSearch,
}: SearchRecentOverlayProps) {
  return (
    <View style={styles.resultsWrap}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.focusedRecentContent as any}
      >
        <View style={styles.resultsRecentBlock}>
          <View style={styles.focusedRecentHeader}>
            <Text style={styles.resultsRecentTitle}>Recent searches</Text>
            {recentSearches.length > 0 ? (
              <TouchableOpacity activeOpacity={0.82} onPress={clearAllRecentSearches}>
                <Text style={styles.clearText}>Clear all</Text>
              </TouchableOpacity>
            ) : null}
          </View>
          {recentSearches.length > 0 ? (
            <View style={styles.focusedRecentList}>
              {recentSearches.map((entry) => (
                <TouchableOpacity
                  key={entry}
                  activeOpacity={0.82}
                  style={styles.focusedRecentItem}
                  onPress={() => setQuery(entry)}
                >
                  <View style={styles.focusedRecentItemMain}>
                    <Ionicons name="time-outline" size={16} color="rgba(255,255,255,0.62)" />
                    <Text style={styles.focusedRecentItemText} numberOfLines={1}>
                      {entry}
                    </Text>
                  </View>
                  <TouchableOpacity activeOpacity={0.8} hitSlop={10} onPress={() => removeRecentSearch(entry)}>
                    <Ionicons name="close" size={18} color="rgba(255,255,255,0.54)" />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No recent searches</Text>
              <Text style={styles.emptySubtitle}>Search once and it will appear here for quick access.</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  resultsWrap: {
    flex: 1,
  },
  focusedRecentContent: {
    paddingTop: 12,
    paddingBottom: 56,
  },
  resultsRecentBlock: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 12,
  },
  focusedRecentHeader: {
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resultsRecentTitle: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
    marginBottom: 8,
  },
  clearText: {
    color: '#7DD3FC',
    fontSize: 14,
    fontWeight: '700',
  },
  focusedRecentList: {
    gap: 8,
  },
  focusedRecentItem: {
    minHeight: 54,
    borderRadius: 18,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0A0C10',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  focusedRecentItemMain: {
    flex: 1,
    marginRight: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  focusedRecentItemText: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '600',
  },
  emptyState: {
    paddingTop: 96,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
  },
  emptyTitle: {
    color: colors.text.primary,
    fontSize: 20,
    fontWeight: '800',
  },
  emptySubtitle: {
    color: 'rgba(255,255,255,0.58)',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
});
