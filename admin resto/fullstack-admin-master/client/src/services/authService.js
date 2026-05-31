import {
  onIdTokenChanged,
  setPersistence,
  browserLocalPersistence,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { normalizeRole } from "lib/accessControl";
import { normalizeTimestamp } from "lib/firestoreData";
import { COLLECTIONS } from "lib/firebaseCollections";
import { auth, db } from "lib/firebaseApp";
import { mapFirebaseError } from "services/firebaseErrorService";

function mapClaims(tokenResult, profileData = null) {
  const claims = tokenResult?.claims || {};
  const role = normalizeRole(claims.role || profileData?.role || "employer");
  const approved = claims.approved === true || profileData?.approved === true;
  const superAdmin =
    claims.super_admin === true || role === "super_admin";
  const admin =
    claims.admin === true || superAdmin || role === "admin";
  const chef =
    claims.chef === true ||
    claims.kitchen === true ||
    role === "chef";
  const employer =
    claims.employer === true ||
    claims.employee === true ||
    claims.client === true ||
    role === "employer";

  return {
    approved,
    superAdmin,
    admin,
    employer,
    chef,
    role,
  };
}

function mapProfile(profileSnapshot) {
  if (!profileSnapshot.exists()) {
    return null;
  }

  const data = profileSnapshot.data();
  return {
    ...data,
    createdAt: normalizeTimestamp(data.createdAt),
    updatedAt: normalizeTimestamp(data.updatedAt),
    claimsUpdatedAt: normalizeTimestamp(data.claimsUpdatedAt),
  };
}

async function buildAuthState(user, forceRefresh = true) {
  const tokenResult = await user.getIdTokenResult(forceRefresh);
  const profileSnapshot = await getDoc(doc(db, COLLECTIONS.USERS, user.uid));
  const profileData = profileSnapshot.exists() ? profileSnapshot.data() : null;

  return {
    user,
    claims: mapClaims(tokenResult, profileData),
    profile: mapProfile(profileSnapshot),
  };
}

export async function signInAdmin(email, password) {
  try {
    await setPersistence(auth, browserLocalPersistence);
    const credential = await signInWithEmailAndPassword(
      auth,
      email.trim(),
      password
    );
    const tokenResult = await credential.user.getIdTokenResult(true);
    const claims = mapClaims(tokenResult);

    if (
      !claims.approved ||
      (!claims.admin && !claims.superAdmin && !claims.chef)
    ) {
      await signOut(auth);
      throw new Error(
        "Ce compte n'a pas acces au panel web. Seuls super_admin, admin et chef sont autorises."
      );
    }

    return { user: credential.user, claims };
  } catch (error) {
    throw new Error(mapFirebaseError(error, "Connexion impossible."));
  }
}

export async function signOutUser() {
  await signOut(auth);
}

export function subscribeToAuthState(callback) {
  let claimsRefreshIntervalId = null;

  const clearClaimsRefresh = () => {
    if (claimsRefreshIntervalId) {
      window.clearInterval(claimsRefreshIntervalId);
      claimsRefreshIntervalId = null;
    }
  };

  const emitRefreshedState = async (user, forceRefresh = true) => {
    try {
      callback(await buildAuthState(user, forceRefresh));
    } catch (error) {
      callback({
        user,
        claims: null,
        profile: null,
        error,
      });
    }
  };

  const unsubscribe = onIdTokenChanged(auth, async (user) => {
    clearClaimsRefresh();

    if (!user) {
      callback({
        user: null,
        claims: null,
        profile: null,
      });
      return;
    }

    await emitRefreshedState(user, true);

    // Claims are updated server-side without an auth state change.
    // Poll a forced token refresh so role/approval changes converge quickly.
    claimsRefreshIntervalId = window.setInterval(() => {
      emitRefreshedState(user, true);
    }, 60_000);
  });

  return () => {
    clearClaimsRefresh();
    unsubscribe();
  };
}

export async function refreshAdminClaims() {
  const user = auth.currentUser;
  if (!user) {
    return { user: null, claims: null, profile: null };
  }

  return buildAuthState(user, true);
}
