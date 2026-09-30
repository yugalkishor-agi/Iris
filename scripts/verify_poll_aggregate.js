// Usage: node scripts/verify_poll_aggregate.js <storyId> <stickerId>
// Requires serviceAccount.json in project root
const admin = require('firebase-admin');
const fs = require('fs');

if (!fs.existsSync('serviceAccount.json')) {
  console.error('Missing serviceAccount.json in project root.');
  process.exit(1);
}

admin.initializeApp({ credential: admin.credential.cert('./serviceAccount.json') });
const db = admin.firestore();

async function verify(storyId, stickerId) {
  const votes = await db.collection(`stories/${storyId}/pollVotes`).where('stickerId','==',stickerId).get();
  const counts = {};
  votes.forEach(d => { const i = d.get('optionIndex'); counts[i] = (counts[i]||0)+1; });
  const sDoc = await db.doc(`stories/${storyId}`).get();
  const agg = sDoc.get(`stickerAggregates.${stickerId}.poll`) || {};
  console.log('Expected:', counts);
  console.log('Aggregates:', agg);
  const ok = Object.keys(counts).every(k => (agg[k]||0) === counts[k]);
  console.log('OK:', ok);
}

const [storyId, stickerId] = process.argv.slice(2);
if (!storyId || !stickerId) {
  console.error('Usage: node scripts/verify_poll_aggregate.js <storyId> <stickerId>');
  process.exit(1);
}
verify(storyId, stickerId).then(()=>process.exit(0));
