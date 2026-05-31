import { addDoc, collection, limit, orderBy, query, serverTimestamp } from "firebase/firestore";
import { COLLECTIONS } from "lib/firebaseCollections";
import { auth, db } from "lib/firebaseApp";
import { mapDocument } from "lib/firestoreData";
import { subscribeToSnapshot } from "lib/firestoreRealtime";
import { mapFirebaseError } from "services/firebaseErrorService";

export async function createActivityLog({
  action,
  actorRole,
  targetId,
  targetType,
  description,
}) {
  const actorId = auth.currentUser?.uid || "";

  try {
    await addDoc(collection(db, COLLECTIONS.ACTIVITY_LOGS), {
      action: String(action || "").trim(),
      actorId,
      actorRole: String(actorRole || "").trim(),
      targetId: String(targetId || "").trim(),
      targetType: String(targetType || "").trim(),
      description: String(description || "").trim(),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    throw new Error(
      mapFirebaseError(error, "Impossible d'enregistrer le log d'activite.")
    );
  }
}

export function subscribeActivityLogs(callback, onError, maxItems = 100) {
  return subscribeToSnapshot(
    query(
      collection(db, COLLECTIONS.ACTIVITY_LOGS),
      orderBy("createdAt", "desc"),
      limit(maxItems)
    ),
    {
      label: "activity-logs",
      onNext: (snapshot) => {
        callback(snapshot.docs.map(mapDocument));
      },
      onError: (error) => {
        if (onError) {
          onError(
            new Error(
              mapFirebaseError(error, "Impossible de charger les logs d'activite.")
            )
          );
        }
      },
    }
  );
}
