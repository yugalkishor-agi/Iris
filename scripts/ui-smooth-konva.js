const fs = require('fs');
const path = 'c:/i/web-viewer/src/KonvaStoryViewer.tsx';
let t = fs.readFileSync(path, 'utf8');

// 1) Add layerRef and sliderThumbRefs
if (!t.includes('layerRef = useRef')) {
  t = t.replace(
    'const stageRef = useRef<Konva.Stage>(null);',
    "const stageRef = useRef<Konva.Stage>(null);\n    const layerRef = useRef<Konva.Layer | null>(null);"
  );
}
if (!t.includes('sliderThumbRefs')) {
  t = t.replace(
    'const sliderDragRef = useRef<Record<string, boolean>>({});',
    "const sliderDragRef = useRef<Record<string, boolean>>({});\n    const sliderThumbRefs = useRef<Record<string, any>>({});"
  );
}

// 2) Attach ref to Layer
if (!t.includes('ref={layerRef}')) {
  t = t.replace(
    /<Layer\s*\n\s*x=\{offsetX\}/,
    '<Layer\n                    ref={layerRef}\n                    x={offsetX}'
  );
}

// 3) Add ref to slider Circle
if (!t.includes('sliderThumbRefs.current[w.id]')) {
  t = t.replace(
    /<Circle x=\{trackX \+ \(v \* trackW\)\}/,
    "<Circle ref={(node) => { if (node) sliderThumbRefs.current[w.id] = node; }} x={trackX + (v * trackW)}"
  );
}

// 4) Update onTrackSet to mutate node directly instead of setState during drag
if (t.includes("setSliderValues((prev) => ({ ...prev, [w.id]: ratio }))")) {
  t = t.replace(
    "setSliderValues((prev) => ({ ...prev, [w.id]: ratio }))",
    "try { sliderThumbRefs.current[w.id]?.x(trackX + (ratio * trackW)); layerRef.current?.batchDraw?.(); } catch {}"
  );
}
if (t.includes("setSliderValues((prev) => ({ ...prev, [w.id]: mid }))")) {
  t = t.replace(
    "setSliderValues((prev) => ({ ...prev, [w.id]: mid }))",
    "try { sliderThumbRefs.current[w.id]?.x(trackX + (mid * trackW)); layerRef.current?.batchDraw?.(); } catch {}"
  );
}

// 5) Ensure onTouchMove is present (mobile smooth)
if (!t.includes('onTouchMove={onTrackMove}')) {
  t = t.replace(
    'onMouseMove={onTrackMove}',
    'onMouseMove={onTrackMove}\n                                onTouchMove={onTrackMove}'
  );
}

fs.writeFileSync(path, t, 'utf8');
console.log('ui-smooth-konva: direct Konva node updates for slider + refs attached');
