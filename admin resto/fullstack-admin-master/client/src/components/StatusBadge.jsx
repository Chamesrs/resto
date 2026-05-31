import { Chip } from "@mui/material";

const STATUS_CONFIG = {
  success: { label: "Actif", color: "success" },
  approved: { label: "Approuve", color: "success" },
  super_admin: { label: "Super admin", color: "error" },
  admin: { label: "Admin", color: "error" },
  employer: { label: "Employe", color: "info" },
  employee: { label: "Employe", color: "info" },
  chef: { label: "Chef", color: "secondary" },
  kitchen: { label: "Chef", color: "secondary" },
  client: { label: "Employe", color: "info" },
  user: { label: "Employe", color: "info" },
  pending: { label: "En attente", color: "warning" },
  warning: { label: "En attente", color: "warning" },
  rejected: { label: "Refuse", color: "error" },
  blocked: { label: "Bloque", color: "error" },
  cancelled: { label: "Annule", color: "default" },
  reserved: { label: "Reserve", color: "info" },
  prepared: { label: "Prepare", color: "secondary" },
  served: { label: "Servi", color: "success" },
  credit: { label: "Credit", color: "success" },
  debit: { label: "Debit", color: "warning" },
  recharge_approved: { label: "Recharge", color: "success" },
  inactive: { label: "Inactif", color: "default" },
  info: { label: "Info", color: "info" },
};

function normalizeStatus(status) {
  return String(status || "").trim().toLowerCase();
}

const StatusBadge = ({ status, label, size = "small", variant = "soft" }) => {
  const normalized = normalizeStatus(status);
  const config = STATUS_CONFIG[normalized] || {
    label: label || status || "Statut",
    color: "default",
  };

  return (
    <Chip
      size={size}
      label={label || config.label}
      color={config.color}
      variant={variant === "outlined" ? "outlined" : "filled"}
      sx={{
        fontWeight: 600,
        borderRadius: "999px",
      }}
    />
  );
};

export default StatusBadge;
