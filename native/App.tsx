import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, View } from 'react-native';

// Import Firebase and Supabase to initialize
import './config/firebase';
import './config/supabase';

// Contexts
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Auth & Onboarding Screens
import SplashScreen from './screens/SplashScreen';
import WelcomeScreen from './screens/WelcomeScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';

// Main Tab Screens
import HomeScreen from './screens/HomeScreen';
import SearchScreen from './screens/SearchScreen';
import NewPostScreen from './screens/NewPostScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import ProfileScreen from './screens/ProfileScreen';

// Messaging Screens
import MessagesScreen from './screens/MessagesScreen';
import ChatScreen from './screens/ChatScreen';
import NewChatScreen from './screens/NewChatScreen';
import NewGroupScreen from './screens/NewGroupScreen';
import GroupInfoScreen from './screens/GroupInfoScreen';

// Content Screens
import PostViewScreen from './screens/PostViewScreen';
import CommentsScreen from './screens/CommentsScreen';
import LikesListScreen from './screens/LikesListScreen';
import SharePostScreen from './screens/SharePostScreen';

// Story/Glimpse Screens
import StoryViewerScreen from './screens/StoryViewerScreen';
import StoryCreateScreen from './screens/StoryCreateScreen';
import GlimpseViewerScreen from './screens/GlimpseViewerScreen';
import GlimpseCreateScreen from './screens/GlimpseCreateScreen';
import HighlightsScreen from './screens/HighlightsScreen';
import ViewersListScreen from './screens/ViewersListScreen';

// Profile Screens
import EditProfileScreen from './screens/EditProfileScreen';
import FollowersListScreen from './screens/FollowersListScreen';
import FollowingScreen from './screens/FollowingScreen';
import TaggedPostsScreen from './screens/TaggedPostsScreen';
import MentionsScreen from './screens/MentionsScreen';

// Profile Editors
import AvatarEditorScreen from './screens/AvatarEditorScreen';
import BioEditorScreen from './screens/BioEditorScreen';
import NameEditorScreen from './screens/NameEditorScreen';
import WebsiteEditorScreen from './screens/WebsiteEditorScreen';
import LocationEditorScreen from './screens/LocationEditorScreen';

// Content Management
import SavedPostsScreen from './screens/SavedPostsScreen';
import ArchiveScreen from './screens/ArchiveScreen';
import LikedPostsScreen from './screens/LikedPostsScreen';
import CollectionsScreen from './screens/CollectionsScreen';
import BookmarksScreen from './screens/BookmarksScreen';
import DraftsScreen from './screens/DraftsScreen';

// Discovery
import DiscoveryScreen from './screens/DiscoveryScreen';
import ExploreScreen from './screens/ExploreScreen';
import TrendingScreen from './screens/TrendingScreen';
import HashtagScreen from './screens/HashtagScreen';
import LocationScreen from './screens/LocationScreen';
import SuggestionsScreen from './screens/SuggestionsScreen';
import RecentSearchesScreen from './screens/RecentSearchesScreen';

// Settings Screens
import SettingsMainScreen from './screens/SettingsMainScreen';
import PrivacySettingsScreen from './screens/PrivacySettingsScreen';
import NotificationSettingsScreen from './screens/NotificationSettingsScreen';
import AccountSettingsScreen from './screens/AccountSettingsScreen';
import SecuritySettingsScreen from './screens/SecuritySettingsScreen';
import AppearanceSettingsScreen from './screens/AppearanceSettingsScreen';
import LanguageSettingsScreen from './screens/LanguageSettingsScreen';
import DataUsageScreen from './screens/DataUsageScreen';
import AccessibilityScreen from './screens/AccessibilityScreen';
import SoundSettingsScreen from './screens/SoundSettingsScreen';
import AutoPlaySettingsScreen from './screens/AutoPlaySettingsScreen';
import CaptionsSettingsScreen from './screens/CaptionsSettingsScreen';

// Account & Security
import TwoFactorAuthScreen from './screens/TwoFactorAuthScreen';
import ChangePasswordScreen from './screens/ChangePasswordScreen';
import DeactivateAccountScreen from './screens/DeactivateAccountScreen';
import DeleteAccountScreen from './screens/DeleteAccountScreen';
import EmailPhoneScreen from './screens/EmailPhoneScreen';
import LoginActivityScreen from './screens/LoginActivityScreen';
import SavedLoginScreen from './screens/SavedLoginScreen';
import AppsWebsitesScreen from './screens/AppsWebsitesScreen';
import BackupCodesScreen from './screens/BackupCodesScreen';

// Privacy Controls
import BlockedUsersScreen from './screens/BlockedUsersScreen';
import MutedAccountsScreen from './screens/MutedAccountsScreen';
import CloseFriendsScreen from './screens/CloseFriendsScreen';
import RestrictedAccountsScreen from './screens/RestrictedAccountsScreen';
import FollowRequestsScreen from './screens/FollowRequestsScreen';
import MessagePrivacyScreen from './screens/MessagePrivacyScreen';
import CommentPrivacyScreen from './screens/CommentPrivacyScreen';
import TagPrivacyScreen from './screens/TagPrivacyScreen';
import HideStoryScreen from './screens/HideStoryScreen';
import MentionSettingsScreen from './screens/MentionSettingsScreen';

// Moderation
import ReportContentScreen from './screens/ReportContentScreen';
import ReportProblemScreen from './screens/ReportProblemScreen';
import BlockConfirmScreen from './screens/BlockConfirmScreen';
import MuteConfirmScreen from './screens/MuteConfirmScreen';

// Analytics & Insights
import AnalyticsScreen from './screens/AnalyticsScreen';
import InsightsScreen from './screens/InsightsScreen';
import ActivityLogScreen from './screens/ActivityLogScreen';
import StorageUsageScreen from './screens/StorageUsageScreen';

// Media Tools
import MediaPickerScreen from './screens/MediaPickerScreen';
import CaptionEditorScreen from './screens/CaptionEditorScreen';
import FiltersScreen from './screens/FiltersScreen';
import CropScreen from './screens/CropScreen';

// Social Features
import QRCodeScreen from './screens/QRCodeScreen';
import ScanQRScreen from './screens/ScanQRScreen';
import PollCreateScreen from './screens/PollCreateScreen';
import LiveStreamScreen from './screens/LiveStreamScreen';
import BadgesScreen from './screens/BadgesScreen';
import AchievementsScreen from './screens/AchievementsScreen';
import LeaderboardScreen from './screens/LeaderboardScreen';

// Preferences
import InterestsScreen from './screens/InterestsScreen';
import ThemeScreen from './screens/ThemeScreen';
import FontSizeScreen from './screens/FontSizeScreen';
import RequestVerificationScreen from './screens/RequestVerificationScreen';
import CacheManagementScreen from './screens/CacheManagementScreen';
import DownloadDataScreen from './screens/DownloadDataScreen';

// Support & Info
import HelpCenterScreen from './screens/HelpCenterScreen';
import AboutScreen from './screens/AboutScreen';
import TermsScreen from './screens/TermsScreen';
import PrivacyPolicyScreen from './screens/PrivacyPolicyScreen';
import GuidelinesScreen from './screens/GuidelinesScreen';
import FAQScreen from './screens/FAQScreen';
import ContactSupportScreen from './screens/ContactSupportScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Search') {
            iconName = focused ? 'search' : 'search-outline';
          } else if (route.name === 'NewPost') {
            iconName = focused ? 'add-circle' : 'add-circle-outline';
          } else if (route.name === 'Notifications') {
            iconName = focused ? 'notifications' : 'notifications-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#6b7280',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#e5e7eb',
          borderTopWidth: 1,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="NewPost" component={NewPostScreen} options={{ title: 'Create' }} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
}

function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      {!user ? (
        <Stack.Screen name="Auth" component={AuthStack} />
      ) : (
        <>
          <Stack.Screen name="Main" component={MainTabs} />
          
          {/* Messaging */}
          <Stack.Screen name="Messages" component={MessagesScreen} />
          <Stack.Screen name="Chat" component={ChatScreen} />
          <Stack.Screen name="NewChat" component={NewChatScreen} />
          <Stack.Screen name="NewGroup" component={NewGroupScreen} />
          <Stack.Screen name="GroupInfo" component={GroupInfoScreen} />
          
          {/* Content */}
          <Stack.Screen name="PostView" component={PostViewScreen} />
          <Stack.Screen name="Comments" component={CommentsScreen} />
          <Stack.Screen name="LikesList" component={LikesListScreen} />
          <Stack.Screen name="SharePost" component={SharePostScreen} />
          
          {/* Stories & Glimpses */}
          <Stack.Screen name="StoryViewer" component={StoryViewerScreen} />
          <Stack.Screen name="StoryCreate" component={StoryCreateScreen} />
          <Stack.Screen name="GlimpseViewer" component={GlimpseViewerScreen} />
          <Stack.Screen name="GlimpseCreate" component={GlimpseCreateScreen} />
          <Stack.Screen name="Highlights" component={HighlightsScreen} />
          <Stack.Screen name="ViewersList" component={ViewersListScreen} />
          
          {/* Profile */}
          <Stack.Screen name="EditProfile" component={EditProfileScreen} />
          <Stack.Screen name="FollowersList" component={FollowersListScreen} />
          <Stack.Screen name="Following" component={FollowingScreen} />
          <Stack.Screen name="TaggedPosts" component={TaggedPostsScreen} />
          <Stack.Screen name="Mentions" component={MentionsScreen} />
          
          {/* Profile Editors */}
          <Stack.Screen name="AvatarEditor" component={AvatarEditorScreen} />
          <Stack.Screen name="BioEditor" component={BioEditorScreen} />
          <Stack.Screen name="NameEditor" component={NameEditorScreen} />
          <Stack.Screen name="WebsiteEditor" component={WebsiteEditorScreen} />
          <Stack.Screen name="LocationEditor" component={LocationEditorScreen} />
          
          {/* Content Management */}
          <Stack.Screen name="SavedPosts" component={SavedPostsScreen} />
          <Stack.Screen name="Archive" component={ArchiveScreen} />
          <Stack.Screen name="LikedPosts" component={LikedPostsScreen} />
          <Stack.Screen name="Collections" component={CollectionsScreen} />
          <Stack.Screen name="Bookmarks" component={BookmarksScreen} />
          <Stack.Screen name="Drafts" component={DraftsScreen} />
          
          {/* Discovery */}
          <Stack.Screen name="Discovery" component={DiscoveryScreen} />
          <Stack.Screen name="Explore" component={ExploreScreen} />
          <Stack.Screen name="Trending" component={TrendingScreen} />
          <Stack.Screen name="Hashtag" component={HashtagScreen} />
          <Stack.Screen name="Location" component={LocationScreen} />
          <Stack.Screen name="Suggestions" component={SuggestionsScreen} />
          <Stack.Screen name="RecentSearches" component={RecentSearchesScreen} />
          
          {/* Settings */}
          <Stack.Screen name="Settings" component={SettingsMainScreen} />
          <Stack.Screen name="PrivacySettings" component={PrivacySettingsScreen} />
          <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
          <Stack.Screen name="AccountSettings" component={AccountSettingsScreen} />
          <Stack.Screen name="SecuritySettings" component={SecuritySettingsScreen} />
          <Stack.Screen name="AppearanceSettings" component={AppearanceSettingsScreen} />
          <Stack.Screen name="LanguageSettings" component={LanguageSettingsScreen} />
          <Stack.Screen name="DataUsage" component={DataUsageScreen} />
          <Stack.Screen name="Accessibility" component={AccessibilityScreen} />
          <Stack.Screen name="SoundSettings" component={SoundSettingsScreen} />
          <Stack.Screen name="AutoPlaySettings" component={AutoPlaySettingsScreen} />
          <Stack.Screen name="CaptionsSettings" component={CaptionsSettingsScreen} />
          
          {/* Account & Security */}
          <Stack.Screen name="TwoFactorAuth" component={TwoFactorAuthScreen} />
          <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
          <Stack.Screen name="DeactivateAccount" component={DeactivateAccountScreen} />
          <Stack.Screen name="DeleteAccount" component={DeleteAccountScreen} />
          <Stack.Screen name="EmailPhone" component={EmailPhoneScreen} />
          <Stack.Screen name="LoginActivity" component={LoginActivityScreen} />
          <Stack.Screen name="SavedLogin" component={SavedLoginScreen} />
          <Stack.Screen name="AppsWebsites" component={AppsWebsitesScreen} />
          <Stack.Screen name="BackupCodes" component={BackupCodesScreen} />
          
          {/* Privacy Controls */}
          <Stack.Screen name="BlockedUsers" component={BlockedUsersScreen} />
          <Stack.Screen name="MutedAccounts" component={MutedAccountsScreen} />
          <Stack.Screen name="CloseFriends" component={CloseFriendsScreen} />
          <Stack.Screen name="RestrictedAccounts" component={RestrictedAccountsScreen} />
          <Stack.Screen name="FollowRequests" component={FollowRequestsScreen} />
          <Stack.Screen name="MessagePrivacy" component={MessagePrivacyScreen} />
          <Stack.Screen name="CommentPrivacy" component={CommentPrivacyScreen} />
          <Stack.Screen name="TagPrivacy" component={TagPrivacyScreen} />
          <Stack.Screen name="HideStory" component={HideStoryScreen} />
          <Stack.Screen name="MentionSettings" component={MentionSettingsScreen} />
          
          {/* Moderation */}
          <Stack.Screen name="ReportContent" component={ReportContentScreen} />
          <Stack.Screen name="ReportProblem" component={ReportProblemScreen} />
          <Stack.Screen name="BlockConfirm" component={BlockConfirmScreen} />
          <Stack.Screen name="MuteConfirm" component={MuteConfirmScreen} />
          
          {/* Analytics */}
          <Stack.Screen name="Analytics" component={AnalyticsScreen} />
          <Stack.Screen name="Insights" component={InsightsScreen} />
          <Stack.Screen name="ActivityLog" component={ActivityLogScreen} />
          <Stack.Screen name="StorageUsage" component={StorageUsageScreen} />
          
          {/* Media Tools */}
          <Stack.Screen name="MediaPicker" component={MediaPickerScreen} />
          <Stack.Screen name="CaptionEditor" component={CaptionEditorScreen} />
          <Stack.Screen name="Filters" component={FiltersScreen} />
          <Stack.Screen name="Crop" component={CropScreen} />
          
          {/* Social Features */}
          <Stack.Screen name="QRCode" component={QRCodeScreen} />
          <Stack.Screen name="ScanQR" component={ScanQRScreen} />
          <Stack.Screen name="PollCreate" component={PollCreateScreen} />
          <Stack.Screen name="LiveStream" component={LiveStreamScreen} />
          <Stack.Screen name="Badges" component={BadgesScreen} />
          <Stack.Screen name="Achievements" component={AchievementsScreen} />
          <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
          
          {/* Preferences */}
          <Stack.Screen name="Interests" component={InterestsScreen} />
          <Stack.Screen name="Theme" component={ThemeScreen} />
          <Stack.Screen name="FontSize" component={FontSizeScreen} />
          <Stack.Screen name="RequestVerification" component={RequestVerificationScreen} />
          <Stack.Screen name="CacheManagement" component={CacheManagementScreen} />
          <Stack.Screen name="DownloadData" component={DownloadDataScreen} />
          
          {/* Support & Info */}
          <Stack.Screen name="HelpCenter" component={HelpCenterScreen} />
          <Stack.Screen name="About" component={AboutScreen} />
          <Stack.Screen name="Terms" component={TermsScreen} />
          <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
          <Stack.Screen name="Guidelines" component={GuidelinesScreen} />
          <Stack.Screen name="FAQ" component={FAQScreen} />
          <Stack.Screen name="ContactSupport" component={ContactSupportScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <StatusBar style="dark" />
        <AppNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
