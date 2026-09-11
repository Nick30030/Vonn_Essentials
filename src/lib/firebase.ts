import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  getDocs,
  query,
  orderBy
} from "firebase/firestore";

const firebaseConfig = {
  projectId: "vonn-essentials-f5076",
  appId: "1:881735947174:web:beef7bad44a1815decf567",
  apiKey: "AIzaSyBhDILGpMnmrOwiXXTohosq5liq-HtOmHM",
  authDomain: "vonn-essentials-f5076.firebaseapp.com",
  firestoreDatabaseId: "vonn-essentials"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || "(default)");

// Automatically authenticate anonymously for authorized Firestore database access
if (typeof window !== "undefined") {
  signInAnonymously(auth).catch((err) => {
    console.warn("Client Firebase anonymous authentication notice:", err?.message || err);
  });
}

export { collection, doc, onSnapshot, setDoc, updateDoc, getDocs, query, orderBy };
export default { db, auth, doc, collection, onSnapshot, setDoc, updateDoc, getDocs, query, orderBy };

