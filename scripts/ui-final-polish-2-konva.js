const fs = require('fs');
const path = 'c:/i/web-viewer/src/KonvaStoryViewer.tsx';

try {
  let src = fs.readFileSync(path, 'utf8');
  let changed = false;

  // 1) Ensure slider progress fill rect exists after the track rect
  if (!/sliderFillRefs\.current\[w\.id\]/.test(src)) {
    const trackCloseRe = /onTouchEnd=\{onTrackUp\}\s*\n\s*\/>/m;
    if (trackCloseRe.test(src)) {
      const fillBlock = `\n                            <Rect\n                                x={trackX}\n                                y={trackY}\n                                width={v * trackW}\n                                height={24}\n                                cornerRadius={999}\n                                fill={c.b}\n                                opacity={0.9}\n                                ref={(node) => { if (node) sliderFillRefs.current[w.id] = node; }}\n                            />`;
      src = src.replace(trackCloseRe, (m) => m + fillBlock);
      changed = true;
    }
  }

  // 2) Add thumb scale-up onTrackDown
  const onDownRe = /const onTrackDown = \(e: any\) => \{[\s\S]*?\};/m;
  if (onDownRe.test(src) && !/sliderThumbRefs\.current\[w\.id\]\?\.scale\(\{ x: 1\.08, y: 1\.08 \}\)/.test(src)) {
    src = src.replace(onDownRe, `const onTrackDown = (e: any) => { try { sliderDragRef.current[w.id] = true; sliderThumbRefs.current[w.id]?.scale({ x: 1.08, y: 1.08 }); } catch {} onTrackSet(e); };`);
    changed = true;
  }

  // Helper to inject micro-press handlers into a Rect (poll/quiz options)
  function injectPressHandlers(block) {
    if (/onMouseDown=\{.*e =>/.test(block) || /onMouseDown=\{\(e: any\)/.test(block)) return block;
    const beforeClose = /\n\s*\/>\s*$/m;
    if (!beforeClose.test(block)) return block;
    const handlers = `\n                                    onMouseDown={(e: any) => { try { e.cancelBubble = true; if (e?.evt) e.evt.cancelBubble = true; } catch {} try { e.target.opacity(0.95); layerRef.current?.batchDraw?.(); } catch {} }}\n                                    onTouchStart={(e: any) => { try { e.cancelBubble = true; if (e?.evt) e.evt.cancelBubble = true; } catch {} try { e.target.opacity(0.95); layerRef.current?.batchDraw?.(); } catch {} }}\n                                    onMouseUp={(e: any) => { try { e.target.opacity(1); layerRef.current?.batchDraw?.(); } catch {} }}\n                                    onTouchEnd={(e: any) => { try { e.target.opacity(1); layerRef.current?.batchDraw?.(); } catch {} }}\n                                    onMouseLeave={(e: any) => { try { e.target.opacity(1); layerRef.current?.batchDraw?.(); } catch {} }}\n                                />`;
    return block.replace(beforeClose, handlers);
  }

  // 3) Poll Rect: add press micro-interactions
  const pollRectRe = /(\n\s*<Rect\s*\n\s*x=\{46\}[\s\S]*?opacity=\{[\s\S]*?\}\s*\n\s*onClick=\{[\s\S]*?\}\s*\n\s*onTap=\{[\s\S]*?\}\s*\n\s*\/\>)/m;
  if (pollRectRe.test(src)) {
    src = src.replace(pollRectRe, (m) => injectPressHandlers(m));
    changed = true;
  }

  // 4) Quiz Rect: add press micro-interactions
  const quizRectRe = /(\n\s*<Rect\s*\n\s*x=\{46\}[\s\S]*?opacity=\{[\s\S]*?\}\s*\n\s*onClick=\{[\s\S]*?\}\s*\n\s*onTap=\{[\s\S]*?\}\s*\n\s*\/\>)/m;
  if (quizRectRe.test(src)) {
    // Replace the first occurrence under quiz block by narrowing context around quiz
    // But safe to apply globally since pattern is identical to poll; we already handled one above, replace second occurrence too
    src = src.replace(quizRectRe, (m) => injectPressHandlers(m));
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(path, src, 'utf8');
    console.log('ui-final-polish-2-konva: applied remaining polish (fill, thumb scale, press handlers)');
  } else {
    console.log('ui-final-polish-2-konva: nothing to change');
  }
} catch (e) {
  console.error('ui-final-polish-2-konva: error', e);
  process.exit(1);
}
