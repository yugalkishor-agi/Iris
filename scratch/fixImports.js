const fs = require('fs');

// 1. Fix types.ts
let typesTxt = fs.readFileSync('u:/i/native/components/media/NativePostImageEditor/types.ts', 'utf8');
typesTxt = typesTxt.replace(/import \{ TextAlignMode.*?\} from '.\/types';\n?/, '');
fs.writeFileSync('u:/i/native/components/media/NativePostImageEditor/types.ts', typesTxt);

// 2. Fix constants.ts
let constantsTxt = fs.readFileSync('u:/i/native/components/media/NativePostImageEditor/constants.ts', 'utf8');
if (!constantsTxt.includes('TextStyleState')) {
  constantsTxt = `import { TextStyleState } from './types';\n` + constantsTxt;
} else if (!constantsTxt.includes(`import { TextStyleState }`)) {
  constantsTxt = constantsTxt.replace(/import \{ TextAlignMode.*?\} from '.\/types';/, match => match.replace('}', ', TextStyleState }'));
}
fs.writeFileSync('u:/i/native/components/media/NativePostImageEditor/constants.ts', constantsTxt);

// 3. Fix useEditorStore.ts
let storeTxt = fs.readFileSync('u:/i/native/components/media/NativePostImageEditor/useEditorStore.ts', 'utf8');
if (!storeTxt.includes('GiphyGif')) {
  storeTxt = `import { GiphyGif } from '../../../../services/giphy.service';\n` + storeTxt;
  fs.writeFileSync('u:/i/native/components/media/NativePostImageEditor/useEditorStore.ts', storeTxt);
}

// 4. Fix NativePostImageEditor.tsx imports
let mainTxt = fs.readFileSync('u:/i/native/components/media/NativePostImageEditor.tsx', 'utf8');
const missingImports = `
import { EditorVisualLayer } from './NativePostImageEditor/components/EditorVisualLayer';
import { EditorTextLayer } from './NativePostImageEditor/components/EditorTextLayer';
import { TextBackdrop } from './NativePostImageEditor/components/TextBackdrop';
import { StickerAssetSheet } from './NativePostImageEditor/components/StickerAssetSheet';
import { TextMiniSlider } from './NativePostImageEditor/components/TextMiniSlider';
import { GradeSlider } from './NativePostImageEditor/components/GradeSlider';
import { FONT_OPTIONS, PREMIUM_TEXT_COLORS, TEXT_ANIMATION_OPTIONS, TEXT_EFFECT_OPTIONS, TEXT_BACKGROUND_OPTIONS } from './NativePostImageEditor/constants';
`;
if (!mainTxt.includes('EditorVisualLayer')) {
  mainTxt = mainTxt.replace(/import \{ styles \} from "\.\/NativePostImageEditor\/styles";/, match => missingImports + match);
} else {
  // It's already there? Wait, the error said Cannot find name 'EditorVisualLayer'.
  // That means it wasn't there or was corrupted.
  // Let's just insert it after useEditorStore import
  if (!mainTxt.includes('import { EditorVisualLayer }')) {
    mainTxt = mainTxt.replace(/import \{ useEditorStore \} from "\.\/NativePostImageEditor\/useEditorStore";/, match => match + '\n' + missingImports);
  }
}
fs.writeFileSync('u:/i/native/components/media/NativePostImageEditor.tsx', mainTxt);

console.log('Imports fixed.');
