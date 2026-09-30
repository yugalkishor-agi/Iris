import React from 'react';
import {
  Group,
  Text as SkiaText,
  matchFont,
  Path,
  Image,
  useImage,
} from '@shopify/react-native-skia';
import type { EditorElement } from '../../../stores/editorStore';

interface ElementRendererProps {
  element: EditorElement;
}

export function ElementRenderer({ element }: ElementRendererProps) {
  switch (element.type) {
    case 'text':
      return <TextElementRenderer element={element} />;
    case 'drawing':
      return <DrawingElementRenderer element={element} />;
    case 'sticker':
      return <StickerElementRenderer element={element} />;
    case 'gifSticker':
      return <GifStickerElementRenderer element={element} />;
    case 'widget':
      return <WidgetElementRenderer element={element} />;
    default:
      return null;
  }
}

function TextElementRenderer({ element }: { element: any }) {
  // Using matchFont to use system fonts
  // This works without requiring font files
  const font = matchFont({
    fontFamily: element.fontFamily || 'sans-serif',
    fontSize: element.fontSize,
    fontWeight: element.fontWeight === 'bold' ? 'bold' : 'normal',
  });

  if (!font) {
    return null;
  }

  return (
    <Group
      transform={[
        { translateX: element.x },
        { translateY: element.y },
        { rotate: (element.rotation * Math.PI) / 180 },
        { scale: element.scale },
      ]}
      opacity={element.opacity}
    >
      <SkiaText
        text={element.text}
        font={font}
        x={-element.width / 2}
        y={0}
        color={element.color}
      />
    </Group>
  );
}

function DrawingElementRenderer({ element }: { element: any }) {
  // Convert points array to SVG path
  const pathString = pointsToPath(element.points);

  return (
    <Group opacity={element.opacity}>
      <Path
        path={pathString}
        color={element.brushColor}
        style="stroke"
        strokeWidth={element.brushSize}
        strokeCap="round"
        strokeJoin="round"
      />
    </Group>
  );
}

function StickerElementRenderer({ element }: { element: any }) {
  // Render emoji as text using system fonts
  const font = matchFont({
    fontFamily: 'sans-serif',
    fontSize: element.fontSize,
  });

  if (!font) {
    return null;
  }

  return (
    <Group
      transform={[
        { translateX: element.x },
        { translateY: element.y },
        { rotate: (element.rotation * Math.PI) / 180 },
        { scale: element.scale },
      ]}
      opacity={element.opacity}
    >
      <SkiaText
        text={element.emoji}
        font={font}
        x={-element.fontSize / 2}
        y={0}
      />
    </Group>
  );
}

function GifStickerElementRenderer({ element }: { element: any }) {
  // Load GIF thumbnail (actual GIF animation will be handled differently)
  const image = useImage(element.thumbnailUrl);

  if (!image) {
    return null;
  }

  return (
    <Group
      transform={[
        { translateX: element.x },
        { translateY: element.y },
        { rotate: (element.rotation * Math.PI) / 180 },
        { scale: element.scale },
      ]}
      opacity={element.opacity}
    >
      <Image
        image={image}
        x={-element.width / 2}
        y={-element.height / 2}
        width={element.width}
        height={element.height}
        fit="contain"
      />
    </Group>
  );
}

function WidgetElementRenderer({ element }: { element: any }) {
  // Widgets are rendered as simplified placeholders during editing
  // Full interactive widgets would be rendered during final export
  const font = matchFont({
    fontFamily: 'sans-serif',
    fontSize: 40,
  });

  if (!font) {
    return null;
  }

  const widgetIcon = getWidgetIcon(element.widgetType);

  return (
    <Group
      transform={[
        { translateX: element.x },
        { translateY: element.y },
        { rotate: (element.rotation * Math.PI) / 180 },
        { scale: element.scale },
      ]}
      opacity={element.opacity}
    >
      <SkiaText
        text={widgetIcon}
        font={font}
        x={-20}
        y={0}
        color="#EC4899"
      />
    </Group>
  );
}

// Helper functions
function pointsToPath(points: number[]): string {
  if (points.length < 2) return '';

  let path = `M ${points[0]} ${points[1]}`;
  for (let i = 2; i < points.length; i += 2) {
    path += ` L ${points[i]} ${points[i + 1]}`;
  }
  return path;
}

function getWidgetIcon(widgetType: string): string {
  const icons: Record<string, string> = {
    poll: '📊',
    quiz: '❓',
    slider: '🎚️',
    question: '💬',
    countdown: '⏰',
    mention: '@',
    hashtag: '#',
  };
  return icons[widgetType] || '📌';
}