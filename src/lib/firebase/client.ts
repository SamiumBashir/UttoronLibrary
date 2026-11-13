"use client";

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  type Auth,
} from "firebase/auth";
import { getStorage, type FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export function isFirebaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  );
}

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let storage: FirebaseStorage | undefined;

if (typeof window !== "undefined" && isFirebaseConfigured()) {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  storage = getStorage(app);
}

export { app, auth, storage };

export async function signInWithGoogle() {
  if (!auth) {
    throw new Error(
      "Firebase is not configured yet. Add NEXT_PUBLIC_FIREBASE_API_KEY and NEXT_PUBLIC_FIREBASE_PROJECT_ID to .env.local."
    );
  }
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  return signInWithPopup(auth, provider);
}

export async function signInWithEmail(email: string, pass: string) {
  if (!auth) {
    throw new Error("Firebase Auth is not configured.");
  }
  return signInWithEmailAndPassword(auth, email, pass);
}

export async function signUpWithEmail(email: string, pass: string) {
  if (!auth) {
    throw new Error("Firebase Auth is not configured.");
  }
  return createUserWithEmailAndPassword(auth, email, pass);
}

export async function resetPasswordWithEmail(email: string) {
  if (!auth) {
    throw new Error("Firebase Auth is not configured.");
  }
  return sendPasswordResetEmail(auth, email);
}

export async function logOutFromFirebase() {
  if (auth) {
    await firebaseSignOut(auth);
  }
}

