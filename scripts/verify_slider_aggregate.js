// Usage: node scripts/verify_slider_aggregate.js <storyId> <stickerId>
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
  const vals = await db.collection(`stories/${storyId}/sliderValues`).where('stickerId','==',stickerId).get();
  let sum = 0, count = 0;
  vals.forEach(d => { sum += Number(d.get('value')||0); count++; });
  const sDoc = await db.doc(`stories/${storyId}`).get();
  const agg = sDoc.get(`stickerAggregates.${stickerId}.slider`) || {};
  const avgAgg = agg.count ? (agg.sum/agg.count) : 0;
  console.log({ count, sum, avg: count?sum/count:0, agg, avgAgg, ok: Math.abs(avgAgg - (count?sum/count:0)) < 1e-6 });
}

const [storyId, stickerId] = process.argv.slice(2);
if (!storyId || !stickerId) {
  console.error('Usage: node scripts/verify_slider_aggregate.js <storyId> <stickerId>');
  process.exit(1);
}
verify(storyId, stickerId).then(()=>process.exit(0));
