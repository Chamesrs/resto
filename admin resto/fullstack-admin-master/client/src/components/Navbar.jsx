import { LogoutOutlined, Menu as MenuIcon } from "@mui/icons-material";
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Chip,
  IconButton,
  Toolbar,
  Typography,
  useTheme,
} from "@mui/material";
import BrandLogo from "components/BrandLogo";
import useAuth from "hooks/useAuth";
import { adminCapabilities } from "services/adminCapabilitiesService";
import { signOutUser } from "services/authService";

const Navbar = ({ isSidebarOpen, setIsSidebarOpen }) => {
  const theme = useTheme();
  const { profile, claims } = useAuth();

  const displayName = profile?.name || "Administrateur";
  const subtitle =
    claims?.role === "chef"
      ? "Coordination cuisine"
      : claims?.role === "admin"
      ? "Administration restauration"
      : claims?.role === "super_admin"
      ? "Supervision globale"
      : "Session active";
  const modeLabel = adminCapabilities.manualMode
    ? "Actions manuelles"
    : adminCapabilities.localApiEnabled
    ? "Actions admin"
    : "Cloud Functions";

  return (
    <AppBar
      sx={{
        position: "sticky",
        top: 0,
        background:
          theme.palette.mode === "dark"
            ? "rgba(18, 13, 14, 0.72)"
            : "rgba(255, 253, 250, 0.72)",
        boxShadow: "none",
        borderBottom: `1px solid ${theme.palette.divider}`,
        backdropFilter: "blur(14px)",
      }}
    >
      <Toolbar
        sx={{
          justifyContent: "space-between",
          gap: 2,
          flexWrap: { xs: "wrap", md: "nowrap" },
          py: 1,
        }}
      >
        <Box display="flex" alignItems="center" gap={1.5}>
          <IconButton onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            <MenuIcon />
          </IconButton>
          <Box sx={{ display: { xs: "block", md: "none" } }}>
            <BrandLogo compact showCaption={false} />
          </Box>
        </Box>

        <Box
          display="flex"
          alignItems="center"
          gap={1.5}
          flexWrap={{ xs: "wrap", md: "nowrap" }}
          justifyContent="flex-end"
        >
          <Box display="flex" alignItems="center" gap={1}>
            <Avatar
              sx={{
                bgcolor: theme.palette.primary.main,
                color: "#fffdf9",
                boxShadow: "0 10px 24px rgba(166,31,45,0.26)",
              }}
            >
              {displayName.slice(0, 2).toUpperCase()}
            </Avatar>
            <Box>
              <Typography fontWeight="bold" color="text.primary">
                {displayName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            </Box>
          </Box>

          <Button
            variant="outlined"
            color="secondary"
            startIcon={<LogoutOutlined />}
            onClick={signOutUser}
          >
            Déconnexion
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
