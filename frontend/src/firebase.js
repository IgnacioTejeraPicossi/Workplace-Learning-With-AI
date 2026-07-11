import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// Firebase web config. NOTE: a Firebase web `apiKey` is a public project
// identifier, not a secret — access is controlled by Firebase Security Rules
// and the Authorized Domains list, not by hiding this value. The defaults
// below keep local dev working out of the box, but every field can be
// overridden per-environment via REACT_APP_FIREBASE_* build-time variables.
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyB9jNx5pj5-KauoMnrKgwgqWEB5bFUu0cA",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "ai-learning-platform-71fcd.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "ai-learning-platform-71fcd",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "ai-learning-platform-71fcd.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "970774568929",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:970774568929:web:4b263e342c77474eb93ca0",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
