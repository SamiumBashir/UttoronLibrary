import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";

export function isFirebaseAdminConfigured(): boolean {
  return Boolean(
    process.env.FIREBASE_PROJECT_ID &&
      (process.env.FIREBASE_PRIVATE_KEY || process.env.FIREBASE_CLIENT_EMAIL)
  );
}

let adminApp: App | undefined;
let adminAuth: Auth | undefined;

if (isFirebaseAdminConfigured()) {
  try {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
      : undefined;

    adminApp =
      getApps().length > 0
        ? getApps()[0]
        : initializeApp({
            credential: cert({
              projectId: process.env.FIREBASE_PROJECT_ID,
              clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
              privateKey,
            }),
            storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
          });

    adminAuth = getAuth(adminApp);
  } catch (err) {
    console.warn("[Firebase Admin] Initialization skipped or error:", err);
  }
}

export async function verifyFirebaseIdToken(idToken: string) {
  if (!adminAuth) {
    throw new Error(
      "Firebase Admin is not configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in .env.local."
    );
  }
  return adminAuth.verifyIdToken(idToken);
}

export { adminApp, adminAuth };
