import "./global.css";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { Suspense, lazy, useEffect } from "react";
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { UploadProvider } from './contexts/UploadContext';
import ErrorBoundary from './components/ErrorBoundary';
import { AppShell } from "@/components/layout/AppShell";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { LoadingState } from "@/components/ui/loading-state";

// Lazy load all pages for better performance
// Main Pages
const Index = lazy(() => import("./pages/Index"));
const Search = lazy(() => import("./pages/Search"));
const Discovery = lazy(() => import("./pages/Discovery"));
const NewPost = lazy(() => import("./pages/NewPost"));
const CreatePost = lazy(() => import("./pages/CreatePost"));
const Glimpses = lazy(() => import("./pages/Glimpses"));
const Moments = lazy(() => import("./pages/Moments"));
const Profile = lazy(() => import("./pages/Profile"));
const EditProfile = lazy(() => import("./pages/EditProfile"));
const Messages = lazy(() => import("./pages/Messages"));
const Chat = lazy(() => import("./pages/Chat"));
const NewChat = lazy(() => import("./pages/NewChat"));
const NewGroup = lazy(() => import("./pages/NewGroup"));
const Settings = lazy(() => import("./pages/Settings"));
const Admin = lazy(() => import("./pages/Admin"));
const Notifications = lazy(() => import("./pages/Notifications"));
const PostViewer = lazy(() => import("./pages/PostViewer"));
const Comments = lazy(() => import("./pages/Comments"));

// Story/Glimpse Pages
const StoryPost = lazy(() => import("./pages/StoryPost"));
const StoryCreate = lazy(() => import("./pages/StoryCreate"));
const MomentCreate = lazy(() => import("./pages/MomentCreate"));
const StoryViewer = lazy(() => import("./pages/StoryViewer"));
const StoryAnalytics = lazy(() => import("./pages/StoryAnalytics"));
const GlimpseCreate = lazy(() => import("./pages/GlimpseCreate"));
const GlimpseCreateNew = lazy(() => import("./pages/GlimpseCreateNew"));
const GlimpseViewer = lazy(() => import("./pages/GlimpseViewer"));
const GlimpseEdit = lazy(() => import("./pages/GlimpseEdit"));
const GlimpseTextEditor = lazy(() => import("./pages/GlimpseTextEditor"));
const StoryHighlightsManager = lazy(() => import("./pages/StoryHighlightsManager_Enhanced"));
const HighlightViewer = lazy(() => import("./pages/HighlightViewer"));
const HighlightEdit = lazy(() => import("./pages/HighlightEdit"));
const ArchivedStoryViewer = lazy(() => import("./pages/ArchivedStoryViewer"));
const MyActivity = lazy(() => import("./pages/MyActivity"));
const MusicSearch = lazy(() => import("./pages/MusicSearch"));
const LiveStream = lazy(() => import("./pages/LiveStream"));

// Profile Pages
const ProfileSettings = lazy(() => import("./pages/ProfileSettings"));
const BioEditor = lazy(() => import("./pages/BioEditor"));
const FollowersList = lazy(() => import("./pages/FollowersList"));
const Following = lazy(() => import("./pages/Following"));
const FollowSuggestions = lazy(() => import("./pages/FollowSuggestions"));
const CloseFriends = lazy(() => import("./pages/CloseFriends"));

// Post Features
const PostEditor = lazy(() => import("./pages/PostEditor"));
const SavedCollections = lazy(() => import("./pages/SavedCollections"));
const CollectionDetail = lazy(() => import("./pages/CollectionDetail"));
const VideoEditor = lazy(() => import("./pages/VideoEditor"));
const SharePost = lazy(() => import("./pages/SharePost"));

// Account Settings
const PersonalInfo = lazy(() => import("./pages/PersonalInfo"));
const ChangePassword = lazy(() => import("./pages/ChangePassword"));
const EmailPhoneSettings = lazy(() => import("./pages/EmailPhoneSettings"));
const DeactivateAccount = lazy(() => import("./pages/DeactivateAccount"));
const DeleteAccount = lazy(() => import("./pages/DeleteAccount"));
const ProfessionalAccount = lazy(() => import("./pages/ProfessionalAccount"));
const AccountActivity = lazy(() => import("./pages/AccountActivity"));

// Privacy & Security
const Security = lazy(() => import("./pages/Security"));
const Privacy = lazy(() => import("./pages/Privacy"));
const PrivacySettings = lazy(() => import("./pages/PrivacySettings"));
const TwoFactorAuth = lazy(() => import("./pages/TwoFactorAuth"));
const BlockedUsers = lazy(() => import("./pages/BlockedUsers"));
const MutedAccounts = lazy(() => import("./pages/MutedAccounts"));
const HiddenWords = lazy(() => import("./pages/HiddenWords"));
const LoginActivity = lazy(() => import("./pages/LoginActivity"));

// Notifications
const NotificationSettings = lazy(() => import("./pages/NotificationSettings"));

// Appearance
const AccentColor = lazy(() => import("./pages/AccentColor"));
const FontSize = lazy(() => import("./pages/FontSize"));

// Language & Region
const Language = lazy(() => import("./pages/Language"));
const AppLanguage = lazy(() => import("./pages/AppLanguage"));

// Data & Storage
const ClearCache = lazy(() => import("./pages/ClearCache"));
const DownloadData = lazy(() => import("./pages/DownloadData"));
const StorageUsage = lazy(() => import("./pages/StorageUsage"));
const UploadQuality = lazy(() => import("./pages/UploadQuality"));

// Messages
const MessageRequests = lazy(() => import("./pages/MessageRequests"));
const ForwardMessage = lazy(() => import("./pages/ForwardMessage"));
const GroupChatSettings = lazy(() => import("./pages/GroupChatSettings"));

// Help & Support
const HelpCenter = lazy(() => import("./pages/HelpCenter"));
const ReportProblem = lazy(() => import("./pages/ReportProblem"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const Terms = lazy(() => import("./pages/Terms"));
const Guidelines = lazy(() => import("./pages/Guidelines"));
const Acknowledgements = lazy(() => import("./pages/Acknowledgements"));

// Advanced & Analytics
const Devices = lazy(() => import("./pages/Devices"));
const PostInsights = lazy(() => import("./pages/PostInsights"));
const GlimpseAnalytics = lazy(() => import("./pages/GlimpseAnalytics"));
const StorageOptimization = lazy(() => import("./pages/StorageOptimization"));
const Experimental = lazy(() => import("./pages/Experimental"));

// Additional Settings
const AccountStatus = lazy(() => import("./pages/AccountStatus"));
const StoryReplies = lazy(() => import("./pages/StoryReplies"));
const SecurityAlerts = lazy(() => import("./pages/SecurityAlerts"));
const NotificationSound = lazy(() => import("./pages/NotificationSound"));
const LayoutStyle = lazy(() => import("./pages/LayoutStyle"));
const AppIcon = lazy(() => import("./pages/AppIcon"));
const Region = lazy(() => import("./pages/Region"));
const Translation = lazy(() => import("./pages/Translation"));
const DateTimeFormat = lazy(() => import("./pages/DateTimeFormat"));
const SaveMedia = lazy(() => import("./pages/SaveMedia"));
const MutedChats = lazy(() => import("./pages/MutedChats"));

// Payment & Wallet
const Wallet = lazy(() => import("./pages/Wallet"));
const Transactions = lazy(() => import("./pages/Transactions"));
const PaymentMethods = lazy(() => import("./pages/PaymentMethods"));
const Subscriptions = lazy(() => import("./pages/Subscriptions"));

// Testing & Debug
const TestFeatures = lazy(() => import("./pages/TestFeatures"));

// Auth Pages - Keep these eager loaded for faster initial auth flow
import SplashScreen from "./pages/SplashScreen";
import WelcomeScreen from "./pages/WelcomeScreen";
import OnboardingScreen from "./pages/OnboardingScreen";
import LoginScreen from "./pages/LoginScreen";
import SignupScreen from "./pages/SignupScreen";
import ForgotPasswordScreen from "./pages/ForgotPasswordScreen";

function SplashRedirect() {
  const navigate = useNavigate();
  const { loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    
    // Check if we're switching accounts - skip splash completely
    const isSwitching = localStorage.getItem('accountSwitching');
    if (isSwitching) {
      localStorage.removeItem('accountSwitching');
      sessionStorage.setItem('splashShown', 'true');
      return; // Stay on home, don't redirect to splash
    }
    
    // Check if splash has been shown in this session
    const splashShown = sessionStorage.getItem('splashShown');
    
    if (!splashShown) {
      navigate('/splash', { replace: true });
    }
  }, [navigate, loading]);

  return null;
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <UploadProvider>
            <BrowserRouter>
          <Routes>
            {/* Splash Screen - Entry Point */}
            <Route path="/splash" element={<SplashScreen />} />
            
            {/* Auth Routes - No AppShell */}
            <Route path="/welcome" element={<WelcomeScreen />} />
            <Route path="/onboarding" element={<OnboardingScreen />} />
            <Route path="/login" element={<LoginScreen />} />
            <Route path="/signup" element={<SignupScreen />} />
            <Route path="/forgot-password" element={<ForgotPasswordScreen />} />
            
            {/* Public Legal Pages */}
            <Route path="/terms" element={
              <Suspense fallback={<LoadingState text="Loading..." />}>
                <Terms />
              </Suspense>
            } />
            <Route path="/privacy-policy" element={
              <Suspense fallback={<LoadingState text="Loading..." />}>
                <PrivacyPolicy />
              </Suspense>
            } />
            
            {/* Main App Routes - With AppShell (Protected) */}
            <Route path="/" element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingState text="Loading..." />}>
                  <SplashRedirect />
                  <AppShell />
                </Suspense>
              </ProtectedRoute>
            }>
              {/* Home & Feed */}
              <Route index element={<Index />} />
              <Route path="search" element={<Search />} />
              <Route path="discovery" element={<Discovery />} />
              <Route path="notifications" element={<Notifications />} />
              
              {/* Posts */}
              <Route path="post/new" element={<NewPost />} />
              <Route path="create-post" element={<CreatePost />} />
              <Route path="post/:id" element={<PostViewer />} />
              <Route path="p/:id/:username" element={<PostViewer />} />
              <Route path="share/post/:postId" element={<SharePost />} />
              <Route path="post-editor" element={<PostEditor />} />
              <Route path="video-editor" element={<VideoEditor />} />
              <Route path="comments/:id" element={<Comments />} />
              <Route path="saved-collections" element={<SavedCollections />} />
              <Route path="saved/collection/:id" element={<CollectionDetail />} />
              
              {/* Stories/Glimpses */}
              <Route path="story/new" element={<StoryPost />} />
              <Route path="story-create" element={<MomentCreate />} />
              <Route path="moment-create" element={<MomentCreate />} />
              <Route path="story/:userId" element={<StoryViewer />} />
              <Route path="story-viewer" element={<StoryViewer />} />
              <Route path="story-analytics" element={<StoryAnalytics />} />
              <Route path="story-highlights" element={<StoryHighlightsManager />} />
              <Route path="highlight/:id" element={<HighlightViewer />} />
              <Route path="highlight/:id/edit" element={<HighlightEdit />} />
              <Route path="story-archived/:id" element={<ArchivedStoryViewer />} />
              <Route path="glimpses" element={<Glimpses />} />
              <Route path="moments" element={<Moments />} />
              <Route path="glimpses/:id" element={<GlimpseViewer />} />
              <Route path="glimpse-create" element={<GlimpseCreate />} />
              <Route path="glimpse-create-new" element={<GlimpseCreateNew />} />
              <Route path="glimpse-edit/:id" element={<GlimpseEdit />} />
              <Route path="glimpse-text-editor" element={<GlimpseTextEditor />} />
              <Route path="music-search" element={<MusicSearch />} />
              <Route path="live" element={<LiveStream />} />
              
              {/* Profile */}
              <Route path="me" element={<Profile />} />
              <Route path="profile/edit" element={<EditProfile />} />
              <Route path="profile-settings" element={<ProfileSettings />} />
              <Route path="profile/:id" element={<Profile />} />
              <Route path="edit-bio" element={<BioEditor />} />
              <Route path="followers/:username" element={<FollowersList />} />
              <Route path="following/:username" element={<Following />} />
              <Route path="suggestions" element={<FollowSuggestions />} />
              <Route path="close-friends" element={<CloseFriends />} />
              
              {/* Messages */}
              <Route path="messages" element={<Messages />} />
              <Route path="messages/:userId" element={<Chat />} />
              <Route path="messages/new-group" element={<NewGroup />} />
              <Route path="chat/new" element={<NewChat />} />
              <Route path="chat/:id" element={<Chat />} />
              <Route path="forward-message" element={<ForwardMessage />} />
              <Route path="message-requests" element={<MessageRequests />} />
              <Route path="group-settings/:id" element={<GroupChatSettings />} />
              <Route path="save-media" element={<SaveMedia />} />
              <Route path="muted-chats" element={<MutedChats />} />
              
              {/* Settings - Main */}
              <Route path="settings" element={<Settings />} />
              <Route path="admin" element={<Admin />} />
              
              {/* Settings - Account */}
              <Route path="personal-info" element={<PersonalInfo />} />
              <Route path="change-password" element={<ChangePassword />} />
              <Route path="email-phone-settings" element={<EmailPhoneSettings />} />
              <Route path="my-activity" element={<MyActivity />} />
              <Route path="account-status" element={<AccountStatus />} />
              <Route path="deactivate" element={<DeactivateAccount />} />
              <Route path="delete-account" element={<DeleteAccount />} />
              <Route path="professional" element={<ProfessionalAccount />} />
              <Route path="account-activity" element={<AccountActivity />} />
              
              {/* Settings - Privacy & Security */}
              <Route path="security" element={<Security />} />
              {/* Aliases to support '/settings/security' deep links */}
              <Route path="settings/security" element={<Security />} />
              <Route path="privacy" element={<Privacy />} />
              {/* Alias for '/settings/privacy' */}
              <Route path="settings/privacy" element={<Privacy />} />
              <Route path="privacy-settings" element={<PrivacySettings />} />
              <Route path="two-factor-auth" element={<TwoFactorAuth />} />
              <Route path="blocked" element={<BlockedUsers />} />
              <Route path="muted" element={<MutedAccounts />} />
              <Route path="hidden-words" element={<HiddenWords />} />
              <Route path="login-activity" element={<LoginActivity />} />
              <Route path="story-replies" element={<StoryReplies />} />
              <Route path="security-alerts" element={<SecurityAlerts />} />
              
              {/* Settings - Notifications */}
              <Route path="notification-settings" element={<NotificationSettings />} />
              <Route path="notification-sound" element={<NotificationSound />} />
              <Route path="glimpse-notif" element={<NotificationSettings />} />
              
              {/* Settings - Appearance */}
              <Route path="accent-color" element={<AccentColor />} />
              <Route path="font-size" element={<FontSize />} />
              <Route path="layout-style" element={<LayoutStyle />} />
              <Route path="app-icon" element={<AppIcon />} />
              
              {/* Settings - Language */}
              <Route path="language" element={<Language />} />
              <Route path="app-language" element={<AppLanguage />} />
              <Route path="region" element={<Region />} />
              <Route path="translation" element={<Translation />} />
              <Route path="datetime-format" element={<DateTimeFormat />} />
              
              {/* Settings - Data & Storage */}
              <Route path="clear-cache" element={<ClearCache />} />
              <Route path="download-data" element={<DownloadData />} />
              <Route path="storage-usage" element={<StorageUsage />} />
              <Route path="upload-quality" element={<UploadQuality />} />
              
              {/* Help & Support */}
              <Route path="help" element={<HelpCenter />} />
              <Route path="report" element={<ReportProblem />} />
              <Route path="privacy-policy" element={<PrivacyPolicy />} />
              <Route path="terms" element={<Terms />} />
              <Route path="guidelines" element={<Guidelines />} />
              <Route path="acknowledgements" element={<Acknowledgements />} />
              
              {/* Payment & Wallet */}
              <Route path="wallet" element={<Wallet />} />
              <Route path="transactions" element={<Transactions />} />
              <Route path="payment-methods" element={<PaymentMethods />} />
              <Route path="subscriptions" element={<Subscriptions />} />
              
              {/* Advanced Features */}
              <Route path="devices" element={<Devices />} />
              <Route path="post-insights" element={<PostInsights />} />
              <Route path="/glimpse-analytics/:id" element={<GlimpseAnalytics />} />
              <Route path="/test-features" element={<TestFeatures />} />
              <Route path="storage-optimization" element={<StorageOptimization />} />
              <Route path="experimental" element={<Experimental />} />
            </Route>
          </Routes>
            </BrowserRouter>
          </UploadProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
