interface StoryViewerProps {
    route: {
        params: {
          userId?: string;
          storyId?: string;
          storyIndex?: number;
          startFromEnd?: boolean;
        };
        };
    navigation: any;
}
