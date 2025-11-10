// One-time script to fix following/followers count mismatch
// Run this with: node fix-following-count.js

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // You'll need to download this from Firebase Console

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function fixFollowingCounts() {
  console.log('Starting to fix following/followers counts...');
  
  const usersSnapshot = await db.collection('users').get();
  
  for (const userDoc of usersSnapshot.docs) {
    const userId = userDoc.id;
    
    // Count actual following
    const followingSnapshot = await db.collection(`users/${userId}/following`).get();
    const actualFollowingCount = followingSnapshot.size;
    
    // Count actual followers
    const followersSnapshot = await db.collection(`users/${userId}/followers`).get();
    const actualFollowersCount = followersSnapshot.size;
    
    // Get current counts
    const currentData = userDoc.data();
    const currentFollowingCount = currentData?.stats?.followingCount || 0;
    const currentFollowersCount = currentData?.stats?.followersCount || 0;
    
    // Update if mismatch
    if (currentFollowingCount !== actualFollowingCount || currentFollowersCount !== actualFollowersCount) {
      console.log(`Fixing ${currentData.username}:`);
      console.log(`  Following: ${currentFollowingCount} → ${actualFollowingCount}`);
      console.log(`  Followers: ${currentFollowersCount} → ${actualFollowersCount}`);
      
      await db.collection('users').doc(userId).update({
        'stats.followingCount': actualFollowingCount,
        'stats.followersCount': actualFollowersCount
      });
    }
  }
  
  console.log('Done! All counts fixed.');
}

fixFollowingCounts().catch(console.error);
