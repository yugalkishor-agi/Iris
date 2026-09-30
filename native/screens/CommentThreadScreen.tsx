import React from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import CommentThreadList from '../components/comments/CommentThreadList';

interface RouteParams {
  postId: string;
  postAuthorId: string;
}

export default function CommentThreadScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const { postId, postAuthorId } = route.params as RouteParams;

  if (!user) {
    return null;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <CommentThreadList
        postId={postId}
        postAuthorId={postAuthorId}
        currentUserId={user.userId}
        onClose={() => navigation.goBack()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});
