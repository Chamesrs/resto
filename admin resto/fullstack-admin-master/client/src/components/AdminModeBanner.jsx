import { Box, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { adminCapabilities } from "services/adminCapabilitiesService";
import { getLocalAdminHealth } from "services/localAdminApiService";

const AdminModeBanner = () => {
  const [localApiState, setLocalApiState] = useState({
    loading: adminCapabilities.localApiEnabled,
    connected: false,
    error: "",
  });
  const [isOnline, setIsOnline] = useState(window.navigator.onLine);

  useEffect(() => {
    let active = true;

    if (!adminCapabilities.localApiEnabled) {
      setLocalApiState({ loading: false, connected: false, error: "" });
      return () => {
        active = false;
      };
    }

    getLocalAdminHealth().then((result) => {
      if (!active) return;
      setLocalApiState({
        loading: false,
        connected: result.connected,
        error: result.error || "",
      });
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!adminCapabilities.manualMode && localApiState.connected && isOnline) {
    return null;
  }

  const message = !isOnline
    ? "Connexion hors ligne. Les donnees se resynchronisent automatiquement au retour du reseau."
    : adminCapabilities.manualMode
    ? "Certaines actions sensibles se font via validation locale."
    : adminCapabilities.localApiEnabled && !localApiState.connected
    ? "Service admin local indisponible pour le moment."
    : "";

  if (!message) {
    return null;
  }

  return (
    <Box px={{ xs: 2, md: 3 }} pt={1}>
      <Box
        sx={{
          px: 1.5,
          py: 0.75,
          borderRadius: "999px",
          display: "inline-flex",
          backgroundColor: "action.hover",
        }}
      >
        <Typography variant="caption" color="text.secondary">
          {message}
        </Typography>
      </Box>
    </Box>
  );
};

export default AdminModeBanner;
