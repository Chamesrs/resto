const DEFAULT_LOCAL_ADMIN_API_BASE_URL = "http://127.0.0.1:5055";

function normalizeBaseUrl(rawValue) {
  const candidate = String(rawValue || DEFAULT_LOCAL_ADMIN_API_BASE_URL).trim();

  try {
    const parsed = new URL(candidate);
    if (!/^https?:$/.test(parsed.protocol)) {
      throw new Error("Unsupported protocol.");
    }

    if (!parsed.hostname || !parsed.port) {
      throw new Error("Host or port missing.");
    }

    parsed.pathname = "";
    parsed.search = "";
    parsed.hash = "";

    return parsed.toString().replace(/\/$/, "");
  } catch (error) {
    console.error("[local-admin-api] Invalid API base URL:", candidate, error);
    return DEFAULT_LOCAL_ADMIN_API_BASE_URL;
  }
}

function buildApiUrl(pathname) {
  const normalizedPath = String(pathname || "/").startsWith("/")
    ? String(pathname || "/")
    : `/${String(pathname || "")}`;

  try {
    return new URL(normalizedPath, `${API_BASE_URL}/`).toString();
  } catch (error) {
    console.error("[local-admin-api] Invalid API path:", pathname, error);
    return new URL("/", `${API_BASE_URL}/`).toString();
  }
}

export const API_BASE_URL = normalizeBaseUrl(
  process.env.REACT_APP_LOCAL_ADMIN_API_URL
);

export const apiConfig = {
  API_BASE_URL,
  buildApiUrl,
  defaultLocalAdminApiBaseUrl: DEFAULT_LOCAL_ADMIN_API_BASE_URL,
};

