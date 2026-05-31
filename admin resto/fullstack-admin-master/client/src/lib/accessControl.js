export function normalizeRole(role) {
  const value = String(role || "").trim().toLowerCase();

  switch (value) {
    case "super_admin":
    case "super-admin":
      return "super_admin";
    case "admin":
      return "admin";
    case "chef":
    case "kitchen":
    case "cuisine":
    case "cuisinier":
      return "chef";
    case "employer":
    case "employee":
    case "client":
    case "user":
    case "":
      return "employer";
    default:
      return value;
  }
}

export function resolveHomePath(role) {
  switch (normalizeRole(role)) {
    case "super_admin":
      return "/dashboard";
    case "admin":
      return "/dashboard";
    case "chef":
      return "/reservations";
    default:
      return "/unauthorized";
  }
}

export function hasAllowedRole(role, allowedRoles = []) {
  if (!allowedRoles.length) {
    return true;
  }

  const normalizedRole = normalizeRole(role);
  return allowedRoles.includes(normalizedRole);
}
