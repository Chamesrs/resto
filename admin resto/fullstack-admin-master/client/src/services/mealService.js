import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { normalizeNumber, normalizeTimestamp } from "lib/firestoreData";
import { COLLECTIONS } from "lib/firebaseCollections";
import { db } from "lib/firebaseApp";
import { subscribeToSnapshot } from "lib/firestoreRealtime";
import { mapFirebaseError } from "services/firebaseErrorService";

function mapMeal(documentSnapshot) {
  const data = documentSnapshot.data();

  return {
    id: documentSnapshot.id,
    ...data,
    name: String(data.name || "").trim(),
    description: String(data.description || "").trim(),
    category: String(data.category || "meal").trim() || "meal",
    price: normalizeNumber(data.price, 0),
    calories: normalizeNumber(data.calories, 0),
    allergens: Array.isArray(data.allergens) ? data.allergens : [],
    photoUrl: String(data.photoUrl || "").trim(),
    active: data.active !== false,
    day: String(data.day || "").trim(),
    weekStart: String(data.weekStart || "").trim(),
    reserve: normalizeNumber(data.reserve, 0),
    createdAt: normalizeTimestamp(data.createdAt),
    updatedAt: normalizeTimestamp(data.updatedAt),
  };
}

function computeWeekStart(day) {
  const date = new Date(`${day}T00:00:00.000Z`);
  const weekday = date.getUTCDay();
  const distance = weekday === 0 ? 6 : weekday - 1;
  date.setUTCDate(date.getUTCDate() - distance);
  return date.toISOString().slice(0, 10);
}

function normalizeMealPayload(payload, withCreatedAt = false) {
  const day = String(payload.day || "").trim();
  const normalized = {
    name: String(payload.name || "").trim(),
    description: String(payload.description || "").trim(),
    category: String(payload.category || "meal").trim() || "meal",
    price: normalizeNumber(payload.price, 0),
    calories: normalizeNumber(payload.calories, 0),
    allergens: Array.isArray(payload.allergens) ? payload.allergens : [],
    photoUrl: String(payload.photoUrl || "").trim(),
    active: payload.active !== false,
    day,
    weekStart: day ? computeWeekStart(day) : "",
    updatedAt: serverTimestamp(),
  };

  if (withCreatedAt) {
    normalized.createdAt = serverTimestamp();
    normalized.reserve = 0;
  }

  return normalized;
}

export function subscribeMeals(callback, onError) {
  const mealsQuery = query(
    collection(db, COLLECTIONS.MEALS),
    orderBy("day", "desc"),
    orderBy("createdAt", "desc")
  );

  return subscribeToSnapshot(mealsQuery, {
    label: "meals",
    onNext: (snapshot) => callback(snapshot.docs.map(mapMeal)),
    onError: (error) => {
      if (onError) {
        onError(
          new Error(mapFirebaseError(error, "Impossible de charger les repas."))
        );
      }
    },
  });
}

export async function createMeal(payload) {
  try {
    await addDoc(
      collection(db, COLLECTIONS.MEALS),
      normalizeMealPayload(payload, true)
    );
  } catch (error) {
    throw new Error(mapFirebaseError(error, "Creation du repas impossible."));
  }
}

export async function updateMeal(id, payload) {
  try {
    await updateDoc(doc(db, COLLECTIONS.MEALS, id), normalizeMealPayload(payload));
  } catch (error) {
    throw new Error(
      mapFirebaseError(error, "Modification du repas impossible.")
    );
  }
}

export async function deleteMeal(id) {
  try {
    await deleteDoc(doc(db, COLLECTIONS.MEALS, id));
  } catch (error) {
    throw new Error(mapFirebaseError(error, "Suppression du repas impossible."));
  }
}
