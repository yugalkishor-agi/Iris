const fs = require('fs');
const path = 'c:/i/web-viewer/src/KonvaStoryViewer.tsx';

try {
  let src = fs.readFileSync(path, 'utf8');
  let changed = false;

  // Insert slider progress fill Rect before Circle if not present in JSX
  const hasFillInJsx = /<Rect[\s\S]*?ref=\{\(node\) => \{ if \(node\) sliderFillRefs\.current\[w\.id\] = node; \} \}\s*\/>/m.test(src);
  if (!hasFillInJsx) {
    const circleRefPattern = /(\r?\n\s*<Circle\s+ref=\{)/m;
    if (circleRefPattern.test(src)) {
      const fillJsx = `\n                            <Rect x={trackX} y={trackY} width={v * trackW} height={24} cornerRadius={999} fill={c.b} opacity={0.9} listening={false} ref={(node) => { if (node) sliderFillRefs.current[w.id] = node; }} />\n                            `;
      src = src.replace(circleRefPattern, fillJsx + '$1');
      changed = true;
    } else {
      console.log('ui-final-polish-insert-fill: Circle anchor not found');
    }
  }

  // Add press micro-interactions to QUIZ Rect if missing
  const quizRectBlockRe = /(\n\s*<Rect\s*\n\s*x=\{46\}[\s\S]*?fill=\{i === correct \? c\.a : c\.b\}[\s\S]*?onClick=\{[\s\S]*?\}\s*\n\s*onTap=\{[\s\S]*?\}\s*\n\s*\/\>)/m;
  if (quizRectBlockRe.test(src)) {
    const block = src.match(quizRectBlockRe)[1];
    if (!/onMouseDown=\{\(e: any\)/.test(block)) {
      const patched = block.replace(/\n\s*\/>\s*$/, `\n                                    onMouseDown={(e: any) => { try { e.cancelBubble = true; if (e?.evt) e.evt.cancelBubble = true; } catch {} try { e.target.opacity(0.95); layerRef.current?.batchDraw?.(); } catch {} }}\n                                    onTouchStart={(e: any) => { try { e.cancelBubble = true; if (e?.evt) e.evt.cancelBubble = true; } catch {} try { e.target.opacity(0.95); layerRef.current?.batchDraw?.(); } catch {} }}\n                                    onMouseUp={(e: any) => { try { e.target.opacity(1); layerRef.current?.batchDraw?.(); } catch {} }}\n                                    onTouchEnd={(e: any) => { try { e.target.opacity(1); layerRef.current?.batchDraw?.(); } catch {} }}\n                                    onMouseLeave={(e: any) => { try { e.target.opacity(1); layerRef.current?.batchDraw?.(); } catch {} }}\n                                />`);
      src = src.replace(quizRectBlockRe, patched);
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(path, src, 'utf8');
    console.log('ui-final-polish-insert-fill: ensured slider fill and quiz press handlers');
  } else {
    console.log('ui-final-polish-insert-fill: nothing to change');
  }
} catch (e) {
  console.error('ui-final-polish-insert-fill: error', e);
  process.exit(1);
}
