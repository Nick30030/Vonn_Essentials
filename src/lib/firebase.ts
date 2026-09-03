import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc as firestoreSetDoc, 
  updateDoc as firestoreUpdateDoc, 
  onSnapshot, 
  collection, 
  getDocs, 
  arrayUnion, 
  arrayRemove,
  SetOptions,
  DocumentReference,
  UpdateData,
  WithFieldValue,
  PartialWithFieldValue
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import firebaseConfig from "../../firebase-applet-config.json";

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId || "(default)");
export const auth = getAuth(app);

export function sanitizeFirestoreData<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return null as unknown as T;
  }
  if (Array.isArray(obj)) {
    return obj
      .filter(item => item !== undefined)
      .map(item => sanitizeFirestoreData(item)) as unknown as T;
  }
  if (typeof obj === "object" && !(obj instanceof Date)) {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = sanitizeFirestoreData(value);
      }
    }
    return cleaned as T;
  }
  return obj;
}

export const setDoc = async <T extends Record<string, any>>(
  reference: DocumentReference<any>,
  data: WithFieldValue<T> | PartialWithFieldValue<T>,
  options?: SetOptions
) => {
  const sanitized = sanitizeFirestoreData(data);
  return options ? firestoreSetDoc(reference, sanitized as any, options) : firestoreSetDoc(reference, sanitized as any);
};

export const updateDoc = async (
  reference: DocumentReference<any>,
  data: UpdateData<any>
) => {
  const sanitized = sanitizeFirestoreData(data);
  return firestoreUpdateDoc(reference, sanitized as any);
};

export { doc, getDoc, onSnapshot, collection, getDocs, arrayUnion, arrayRemove };
