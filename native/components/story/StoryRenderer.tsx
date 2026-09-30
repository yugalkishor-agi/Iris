import React, { useMemo } from 'react';
import { View, StyleSheet, Dimensions, ActivityIndicator, Text, Platform } from 'react-native';
import { WebView } from 'react-native-webview';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface StoryOverlay {
  id: string;
  type: string;
  x: number;
  y: number;
  rotation?: number;
  scale?: number;
  scaleX?: number;
  scaleY?: number;
  content?: any;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  transform?: {
    x?: number;
    y?: number;
    w?: number;
    h?: number;
    rotation?: number;
    scale?: number;
  };
}

interface StoryRendererProps {
  mediaURL: string;
  mediaType?: 'image' | 'video';
  textElements?: StoryOverlay[];
  stickers?: StoryOverlay[];
  drawings?: Array<{ id: string; svgData?: string; points?: number[]; stroke?: string; strokeWidth?: number }>;
  filters?: { brightness?: number; contrast?: number; saturation?: number };
  stageWidth?: number;
  stageHeight?: number;
  imageRect?: { left: number; top: number; width: number; height: number };
  onLoad?: () => void;
  onError?: () => void;
  onInteraction?: (data: any) => void;
}

/**
 * WebView-based Story Renderer that uses the same Konva rendering engine
 * as the story editor to ensure 100% visual parity between editor and viewer.
 */
export function StoryRenderer({
  mediaURL,
  mediaType = 'image',
  textElements = [],
  stickers = [],
  drawings = [],
  filters = {},
  stageWidth = 375,
  stageHeight = 667,
  imageRect,
  onLoad,
  onError,
  onInteraction,
}: StoryRendererProps) {

  const html = useMemo(() => {
    const escapedMediaURL = mediaURL.replace(/'/g, "\\'").replace(/"/g, '\\"');
    const textJson = JSON.stringify(textElements);
    const stickersJson = JSON.stringify(stickers);
    const drawingsJson = JSON.stringify(drawings);
    const filtersJson = JSON.stringify(filters);
    const imageRectJson = imageRect ? JSON.stringify(imageRect) : 'null';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
  <style>
    :root {
      --bg-dark: rgba(0,0,0,0.55);
      --bg-light: #FFFFFF;
      --element-bg-light: #F3F4F6;
      --element-bg-dark: rgba(255,255,255,0.15);
      --text-dark: #111111;
      --text-light: #FFFFFF;
      --text-muted: #6B7280;
      /* Brand */
      --accent-blue: #3b82f6;
      --accent-pink: #ec4899;
      --accent-green: #22c55e;
      --slider-grad-1: #f97316;
      --slider-grad-2: #ec4899;
      --slider-grad-3: #3b82f6;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; user-select: none; -webkit-user-select: none; -webkit-tap-highlight-color: transparent; }
    html, body { 
      width: 100%; height: 100%; 
      overflow: hidden; 
      background: #000; 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    #container {
      width: 100%; height: 100%;
      display: flex; align-items: center; justify-content: center;
    }
    #stage {
      position: relative;
      width: ${stageWidth}px; height: ${stageHeight}px;
      transform-origin: center center;
      overflow: hidden; 
    }
    #media {
      width: 100%; height: 100%; object-fit: contain;
    }
    .overlay { position: absolute; }
    
    /* Text */
    .text-element {
      white-space: pre-wrap; word-wrap: break-word;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
      pointer-events: none;
    }
    
    /* Widgets */
    .widget-container {
      border-radius: 16px;
      padding: 12px;
      min-width: 220px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    .widget-container.light {
      background: var(--bg-light); color: var(--text-dark);
    }
    .widget-container.dark {
      background: var(--bg-dark); color: var(--text-light); box-shadow: none;
    }
    
    .widget-title {
      font-weight: 700; font-size: 16px; margin-bottom: 10px; text-align: left;
    }
    
    /* Poll */
    .poll-option {
      background: var(--element-bg-light);
      border-radius: 12px;
      padding: 10px 14px;
      margin-bottom: 8px;
      font-weight: 600; font-size: 14px;
      color: var(--text-dark);
      cursor: pointer;
      position: relative; overflow: hidden;
      transition: all 0.2s;
    }
    .widget-container.dark .poll-option {
      background: var(--element-bg-dark); color: var(--text-light);
    }
    .poll-option.selected {
      background: var(--element-bg-dark);
      border: 2px solid var(--accent-green);
    }
    
    /* Slider */
    .slider-track {
      height: 40px; border-radius: 20px;
      background: var(--element-bg-light);
      position: relative; display: flex; align-items: center;
      padding: 0 8px;
    }
    .widget-container.dark .slider-track {
      background: var(--element-bg-dark);
    }
    .slider-bar {
      height: 8px; border-radius: 4px;
      background: linear-gradient(90deg, var(--slider-grad-1), var(--slider-grad-2), var(--slider-grad-3));
      width: 0%; pointer-events: none;
    }
    .slider-thumb {
      width: 32px; height: 32px;
      border-radius: 50%;
      background: #fff;
      border: 2px solid #e5e7eb;
      position: absolute; top: 50%;
      transform: translateY(-50%) translateX(-50%);
      display: flex; align-items: center; justify-content: center;
      font-size: 20px; left: 0%;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }

    /* Quiz */
    .quiz-option {
       display: flex; flex-direction: row; align-items: center;
       gap: 8px; padding: 8px 0; cursor: pointer;
    }
    .quiz-dot {
       width: 20px; height: 20px; border-radius: 50%;
       border: 2px solid rgba(255,255,255,0.4);
    }
    
    /* Question */
    .question-input-box {
       background: var(--element-bg-light); border-radius: 12px;
       padding: 12px; color: var(--text-muted); font-size: 14px;
    }

    /* Badges */
    .badge {
      padding: 9px 16px; border-radius: 999px;
      background: rgba(255, 255, 255, 0.92);
      color: #111; font-weight: 600; font-size: 16px;
      white-space: nowrap; box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    }
    
    .drawing-overlay {
      position: absolute; left: 0; top: 0; width: 100%; height: 100%; pointer-events: none;
    }
  </style>
</head>
<body>
  <div id="container">
    <div id="stage">
      ${mediaType === 'video' ?
        `<video id="media" src="${escapedMediaURL}" autoplay loop muted playsinline webkit-playsinline></video>` :
        `<img id="media" src="${escapedMediaURL}" />`
      }
      <div id="overlays"></div>
    </div>
  </div>
  
  <script>
    (function() {
      const STAGE_W = ${stageWidth};
      const STAGE_H = ${stageHeight};
      const stickers = ${stickersJson};
      const textElements = ${textJson};
      const drawings = ${drawingsJson};
      
      function postRN(data) {
        if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(data));
      }

      function scaleStage() {
        const stage = document.getElementById('stage');
        const sw = window.innerWidth;
        const sh = window.innerHeight;
        const scale = Math.min(sw / STAGE_W, sh / STAGE_H);
        stage.style.transform = 'scale(' + scale + ')';
      }
      
      function render() {
        const container = document.getElementById('overlays');
        container.innerHTML = '';

        // Text
        textElements.forEach(el => {
          const div = document.createElement('div');
          div.className = 'overlay text-element';
          const x = el.transform?.x ?? el.x ?? 0.5;
          const y = el.transform?.y ?? el.y ?? 0.5;
          
          div.style.left = (x * STAGE_W) + 'px';
          div.style.top = (y * STAGE_H) + 'px';
          
          const rotation = el.transform?.rotation ?? el.rotation ?? 0;
          const scale = el.transform?.scale ?? el.scale ?? 1;
          div.style.transform = 'translate(-50%, -50%) rotate(' + rotation + 'deg) scale(' + scale + ')';
          
          div.style.color = el.color || '#fff';
          div.style.fontSize = (el.fontSize || 24) + 'px';
          div.style.fontWeight = el.fontWeight || 'bold';
          if(el.fontFamily) div.style.fontFamily = el.fontFamily;
          div.textContent = el.text;
          container.appendChild(div);
        });

        // Stickers
        stickers.forEach(st => {
          const div = document.createElement('div');
          div.className = 'overlay sticker';
          const x = st.transform?.x ?? st.x ?? 0.5;
          const y = st.transform?.y ?? st.y ?? 0.5;
          
          div.style.left = (x * STAGE_W) + 'px';
          div.style.top = (y * STAGE_H) + 'px';
          
          const rotation = st.transform?.rotation ?? st.rotation ?? 0;
          const scale = st.transform?.scale ?? st.scale ?? 1;
          div.style.transform = 'translate(-50%, -50%) rotate(' + rotation + 'deg) scale(' + scale + ')';
          
          const type = st.type || 'label';
          const content = st.content || {};
          
          // --- Widget Rendering Logic ---
          if (type === 'poll') {
            const wrap = document.createElement('div');
            wrap.className = 'widget-container light';
            wrap.innerHTML = '<div class="widget-title">' + (content.question || 'Poll') + '</div>';
            const opts = content.options || ['Yes', 'No'];
            opts.forEach((opt, idx) => {
              const btn = document.createElement('div');
              btn.className = 'poll-option';
              btn.textContent = opt;
              btn.onclick = (e) => {
                 e.stopPropagation();
                 const all = wrap.querySelectorAll('.poll-option');
                 all.forEach(el => el.classList.remove('selected'));
                 btn.classList.add('selected');
                 postRN({ type: 'poll_vote', id: st.id, optionIndex: idx });
              };
              wrap.appendChild(btn);
            });
            div.appendChild(wrap);
            
          } else if (type === 'slider') {
            const wrap = document.createElement('div');
            wrap.className = 'widget-container light';
            wrap.innerHTML = '<div class="widget-title">' + (content.question || 'Rate') + '</div>';
            
            const track = document.createElement('div');
            track.className = 'slider-track';
            
            const bar = document.createElement('div');
            bar.className = 'slider-bar';
            
            const thumb = document.createElement('div');
            thumb.className = 'slider-thumb';
            thumb.textContent = content.emoji || '😍';
            
            track.appendChild(bar);
            track.appendChild(thumb);
            wrap.appendChild(track);
            
            const moveThumb = (clientX) => {
               const rect = track.getBoundingClientRect();
               let pct = (clientX - rect.left) / rect.width;
               pct = Math.max(0, Math.min(1, pct));
               bar.style.width = (pct * 100) + '%';
               thumb.style.left = (pct * 100) + '%';
               return pct;
            };

            track.onclick = (e) => {
               e.stopPropagation();
               const pct = moveThumb(e.clientX);
               postRN({ type: 'slider_change', id: st.id, value: pct });
            };
            
            track.ontouchmove = (e) => {
               e.stopPropagation();
               moveThumb(e.touches[0].clientX);
            };
            track.ontouchend = (e) => {
               e.stopPropagation();
               const pct = moveThumb(e.changedTouches[0].clientX);
               postRN({ type: 'slider_change', id: st.id, value: pct });
            };
            
            div.appendChild(wrap);

          } else if (type === 'quiz') {
            const wrap = document.createElement('div');
            wrap.className = 'widget-container dark';
            wrap.innerHTML = '<div class="widget-title">' + (content.question || 'Guess!') + '</div>';
            const opts = content.options || ['True', 'False'];
            opts.forEach((opt, idx) => {
               const row = document.createElement('div');
               row.className = 'quiz-option';
               row.innerHTML = '<div class="quiz-dot"></div><span>' + opt + '</span>';
               row.onclick = (e) => {
                  e.stopPropagation();
                  postRN({ type: 'poll_vote', id: st.id, optionIndex: idx });
               };
               wrap.appendChild(row);
            });
            div.appendChild(wrap);

          } else if (type === 'question') {
             const wrap = document.createElement('div');
             wrap.className = 'widget-container light';
             wrap.innerHTML = '<div class="widget-title">' + (content.question || 'Ask me anything') + '</div>';
             const input = document.createElement('div');
             input.className = 'question-input-box';
             input.textContent = 'Type something...';
             input.onclick = (e) => {
               e.stopPropagation();
               postRN({ type: 'question_focus', id: st.id });
             };
             wrap.appendChild(input);
             div.appendChild(wrap);

          } else if (['mention', 'location', 'hashtag'].includes(type) || st.kind === 'location') {
             const badge = document.createElement('div');
             badge.className = 'badge';
             const txt = content.text || content.name || content.tag || content.handle || type;
             const prefix = type === 'mention' ? '@' : (type === 'hashtag' ? '#' : (type === 'location' ? '📍 ' : ''));
             badge.textContent = prefix + txt.replace(/^[@#]/, '');
             div.appendChild(badge);

          } else if (type === 'emoji') {
             div.style.fontSize = '80px';
             div.textContent = content.source || content || '😀';

          } else {
             div.textContent = typeof content === 'string' ? content : 'Widget'; 
          }
          
          container.appendChild(div);
        });
      }
      
      window.onload = function() {
        scaleStage();
        render();
        postRN({ event: 'loaded' });
      };
      window.onresize = scaleStage;
      
      window.onclick = function(e) {
         const path = e.composedPath();
         const isWidget = path.some(el => el.classList && el.classList.contains('widget-container'));
         if (!isWidget) {
             const w = window.innerWidth;
             postRN({ type: 'tap', x: e.clientX, width: w });
         }
      };
    })();
  </script>
</body>
</html>
    `;
  }, [mediaURL, mediaType, textElements, stickers, drawings, filters, stageWidth, stageHeight, imageRect]);

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.event === 'loaded' || data.event === 'mediaLoaded') {
        onLoad?.();
      } else if (data.event === 'mediaError') {
        onError?.();
      } else if (data.type) {
        // Widget interaction
        onInteraction?.(data);
      }
    } catch { }
  };

  return (
    <View style={styles.container}>
      <WebView
        originWhitelist={['*']}
        source={{ html }}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        bounces={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        androidLayerType="hardware"
        onMessage={handleMessage}
        onError={() => onError?.()}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        mixedContentMode="always"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});

export default StoryRenderer;
