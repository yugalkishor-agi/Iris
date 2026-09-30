import { create } from 'zustand';

interface StoryViewerState {
  stories: any[];
  setStories: (val: any[] | ((prev: any[]) => any[])) => void;
  currentStory: any;
  setCurrentStory: (val: any | ((prev: any) => any)) => void;
  loading: any;
  setLoading: (val: any | ((prev: any) => any)) => void;
  storyUser: any;
  setStoryUser: (val: any | ((prev: any) => any)) => void;
  progress: any;
  setProgress: (val: any | ((prev: any) => any)) => void;
  isPaused: any;
  setIsPaused: (val: any | ((prev: any) => any)) => void;
  isTyping: any;
  setIsTyping: (val: any | ((prev: any) => any)) => void;
  isLiked: any;
  setIsLiked: (val: any | ((prev: any) => any)) => void;
  replyText: any;
  setReplyText: (val: any | ((prev: any) => any)) => void;
  showInsights: any;
  setShowInsights: (val: any | ((prev: any) => any)) => void;
  insightsUsers: any[];
  setInsightsUsers: (val: any[] | ((prev: any[]) => any[])) => void;
  viewersData: any[];
  setViewersData: (val: any[] | ((prev: any[]) => any[])) => void;
  likersData: any[];
  setLikersData: (val: any[] | ((prev: any[]) => any[])) => void;
  viewerIdsOrdered: string[];
  setViewerIdsOrdered: (val: string[] | ((prev: string[]) => string[])) => void;
  likerIdsOrdered: string[];
  setLikerIdsOrdered: (val: string[] | ((prev: string[]) => string[])) => void;
  loadingInsights: any;
  setLoadingInsights: (val: any | ((prev: any) => any)) => void;
  myQuizAnswer: Record<string, number | null>;
  setMyQuizAnswer: (val: Record<string, number | null> | ((prev: Record<string, number | null>) => Record<string, number | null>)) => void;
  showMoreMenu: any;
  setShowMoreMenu: (val: any | ((prev: any) => any)) => void;
  showShareModal: any;
  setShowShareModal: (val: any | ((prev: any) => any)) => void;
  showDeleteDialog: any;
  setShowDeleteDialog: (val: any | ((prev: any) => any)) => void;
  pollResults: Record<string, { counts: number[]; total: number }>;
  setPollResults: (val: Record<string, { counts: number[]; total: number }> | ((prev: Record<string, { counts: number[]; total: number }>) => Record<string, { counts: number[]; total: number }>)) => void;
  myPollVote: Record<string, number | null>;
  setMyPollVote: (val: Record<string, number | null> | ((prev: Record<string, number | null>) => Record<string, number | null>)) => void;
  sliderStats: Record<string, { avg: number; count: number }>;
  setSliderStats: (val: Record<string, { avg: number; count: number }> | ((prev: Record<string, { avg: number; count: number }>) => Record<string, { avg: number; count: number }>)) => void;
  mySliderValue: Record<string, number | null>;
  setMySliderValue: (val: Record<string, number | null> | ((prev: Record<string, number | null>) => Record<string, number | null>)) => void;
  questionModal: { visible: boolean; stickerId?: string; text: string };
  setQuestionModal: (val: { visible: boolean; stickerId?: string; text: string } | ((prev: { visible: boolean; stickerId?: string; text: string }) => { visible: boolean; stickerId?: string; text: string })) => void;
  activeQuestion: { stickerId: string | null; text: string };
  setActiveQuestion: (val: { stickerId: string | null; text: string } | ((prev: { stickerId: string | null; text: string }) => { stickerId: string | null; text: string })) => void;
  questionRepliesModal: { visible: boolean; stickerId?: string };
  setQuestionRepliesModal: (val: { visible: boolean; stickerId?: string } | ((prev: { visible: boolean; stickerId?: string }) => { visible: boolean; stickerId?: string })) => void;
  questionReplies: Record<string, Array<{ replyId: string; senderId: string; message: string }>>;
  setQuestionReplies: (val: Record<string, Array<{ replyId: string; senderId: string; message: string }>> | ((prev: Record<string, Array<{ replyId: string; senderId: string; message: string }>>) => Record<string, Array<{ replyId: string; senderId: string; message: string }>>)) => void;
  questionCounts: Record<string, number>;
  setQuestionCounts: (val: Record<string, number> | ((prev: Record<string, number>) => Record<string, number>)) => void;
  quizResults: Record<string, { counts: number[]; total: number }>;
  setQuizResults: (val: Record<string, { counts: number[]; total: number }> | ((prev: Record<string, { counts: number[]; total: number }>) => Record<string, { counts: number[]; total: number }>)) => void;
  sliderWidths: Record<string, number>;
  setSliderWidths: (val: Record<string, number> | ((prev: Record<string, number>) => Record<string, number>)) => void;
  sentToastText: any;
  setSentToastText: (val: any | ((prev: any) => any)) => void;
  mediaNaturalSize: { width: number; height: number } | null;
  setMediaNaturalSize: (val: { width: number; height: number } | null | ((prev: { width: number; height: number } | null) => { width: number; height: number } | null)) => void;
  widgetsOverlays: Record<string, any[]>;
  setWidgetsOverlays: (val: Record<string, any[]> | ((prev: Record<string, any[]>) => Record<string, any[]>)) => void;
  webRendererFailed: any;
  setWebRendererFailed: (val: any | ((prev: any) => any)) => void;
  webRendererReady: any;
  setWebRendererReady: (val: any | ((prev: any) => any)) => void;
  isEmulator: any;
  setIsEmulator: (val: any | ((prev: any) => any)) => void;
  webErrorCount: any;
  setWebErrorCount: (val: any | ((prev: any) => any)) => void;
  preferSoftwareLayer: any;
  setPreferSoftwareLayer: (val: any | ((prev: any) => any)) => void;
  sessionForceNative: any;
  setSessionForceNative: (val: any | ((prev: any) => any)) => void;
  webViewKey: any;
  setWebViewKey: (val: any | ((prev: any) => any)) => void;
  webMountReady: any;
  setWebMountReady: (val: any | ((prev: any) => any)) => void;
}

export const useStoryViewerStore = create<StoryViewerState>((set) => ({
  stories: [],
  setStories: (val) => set((state) => ({ stories: typeof val === 'function' ? (val as any)(state.stories) : val })),
  currentStory: null,
  setCurrentStory: (val) => set((state) => ({ currentStory: typeof val === 'function' ? (val as any)(state.currentStory) : val })),
  loading: true,
  setLoading: (val) => set((state) => ({ loading: typeof val === 'function' ? (val as any)(state.loading) : val })),
  storyUser: null,
  setStoryUser: (val) => set((state) => ({ storyUser: typeof val === 'function' ? (val as any)(state.storyUser) : val })),
  progress: 0,
  setProgress: (val) => set((state) => ({ progress: typeof val === 'function' ? (val as any)(state.progress) : val })),
  isPaused: false,
  setIsPaused: (val) => set((state) => ({ isPaused: typeof val === 'function' ? (val as any)(state.isPaused) : val })),
  isTyping: false,
  setIsTyping: (val) => set((state) => ({ isTyping: typeof val === 'function' ? (val as any)(state.isTyping) : val })),
  isLiked: false,
  setIsLiked: (val) => set((state) => ({ isLiked: typeof val === 'function' ? (val as any)(state.isLiked) : val })),
  replyText: '',
  setReplyText: (val) => set((state) => ({ replyText: typeof val === 'function' ? (val as any)(state.replyText) : val })),
  showInsights: false,
  setShowInsights: (val) => set((state) => ({ showInsights: typeof val === 'function' ? (val as any)(state.showInsights) : val })),
  insightsUsers: [],
  setInsightsUsers: (val) => set((state) => ({ insightsUsers: typeof val === 'function' ? (val as any)(state.insightsUsers) : val })),
  viewersData: [],
  setViewersData: (val) => set((state) => ({ viewersData: typeof val === 'function' ? (val as any)(state.viewersData) : val })),
  likersData: [],
  setLikersData: (val) => set((state) => ({ likersData: typeof val === 'function' ? (val as any)(state.likersData) : val })),
  viewerIdsOrdered: [],
  setViewerIdsOrdered: (val) => set((state) => ({ viewerIdsOrdered: typeof val === 'function' ? (val as any)(state.viewerIdsOrdered) : val })),
  likerIdsOrdered: [],
  setLikerIdsOrdered: (val) => set((state) => ({ likerIdsOrdered: typeof val === 'function' ? (val as any)(state.likerIdsOrdered) : val })),
  loadingInsights: false,
  setLoadingInsights: (val) => set((state) => ({ loadingInsights: typeof val === 'function' ? (val as any)(state.loadingInsights) : val })),
  myQuizAnswer: {},
  setMyQuizAnswer: (val) => set((state) => ({ myQuizAnswer: typeof val === 'function' ? (val as any)(state.myQuizAnswer) : val })),
  showMoreMenu: false,
  setShowMoreMenu: (val) => set((state) => ({ showMoreMenu: typeof val === 'function' ? (val as any)(state.showMoreMenu) : val })),
  showShareModal: false,
  setShowShareModal: (val) => set((state) => ({ showShareModal: typeof val === 'function' ? (val as any)(state.showShareModal) : val })),
  showDeleteDialog: false,
  setShowDeleteDialog: (val) => set((state) => ({ showDeleteDialog: typeof val === 'function' ? (val as any)(state.showDeleteDialog) : val })),
  pollResults: {},
  setPollResults: (val) => set((state) => ({ pollResults: typeof val === 'function' ? (val as any)(state.pollResults) : val })),
  myPollVote: {},
  setMyPollVote: (val) => set((state) => ({ myPollVote: typeof val === 'function' ? (val as any)(state.myPollVote) : val })),
  sliderStats: {},
  setSliderStats: (val) => set((state) => ({ sliderStats: typeof val === 'function' ? (val as any)(state.sliderStats) : val })),
  mySliderValue: {},
  setMySliderValue: (val) => set((state) => ({ mySliderValue: typeof val === 'function' ? (val as any)(state.mySliderValue) : val })),
  questionModal: null,
  setQuestionModal: (val) => set((state) => ({ questionModal: typeof val === 'function' ? (val as any)(state.questionModal) : val })),
  activeQuestion: null,
  setActiveQuestion: (val) => set((state) => ({ activeQuestion: typeof val === 'function' ? (val as any)(state.activeQuestion) : val })),
  questionRepliesModal: null,
  setQuestionRepliesModal: (val) => set((state) => ({ questionRepliesModal: typeof val === 'function' ? (val as any)(state.questionRepliesModal) : val })),
  questionReplies: {},
  setQuestionReplies: (val) => set((state) => ({ questionReplies: typeof val === 'function' ? (val as any)(state.questionReplies) : val })),
  questionCounts: {},
  setQuestionCounts: (val) => set((state) => ({ questionCounts: typeof val === 'function' ? (val as any)(state.questionCounts) : val })),
  quizResults: {},
  setQuizResults: (val) => set((state) => ({ quizResults: typeof val === 'function' ? (val as any)(state.quizResults) : val })),
  sliderWidths: {},
  setSliderWidths: (val) => set((state) => ({ sliderWidths: typeof val === 'function' ? (val as any)(state.sliderWidths) : val })),
  sentToastText: '',
  setSentToastText: (val) => set((state) => ({ sentToastText: typeof val === 'function' ? (val as any)(state.sentToastText) : val })),
  mediaNaturalSize: null,
  setMediaNaturalSize: (val) => set((state) => ({ mediaNaturalSize: typeof val === 'function' ? (val as any)(state.mediaNaturalSize) : val })),
  widgetsOverlays: {},
  setWidgetsOverlays: (val) => set((state) => ({ widgetsOverlays: typeof val === 'function' ? (val as any)(state.widgetsOverlays) : val })),
  webRendererFailed: false,
  setWebRendererFailed: (val) => set((state) => ({ webRendererFailed: typeof val === 'function' ? (val as any)(state.webRendererFailed) : val })),
  webRendererReady: false,
  setWebRendererReady: (val) => set((state) => ({ webRendererReady: typeof val === 'function' ? (val as any)(state.webRendererReady) : val })),
  isEmulator: false,
  setIsEmulator: (val) => set((state) => ({ isEmulator: typeof val === 'function' ? (val as any)(state.isEmulator) : val })),
  webErrorCount: 0,
  setWebErrorCount: (val) => set((state) => ({ webErrorCount: typeof val === 'function' ? (val as any)(state.webErrorCount) : val })),
  preferSoftwareLayer: false,
  setPreferSoftwareLayer: (val) => set((state) => ({ preferSoftwareLayer: typeof val === 'function' ? (val as any)(state.preferSoftwareLayer) : val })),
  sessionForceNative: false,
  setSessionForceNative: (val) => set((state) => ({ sessionForceNative: typeof val === 'function' ? (val as any)(state.sessionForceNative) : val })),
  webViewKey: 0,
  setWebViewKey: (val) => set((state) => ({ webViewKey: typeof val === 'function' ? (val as any)(state.webViewKey) : val })),
  webMountReady: true,
  setWebMountReady: (val) => set((state) => ({ webMountReady: typeof val === 'function' ? (val as any)(state.webMountReady) : val })),
}));
