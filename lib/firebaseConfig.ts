// firebaseConfig.ts
import { getApp, getApps, initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { initializeAuth, getReactNativePersistence, getAuth } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getFunctions } from "firebase/functions";

export const firebaseConfig = {
  apiKey: "AIzaSyBUm57cQI67Joupf4dovElZYeOnmXcpYcs",
  authDomain: "bilingualsite-ee6f8.firebaseapp.com",
  databaseURL: "https://bilingualsite-ee6f8-default-rtdb.firebaseio.com",
  projectId: "bilingualsite-ee6f8",
  storageBucket: "bilingualsite-ee6f8.firebasestorage.app",
  messagingSenderId: "871050529166",
  appId: "1:871050529166:web:b1d0a762819fed9be6bcdf",
  measurementId: "G-RED4ZSZMD4",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app);
export { app, auth, db, functions };

export const checkAuthState = async (): Promise<boolean> => {
  try {
    const user = auth.currentUser;
    if (!user) return false;

    const idTokenResult = await user.getIdTokenResult();
    const expirationTime = idTokenResult.claims.exp as number | undefined;

    if (!expirationTime || expirationTime * 1000 < Date.now()) {
      await auth.signOut();
      return false;
    }

    return true;
  } catch (error) {
    console.error("Auth state check failed:", error);
    await auth.signOut();
    return false;
  }
};