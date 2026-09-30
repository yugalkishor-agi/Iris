import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import AnimatedTabBar from '../components/navigation/AnimatedTabBar';

// Screens
import HomeScreenWorking from '../screens/HomeScreenWorking';
import SearchScreen from '../screens/SearchScreenEnhanced';
import MessagesScreenEnhanced from '../screens/MessagesScreenEnhanced';
import NotificationsScreen from '../screens/NotificationsScreen';
import ProfileScreen from '../screens/ProfileScreenEnhanced';
import ActiveUsersScreen from '../screens/ActiveUsersScreen';

// Create/Edit Screens
import StoryCreateScreen from '../screens/StoryCreateScreen';
import NewPostScreen from '../screens/NewPostScreen';
import GlimpseCreateScreen from '../screens/GlimpseCreateScreen';
import LiveStreamScreen from '../screens/LiveStreamScreen';
import EditorTestScreen from '../screens/EditorTestScreen';
import DevMenuScreen from '../screens/DevMenuScreen';

// Story Components
import StoryViewerScreen from '../screens/StoryViewerScreen';
import StoryViewerEnhanced from '../screens/StoryViewerEnhanced';
import GlimpseViewerScreen from '../screens/GlimpseViewerScreen';
import StoryCamera from '../components/StoryEditor/StoryCamera';

// Other Screens
import ChatScreenEnhanced from '../screens/ChatScreenEnhanced';
import UserProfileScreen from '../screens/ProfileScreenEnhanced';
import PostViewScreen from '../screens/PostViewScreen';
import CommentsScreen from '../screens/CommentsScreen';
import NewMessageScreen from '../screens/NewMessageScreen';
import ChatDetailsScreen from '../screens/ChatDetailsScreen';
import ChatMessageSearchScreen from '../screens/ChatMessageSearchScreen';
import ChatPrivacySafetyScreen from '../screens/ChatPrivacySafetyScreen';
import ChatProfileScreen from '../screens/ChatProfileScreen';
import HighlightsScreen from '../screens/HighlightsScreen';
import StoryHighlightsManagerScreen from '../screens/StoryHighlightsManagerScreen';
import NewGroupScreen from '../screens/NewGroupScreen';
import GroupInfoScreen from '../screens/GroupInfoScreen';
import GroupChatSettingsScreen from '../screens/GroupChatSettingsScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Main Tab Navigator
function MainTabNavigator() {
  return (
    <Tab.Navigator
      id={undefined}
      tabBar={props => <AnimatedTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreenWorking}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen 
        name="Search" 
        component={SearchScreen}
        options={{ tabBarLabel: 'Search' }}
      />
      <Tab.Screen 
        name="Create" 
        component={HomeScreenWorking} // Dummy - handled by floating button
        options={{ 
          tabBarLabel: 'Create',
          tabBarButton: () => null, // Hide tab - using floating button instead
        }}
      />
      <Tab.Screen 
        name="Notifications" 
        component={NotificationsScreen}
        options={{ tabBarLabel: 'Activity' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
}

// Main App Navigator
export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        id={undefined}
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: '#000000' },
          gestureEnabled: true,
          gestureDirection: 'horizontal',
        }}
      >
        {/* Main App */}
        <Stack.Screen 
          name="MainTabs" 
          component={MainTabNavigator}
        />

        {/* Story Creation Flow */}
        <Stack.Screen 
          name="StoryEditor" 
          component={StoryCreateScreen}
          options={{
            presentation: 'modal',
            gestureEnabled: false,
          }}
        />
        
        <Stack.Screen 
          name="StoryCamera" 
          component={StoryCamera}
          options={{
            presentation: 'modal',
            gestureEnabled: false,
          }}
        />

        {/* Content Creation */}
        <Stack.Screen 
          name="NewPost" 
          component={NewPostScreen}
          options={{
            presentation: 'modal',

            headerShown: true,
            headerTitle: 'New Post',
            headerStyle: { backgroundColor: '#000000' },
            headerTintColor: '#FFFFFF',
          }}
        />

        <Stack.Screen 
          name="GlimpseCreate" 
          component={GlimpseCreateScreen}
          options={{
            presentation: 'modal',
            gestureEnabled: false,
          }}
        />

        <Stack.Screen 
          name="LiveStream" 
          component={LiveStreamScreen}
          options={{
            presentation: 'modal',
            gestureEnabled: false,
          }}
        />

                {/* Story Viewing */}
        <Stack.Screen 
          name="StoryViewer" 
          component={StoryViewerEnhanced}
          options={{
            presentation: 'modal',
            gestureEnabled: true,
            gestureDirection: 'vertical',
          }}
        />

        <Stack.Screen
          name="StoryViewerEnhanced"
          component={StoryViewerEnhanced}
          options={{
            presentation: 'modal',
            gestureEnabled: true,
            gestureDirection: 'vertical',
          }}
        />

                {/* Glimpse Viewing */}
        <Stack.Screen 
          name="GlimpseViewer" 
          component={GlimpseViewerScreen}
          options={{
            presentation: 'modal',
            gestureEnabled: true,
            gestureDirection: 'vertical',
          }}
        />

        {/* Messages Flow */}
        <Stack.Screen 
          name="Messages" 
          component={MessagesScreenEnhanced}
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen 
          name="Chat" 
          component={ChatScreenEnhanced}
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="ChatDetails"
          component={ChatDetailsScreen}
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="ChatMessageSearch"
          component={ChatMessageSearchScreen}
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="ChatPrivacySafety"
          component={ChatPrivacySafetyScreen}
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="ChatProfile"
          component={ChatProfileScreen}
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name="NewGroup"
          component={NewGroupScreen}
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="GroupInfo"
          component={GroupInfoScreen}
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="GroupChatSettings"
          component={GroupChatSettingsScreen}
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen 
          name="NewMessage" 
          component={NewMessageScreen}
          options={{
            presentation: 'modal',
            headerShown: true,
            headerTitle: 'New Message',
            headerStyle: { backgroundColor: '#000000' },
            headerTintColor: '#FFFFFF',
          }}
        />
        
        <Stack.Screen
          name="ActiveUsers"
          component={ActiveUsersScreen}
          options={{
            headerShown: false,
          }}
        />

        {/* Profile & Posts */}
        <Stack.Screen
          name="StoryHighlightsManager"
          component={StoryHighlightsManagerScreen}
          options={{
            headerShown: true,
            headerTitle: "Story Highlights",
            headerStyle: { backgroundColor: "#000000" },
            headerTintColor: "#FFFFFF",
          }}
        />

        <Stack.Screen
          name="Highlights"
          component={HighlightsScreen}
          options={{
            headerShown: true,
            headerTitle: "Highlights",
            headerStyle: { backgroundColor: "#000000" },
            headerTintColor: "#FFFFFF",
          }}
        />

        <Stack.Screen
          name="UserProfile"
          component={UserProfileScreen}
          options={({ route }) => ({
            headerShown: true,
            headerTitle: (route.params as any)?.username || "Profile",
            headerStyle: { backgroundColor: "#000000" },
            headerTintColor: "#FFFFFF",
          })}
        />

        <Stack.Screen 
          name="PostView" 
          component={PostViewScreen}
          options={{
            headerShown: true,
            headerTitle: 'Post',
            headerStyle: { backgroundColor: '#000000' },
            headerTintColor: '#FFFFFF',
          }}
        />

        <Stack.Screen 
          name="Comments" 
          component={CommentsScreen}
          options={{
            presentation: 'modal',
            headerShown: true,
            headerTitle: 'Comments',
            headerStyle: { backgroundColor: '#000000' },
            headerTintColor: '#FFFFFF',
          }}
        />

        {/* Camera */}
        <Stack.Screen 
          name="Camera" 
          component={StoryCamera}
          options={{
            presentation: 'modal',
            gestureEnabled: false,
          }}
        />

        {/* Dev/Testing Screens */}
        <Stack.Screen 
          name="DevMenu" 
          component={DevMenuScreen}
          options={{
            headerShown: true,
            headerTitle: '🧪 Developer Menu',
            headerStyle: { backgroundColor: '#000000' },
            headerTintColor: '#FFFFFF',
          }}
        />
        
        <Stack.Screen 
          name="EditorTest" 
          component={EditorTestScreen}
          options={{
            presentation: 'modal',
            headerShown: true,
            headerTitle: '🎨 Editor Testing',
            headerStyle: { backgroundColor: '#000000' },
            headerTintColor: '#FFFFFF',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}



















