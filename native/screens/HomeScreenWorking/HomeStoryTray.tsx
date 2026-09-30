import React from 'react';
import { View, Text } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { StoryProcessingBar } from '../../components/ui/StoryProcessingBar';
import { styles } from './styles';
import type { Story } from './homeFeedTypes';

interface HomeStoryTrayProps {
  storiesWithCreate: Array<{ storyId: string; userId: string } | Story>;
  renderStoryItem: (info: { item: any; index: number }) => React.ReactElement;
}

export const HomeStoryTray = React.memo(({
  storiesWithCreate,
  renderStoryItem
}: HomeStoryTrayProps) => {
  return (
    <View style={styles.headerContainer}>
      <StoryProcessingBar />
      <View style={styles.momentsSection}>
        <Text style={styles.momentsTitle}>Moments</Text>
        <FlashList
          data={storiesWithCreate}
          renderItem={renderStoryItem}
          keyExtractor={(item: any, index: number) => item.storyId || `story-${index}`}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.storiesList as any}
          estimatedItemSize={80}
        />
      </View>
    </View>
  );
});
