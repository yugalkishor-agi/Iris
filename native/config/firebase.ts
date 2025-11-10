import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
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

console.log('🔥 Firebase initialized for React Native');

export default app;
