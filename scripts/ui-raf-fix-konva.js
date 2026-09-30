const fs = require('fs');
const path = 'c:/i/web-viewer/src/KonvaStoryViewer.tsx';

try {
  let src = fs.readFileSync(path, 'utf8');

  // Replace onTrackUp to use sliderPendingRef (RAF-coalesced) and persist final value in state
  const onTrackUpRegex = /const onTrackUp = \(\) => \{[\s\S]*?\};/m;
  const newOnTrackUp = `const onTrackUp = () => { try { sliderDragRef.current[w.id] = false; } catch {} const pending = (typeof sliderPendingRef.current[w.id] === 'number') ? sliderPendingRef.current[w.id] : undefined; const finalV = (typeof pending === 'number') ? pending : (typeof sliderValues[w.id] === 'number' ? sliderValues[w.id] : 0.5); try { setSliderValues((prev) => ({ ...prev, [w.id]: finalV })); } catch {} handleWidgetClick(w.id, 'slider_set', { value: finalV }); };`;
  if (onTrackUpRegex.test(src)) {
    src = src.replace(onTrackUpRegex, newOnTrackUp);
  } else {
    console.log('ui-raf-fix-konva: onTrackUp pattern not found');
  }

  // Add RAF cleanup on unmount if missing
  if (!/cancelAnimationFrame\(sliderRafRef\.current\)/.test(src)) {
    const anchorRegex = /const sliderPendingRef = useRef<Record<string, number>>\(\{\}\);\r?\n/;
    const cleanupBlock = `useEffect(() => { return () => { try { if (sliderRafRef.current) { cancelAnimationFrame(sliderRafRef.current); } } catch {} try { sliderRafRef.current = null; } catch {} }; }, []);\n`;
    if (anchorRegex.test(src)) {
      src = src.replace(anchorRegex, (m) => m + cleanupBlock);
    } else {
      console.log('ui-raf-fix-konva: sliderPendingRef anchor not found');
    }
  }

  fs.writeFileSync(path, src, 'utf8');
  console.log('ui-raf-fix-konva: patched onTrackUp and cleanup');
} catch (e) {
  console.error('ui-raf-fix-konva: error', e);
  process.exit(1);
}
