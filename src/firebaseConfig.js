// Firebase v9+ modular SDK
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { signOut } from "firebase/auth";

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

// Auth + Providers
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const logout = () => {
  return signOut(auth);
};

export default app;