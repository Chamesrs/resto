import { apiConfig } from "config/api";
import { auth } from "lib/firebaseApp";
import { adminCapabilities } from "services/adminCapabilitiesService";
import { mapFirebaseError } from "services/firebaseErrorService";

async function readJson(response) {
  const text = await response.text();
  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    return { ok: false, error: "Invalid JSON response from local admin API." };
  }
}

async function request(pathname, options = {}) {
  const token = adminCapabilities.localApiToken;
  if (!token) {
    throw new Error(
      "Token local manquant. Configurez REACT_APP_LOCAL_ADMIN_TOKEN pour utiliser le backend local."
    );
  }

  const requestUrl = apiConfig.buildApiUrl(pathname);
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("Session admin introuvable.");
  }

  const idToken = await currentUser.getIdToken(true);
  let response;

  try {
    response = await fetch(requestUrl, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
        "x-admin-local-token": token,
        ...(options.headers || {}),
      },
    });
  } catch (error) {
    console.error("[local-admin-api] Request failed:", requestUrl, error);
    throw new Error(
      mapFirebaseError(error, "Impossible de joindre le backend admin local.")
    );
  }

  const payload = await readJson(response);
  if (!response.ok || payload.ok === false) {
    throw new Error(
      payload.error ||
        `Local admin API error (${response.status}).`
    );
  }

  return payload.result ?? payload;
}

export async function getLocalAdminHealth() {
  const healthUrl = apiConfig.buildApiUrl("/api/health");

  try {
    const response = await fetch(healthUrl);
    const payload = await readJson(response);
    if (!response.ok || payload.ok === false) {
      throw new Error(payload.error || "Backend local indisponible.");
    }
    return {
      connected: true,
      payload,
    };
  } catch (error) {
    console.error("[local-admin-api] Health check failed:", healthUrl, error);
    return {
      connected: false,
      error: mapFirebaseError(
        error,
        "Impossible de joindre le service admin local."
      ),
    };
  }
}

export async function localApiSetUserAccess({ uid, role, approved }) {
  return request(`/api/users/${uid}/access`, {
    method: "POST",
    body: JSON.stringify({ role, approved }),
  });
}

export async function localApiDeleteUser(uid) {
  return request(`/api/users/${uid}`, {
    method: "DELETE",
  });
}

export async function localApiSetUserBalance({
  uid,
  balance,
  adminNote = "",
}) {
  return request("/api/users/set-balance", {
    method: "POST",
    body: JSON.stringify({ uid, balance, adminNote }),
  });
}

export async function localApiAdjustUserBalance({
  uid,
  amount,
  adminNote = "",
  reason = "",
}) {
  return request("/api/users/adjust-balance", {
    method: "POST",
    body: JSON.stringify({ uid, amount, adminNote, reason }),
  });
}

export async function localApiFindEmployer(query) {
  const params = new URLSearchParams({ query: String(query || "").trim() });
  return request(`/api/users/search?${params.toString()}`, {
    method: "GET",
  });
}

export async function localApiGetUserTransactions(uid, limit = 20) {
  const params = new URLSearchParams({ limit: String(limit) });
  return request(`/api/users/${uid}/transactions?${params.toString()}`, {
    method: "GET",
  });
}

export async function localApiGetActivityLogs(limit = 50) {
  const params = new URLSearchParams({ limit: String(limit) });
  return request(`/api/activity-logs?${params.toString()}`, {
    method: "GET",
  });
}

export async function localApiApproveUser(uid) {
  return request("/api/users/approve", {
    method: "POST",
    body: JSON.stringify({ uid }),
  });
}

export async function localApiRejectUser(uid) {
  return request("/api/users/reject", {
    method: "POST",
    body: JSON.stringify({ uid }),
  });
}

export async function localApiUpdateUserRole({ uid, role }) {
  return request("/api/users/update-role", {
    method: "POST",
    body: JSON.stringify({ uid, role }),
  });
}

export async function localApiUpdateUserProfile({
  uid,
  name,
  employerCode,
  cin,
  role,
}) {
  return request("/api/users/update-profile", {
    method: "POST",
    body: JSON.stringify({ uid, name, employerCode, cin, role }),
  });
}

export async function localApiSetReservationsOpen(reservationsOpen) {
  return request("/api/reservations/open-state", {
    method: "POST",
    body: JSON.stringify({ reservationsOpen }),
  });
}
