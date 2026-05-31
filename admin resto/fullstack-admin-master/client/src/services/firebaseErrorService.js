const DEFAULT_FUNCTIONS_REQUIRED_MESSAGE =
  "Cette action n'est pas disponible depuis React en mode gratuit.";

function getErrorCode(error) {
  return String(error?.code || error?.customData?.code || "").toLowerCase();
}

export function isFunctionsUnavailableError(error) {
  const code = getErrorCode(error);

  return [
    "functions/not-found",
    "functions/unavailable",
    "functions/internal",
    "functions/deadline-exceeded",
    "functions/disabled-by-config",
  ].includes(code);
}

export function createFunctionsDisabledError(
  message = DEFAULT_FUNCTIONS_REQUIRED_MESSAGE
) {
  const error = new Error(message);
  error.code = "functions/disabled-by-config";
  return error;
}

export function mapFirebaseError(error, fallbackMessage) {
  const code = getErrorCode(error);
  const message = String(error?.message || "").toLowerCase();

  if (message.includes("failed to fetch")) {
    return "Impossible de joindre le service admin local. Verifiez qu'il est demarre.";
  }

  if (
    code === "permission-denied" ||
    code === "firestore/permission-denied" ||
    code === "functions/permission-denied"
  ) {
    return "Vous n'avez pas les droits necessaires pour cette action.";
  }

  if (isFunctionsUnavailableError(error)) {
    return DEFAULT_FUNCTIONS_REQUIRED_MESSAGE;
  }

  if (code === "functions/invalid-argument" || code === "invalid-argument") {
    return "Les donnees envoyees sont invalides pour cette action.";
  }

  if (code === "functions/not-found" || code === "not-found") {
    return "La ressource demandee est introuvable.";
  }

  if (code === "auth/invalid-credential" || code === "auth/wrong-password") {
    return "Email ou mot de passe invalide.";
  }

  if (code === "auth/too-many-requests") {
    return "Trop de tentatives de connexion. Reessayez plus tard.";
  }

  if (code === "auth/user-not-found") {
    return "Aucun compte ne correspond a ces identifiants.";
  }

  if (code === "auth/invalid-email") {
    return "L'adresse email est invalide.";
  }

  if (message.includes("token local manquant")) {
    return "Le service admin local n'est pas configure sur ce poste.";
  }

  if (code === "unavailable" || code === "firestore/unavailable") {
    return "Service Firebase temporairement indisponible. Reessayez plus tard.";
  }

  if (code === "failed-precondition") {
    return "Operation impossible dans l'etat actuel du projet Firebase.";
  }

  if (code === "aborted") {
    return "L'operation a ete interrompue. Rechargez la page et reessayez.";
  }

  return error?.message || fallbackMessage;
}

export const FUNCTIONS_REQUIRED_MESSAGE = DEFAULT_FUNCTIONS_REQUIRED_MESSAGE;
export const MANUAL_ADMIN_FALLBACK_MESSAGE =
  "Action sensible : utilisez le script Admin SDK local pour appliquer les claims ou traiter la demande.";
