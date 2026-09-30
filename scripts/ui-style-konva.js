const fs = require('fs');
const path = 'c:/i/web-viewer/src/KonvaStoryViewer.tsx';
let t = fs.readFileSync(path, 'utf8');

// 1) Slider: sub-pixel smooth (remove rounding)
try {
  t = t.replace(/Math\.round\(v \* trackW\)/g, '(v * trackW)');
} catch {}

// 2) Slider: add onTouchMove for smooth mobile drag
try {
  const token = 'onMouseMove={onTrackMove}';
  if (t.includes(token) && !t.includes('onTouchMove={onTrackMove}')) {
    t = t.replace(token, token + '\n                                onTouchMove={onTrackMove}');
  }
} catch {}

// 3) Poll option opacity (lighter default; darker on selection)
try {
  const pollFill = 'fill={i % 2 === 0 ? c.a : c.b}';
  if (t.includes(pollFill) && !t.includes('opacity={selected == null ? 0.8')) {
    t = t.replace(pollFill, pollFill + '\n                                        opacity={selected == null ? 0.8 : (selected === i ? 1 : 0.6)}');
  }
} catch {}

// 4) Quiz option opacity (lighter default; darker on selection)
try {
  const quizFill = "fill={i === correct ? c.a : c.b}";
  if (t.includes(quizFill) && !t.includes('opacity={answered == null ? 0.8')) {
    t = t.replace(quizFill, quizFill + '\n                                        opacity={answered == null ? 0.8 : (answered === i ? 1 : 0.6)}');
  }
} catch {}

fs.writeFileSync(path, t, 'utf8');
console.log('ui-style-konva: applied smoothness + styling changes');
