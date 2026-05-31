import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { normalizeNumber, normalizeTimestamp } from "lib/firestoreData";
import { COLLECTIONS } from "lib/firebaseCollections";
import { db } from "lib/firebaseApp";
import { mapFirebaseError } from "services/firebaseErrorService";

function mapRecharge(documentSnapshot) {
  const data = documentSnapshot.data();

  return {
    id: documentSnapshot.id,
    ...data,
    userId: String(data.userId || "").trim(),
    userName: String(data.userName || "").trim(),
    userEmail: String(data.userEmail || "").trim(),
    amount: normalizeNumber(data.amount, 0),
    note: String(data.note || "").trim(),
    adminNote: String(data.adminNote || "").trim(),
    status: String(data.status || "pending").trim(),
    createdAt: normalizeTimestamp(data.createdAt),
    processedAt: normalizeTimestamp(data.processedAt),
    updatedAt: normalizeTimestamp(data.updatedAt),
  };
}

function buildRechargeQuery(filters = {}) {
  const clauses = [collection(db, COLLECTIONS.RECHARGE_REQUESTS)];

  if (filters.status && filters.status !== "all") {
    clauses.push(where("status", "==", filters.status));
  }

  clauses.push(orderBy("createdAt", "desc"));
  return query(...clauses);
}

function applyClientFilters(items, filters = {}) {
  let nextItems = items;

  if (filters.userSearch) {
    const searchNeedle = filters.userSearch.toLowerCase();
    nextItems = nextItems.filter(
      (item) =>
        item.userName.toLowerCase().includes(searchNeedle) ||
        item.userEmail.toLowerCase().includes(searchNeedle)
    );
  }

  if (filters.dateFrom) {
    nextItems = nextItems.filter(
      (item) => String(item.createdAt).slice(0, 10) >= filters.dateFrom
    );
  }

  if (filters.dateTo) {
    nextItems = nextItems.filter(
      (item) => String(item.createdAt).slice(0, 10) <= filters.dateTo
    );
  }

  return nextItems;
}

export function subscribeRechargeRequests(filters, callback, onError) {
  return onSnapshot(
    buildRechargeQuery(filters),
    (snapshot) => {
      callback(applyClientFilters(snapshot.docs.map(mapRecharge), filters));
    },
    (error) => {
      if (onError) {
        onError(
          new Error(
            mapFirebaseError(
              error,
              "Impossible de charger les demandes de recharge."
            )
          )
        );
      }
    }
  );
}
