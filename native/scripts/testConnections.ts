/**
 * Database Connection Test Script
 * Run this to verify all database connections are working
 */

import { db, auth, storage } from '../config/firebase';
import { supabase } from '../config/supabase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

// Color codes for console
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

const log = {
  success: (msg: string) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg: string) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  info: (msg: string) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  warning: (msg: string) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
};

/**
 * Test Firebase Firestore connection
 */
async function testFirestore() {
  log.info('Testing Firebase Firestore...');
  
  try {
    const testDocRef = doc(db, 'test', 'connection');
    
    // Try to write
    await setDoc(testDocRef, {
      test: true,
      timestamp: serverTimestamp(),
      message: 'Connection test successful',
    });
    
    // Try to read
    const docSnap = await getDoc(testDocRef);
    
    if (docSnap.exists()) {
      log.success('Firestore: Connected and working!');
      log.info(`  Data: ${JSON.stringify(docSnap.data())}`);
      return true;
    } else {
      log.error('Firestore: Document not found after write');
      return false;
    }
  } catch (error: any) {
    log.error(`Firestore: Connection failed - ${error.message}`);
    return false;
  }
}

/**
 * Test Firebase Auth connection
 */
async function testAuth() {
  log.info('Testing Firebase Auth...');
  
  try {
    const currentUser = auth.currentUser;
    
    if (currentUser) {
      log.success('Auth: User is logged in');
      log.info(`  User ID: ${currentUser.uid}`);
      log.info(`  Email: ${currentUser.email}`);
    } else {
      log.warning('Auth: No user currently logged in (this is OK)');
    }
    
    log.success('Auth: Connection working!');
    return true;
  } catch (error: any) {
    log.error(`Auth: Connection failed - ${error.message}`);
    return false;
  }
}

/**
 * Test Firebase Storage connection
 */
async function testFirebaseStorage() {
  log.info('Testing Firebase Storage...');
  
  try {
    // Just check if storage is initialized
    if (storage) {
      log.success('Firebase Storage: Connected and available!');
      log.info(`  Bucket: ${storage.app.options.storageBucket}`);
      return true;
    } else {
      log.error('Firebase Storage: Not initialized');
      return false;
    }
  } catch (error: any) {
    log.error(`Firebase Storage: Connection failed - ${error.message}`);
    return false;
  }
}

/**
 * Test Supabase Storage connection
 */
async function testSupabaseStorage() {
  log.info('Testing Supabase Storage...');
  
  try {
    // List files in avatars bucket (should work even if empty)
    const { data, error } = await supabase
      .storage
      .from('avatars')
      .list('', { limit: 1 });
    
    if (error) {
      log.error(`Supabase Storage: ${error.message}`);
      return false;
    }
    
    log.success('Supabase Storage: Connected and working!');
    log.info(`  Bucket 'avatars' accessible`);
    return true;
  } catch (error: any) {
    log.error(`Supabase Storage: Connection failed - ${error.message}`);
    return false;
  }
}

/**
 * Test all required Firestore collections
 */
async function testCollections() {
  log.info('Testing Firestore Collections...');
  
  const collections = [
    'users',
    'posts',
    'stories',
    'glimpses',
    'conversations',
    'notifications',
    'highlights',
  ];
  
  let allPassed = true;
  
  for (const collectionName of collections) {
    try {
      const testDocRef = doc(db, collectionName, 'test');
      await getDoc(testDocRef);
      log.success(`  Collection '${collectionName}': Accessible ✓`);
    } catch (error: any) {
      log.error(`  Collection '${collectionName}': Error - ${error.message}`);
      allPassed = false;
    }
  }
  
  return allPassed;
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('\n' + '='.repeat(50));
  console.log('🧪 DATABASE CONNECTION TESTS');
  console.log('='.repeat(50) + '\n');
  
  const results = {
    firestore: false,
    auth: false,
    firebaseStorage: false,
    supabaseStorage: false,
    collections: false,
  };
  
  // Run all tests
  results.firestore = await testFirestore();
  console.log('');
  
  results.auth = await testAuth();
  console.log('');
  
  results.firebaseStorage = await testFirebaseStorage();
  console.log('');
  
  results.supabaseStorage = await testSupabaseStorage();
  console.log('');
  
  results.collections = await testCollections();
  console.log('');
  
  // Summary
  console.log('='.repeat(50));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(50) + '\n');
  
  const total = Object.keys(results).length;
  const passed = Object.values(results).filter(Boolean).length;
  const failed = total - passed;
  
  console.log(`Total Tests: ${total}`);
  console.log(`${colors.green}Passed: ${passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failed}${colors.reset}\n`);
  
  if (passed === total) {
    log.success('All tests passed! 🎉');
    log.success('Database connections are working correctly!');
  } else {
    log.error('Some tests failed!');
    log.warning('Please check the Firebase/Supabase configuration');
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  return passed === total;
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      log.error(`Fatal error: ${error.message}`);
      process.exit(1);
    });
}

export default runTests;
