const fs = require('fs');
const path = 'c:/i/web-viewer/src/KonvaStoryViewer.tsx';

function insertAfter(haystack, anchor, insert) {
  const idx = haystack.indexOf(anchor);
  if (idx === -1) return haystack;
  return haystack.slice(0, idx + anchor.length) + insert + haystack.slice(idx + anchor.length);
}

try {
  let src = fs.readFileSync(path, 'utf8');
  let changed = false;

  // 1) Add new refs for slider fill and option groups if missing
  if (!/const\s+sliderFillRefs\s*=\s*useRef<Record<string, any>>\(\{\}\)/.test(src)) {
    src = src.replace(
      /const\s+sliderPendingRef\s*=\s*useRef<Record<string, number>>\(\{\}\);/,
      (m) => `${m}\n    const sliderFillRefs = useRef<Record<string, any>>({});\n    const pollOptionRefs = useRef<Record<string, Record<number, any>>>({});\n    const quizOptionRefs = useRef<Record<string, Record<number, any>>>({});`
    );
    changed = true;
  }

  // 2) Insert slider progress fill rect after track background rect
  if (!/ref=\{\(node\) => \{ if \(node\) sliderFillRefs/.test(src)) {
    const trackBlockRegex = new RegExp(
      `<Rect\s*\n\s*x=\{trackX\}[\s\S]*?onTouchEnd=\{onTrackUp\}\s*\n\s*/>`,
      'm'
    );
    const fillRect = `\n                            <Rect\n                                x={trackX}\n                                y={trackY}\n                                width={v * trackW}\n                                height={24}\n                                cornerRadius={999}\n                                fill={c.b}\n                                opacity={0.9}\n                                ref={(node) => { if (node) sliderFillRefs.current[w.id] = node; }}\n                            />`;
    if (trackBlockRegex.test(src)) {
      src = src.replace(trackBlockRegex, (m) => m + fillRect);
      changed = true;
    }
  }

  // 3) Update RAF callback to also set fill width
  const raf1 = /sliderThumbRefs\.current\[w\.id\]\?\.x\(trackX \+ \(r \* trackW\)\);\s*layerRef\.current\?\.batchDraw\?\.\(\)\;/g;
  if (raf1.test(src)) {
    src = src.replace(raf1, `sliderThumbRefs.current[w.id]?.x(trackX + (r * trackW)); sliderFillRefs.current[w.id]?.width(r * trackW); layerRef.current?.batchDraw?.();`);
    changed = true;
  }

  // 4) Thumb scale on drag start
  const onDownRegex = /const onTrackDown = \(e: any\) => \{([^}]*)\};/m;
  if (onDownRegex.test(src)) {
    src = src.replace(onDownRegex, (m, body) => {
      if (/sliderThumbRefs\.current\[w\.id\]\?\.scale\(/.test(m)) return m; // already patched
      const patchedBody = ` try { sliderDragRef.current[w.id] = true; sliderThumbRefs.current[w.id]?.scale({ x: 1.08, y: 1.08 }); } catch {} onTrackSet(e); `;
      return `const onTrackDown = (e: any) => {${patchedBody}};`;
    });
    changed = true;
  }

  // 5) Thumb scale reset and fill width sync on release
  const onUpRegex = /const onTrackUp = \(\) => \{[\s\S]*?\};/m;
  if (onUpRegex.test(src)) {
    src = src.replace(onUpRegex, (m) => {
      if (/sliderThumbRefs\.current\[w\.id\]\?\.scale\(\{ x: 1, y: 1 \}\)/.test(m)) return m; // already patched version
      return `const onTrackUp = () => { try { sliderDragRef.current[w.id] = false; sliderThumbRefs.current[w.id]?.scale({ x: 1, y: 1 }); } catch {} const pending = (typeof sliderPendingRef.current[w.id] === 'number') ? sliderPendingRef.current[w.id] : undefined; const finalV = (typeof pending === 'number') ? pending : (typeof sliderValues[w.id] === 'number' ? sliderValues[w.id] : 0.5); try { setSliderValues((prev) => ({ ...prev, [w.id]: finalV })); sliderFillRefs.current[w.id]?.width(finalV * trackW); } catch {} handleWidgetClick(w.id, 'slider_set', { value: finalV }); };`;
    });
    changed = true;
  }

  // 6) Poll: add refs and press micro-interactions on option Group
  if (!/pollOptionRefs\.current\[w\.id\]/.test(src)) {
    const pollGroupRegex = /\{opts\.map\([^)]*=> \(\s*<Group key=\{i\}>/m;
    if (pollGroupRegex.test(src)) {
      src = src.replace(pollGroupRegex, (m) => {
        return m.replace(
          /<Group key=\{i\}>/,
          `<Group key={i}
                                    ref={(node) => { if (node) { if (!pollOptionRefs.current[w.id]) pollOptionRefs.current[w.id] = {}; pollOptionRefs.current[w.id][i] = node; } }}
                                    onMouseDown={(e) => { try { e.cancelBubble = true; if (e?.evt) e.evt.cancelBubble = true; } catch {}; try { pollOptionRefs.current[w.id]?.[i]?.opacity(0.95); layerRef.current?.batchDraw?.(); } catch {} }}
                                    onTouchStart={(e) => { try { e.cancelBubble = true; if (e?.evt) e.evt.cancelBubble = true; } catch {}; try { pollOptionRefs.current[w.id]?.[i]?.opacity(0.95); layerRef.current?.batchDraw?.(); } catch {} }}
                                    onMouseUp={(e) => { try { pollOptionRefs.current[w.id]?.[i]?.opacity(1); layerRef.current?.batchDraw?.(); } catch {} }}
                                    onTouchEnd={(e) => { try { pollOptionRefs.current[w.id]?.[i]?.opacity(1); layerRef.current?.batchDraw?.(); } catch {} }}
                                    onMouseLeave={(e) => { try { pollOptionRefs.current[w.id]?.[i]?.opacity(1); layerRef.current?.batchDraw?.(); } catch {} }}
                                  >`
        );
      });
      changed = true;
    }
  }

  // 7) Quiz: add refs and press micro-interactions on option Group
  if (!/quizOptionRefs\.current\[w\.id\]/.test(src)) {
    const quizGroupRegex = /\{opts\.map\([^)]*=> \(\s*<Group key=\{i\}>[\s\S]*?\n\s*<Rect\s*\n\s*x=\{46\}/m;
    if (quizGroupRegex.test(src)) {
      src = src.replace(quizGroupRegex, (m) => {
        return m.replace(
          /<Group key=\{i\}>/,
          `<Group key={i}
                                    ref={(node) => { if (node) { if (!quizOptionRefs.current[w.id]) quizOptionRefs.current[w.id] = {}; quizOptionRefs.current[w.id][i] = node; } }}
                                    onMouseDown={(e) => { try { e.cancelBubble = true; if (e?.evt) e.evt.cancelBubble = true; } catch {}; try { quizOptionRefs.current[w.id]?.[i]?.opacity(0.95); layerRef.current?.batchDraw?.(); } catch {} }}
                                    onTouchStart={(e) => { try { e.cancelBubble = true; if (e?.evt) e.evt.cancelBubble = true; } catch {}; try { quizOptionRefs.current[w.id]?.[i]?.opacity(0.95); layerRef.current?.batchDraw?.(); } catch {} }}
                                    onMouseUp={(e) => { try { quizOptionRefs.current[w.id]?.[i]?.opacity(1); layerRef.current?.batchDraw?.(); } catch {} }}
                                    onTouchEnd={(e) => { try { quizOptionRefs.current[w.id]?.[i]?.opacity(1); layerRef.current?.batchDraw?.(); } catch {} }}
                                    onMouseLeave={(e) => { try { quizOptionRefs.current[w.id]?.[i]?.opacity(1); layerRef.current?.batchDraw?.(); } catch {} }}
                                  >`
        );
      });
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(path, src, 'utf8');
    console.log('ui-final-polish-konva: applied final UI polish');
  } else {
    console.log('ui-final-polish-konva: nothing to change');
  }
} catch (e) {
  console.error('ui-final-polish-konva: error', e);
  process.exit(1);
}
