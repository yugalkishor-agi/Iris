const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../dignosis profile data/profiling-data.06-30-2026.13-39-45.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

console.log('Keys in root:', Object.keys(data));
if (data.dataForRoots && data.dataForRoots.length > 0) {
    const root = data.dataForRoots[0];
    console.log('Keys in dataForRoots[0]:', Object.keys(root));
    if (root.profilerOperations) {
        console.log('profilerOperations length:', root.profilerOperations.length);
    }
}
