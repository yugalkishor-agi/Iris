import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type SearchScope = 'chats' | 'messages' | 'media';

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchScope: SearchScope;
  onSearchScopeChange: (scope: SearchScope) => void;
  placeholder?: string;
}

export const SearchBar = React.memo<SearchBarProps>(({
  searchQuery,
  onSearchChange,
  searchScope,
  onSearchScopeChange,
  placeholder = 'Search conversations...',
}) => {
  const showScopeChips = searchQuery.trim().length > 0;

  return (
    <View style={styles.searchContainer}>
      <View style={styles.searchInputContainer}>
        <Ionicons name="search" size={18} color="#94a3b8" style={styles.searchIcon} />
        
        <TextInput
          style={styles.searchInput}
          placeholder={placeholder}
          placeholderTextColor="#64748b"
          value={searchQuery}
          onChangeText={onSearchChange}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />

        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => onSearchChange('')} style={styles.searchClear}>
            <Ionicons name="close-circle" size={18} color="#64748b" />
          </TouchableOpacity>
        )}
      </View>

      {showScopeChips && (
        <View style={styles.searchScopeRow}>
          <TouchableOpacity
            style={[styles.searchScopeChip, searchScope === 'chats' && styles.searchScopeChipActive]}
            onPress={() => onSearchScopeChange('chats')}
          >
            <Text style={[styles.searchScopeText, searchScope === 'chats' && styles.searchScopeTextActive]}>
              Chats
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.searchScopeChip, searchScope === 'messages' && styles.searchScopeChipActive]}
            onPress={() => onSearchScopeChange('messages')}
          >
            <Text style={[styles.searchScopeText, searchScope === 'messages' && styles.searchScopeTextActive]}>
              Text
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.searchScopeChip, searchScope === 'media' && styles.searchScopeChipActive]}
            onPress={() => onSearchScopeChange('media')}
          >
            <Text style={[styles.searchScopeText, searchScope === 'media' && styles.searchScopeTextActive]}>
              Media
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
});

SearchBar.displayName = 'SearchBar';

const styles = StyleSheet.create({
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    borderRadius: 18,
    paddingHorizontal: 14,
    minHeight: 50,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.12)',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#f8fafc',
  },
  searchClear: {
    paddingLeft: 8,
  },
  searchScopeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  searchScopeChip: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.12)',
    marginRight: 8,
  },
  searchScopeChipActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.14)',
    borderColor: 'rgba(56, 189, 248, 0.5)',
  },
  searchScopeText: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '600',
  },
  searchScopeTextActive: {
    color: '#e2e8f0',
  },
});
