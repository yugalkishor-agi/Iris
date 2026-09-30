const fs = require('fs');
const path = 'c:/i/web-viewer/src/KonvaStoryViewer.tsx';
let t = fs.readFileSync(path, 'utf8');

const insertAfter = (src, anchor, add) => {
  const i = src.indexOf(anchor);
  if (i === -1) return src;
  return src.slice(0, i + anchor.length) + add + src.slice(i + anchor.length);
};

// 1) Poll: add percentages next to options
(() => {
  const anchor = "<KonvaText text={txt} x={75} y={172 + i * 104} fontSize={40} fill={c.textDark ? '#111' : '#fff'} />";
  const block = "\n{(() => { const r = pollResults[w.id]; const total = r?.total || 0; const cnt = total ? (r?.counts?.[i] || 0) : 0; const pct = total ? Math.round((cnt * 100) / total) : 0; return (<KonvaText text={`${pct}%`} x={828 - 86} y={172 + i * 104} fontSize={34} fill={c.textDark ? '#111' : '#fff'} />); })()}";
  if (!t.includes('pollResults[w.id]') && t.includes(anchor)) {
    t = insertAfter(t, anchor, block);
  }
})();

// 2) Quiz: add percentages next to options
(() => {
  const anchor = "<KonvaText text={txt} x={75} y={172 + i * 104} fontSize={40} fontStyle={i === correct ? 'bold' : 'normal'} fill={c.textDark ? '#111' : '#fff'} />";
  const block = "\n{(() => { const r = quizResults[w.id]; const total = r?.total || 0; const cnt = total ? (r?.counts?.[i] || 0) : 0; const pct = total ? Math.round((cnt * 100) / total) : 0; return (<KonvaText text={`${pct}%`} x={828 - 86} y={172 + i * 104} fontSize={34} fill={c.textDark ? '#111' : '#fff'} />); })()}";
  if (!t.includes('quizResults[w.id]') && t.includes(anchor)) {
    t = insertAfter(t, anchor, block);
  }
})();

// 3) Slider: add average marker + avg% label
(() => {
  const anchor = "<Circle x={trackX + (v * trackW)} y={208} radius={34} fill={'#ec4899'} stroke={c.textDark ? '#111' : '#fff'} strokeWidth={6} />";
  const block = "\n{(() => { const s = sliderStats[w.id]; const avg = typeof s?.avg === 'number' ? s.avg : undefined; return avg != null ? (\n    <Group>\n      <Rect x={trackX + (avg * trackW)} y={trackY - 10} width={4} height={44} fill={'#fff'} opacity={0.9} />\n      <KonvaText text={`${Math.round((avg || 0) * 100)}%`} x={trackX + (avg * trackW) - 30} y={trackY - 54} fontSize={28} fill={c.textDark ? '#111' : '#fff'} />\n    </Group>\n  ) : null; })()}";
  if (!t.includes('sliderStats[w.id]') && t.includes(anchor)) {
    t = insertAfter(t, anchor, block);
  }
})();

fs.writeFileSync(path, t, 'utf8');
console.log('ui-polish-konva: percentages and slider average added');
