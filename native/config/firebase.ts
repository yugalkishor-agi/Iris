import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
// @ts-ignore - getReactNativePersistence is exported from firebase/auth but types may not be available
import { initializeAuth, getReactNativePersistence, getAuth, type Auth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { backendConfigSummary, runtimeConfig, runtimeConfigSource } from './runtimeConfig';

if (__DEV__ && runtimeConfigSource.firebaseFromFallback) {
  console.warn(
    '[Config] Firebase env vars not injected. Using temporary fallback values from config/runtimeConfig.ts.'
  );
}

if (__DEV__) {
  console.log(
    `[Config] Firebase target project=${backendConfigSummary.firebase.projectId} authDomain=${backendConfigSummary.firebase.authDomain} tempOverride=${backendConfigSummary.firebase.tempOverrideEnabled}`
  );
}

const firebaseConfig = {
  apiKey: runtimeConfig.firebase.apiKey,
  authDomain: runtimeConfig.firebase.authDomain,
  databaseURL: runtimeConfig.firebase.databaseURL,
  projectId: runtimeConfig.firebase.projectId,
  storageBucket: runtimeConfig.firebase.storageBucket,
  messagingSenderId: runtimeConfig.firebase.messagingSenderId,
  appId: runtimeConfig.firebase.appId,
  measurementId: runtimeConfig.firebase.measurementId,
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);

let authInstance: Auth;
try {
  authInstance = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  // Hot reload / duplicate init path
  authInstance = getAuth(app);
}

export const auth = authInstance;
export const storage = getStorage(app);

export default app;
