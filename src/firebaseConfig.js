// Firebase v9+ modular SDK
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCCRg-c9irDpN0NeTqLRTfuH1PfgVmMQRg",
  authDomain: "pinmypark.firebaseapp.com",
  projectId: "pinmypark",
  storageBucket: "pinmypark.firebasestorage.app",
  messagingSenderId: "396369665327",
  appId: "1:396369665327:web:002164ed366ba1345715da",
  measurementId: "G-TM1WJ56PTH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// -----------------------------
// Auth + Google Provider
// -----------------------------
export const auth = getAuth(app);
auth.useDeviceLanguage(); // 🔥 REQUIRED for redirect to work on iOS/Chrome

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account",
});

// Optional but recommended
googleProvider.addScope("email");
googleProvider.addScope("profile");

// -----------------------------
// Firestore
// -----------------------------
export const db = getFirestore(app);

export const logout = () => signOut(auth);

export default app;