import {
  collection,
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { normalizeNumber, normalizeTimestamp } from "lib/firestoreData";
import { COLLECTIONS } from "lib/firebaseCollections";
import { db } from "lib/firebaseApp";
import { subscribeToSnapshot } from "lib/firestoreRealtime";
import { mapFirebaseError } from "services/firebaseErrorService";
import { localApiFindEmployer } from "services/localAdminApiService";

function normalizeRole(role) {
  const value = String(role || "").trim().toLowerCase();

  switch (value) {
    case "super_admin":
    case "super-admin":
      return "super_admin";
    case "admin":
      return "admin";
    case "employer":
    case "employee":
    case "client":
    case "user":
    case "":
      return "employer";
    case "chef":
    case "kitchen":
    case "cuisine":
    case "cuisinier":
      return "chef";
    default:
      return value;
  }
}

function mapUser(documentSnapshot) {
  const data = documentSnapshot.data();
  return mapUserRecord({
    id: documentSnapshot.id,
    ...data,
  });
}

function mapUserRecord(data) {
  const displayName = String(data.name || "").trim();
  const role = normalizeRole(data.role || "employer");
  const requestedRole = normalizeRole(data.requestedRole || role);

  return {
    id: data.id || data.uid || "",
    ...data,
    uid: data.uid || data.id || "",
    name: displayName,
    displayName,
    email: String(data.email || "").trim(),
    cin: String(data.cin || "").trim(),
    poste: String(data.poste || "").trim(),
    employerCode: String(data.employerCode || data.clientCode || "").trim(),
    balance: normalizeNumber(data.balance, 0),
    role,
    requestedRole,
    approved: data.approved === true,
    createdAt: normalizeTimestamp(data.createdAt || null),
    updatedAt: normalizeTimestamp(data.updatedAt || null),
  };
}

export function subscribeUsers(callback, onError) {
  return subscribeToSnapshot(collection(db, COLLECTIONS.USERS), {
    label: "users",
    onNext: (snapshot) => {
      const users = snapshot.docs.map(mapUser).sort((left, right) =>
        left.displayName.localeCompare(right.displayName, "fr", {
          sensitivity: "base",
        })
      );

      callback(users);
    },
    onError: (error) => {
      if (onError) {
        onError(
          new Error(
            mapFirebaseError(error, "Impossible de charger les utilisateurs.")
          )
        );
      }
    },
  });
}

export async function updateUserProfile(uid, payload) {
  const name = String(payload.name || "").trim();
  const employerCode = String(payload.employerCode || "").trim();

  try {
    await updateDoc(doc(db, COLLECTIONS.USERS, uid), {
      name,
      employerCode,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    throw new Error(
      mapFirebaseError(error, "Mise a jour du profil utilisateur impossible.")
    );
  }
}

export async function searchEmployers(query) {
  try {
    const items = await localApiFindEmployer(query);
    return items.map(mapUserRecord);
  } catch (error) {
    throw new Error(
      mapFirebaseError(error, "Employe introuvable.")
    );
  }
}
