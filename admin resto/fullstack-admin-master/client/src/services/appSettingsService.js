import { doc } from "firebase/firestore";
import { COLLECTIONS } from "lib/firebaseCollections";
import { db } from "lib/firebaseApp";
import { subscribeToSnapshot } from "lib/firestoreRealtime";
import { mapFirebaseError } from "services/firebaseErrorService";
import { localApiSetReservationsOpen } from "services/localAdminApiService";

function mapReservationConfig(snapshot) {
  const data = snapshot.data() || {};

  return {
    id: snapshot.id,
    reservationsOpen: data.reservationsOpen === true,
    updatedBy: String(data.updatedBy || "").trim(),
    updatedAt: data.updatedAt || null,
  };
}

export function subscribeReservationConfig(callback, onError) {
  return subscribeToSnapshot(doc(db, COLLECTIONS.APP_SETTINGS, "reservation_config"), {
    label: "app-settings:reservation-config",
    onNext: (snapshot) => {
      callback(mapReservationConfig(snapshot));
    },
    onError: (error) => {
      if (onError) {
        onError(
          new Error(
            mapFirebaseError(
              error,
              "Impossible de charger la configuration des reservations."
            )
          )
        );
      }
    },
  });
}

export async function setReservationsOpen(reservationsOpen) {
  try {
    await localApiSetReservationsOpen(reservationsOpen === true);
  } catch (error) {
    throw new Error(
      mapFirebaseError(
        error,
        "Impossible de mettre a jour l'ouverture des reservations."
      )
    );
  }
}
