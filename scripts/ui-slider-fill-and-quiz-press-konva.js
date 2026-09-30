const fs = require('fs');
const path = 'c:/i/web-viewer/src/KonvaStoryViewer.tsx';

try {
  let src = fs.readFileSync(path, 'utf8');
  let changed = false;

  // Ensure slider progress fill JSX exists (look for width={v * trackW})
  if (!/width=\{v \* trackW\}/.test(src)) {
    const circleAnchor = /\n\s*<Circle ref=\{\(node\) => \{ if \(node\) sliderThumbRefs\.current\[w\.id\] = node; \} \}\s*x=\{trackX \+ \(v \* trackW\)\}/m;
    if (circleAnchor.test(src)) {
      const fillJsx = `\n                            <Rect x={trackX} y={trackY} width={v * trackW} height={24} cornerRadius={999} fill={c.b} opacity={0.9} listening={false} ref={(node) => { if (node) sliderFillRefs.current[w.id] = node; }} />`;
      src = src.replace(circleAnchor, fillJsx + '\n                            ' + src.match(circleAnchor)[0].trimStart());
      changed = true;
    } else {
      console.log('ui-slider-fill-and-quiz-press: Circle anchor not found, slider fill not inserted');
    }
  }

  // Inject quiz Rect press micro-interactions if missing
  const quizRectBlockRe = /(\n\s*<Rect\s*\n\s*x=\{46\}[\s\S]*?fill=\{i === correct \? c\.a : c\.b\}[\s\S]*?onClick=\{[\s\S]*?\}\s*\n\s*onTap=\{[\s\S]*?\}\s*\n\s*\/\>)/m;
  const quizMatch = src.match(quizRectBlockRe);
  if (quizMatch) {
    const block = quizMatch[1];
    if (!/onMouseDown=\{\(e: any\)/.test(block)) {
      const patched = block.replace(/\n\s*\/>\s*$/, `\n                                    onMouseDown={(e: any) => { try { e.cancelBubble = true; if (e?.evt) e.evt.cancelBubble = true; } catch {} try { e.target.opacity(0.95); layerRef.current?.batchDraw?.(); } catch {} }}\n                                    onTouchStart={(e: any) => { try { e.cancelBubble = true; if (e?.evt) e.evt.cancelBubble = true; } catch {} try { e.target.opacity(0.95); layerRef.current?.batchDraw?.(); } catch {} }}\n                                    onMouseUp={(e: any) => { try { e.target.opacity(1); layerRef.current?.batchDraw?.(); } catch {} }}\n                                    onTouchEnd={(e: any) => { try { e.target.opacity(1); layerRef.current?.batchDraw?.(); } catch {} }}\n                                    onMouseLeave={(e: any) => { try { e.target.opacity(1); layerRef.current?.batchDraw?.(); } catch {} }}\n                                />`);
      src = src.replace(quizRectBlockRe, patched);
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(path, src, 'utf8');
    console.log('ui-slider-fill-and-quiz-press: ensured slider fill and quiz press interactions');
  } else {
    console.log('ui-slider-fill-and-quiz-press: nothing to change');
  }
} catch (e) {
  console.error('ui-slider-fill-and-quiz-press: error', e);
  process.exit(1);
}
