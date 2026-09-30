import React from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import PhotoTagging, { PhotoTag } from '../components/media/PhotoTagging';

interface RouteParams {
  imageUri: string;
  existingTags?: PhotoTag[];
  onSave?: (tags: PhotoTag[]) => void;
}

export default function PhotoTaggingScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const { imageUri, existingTags, onSave } = route.params as RouteParams;

  const handleSave = (tags: PhotoTag[]) => {
    if (tags.length === 0) {
      Alert.alert(
        'No Tags Added',
        'You haven\'t tagged anyone. Do you want to continue without tags?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Continue', 
            onPress: () => {
              if (onSave) {
                onSave(tags);
              }
              navigation.goBack();
            }
          },
        ]
      );
      return;
    }

    // Check for pending approvals
    const pendingTags = tags.filter(tag => !tag.approved);
    if (pendingTags.length > 0) {
      Alert.alert(
        'Pending Approvals',
        `${pendingTags.length} tag(s) require approval from the tagged users. They will be notified.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Continue', 
            onPress: () => {
              if (onSave) {
                onSave(tags);
              }
              navigation.goBack();
            }
          },
        ]
      );
      return;
    }

    if (onSave) {
      onSave(tags);
    }
    navigation.goBack();
  };

  const handleCancel = () => {
    const hasChanges = existingTags?.length !== 0 || false;
    
    if (hasChanges) {
      Alert.alert(
        'Discard Changes',
        'Are you sure you want to discard your tag changes?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { 
            text: 'Discard', 
            style: 'destructive',
            onPress: () => navigation.goBack()
          },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  if (!user) {
    return null;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      <PhotoTagging
        imageUri={imageUri}
        existingTags={existingTags}
        onSave={handleSave}
        onCancel={handleCancel}
        currentUserId={user.userId}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
});
