/**
 * Backfill stickers inline metadata: id, version, createdAt, updatedAt, and clamp transforms.
 *
 * Usage:
 *   node scripts/backfill_stickers_inline.js --batchSize=200          # dry-run
 *   node scripts/backfill_stickers_inline.js --batchSize=200 --commit  # apply changes
 *
 * Requires: serviceAccount.json in project root with Firestore Admin permissions
 */
const admin = require('firebase-admin');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

const args = process.argv.slice(2);
const commit = args.includes('--commit');
const batchSize = parseInt((args.find((a) => a.startsWith('--batchSize=')) || '0').split('=')[1] || '200', 10);

if (!fs.existsSync('serviceAccount.json')) {
  console.error('Missing serviceAccount.json in project root.');
  process.exit(1);
}

admin.initializeApp({ credential: admin.credential.cert('./serviceAccount.json') });
const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

const clamp01 = (n) => Math.max(0, Math.min(1, typeof n === 'number' ? n : 0));
const clampRot = (n) => Math.max(-360, Math.min(360, typeof n === 'number' && isFinite(n) ? n : 0));
const positive = (n, d = 1) => Math.max(0.01, typeof n === 'number' && isFinite(n) ? n : d);

function fixSticker(s, idx, storyCreatedAt) {
  const t = s.transform || {};
  const size = s.size || {};
  const x = clamp01(t.x ?? s.x);
  const y = clamp01(t.y ?? s.y);
  const scale = positive(t.scale ?? s.scale ?? 1);
  const rotation = clampRot(t.rotation ?? s.rotation);
  const w = size.w != null ? clamp01(size.w) : undefined;
  const h = size.h != null ? clamp01(size.h) : undefined;
  const id = String(s.id ?? uuidv4());
  return {
    ...s,
    id,
    transform: { x, y, scale, rotation },
    size: w != null && h != null ? { w, h } : s.size,
    version: typeof s.version === 'number' ? s.version : 1,
    createdAt: s.createdAt ?? storyCreatedAt ?? null,
    updatedAt: s.updatedAt ?? null,
  };
}

(async () => {
  console.log(`Dry-run: ${!commit}. Batch size: ${batchSize}`);
  let lastDoc = null,
    processed = 0,
    changedStories = 0,
    changedStickers = 0;

  while (true) {
    let q = db.collection('stories').orderBy('createdAt').limit(batchSize);
    if (lastDoc) q = q.startAfter(lastDoc);
    const snap = await q.get();
    if (snap.empty) break;

    const batch = db.batch();
    for (const doc of snap.docs) {
      processed++;
      const data = doc.data() || {};
      const stickers = Array.isArray(data.stickers) ? data.stickers : [];
      if (!stickers.length) continue;
      const fixed = stickers.map((s, i) => fixSticker(s, i, data.createdAt || null));
      const same = JSON.stringify(stickers) === JSON.stringify(fixed);
      if (!same) {
        changedStories++;
        changedStickers += stickers.length;
        if (commit) {
          batch.set(doc.ref, { stickers: fixed, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
        } else {
          console.log(`Would update story ${doc.id} (${stickers.length} stickers).`);
        }
      }
    }
    if (commit) await batch.commit();
    lastDoc = snap.docs[snap.docs.length - 1];
  }

  console.log(`Processed stories: ${processed}`);
  console.log(`Changed stories: ${changedStories}, stickers touched: ${changedStickers}`);
  if (!commit) console.log('Dry-run complete. Re-run with --commit to apply.');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
