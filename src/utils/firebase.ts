import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
// @ts-ignore
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase configuration parameters
// Replace the values below with your real project configurations once created in Firebase console
const firebaseConfig = {
  apiKey: "MOCK_API_KEY_REPLACE_ME",
  authDomain: "flatemate-ahmedabad.firebaseapp.com",
  projectId: "flatemate-ahmedabad",
  storageBucket: "flatemate-ahmedabad.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef12345"
};

// Auto-detect if credentials have been replaced with real values
const isFirebaseConfigured = 
  firebaseConfig.apiKey && 
  firebaseConfig.apiKey !== "MOCK_API_KEY_REPLACE_ME" &&
  !firebaseConfig.apiKey.includes("REPLACE_ME");

let app;
let db: any = null;
let auth: any = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app);
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
    console.log("Firebase Firestore and Auth initialized successfully!");
  } catch (error) {
    console.error("Firebase initialization failed:", error);
  }
} else {
  console.log("Firebase is running in OFFLINE MOCK MODE. To connect a live database, configure your credentials in src/utils/firebase.ts.");
}

export { db, auth, isFirebaseConfigured };
