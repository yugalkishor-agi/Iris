import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Platform, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import StoryViewerScreenEnhanced from './StoryViewerScreenEnhanced';
import { storyService } from '../services/story.service.clean';
import { useAuth } from '../contexts/AuthContext';

interface WebStoryViewerScreenProps {
    route: {
        params: {
            story?: any;
            mediaUrl?: string;
            meta?: any;
            userId?: string;
            storyId?: string;
        };
    };
    navigation: any;
}

export function WebStoryViewerScreen({ route, navigation }: WebStoryViewerScreenProps) {
    const { story, mediaUrl, meta, storyId } = route.params || {};
    const { user: currentUser } = useAuth();
    const viewerId = currentUser?.userId || '';
    const isOwnStory = !!(viewerId && (story?.authorId === viewerId));

    // Track WebView failures - only fallback on actual crash
    const [webViewFailed, setWebViewFailed] = useState(false);

    // Lazy loading state - delay WebView rendering to avoid crash (same as Editor)
    const [webViewReady, setWebViewReady] = useState(false);

    // Delay WebView initialization to let Android settle (same pattern as Editor)
    useEffect(() => {
        const timer = setTimeout(() => {
            setWebViewReady(true);
        }, 700); // 700ms delay - sweet spot for stability

        return () => clearTimeout(timer);
    }, []);

    // Keep a ref to WebView for injecting results back to viewer
    const webRef = useRef<WebView>(null);

    // Map widgets from meta/story for option counts (quiz/poll)
    const widgetsMap = useMemo(() => {
        try {
            const list: any[] = Array.isArray(meta?.widgets) ? meta!.widgets
                : (Array.isArray(story?.widgets) ? story!.widgets : []);
            const m = new Map<string, any>();
            list.forEach((w: any, i: number) => m.set(String(w?.id || w?.widgetId || `w_${i}`), w));
            return m;
        } catch { return new Map<string, any>(); }
    }, [meta, story]);

    const injectResults = useCallback((payload: any) => {
        try {
            const js = `;(function(){ if (window.__applyWidgetResults) window.__applyWidgetResults(${JSON.stringify(payload)}); })(); true;`;
            webRef.current?.injectJavaScript(js);
        } catch {}
    }, []);

    // Build the URL to the web-viewer (separate bundle from editor)
    const viewerUrl = useMemo(() => {
        const base = __DEV__
            ? Platform.select({ ios: 'http://localhost:5174', android: 'http://10.0.2.2:5174' }) // Note: different port for viewer dev server
            : 'file:///android_asset/web-viewer/index.html';

        const params = new URLSearchParams({
            src: mediaUrl || story?.mediaURL || '',
        });

        // Pass meta data if available
        if (meta || story) {
            const metaData = meta || {
                widgets: story?.widgets || [],
                text: story?.textElements || [],
                emojis: story?.emojis || [],
                drawings: story?.drawings || [],
                canvasConfig: story?.canvasConfig,
            };
            params.append('meta', encodeURIComponent(JSON.stringify(metaData)));
        }

        return `${base}?${params.toString()}`;
    }, [story, mediaUrl, meta]);

    const handleMessage = useCallback((event: any) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);

            if (data.event === 'close') {
                navigation.goBack();
            }
            if (data.event === 'widget_interaction') {
                console.log('[WebStoryViewerScreen] Widget interaction:', data);
                // Handle widget interactions (polls, quizzes, slider)
                const sid: string = storyId || story?.storyId || '';
                const wid: string = String(data?.widgetId || '');
                const action: string = String(data?.action || '');
                if (!sid || !wid) return;

                (async () => {
                    try {
                        if (action === 'vote' && typeof data?.data?.option === 'number' && viewerId && !isOwnStory) {
                            await storyService.submitPollVote(sid, wid, viewerId, Number(data.data.option));
                            const results = await storyService.getPollResults(sid, wid);
                            injectResults({ type: 'poll', widgetId: wid, results });
                            return;
                        }
                        if (action === 'answer' && typeof data?.data?.option === 'number' && viewerId && !isOwnStory) {
                            await storyService.submitQuizAnswer(sid, wid, viewerId, Number(data.data.option));
                            const w = widgetsMap.get(wid);
                            const optCount = Math.max(1, Math.min(6, Number(w?.content?.options?.length ?? 0) || 0));
                            const results = await storyService.getQuizResultsForOptions(sid, wid, optCount || 4);
                            injectResults({ type: 'quiz', widgetId: wid, results });
                            return;
                        }
                        if (action === 'slider_set' && typeof data?.data?.value === 'number' && viewerId && !isOwnStory) {
                            await storyService.submitSliderValue(sid, wid, viewerId, Number(data.data.value));
                            const stats = await storyService.getSliderStatsFast(sid, wid);
                            injectResults({ type: 'slider', widgetId: wid, stats });
                            return;
                        }
                        // Ask (question) tap is handled natively in enhanced screen; no-op here
                    } catch (err) {
                        console.warn('[WebStoryViewerScreen] Failed widget interaction handling', err);
                    }
                })();
            }
        } catch (error) {
            console.error('[WebStoryViewerScreen] Failed to parse message:', error);
        }
    }, [navigation, storyId, story?.storyId, viewerId, isOwnStory, widgetsMap, injectResults]);

    // Only fallback to native if WebView actually crashes
    if (webViewFailed) {
        console.log('[WebStoryViewerScreen] WebView failed - using native fallback viewer');
        return <StoryViewerScreenEnhanced route={route as any} navigation={navigation} />;
    }

    // Show loading state while waiting for WebView to be ready
    if (!webViewReady) {
        return (
            <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
                    {/* Placeholder to prevent flash */}
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <WebView
                ref={webRef}
                originWhitelist={["*"]}
                allowFileAccess
                allowUniversalAccessFromFileURLs
                javaScriptEnabled
                domStorageEnabled
                cacheEnabled={false}
                setSupportMultipleWindows={false}
                scrollEnabled={false}
                scalesPageToFit={false}
                bounces={false}
                contentMode="mobile"
                pullToRefreshEnabled={false}
                allowsInlineMediaPlayback
                androidLayerType="software"
                forceDarkOn={false}
                source={{ uri: viewerUrl }}
                onMessage={handleMessage}
                onError={(e) => {
                    console.warn('[WebStoryViewerScreen] WebView error:', e.nativeEvent);
                    setWebViewFailed(true);
                }}
                onHttpError={(e) => {
                    console.warn('[WebStoryViewerScreen] HTTP error:', e.nativeEvent);
                }}
                onRenderProcessGone={(e) => {
                    console.error('[WebStoryViewerScreen] WebView process crashed:', e.nativeEvent);
                    setWebViewFailed(true);
                }}
                mixedContentMode="always"
                mediaPlaybackRequiresUserAction={false}
                style={styles.webview}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    webview: {
        flex: 1,
        backgroundColor: '#000',
    },
});

export default WebStoryViewerScreen;
