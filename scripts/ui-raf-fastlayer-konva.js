const fs = require('fs');
const path = 'c:/i/web-viewer/src/KonvaStoryViewer.tsx';
let t = fs.readFileSync(path, 'utf8');

// 1) Ensure FastLayer import
try {
  const imp = "import { Stage, Layer, FastLayer, Image as KonvaImage, Text as KonvaText, Group, Rect, Circle, Line } from 'react-konva';";
  if (!t.includes('FastLayer') && t.includes("import { Stage, Layer, Image as KonvaImage, Text as KonvaText, Group, Rect, Circle, Line } from 'react-konva';")) {
    t = t.replace(
      "import { Stage, Layer, Image as KonvaImage, Text as KonvaText, Group, Rect, Circle, Line } from 'react-konva';",
      imp
    );
  } else if (!t.includes('FastLayer') && t.includes('import {')) {
    t = t.replace('Layer,', 'Layer, FastLayer,');
  }
} catch {}

// 2) Insert FastLayer block before widget Layer
try {
  const layerOpen = "\n                <Layer";
  const idx = t.indexOf(layerOpen);
  if (idx !== -1 && !t.includes('<FastLayer')) {
    const staticBlocks = `
                <FastLayer
                    x={offsetX}
                    y={offsetY}
                    scaleX={scale}
                    scaleY={scale}
                    listening={false}
                >
                    {image && imageRect && (
                        <KonvaImage
                            image={image}
                            x={imageRect.x}
                            y={imageRect.y}
                            width={imageRect.width}
                            height={imageRect.height}
                        />
                    )}
                    {drawings.map((line) => (
                        <Line
                            key={line.id}
                            points={line.points}
                            stroke={line.stroke}
                            strokeWidth={line.strokeWidth}
                            lineCap="round"
                            lineJoin="round"
                            opacity={line.opacity ?? 1}
                            globalCompositeOperation={line.mode === 'erase' ? 'destination-out' : 'source-over'}
                        />
                    ))}
                    {textElements.map((t) => (
                        <KonvaText
                            key={t.id}
                            id={t.id}
                            text={t.text}
                            x={t.x}
                            y={t.y}
                            fontSize={t.fontSize}
                            fontFamily={t.fontFamily}
                            fill={t.fill}
                            rotation={t.rotation}
                            scaleX={t.scaleX}
                            scaleY={t.scaleY}
                        />
                    ))}
                </FastLayer>`;
    t = t.slice(0, idx) + staticBlocks + t.slice(idx);
  }
} catch {}

// 3) Remove static blocks from inside widget Layer (Background Image, Drawings, Text Elements)
try {
  t = t.replace(/\{\/\* Background Image \*\/\}[\s\S]*?\)\}\s*/m, '');
  t = t.replace(/\{\/\* Drawings \*\/\}[\s\S]*?\)\}\s*/m, '');
  t = t.replace(/\{\/\* Text Elements \*\/\}[\s\S]*?\)\}\s*/m, '');
} catch {}

// 4) Add RAF coalescing refs
try {
  const anchor = 'const sliderThumbRefs = useRef<Record<string, any>>({});';
  if (!t.includes('sliderRafRef') && t.includes(anchor)) {
    t = t.replace(anchor, anchor + "\n    const sliderRafRef = useRef<number | null>(null);\n    const sliderPendingRef = useRef<Record<string, number>>({});");
  }
} catch {}

// 5) Replace direct thumb updates with RAF scheduling
try {
  t = t.replace(
    /try \{ sliderThumbRefs\.current\[w\.id\]\?\.x\(trackX \+ \(ratio \* trackW\)\); layerRef\.current\?\.batchDraw\?\.\(\); \} catch \{\};/,
    "try { sliderPendingRef.current[w.id] = ratio; if (!sliderRafRef.current) { sliderRafRef.current = window.requestAnimationFrame(() => { try { const r = sliderPendingRef.current[w.id]; sliderThumbRefs.current[w.id]?.x(trackX + (r * trackW)); layerRef.current?.batchDraw?.(); } finally { sliderRafRef.current = null; } }); } } catch {};"
  );
  t = t.replace(
    /try \{ sliderThumbRefs\.current\[w\.id\]\?\.x\(trackX \+ \(mid \* trackW\)\); layerRef\.current\?\.batchDraw\?\.\(\); \} catch \{\};/,
    "try { sliderPendingRef.current[w.id] = mid; if (!sliderRafRef.current) { sliderRafRef.current = window.requestAnimationFrame(() => { try { const r = sliderPendingRef.current[w.id]; sliderThumbRefs.current[w.id]?.x(trackX + (r * trackW)); layerRef.current?.batchDraw?.(); } finally { sliderRafRef.current = null; } }); } } catch {};"
  );
} catch {}

// 6) Use pending value on release
try {
  t = t.replace(
    /const onTrackUp = \(\) => \{ try \{ sliderDragRef\.current\[w\.id\] = false; \} catch \{\} const finalV = typeof sliderValues\[w\.id\] === 'number' \? sliderValues\[w\.id\] : 0\.5; handleWidgetClick\(w\.id, 'slider_set', \{ value: finalV \} \); \};/,
    "const onTrackUp = () => { try { sliderDragRef.current[w.id] = false; } catch {} const pv = sliderPendingRef.current[w.id]; const finalV = typeof pv === 'number' ? pv : (typeof sliderValues[w.id] === 'number' ? sliderValues[w.id] : 0.5); handleWidgetClick(w.id, 'slider_set', { value: finalV }); };"
  );
} catch {}

fs.writeFileSync(path, t, 'utf8');
console.log('ui-raf-fastlayer-konva: added FastLayer + RAF coalescing for slider');
