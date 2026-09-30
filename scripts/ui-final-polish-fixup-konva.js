const fs = require('fs');
const path = 'c:/i/web-viewer/src/KonvaStoryViewer.tsx';

try {
  let src = fs.readFileSync(path, 'utf8');
  let changed = false;

  // 1) Ensure slider fill rect exists before Circle (under slider kind)
  if (!/sliderFillRefs\.current\[w\.id\]/.test(src)) {
    const circleLine = `<Circle ref={(node) => { if (node) sliderThumbRefs.current[w.id] = node; }} x={trackX + (v * trackW)} y={208} radius={34} fill={'#ec4899'} stroke={c.textDark ? '#111' : '#fff'} strokeWidth={6} />`;
    if (src.includes(circleLine)) {
      const fillBlock = `\n                            <Rect x={trackX} y={trackY} width={v * trackW} height={24} cornerRadius={999} fill={c.b} opacity={0.9} ref={(node) => { if (node) sliderFillRefs.current[w.id] = node; }} />\n                            `;
      src = src.replace(circleLine, fillBlock + circleLine);
      changed = true;
    }
  }

  // 2) Scale thumb on drag start (onTrackDown)
  if (!/sliderThumbRefs\.current\[w\.id\]\?\.scale\(\{ x: 1\.08, y: 1\.08 \}\)/.test(src)) {
    src = src.replace(
      /const onTrackDown = \(e: any\) => \{\s*try \{ sliderDragRef\.current\[w\.id\] = true; \} catch \{\} onTrackSet\(e\); \};/,
      'const onTrackDown = (e: any) => { try { sliderDragRef.current[w.id] = true; sliderThumbRefs.current[w.id]?.scale({ x: 1.08, y: 1.08 }); } catch {} onTrackSet(e); };'
    );
    if (/sliderThumbRefs\.current\[w\.id\]\?\.scale\(\{ x: 1\.08, y: 1\.08 \}\)/.test(src)) changed = true;
  }

  // Helper to append micro press handlers after onTap and before '/>'
  function addPressHandlersForPoll(block) {
    if (/onMouseDown=\{\(e: any\)/.test(block)) return block; // already
    const inject = `\n                                    onMouseDown={(e: any) => { try { e.cancelBubble = true; if (e?.evt) e.evt.cancelBubble = true; } catch {}; try { e.target.opacity(0.95); layerRef.current?.batchDraw?.(); } catch {} }}\n                                    onTouchStart={(e: any) => { try { e.cancelBubble = true; if (e?.evt) e.evt.cancelBubble = true; } catch {}; try { e.target.opacity(0.95); layerRef.current?.batchDraw?.(); } catch {} }}\n                                    onMouseUp={(e: any) => { try { e.target.opacity(1); layerRef.current?.batchDraw?.(); } catch {} }}\n                                    onTouchEnd={(e: any) => { try { e.target.opacity(1); layerRef.current?.batchDraw?.(); } catch {} }}\n                                    onMouseLeave={(e: any) => { try { e.target.opacity(1); layerRef.current?.batchDraw?.(); } catch {} }}`;
    return block.replace(/\n\s*\/>\s*$/, inject + '\n                                    />');
  }

  // 3) Apply press handlers to Poll option Rects
  const pollRectBlockRe = /(\n\s*<Rect\s*\n\s*x=\{46\}[\s\S]*?fill=\{i % 2 === 0 \? c\.a : c\.b\}[\s\S]*?onClick=\{[\s\S]*?\}\s*\n\s*onTap=\{[\s\S]*?\}\s*\n\s*\/\>)/m;
  if (pollRectBlockRe.test(src)) {
    src = src.replace(pollRectBlockRe, (m) => addPressHandlersForPoll(m));
    changed = true;
  }

  // 4) Apply press handlers to Quiz option Rects
  const quizRectBlockRe = /(\n\s*<Rect\s*\n\s*x=\{46\}[\s\S]*?fill=\{i === correct \? c\.a : c\.b\}[\s\S]*?onClick=\{[\s\S]*?\}\s*\n\s*onTap=\{[\s\S]*?\}\s*\n\s*\/\>)/m;
  if (quizRectBlockRe.test(src)) {
    src = src.replace(quizRectBlockRe, (m) => addPressHandlersForPoll(m));
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(path, src, 'utf8');
    console.log('ui-final-polish-fixup-konva: ensured fill, thumb scale, and press micro-interactions');
  } else {
    console.log('ui-final-polish-fixup-konva: nothing to change');
  }
} catch (e) {
  console.error('ui-final-polish-fixup-konva: error', e);
  process.exit(1);
}
