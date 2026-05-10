import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

function getAdminApp() {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!serviceAccount) return null;
  if (getApps().length === 0) {
    return initializeApp({ credential: cert(JSON.parse(serviceAccount)) });
  }
  return getApps()[0];
}

export async function verifyFirebaseToken(idToken: string) {
  const app = getAdminApp();
  if (!app) return null;
  try {
    const decoded = await getAuth(app).verifyIdToken(idToken);
    return decoded;
  } catch {
    return null;
  }
}
