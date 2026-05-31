import { mapFirebaseError } from "services/firebaseErrorService";
import { collection, limit, orderBy, query, where } from "firebase/firestore";
import { COLLECTIONS } from "lib/firebaseCollections";
import { db } from "lib/firebaseApp";
import { subscribeToSnapshot } from "lib/firestoreRealtime";
import {
  localApiAdjustUserBalance,
  localApiGetUserTransactions,
} from "services/localAdminApiService";

function normalizeTransaction(item) {
  return {
    id: item.id,
    ...item,
    amount: Number(item.amount ?? 0),
    balanceBefore: Number(item.balanceBefore ?? 0),
    balanceAfter: Number(item.balanceAfter ?? 0),
    type: String(item.type || "").trim(),
    source: String(item.source || "").trim(),
    note: String(item.note || "").trim(),
    createdAt: item.createdAt || null,
  };
}

export async function adjustEmployerBalance(uid, amount, reason) {
  try {
    return await localApiAdjustUserBalance({
      uid,
      amount,
      reason,
      adminNote: reason,
    });
  } catch (error) {
    throw new Error(
      mapFirebaseError(error, "Erreur lors du chargement.")
    );
  }
}

export async function getEmployerTransactions(uid) {
  try {
    const items = await localApiGetUserTransactions(uid, 20);
    return items.map(normalizeTransaction);
  } catch (error) {
    throw new Error(
      mapFirebaseError(error, "Impossible de charger l'historique des transactions.")
    );
  }
}

export function subscribeEmployerTransactions(uid, callback, onError) {
  if (!uid) {
    callback([]);
    return () => {};
  }

  return subscribeToSnapshot(
    query(
      collection(db, COLLECTIONS.BALANCE_TRANSACTIONS),
      where("userId", "==", uid),
      orderBy("createdAt", "desc"),
      limit(20)
    ),
    {
      label: "balance-transactions",
      onNext: (snapshot) => {
        callback(snapshot.docs.map((item) => normalizeTransaction({ id: item.id, ...item.data() })));
      },
      onError: (error) => {
        if (onError) {
          onError(
            new Error(
              mapFirebaseError(
                error,
                "Impossible de charger l'historique des transactions."
              )
            )
          );
        }
      },
    }
  );
}
