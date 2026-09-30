import { NavigationContainerRef } from '@react-navigation/native';
import React from 'react';
import { Alert } from 'react-native';

// Navigation reference for global navigation
export const navigationRef = React.createRef<NavigationContainerRef<any>>();

// Navigation service for global navigation without props
export class NavigationService {
  // Navigate to any screen
  static navigate(name: string, params?: any) {
    navigationRef.current?.navigate(name, params);
  }

  // Go back
  static goBack() {
    navigationRef.current?.goBack();
  }

  // Reset navigation stack
  static reset(routeName: string, params?: any) {
    navigationRef.current?.reset({
      index: 0,
      routes: [{ name: routeName, params }],
    });
  }

  // Get current route name
  static getCurrentRoute() {
    return navigationRef.current?.getCurrentRoute();
  }

  // Story creation flows
  static openStoryEditor() {
    this.navigate('StoryEditor');
  }

  static openStoryCamera() {
    this.navigate('StoryCamera');
  }

  static openStoryViewer(userId: string) {
    this.navigate('StoryViewerEnhanced', { userId });
  }

  // Content creation flows
  static openNewPost() {
    this.navigate('CreatePost');
  }

  static openGlimpseCreate() {
    this.navigate('GlimpseCreate');
  }

  static openLiveStream() {
    Alert.alert('Coming soon', 'Live streaming will be available in an upcoming update.');
  }

  // Message flows
  static openMessages() {
    this.navigate('Messages');
  }

  static openChat(userId: string, conversationId?: string, otherUser?: any) {
    this.navigate('Chat', {
      userId,
      conversationId,
      otherUser
    });
  }

  static openNewMessage() {
    this.navigate('NewMessage');
  }

  // Profile flows
  static openUserProfile(userId: string, username?: string) {
    this.navigate('UserProfile', {
      userId,
      username
    });
  }

  static openProfile() {
    this.navigate('Main', { screen: 'Profile' });
  }

  // Post flows
  static openPostView(postId: string, userId: string) {
    this.navigate('PostView', {
      postId,
      userId
    });
  }

  static openComments(postId: string) {
    this.navigate('Comments', {
      postId
    });
  }

  // Main tabs
  static openHome() {
    this.navigate('Main', { screen: 'Home' });
  }

  static openSearch() {
    this.navigate('Main', { screen: 'Search' });
  }

  static openNotifications() {
    this.navigate('Main', { screen: 'Notifications' });
  }

  // Camera
  static openCamera() {
    this.navigate('Camera');
  }

  // Utility functions
  static canGoBack(): boolean {
    return navigationRef.current?.canGoBack() ?? false;
  }

  static getRootState() {
    return navigationRef.current?.getRootState();
  }
}

