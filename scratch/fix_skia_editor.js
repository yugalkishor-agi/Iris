const fs = require('fs');
const file = 'native/components/editor/SkiaCanvas/SkiaCanvasEditor.tsx';
let txt = fs.readFileSync(file, 'utf8');
txt = txt.replace("import { Image } from 'expo-image';\n", '');
fs.writeFileSync(file, txt, 'utf8');
console.log('Fixed SkiaCanvasEditor.tsx');
