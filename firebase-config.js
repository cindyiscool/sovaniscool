// Sovan - Firebase Configuration & Multi-tenant Setup
// Configured with Firebase Auth (users/sign-in) and Firestore database

const firebaseConfig = {
  apiKey: "AIzaSy_SOVAN_FIREBASE_API_KEY_PLACEHOLDER",
  authDomain: "sovan-mental-health.firebaseapp.com",
  projectId: "sovan-mental-health",
  storageBucket: "sovan-mental-health.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};

// Initialize Firebase safely
let auth = null;
let db = null;

try {
  if (typeof firebase !== 'undefined' && firebase.apps.length === 0) {
    firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
    db = firebase.firestore();
    console.log("🌸 Firebase initialized for Sovan multi-tenant platform.");
  }
} catch (e) {
  console.warn("Firebase running in offline-resilient local sandbox mode:", e.message);
}
