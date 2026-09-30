const fs = require('fs');
const path = require('path');

const dir = 'u:/i/native/components/media/NativePostImageEditor/components/';

const files = {
  'EditorVisualLayer.tsx': `import React from 'react';\nimport { View, Text } from 'react-native';\nimport FastImage from 'react-native-fast-image';\n\nexport function EditorVisualLayer(props: any) {\n  return <View style={{ position: 'absolute', left: props.layer.x, top: props.layer.y, width: props.layer.width, height: props.layer.height, transform: [{ scale: props.layer.scale }, { rotate: \`\${props.layer.rotation}deg\`}] }}>\n    {props.layer.kind === 'sticker' ? <Text style={{fontSize: 40}}>{props.layer.sticker}</Text> : (props.layer.uri ? <FastImage source={{uri: props.layer.uri}} style={{width: '100%', height: '100%'}} /> : null)}\n  </View>;\n}\n`,
  
  'EditorTextLayer.tsx': `import React from 'react';\nimport { View, Text } from 'react-native';\n\nexport function EditorTextLayer(props: any) {\n  return <View style={{ position: 'absolute', left: props.layer.x, top: props.layer.y, transform: [{ scale: props.layer.scale }, { rotate: \`\${props.layer.rotation}deg\`}] }}>\n    <Text style={{ fontSize: props.layer.fontSize, color: props.layer.color, textAlign: props.layer.align }}>{props.layer.text}</Text>\n  </View>;\n}\n`,
  
  'TextBackdrop.tsx': `import React from 'react';\nimport { Pressable, StyleSheet } from 'react-native';\n\nexport function TextBackdrop({ visible, onPress }: any) {\n  if (!visible) return null;\n  return <Pressable style={StyleSheet.absoluteFill} onPress={onPress} />;\n}\n`,
  
  'StickerAssetSheet.tsx': `import React from 'react';\nimport { View, Text } from 'react-native';\n\nexport function StickerAssetSheet(props: any) {\n  if (!props.visible) return null;\n  return <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 300, backgroundColor: 'black' }}><Text style={{color: 'white'}}>Sticker Sheet Placeholder</Text></View>;\n}\n`,
  
  'GradeSlider.tsx': `import React from 'react';\nimport { View, Text } from 'react-native';\n\nexport function GradeSlider(props: any) {\n  return <View><Text>Grade Slider Placeholder</Text></View>;\n}\n`,
  
  'TextMiniSlider.tsx': `import React from 'react';\nimport { View, Text } from 'react-native';\n\nexport function TextMiniSlider(props: any) {\n  return <View><Text>Mini Slider Placeholder</Text></View>;\n}\n`
};

for (const [filename, content] of Object.entries(files)) {
  fs.writeFileSync(path.join(dir, filename), content, 'utf8');
  console.log('Populated', filename);
}
