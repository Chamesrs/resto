import { collection, query, where } from "firebase/firestore";
import { normalizeNumber, normalizeTimestamp } from "lib/firestoreData";
import { COLLECTIONS } from "lib/firebaseCollections";
import { db } from "lib/firebaseApp";
import { subscribeToSnapshot } from "lib/firestoreRealtime";
import { RESERVATION_STATUS } from "lib/reservationStatus";
import { mapFirebaseError } from "services/firebaseErrorService";

function mapReservation(documentSnapshot) {
  const data = documentSnapshot.data();

  return {
    id: documentSnapshot.id,
    ...data,
    mealId: String(data.mealId || "").trim(),
    mealName: String(data.mealName || "").trim(),
    userId: String(data.userId || "").trim(),
    userName: String(data.userName || "").trim(),
    userEmail: String(data.userEmail || "").trim(),
    priceSnapshot: normalizeNumber(data.priceSnapshot, 0),
    day: String(data.day || "").trim(),
    weekStart: String(data.weekStart || "").trim(),
    status: String(data.status || RESERVATION_STATUS.RESERVED).trim(),
    createdAt: normalizeTimestamp(data.createdAt),
    updatedAt: normalizeTimestamp(data.updatedAt),
  };
}

function normalizeFilters(filters = {}) {
  return {
    status: String(filters.status || "").trim(),
    weekStart: String(filters.weekStart || "").trim(),
    day: String(filters.day || "").trim(),
    userSearch: String(filters.userSearch || "").trim(),
  };
}

function buildReservationsQuery(filters = {}) {
  const normalizedFilters = normalizeFilters(filters);
  const clauses = [collection(db, COLLECTIONS.RESERVATIONS)];

  if (normalizedFilters.status && normalizedFilters.status !== "all") {
    clauses.push(where("status", "==", normalizedFilters.status));
  }

  if (normalizedFilters.weekStart) {
    clauses.push(where("weekStart", "==", normalizedFilters.weekStart));
  }

  return query(...clauses);
}

function applyClientFilters(items, filters = {}) {
  const normalizedFilters = normalizeFilters(filters);
  let nextItems = [...items].sort((left, right) => {
    const leftCreatedAt = left.createdAt ? new Date(left.createdAt).getTime() : 0;
    const rightCreatedAt = right.createdAt ? new Date(right.createdAt).getTime() : 0;
    if (leftCreatedAt !== rightCreatedAt) {
      return rightCreatedAt - leftCreatedAt;
    }
    return right.id.localeCompare(left.id);
  });

  if (normalizedFilters.day) {
    nextItems = nextItems.filter((item) => item.day === normalizedFilters.day);
  }

  if (normalizedFilters.userSearch) {
    const searchNeedle = normalizedFilters.userSearch.toLowerCase();
    nextItems = nextItems.filter(
      (item) =>
        item.userName.toLowerCase().includes(searchNeedle) ||
        item.userEmail.toLowerCase().includes(searchNeedle)
    );
  }

  return nextItems;
}

export function subscribeReservations(filters, callback, onError) {
  const normalizedFilters = normalizeFilters(filters);

  return subscribeToSnapshot(buildReservationsQuery(normalizedFilters), {
    label: "reservations",
    onNext: (snapshot) => {
      callback(applyClientFilters(snapshot.docs.map(mapReservation), filters));
    },
    onError: (error) => {
      if (onError) {
        onError(
          new Error(
            mapFirebaseError(error, "Impossible de charger les reservations.")
          )
        );
      }
    },
  });
}
