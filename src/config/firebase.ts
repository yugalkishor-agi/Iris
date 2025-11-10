import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyD9PHBh208uc4lDO9F3lvBUFUotnzGd56k",
  authDomain: "appmode-a6696.firebaseapp.com",
  databaseURL: "https://appmode-a6696-default-rtdb.firebaseio.com",
  projectId: "appmode-a6696",
  storageBucket: "appmode-a6696.firebasestorage.app",
  messagingSenderId: "350506689842",
  appId: "1:350506689842:web:28faec26001e4f1331632b",
  measurementId: "G-SL94R1QEMC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Auth
export const auth = getAuth(app);

// Initialize Storage
export const storage = getStorage(app);

// Suppress Firebase auth refresh errors when no user is signed in
auth.onAuthStateChanged((user) => {
  if (!user) {
    // Clear any stale tokens
    auth.currentUser?.getIdToken(true).catch(() => {});
  }
});

// Connect to emulators in development (DISABLED - using production Firebase)
// Uncomment below to use local emulators
/*
if (import.meta.env.DEV) {
  try {
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectAuthEmulator(auth, 'http://localhost:9099');
    console.log('🔧 Connected to Firebase emulators');
  } catch (error) {
    console.warn('⚠️ Emulators already connected or not running');
  }
}
*/

// Suppress React Router v6 deprecation warnings in console
const originalWarn = console.warn;
console.warn = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('React Router Future Flag Warning')) {
    return;
  }
  originalWarn.apply(console, args);
};

console.log('🔥 Using production Firebase');

export default app;
