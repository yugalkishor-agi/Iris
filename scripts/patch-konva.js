const fs = require('fs');
const path = 'c:/i/web-viewer/src/KonvaStoryViewer.tsx';
let t = fs.readFileSync(path, 'utf8');

// 1) Fix misencoded glyphs
try {
  t = t.split('âœ…').join('\u2705'); // ✅
  t = t.split('ðŸ˜').join('\u{1F60D}'); // 😍
} catch {}

// 2) Remove per-move slider submissions (only submit on release)
try {
  t = t.replace(/handleWidgetClick\(w\.id,\s*'slider_set',\s*\{\s*value:\s*ratio\s*\}\s*\);\s*/g, '');
  t = t.replace(/handleWidgetClick\(w\.id,\s*'slider_set',\s*\{\s*value:\s*mid\s*\}\s*\);\s*/g, '');
} catch {}

// 3) Submit on release: replace onTrackUp body (only the simple variant)
try {
  t = t.replace(
    /const onTrackUp = \(\) => \{\s*try \{ sliderDragRef\.current\[w\.id\] = false; \} catch \{\} \};/,
    "const onTrackUp = () => { try { sliderDragRef.current[w.id] = false; } catch {} const finalV = typeof sliderValues[w.id] === 'number' ? sliderValues[w.id] : 0.5; handleWidgetClick(w.id, 'slider_set', { value: finalV }); };"
  );
} catch {}

fs.writeFileSync(path, t, 'utf8');
console.log('Patched KonvaStoryViewer.tsx');
