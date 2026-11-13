"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut, type User } from "firebase/auth";
import { doc, onSnapshot, type Firestore } from "firebase/firestore";
import { firebaseConfigured, firebaseMessage, getAdminAuth, getFirebase } from "@/lib/firebase-client";
import { safeAdminDestination } from "@/lib/admin-navigation";
import { SitePublishControl } from "./site-publish-control";
import { DashboardShell } from "./dashboard-shell";

const AdminContext = createContext<{ user: User; db: Firestore } | null>(null);
export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) throw new Error("Admin access is required.");
  return context;
}

export function AdminGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [phase, setPhase] = useState<"checking" | "signedout" | "denied" | "ready" | "error">("checking");
  const [session, setSession] = useState<{ user: User; db: Firestore } | null>(null);
  const [identity, setIdentity] = useState<User | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const atLogin = pathname.replace(/\/$/, "") === "/adminauth";
    if (phase === "signedout" && !atLogin) router.replace(`/adminauth/?next=${encodeURIComponent(pathname)}`);
    if (phase === "ready" && atLogin) {
      const destination = safeAdminDestination(new URLSearchParams(window.location.search).get("next"));
      if (destination && destination !== "/adminauth/") router.replace(destination);
    }
  }, [phase, pathname, router]);

  useEffect(() => {
    if (!firebaseConfigured) return;
    let stopAccess: (() => void) | undefined;
    let stopAuth: (() => void) | undefined;
    try {
      const { db } = getFirebase();
      stopAuth = onAuthStateChanged(getAdminAuth(), user => {
        stopAccess?.();
        setSession(null); setIdentity(user); setError("");
        if (!user) { setPhase("signedout"); return; }
        setPhase("checking");
        stopAccess = onSnapshot(doc(db, "admins", user.uid), { includeMetadataChanges: true }, snapshot => {
          if (snapshot.metadata.fromCache) return;
          if (snapshot.exists() && snapshot.data().enabled === true && user.emailVerified) {
            setSession({ user, db }); setPhase("ready");
          } else { setSession(null); setPhase("denied"); }
        }, () => { setSession(null); setPhase("error"); setError("Admin access could not be verified. Check your connection or contact the site owner."); });
      }, () => { setSession(null); setPhase("error"); setError("The sign-in session could not be verified. Reload to try again."); });
    } catch (cause) { setPhase("error"); setError(firebaseMessage(cause)); }
    return () => { stopAuth?.(); stopAccess?.(); };
  }, []);

  async function login() {
    setBusy(true); setError("");
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      await signInWithPopup(getAdminAuth(), provider);
    } catch (cause) { setError(firebaseMessage(cause)); }
    finally { setBusy(false); }
  }
  async function logout() {
    setBusy(true); setError("");
    try {
      await signOut(getAdminAuth());
      // No persistent Firestore cache is enabled; reloading also clears fetched drafts from memory.
      window.location.replace("/adminauth/");
    }
    catch (cause) { setError(firebaseMessage(cause)); }
    finally { setBusy(false); }
  }

  if (!firebaseConfigured) return <main id="admin-main" tabIndex={-1} className="admin-entry"><section className="admin-card"><h1>Admin access</h1><p>Administration is not configured yet. Complete the Firebase setup in the project documentation before signing in.</p><Link href="/">Back to the website</Link></section></main>;
  if (phase === "ready" && session) return <AdminContext.Provider value={session}><DashboardShell name={session.user.displayName} email={session.user.email} busy={busy} error={error} logout={logout}><SitePublishControl />{children}</DashboardShell></AdminContext.Provider>;
  return <main id="admin-main" tabIndex={-1} className="admin-entry">
    <Link href="/" className="admin-entry-brand" aria-label="John Semblante home">js.</Link>
    <div className="admin-session"><Link href="/adminauth/">Admin home</Link><Link href="/">View website</Link>{identity && <><span>{identity.email}</span><button type="button" data-admin-signout="true" disabled={busy} onClick={logout}>Sign out</button></>}</div>
    {error && <p role="alert" className="form-error">{error}</p>}
    {phase === "checking" && <p role="status">Checking your admin access…</p>}
    {phase === "error" && <button type="button" onClick={() => window.location.reload()}>Reload and try again</button>}
    {phase === "signedout" && <section className="admin-card"><p className="eyebrow">Private workspace</p><h1>Admin access</h1><p>Sign in with your approved Google account to open the dashboard.</p><button type="button" className="button" disabled={busy} onClick={login}>{busy ? "Signing in…" : "Sign in with Google"}</button></section>}
    {phase === "denied" && <section className="admin-card"><h1>Access not granted</h1><p>This Google account is signed in but is not an approved administrator. Sign out to use a different account.</p><p className="form-note">Account ID for the site owner: <code>{identity?.uid}</code></p></section>}
  </main>;
}
