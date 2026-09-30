import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../styles/theme';

interface SearchHeaderProps {
  query: string;
  setQuery: (val: string) => void;
  setIsSearchFocused: (val: boolean) => void;
}

export function SearchHeader({ query, setQuery, setIsSearchFocused }: SearchHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.searchShell}>
        <Ionicons name="search-outline" size={22} color={query ? '#D7F9FF' : 'rgba(255,255,255,0.5)'} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          onFocus={() => setIsSearchFocused(true)}
          onBlur={() => setIsSearchFocused(false)}
          placeholder="Search users, posts, and tags"
          placeholderTextColor="rgba(255,255,255,0.46)"
          style={styles.searchInput}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
        />
        {query.length > 0 ? (
          <TouchableOpacity activeOpacity={0.8} onPress={() => setQuery('')}>
            <Ionicons name="close-circle" size={20} color="rgba(255,255,255,0.56)" />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background.primary,
  },
  searchShell: {
    minHeight: 58,
    borderRadius: 22,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#090B11',
    borderWidth: 1,
    borderColor: 'rgba(125,211,252,0.08)',
  },
  searchInput: {
    flex: 1,
    color: colors.text.primary,
    fontSize: 17,
    marginLeft: 12,
    paddingVertical: 14,
  },
});
