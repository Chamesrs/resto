const ADMIN_SDK_DIR =
  'C:\\Users\\chame\\restoration\\restauration\\backend\\admin-sdk';

function shellQuote(value) {
  const normalized = String(value ?? "").replace(/"/g, '\\"');
  return `"${normalized}"`;
}

function withAdminSdkDir(command) {
  return `cd "${ADMIN_SDK_DIR}"\n${command}`;
}

export function buildSetUserAccessCommand(uid, role, approved) {
  return withAdminSdkDir(
    `node set-user-access.js ${uid} ${role} ${approved ? "true" : "false"}`
  );
}

export function buildDeleteUserAccountCommand(uid) {
  return withAdminSdkDir(`node delete-user-account.js ${uid}`);
}

export function buildRechargeProcessingCommand(requestId, action, adminNote = "") {
  const trimmedNote = String(adminNote || "").trim();
  const noteArg = trimmedNote ? ` --note ${shellQuote(trimmedNote)}` : "";

  return withAdminSdkDir(
    `node process-recharge-request.js ${requestId} ${action}${noteArg}`
  );
}

export const ADMIN_SDK_DIR_PATH = ADMIN_SDK_DIR;
export const ADMIN_SDK_CLAIMS_MESSAGE =
  "Action sensible : utilisez le script Admin SDK local pour appliquer les claims.";
export const ADMIN_SDK_RECONNECT_MESSAGE =
  "Apres modification des claims, l'utilisateur doit se deconnecter puis se reconnecter.";
