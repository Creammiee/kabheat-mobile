import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence, collection, addDoc, serverTimestamp, getDocs, query, orderBy, limit } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updateProfile } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

let app;
let db;
let auth;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);

  // Enable offline persistence
  enableIndexedDbPersistence(db)
    .catch((err) => {
      if (err.code == 'failed-precondition') {
        console.warn('Multiple tabs open, persistence can only be enabled in one tab at a a time.');
      } else if (err.code == 'unimplemented') {
        console.warn('The current browser does not support all of the features required to enable persistence');
      }
    });
} catch (error) {
  console.error("Firebase initialization error", error);
}

// -------------------------------------------------------------
// Firebase Service Helpers
// -------------------------------------------------------------

/**
 * Saves a heat symptom log to Firestore. 
 * Supports offline sync.
 */
export async function saveHeatLogToCloud(logData) {
  if (!db) return;
  try {
    const docRef = await addDoc(collection(db, "heatLogs"), {
      ...logData,
      cloudTimestamp: serverTimestamp()
    });
    console.log("Heat log saved to cloud with ID: ", docRef.id);
    return docRef;
  } catch (e) {
    console.error("Error adding heat log document: ", e);
    throw e;
  }
}

/**
 * Saves an emergency SOS alert to Firestore.
 * Supports offline sync.
 */
export async function broadcastSOSAlert(alertData) {
  if (!db) return;
  try {
    const docRef = await addDoc(collection(db, "sosAlerts"), {
      ...alertData,
      cloudTimestamp: serverTimestamp()
    });
    console.log("SOS Alert broadcasted to cloud with ID: ", docRef.id);
    return docRef;
  } catch (e) {
    console.error("Error broadcasting SOS Alert: ", e);
    throw e;
  }
}

/**
 * Fetches recent heat logs from Firestore.
 */
export async function fetchRecentHeatLogs(maxLogs = 50) {
  if (!db) return [];
  try {
    const q = query(collection(db, "heatLogs"), orderBy("cloudTimestamp", "desc"), limit(maxLogs));
    const querySnapshot = await getDocs(q);
    const logs = [];
    querySnapshot.forEach((doc) => {
      logs.push({ id: doc.id, ...doc.data() });
    });
    return logs;
  } catch (e) {
    console.error("Error fetching heat logs: ", e);
    return [];
  }
}

// -------------------------------------------------------------
// Authentication Helpers
// -------------------------------------------------------------

export async function loginUser(email, password) {
  if (!auth) throw new Error("Firebase Auth not initialized");
  return signInWithEmailAndPassword(auth, email, password);
}

export async function registerUser(email, password) {
  if (!auth) throw new Error("Firebase Auth not initialized");
  return createUserWithEmailAndPassword(auth, email, password);
}

export async function logoutUser() {
  if (!auth) throw new Error("Firebase Auth not initialized");
  return signOut(auth);
}

export async function updateUserProfile(profileData) {
  if (!auth.currentUser) throw new Error("No user logged in");
  return updateProfile(auth.currentUser, profileData);
}

export { db, auth };

