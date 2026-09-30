import React from 'react';
import { Animated, Platform } from 'react-native';
import { TapGestureHandler, PanGestureHandler, State } from 'react-native-gesture-handler';

interface StoryViewerGesturesProps {
  children: React.ReactNode;
  useWebView: boolean;
  tapRef: any;
  doubleTapRef: any;
  panRef: any;
  setIsPaused: (p: boolean) => void;
  handleDoubleTap: () => void;
  handleSwipeDown: (e: any) => void;
}

export const StoryViewerGestures: React.FC<StoryViewerGesturesProps> = ({
  children,
  useWebView,
  tapRef,
  doubleTapRef,
  panRef,
  setIsPaused,
  handleDoubleTap,
  handleSwipeDown
}) => {
  if (Platform.OS === 'web') {
    return <>{children}</>;
  }

  return (
    <TapGestureHandler
      enabled={false}
      ref={tapRef}
      waitFor={doubleTapRef}
      onHandlerStateChange={(event: any) => {
        const state = event.nativeEvent.state;
        if (state === State.BEGAN || state === State.ACTIVE) setIsPaused(true);
        if (state === State.END) {
          setIsPaused(false);
        }
        if (state === State.CANCELLED || state === State.FAILED) setIsPaused(false);
      }}
    >
      <TapGestureHandler
        enabled={false}
        ref={doubleTapRef}
        numberOfTaps={2}
        maxDelayMs={260}
        maxDist={16}
        onActivated={() => { setIsPaused(false); handleDoubleTap(); }}
        onHandlerStateChange={(event: any) => {
          const state = event.nativeEvent.state;
          if (state === State.BEGAN || state === State.ACTIVE) setIsPaused(true);
          if (state === State.CANCELLED || state === State.FAILED) setIsPaused(false);
        }}
      >
        <PanGestureHandler
          enabled={!useWebView}
          ref={panRef}
          onHandlerStateChange={(event: any) => {
            const state = event.nativeEvent.state;
            if (state === State.BEGAN || state === State.ACTIVE) setIsPaused(true);
            if (state === State.END) {
              setIsPaused(false);
              handleSwipeDown(event);
            }
            if (state === State.CANCELLED || state === State.FAILED) setIsPaused(false);
          }}
        >
          {children}
        </PanGestureHandler>
      </TapGestureHandler>
    </TapGestureHandler>
  );
};
