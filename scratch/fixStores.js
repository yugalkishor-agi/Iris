const fs = require('fs');
const paths = [
  '../native/screens/StoryViewerScreenEnhanced/useStoryViewerStore.ts',
  '../native/screens/GlimpseViewerScreenEnhanced/useGlimpseViewerScreenEnhancedStore.ts',
  '../native/screens/HomeScreenWorking/useHomeScreenWorkingStore.ts',
  '../native/screens/ChatScreenEnhanced/useChatScreenStore.ts'
];

paths.forEach(p => {
  if(fs.existsSync(p)) {
    let txt = fs.readFileSync(p, 'utf8');
    
    // Find all state initializers in the store and ensure they are safe literal values
    const lines = txt.split('\n');
    const newLines = lines.map(l => {
      if(l.includes(':') && !l.includes('set(') && !l.includes('typeof') && !l.includes('import') && !l.includes('interface') && !l.includes('export')) {
        const parts = l.split(':');
        const key = parts[0].trim();
        let val = parts.slice(1).join(':').trim();
        if (val.endsWith(',')) val = val.slice(0, -1);
        
        // if val is not a safe primitive, replace it with null or 0
        if (!['true', 'false', '0', '1', 'null', '[]', '{}', '\'\'', '""', 'undefined'].includes(val) && !val.match(/^[0-9]+$/)) {
          console.log(`Fixing unsafe initializer in ${p}: ${key} = ${val}`);
          // special cases
          if (key.includes('Width') || key.includes('Height') || key.includes('Index')) {
            return l.replace(val + ',', '0,');
          } else if (key.includes('is') || key.includes('show') || key.includes('loading')) {
            return l.replace(val + ',', 'false,');
          } else {
            return l.replace(val + ',', 'null,');
          }
        }
      }
      return l;
    });
    
    fs.writeFileSync(p, newLines.join('\n'));
  }
});
