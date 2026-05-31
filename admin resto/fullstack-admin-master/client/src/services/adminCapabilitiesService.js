import { API_BASE_URL } from "config/api";

const actionMode = String(
  process.env.REACT_APP_ADMIN_ACTION_MODE ||
    (String(process.env.REACT_APP_ENABLE_ADMIN_FUNCTIONS || "").toLowerCase() ===
    "true"
      ? "functions"
      : "local-api")
).toLowerCase();

const normalizedActionMode = ["local-api", "manual", "functions"].includes(
  actionMode
)
  ? actionMode
  : "manual";

export const adminCapabilities = {
  actionMode: normalizedActionMode,
  adminFunctionsEnabled: normalizedActionMode === "functions",
  localApiEnabled: normalizedActionMode === "local-api",
  manualMode: normalizedActionMode === "manual",
  localApiUrl: API_BASE_URL,
  localApiToken: process.env.REACT_APP_LOCAL_ADMIN_TOKEN || "",
  modeLabel: normalizedActionMode,
  sensitiveActionsMessage:
    normalizedActionMode === "functions"
      ? "Actions sensibles actives via Cloud Functions."
      : normalizedActionMode === "local-api"
      ? "Actions sensibles actives via backend local Admin SDK."
      : "Actions sensibles en mode manuel via scripts Admin SDK.",
};
