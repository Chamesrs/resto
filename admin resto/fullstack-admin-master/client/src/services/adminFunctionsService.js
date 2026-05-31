import { httpsCallable } from "firebase/functions";
import { functions } from "lib/firebaseApp";
import { adminCapabilities } from "services/adminCapabilitiesService";
import {
  createFunctionsDisabledError,
  mapFirebaseError,
} from "services/firebaseErrorService";

const setUserAccessCallable = httpsCallable(functions, "setUserAccess");
const deleteUserAccountCallable = httpsCallable(functions, "deleteUserAccount");
const adminAdjustUserBalanceCallable = httpsCallable(
  functions,
  "adminAdjustUserBalance"
);
const approveRechargeRequestCallable = httpsCallable(
  functions,
  "approveRechargeRequest"
);
const rejectRechargeRequestCallable = httpsCallable(
  functions,
  "rejectRechargeRequest"
);
const adminUpdateReservationStatusCallable = httpsCallable(
  functions,
  "adminUpdateReservationStatus"
);

function assertFunctionsEnabled() {
  if (!adminCapabilities.adminFunctionsEnabled) {
    throw createFunctionsDisabledError();
  }
}

export async function setUserAccess({ uid, role, approved }) {
  assertFunctionsEnabled();

  try {
    const result = await setUserAccessCallable({ uid, role, approved });
    return result.data;
  } catch (error) {
    throw new Error(mapFirebaseError(error, "Approbation impossible."));
  }
}

export async function deleteUserAccount(uid) {
  assertFunctionsEnabled();

  try {
    const result = await deleteUserAccountCallable({ uid });
    return result.data;
  } catch (error) {
    throw new Error(mapFirebaseError(error, "Suppression impossible."));
  }
}

export async function adminAdjustUserBalance({
  uid,
  balance,
  adminNote = "",
}) {
  assertFunctionsEnabled();

  try {
    const result = await adminAdjustUserBalanceCallable({
      uid,
      balance,
      adminNote,
    });
    return result.data;
  } catch (error) {
    throw new Error(mapFirebaseError(error, "Mise a jour du solde impossible."));
  }
}

export async function approveRechargeRequest({ requestId, adminNote = "" }) {
  assertFunctionsEnabled();

  try {
    const result = await approveRechargeRequestCallable({ requestId, adminNote });
    return result.data;
  } catch (error) {
    throw new Error(
      mapFirebaseError(error, "Validation de la recharge impossible.")
    );
  }
}

export async function rejectRechargeRequest({ requestId, adminNote = "" }) {
  assertFunctionsEnabled();

  try {
    const result = await rejectRechargeRequestCallable({ requestId, adminNote });
    return result.data;
  } catch (error) {
    throw new Error(mapFirebaseError(error, "Rejet de la recharge impossible."));
  }
}

export async function adminUpdateReservationStatus({
  reservationId,
  status,
  reason = "",
}) {
  assertFunctionsEnabled();

  try {
    const result = await adminUpdateReservationStatusCallable({
      reservationId,
      status,
      reason,
    });
    return result.data;
  } catch (error) {
    throw new Error(
      mapFirebaseError(
        error,
        "Mise a jour du statut de reservation impossible."
      )
    );
  }
}
