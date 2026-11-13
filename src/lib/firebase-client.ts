"use client";

import { getApps, initializeApp } from "firebase/app";
import { browserPopupRedirectResolver, browserSessionPersistence, getAuth, initializeAuth, type Auth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase web configuration is public identification, never a service-account key.
const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};
export const firebaseConfigured = Object.values(config).every(Boolean);
let auth: Auth | undefined;

export function getFirebase() {
  if (typeof window === "undefined" || !firebaseConfigured) throw new Error("Firebase is not configured for this browser.");
  const app = getApps().find(item => item.name === "portfolio") ?? initializeApp(config, "portfolio");
  return { app, db: getFirestore(app) };
}

export function getAdminAuth() {
  if (auth) return auth;
  const { app } = getFirebase();
  try {
    auth = initializeAuth(app, { persistence: browserSessionPersistence, popupRedirectResolver: browserPopupRedirectResolver });
  } catch (error) {
    if ((error as { code?: string }).code !== "auth/already-initialized") throw error;
    auth = getAuth(app);
  }
  return auth;
}

export function firebaseMessage(error: unknown): string {
  const code = (error as { code?: string })?.code;
  if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") return "Sign-in was canceled. You can try again.";
  if (code === "auth/popup-blocked") return "Allow the Google sign-in popup for this website, then try again.";
  if (code === "auth/unauthorized-domain") return "This website domain has not been authorized for Firebase sign-in.";
  if (code === "auth/invalid-api-key" || code === "auth/api-key-not-valid.-please-pass-a-valid-api-key.") return "The deployed Firebase sign-in configuration is invalid. The site owner needs to correct the build settings and redeploy.";
  if (code === "auth/operation-not-allowed" || code === "auth/configuration-not-found") return "Google sign-in is not enabled or configured for this Firebase project. Contact the site owner.";
  if (code === "permission-denied") return "Access was denied. Your account may no longer have admin access. Your unsaved changes are still here.";
  if (code === "unavailable" || code === "auth/network-request-failed") return "The service is unavailable. Check your connection and try again.";
  return "The request could not be completed. Check the Firebase setup and your connection, then try again.";
}
