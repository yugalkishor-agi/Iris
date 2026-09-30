const fs = require('fs');
const path = 'c:/i/web-viewer/src/KonvaStoryViewer.tsx';

try {
  let src = fs.readFileSync(path, 'utf8');
  let changed = false;

  // Ensure slider fill rect exists before the Circle
  const circleAnchor = "<Circle ref={(node) => { if (node) sliderThumbRefs.current[w.id] = node; }} x={trackX + (v * trackW)}";
  const hasFillJsx = src.includes('sliderFillRefs.current[w.id] = node');
  if (!hasFillJsx && src.includes(circleAnchor)) {
    const inject = `\n                            <Rect x={trackX} y={trackY} width={v * trackW} height={24} cornerRadius={999} fill={c.b} opacity={0.9} listening={false} ref={(node) => { if (node) sliderFillRefs.current[w.id] = node; }} />\n                            `;
    src = src.replace(circleAnchor, inject + circleAnchor);
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(path, src, 'utf8');
    console.log('ui-insert-fill-hard-konva: inserted slider progress fill before Circle');
  } else {
    console.log('ui-insert-fill-hard-konva: nothing to change');
  }
} catch (e) {
  console.error('ui-insert-fill-hard-konva: error', e);
  process.exit(1);
}
