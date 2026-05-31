import {
  ChevronLeft,
  DashboardOutlined,
  HistoryOutlined,
  PaymentsOutlined,
  PeopleAltOutlined,
  RestaurantOutlined,
  ShoppingCartOutlined,
} from "@mui/icons-material";
import {
  Box,
  Chip,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  useTheme,
} from "@mui/material";
import BrandLogo from "components/BrandLogo";
import useAuth from "hooks/useAuth";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const Sidebar = ({
  drawerWidth,
  isSidebarOpen,
  setIsSidebarOpen,
  isNonMobile,
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { profile } = useAuth();
  const [activePath, setActivePath] = useState(pathname);
  const role = String(profile?.role || "").trim().toLowerCase();
  const isChef = role === "chef";
  const isSuperAdmin = role === "super_admin";
  const navItems = [
    { text: "Dashboard", path: "/dashboard", icon: <DashboardOutlined /> },
    ...(!isChef
      ? [
          { text: "Utilisateurs", path: "/users", icon: <PeopleAltOutlined /> },
          { text: "Paiement", path: "/payments", icon: <PaymentsOutlined /> },
        ]
      : []),
    { text: "Reservations", path: "/reservations", icon: <ShoppingCartOutlined /> },
    { text: "Menus", path: "/meals", icon: <RestaurantOutlined /> },
    ...(isSuperAdmin ? [{ text: "Logs", path: "/logs", icon: <HistoryOutlined /> }] : []),
  ];

  useEffect(() => {
    setActivePath(pathname);
  }, [pathname]);

  return (
    <Box component="nav">
      {isSidebarOpen && (
        <Drawer
          open={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          variant={isNonMobile ? "persistent" : "temporary"}
          anchor="left"
          sx={{
            width: drawerWidth,
            "& .MuiDrawer-paper": {
              color: theme.palette.text.primary,
              background:
                theme.palette.mode === "dark"
                  ? "linear-gradient(180deg, rgba(18,13,14,0.98) 0%, rgba(31,23,25,0.98) 52%, rgba(53,28,32,0.98) 100%)"
                  : "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(252,246,238,0.98) 58%, rgba(248,240,231,0.98) 100%)",
              boxSizing: "border-box",
              borderWidth: isNonMobile ? 0 : "1px",
              borderRight: `1px solid ${theme.palette.divider}`,
              width: drawerWidth,
              boxShadow:
                theme.palette.mode === "dark"
                  ? "28px 0 60px rgba(9, 7, 8, 0.42)"
                  : "20px 0 50px rgba(95, 68, 45, 0.10)",
            },
          }}
        >
          <Box width="100%">
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              m="1.5rem 1.5rem 1rem 1.5rem"
            >
              <BrandLogo compact />
              <IconButton onClick={() => setIsSidebarOpen(false)}>
                <ChevronLeft />
              </IconButton>
            </Box>
            <Divider
              sx={{
                borderColor:
                  theme.palette.mode === "dark"
                    ? "rgba(255,255,255,0.08)"
                    : theme.palette.divider,
              }}
            />

            <Box px={2} pt={2}>
              <Chip
                label={
                  isSuperAdmin
                    ? "Super Admin Web"
                    : isChef
                    ? "Chef Web"
                    : "Admin Web"
                }
                size="small"
                sx={{
                  bgcolor:
                    theme.palette.mode === "dark"
                      ? "rgba(255,255,255,0.08)"
                      : "rgba(166,31,45,0.08)",
                  color: theme.palette.text.primary,
                  border: `1px solid ${
                    theme.palette.mode === "dark"
                      ? "rgba(255,255,255,0.08)"
                      : "rgba(166,31,45,0.10)"
                  }`,
                }}
              />
            </Box>

            <List sx={{ pt: 2 }}>
              {navItems.map(({ text, path, icon }) => {
                const isActive = activePath === path;

                return (
                  <ListItem key={path} disablePadding>
                    <ListItemButton
                      onClick={() => {
                        navigate(path);
                        setActivePath(path);
                      }}
                      sx={{
                        mx: 1.5,
                        mb: 1,
                        borderRadius: "1rem",
                        background: isActive
                          ? theme.palette.mode === "dark"
                            ? "linear-gradient(90deg, rgba(166,31,45,0.24), rgba(255,255,255,0.06))"
                            : "linear-gradient(90deg, rgba(166,31,45,0.12), rgba(201,128,69,0.08))"
                          : "transparent",
                        color: theme.palette.text.primary,
                        border: isActive
                          ? `1px solid ${
                              theme.palette.mode === "dark"
                                ? "rgba(255,255,255,0.08)"
                                : "rgba(166,31,45,0.14)"
                            }`
                          : "1px solid transparent",
                        transition: "all 0.2s ease",
                        "&:hover": {
                          backgroundColor:
                            theme.palette.mode === "dark"
                              ? "rgba(255,255,255,0.05)"
                              : "rgba(15,23,42,0.04)",
                        },
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: 40,
                          color: isActive
                            ? theme.palette.secondary.main
                            : theme.palette.text.secondary,
                        }}
                      >
                        {icon}
                      </ListItemIcon>
                      <ListItemText primary={text} />
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
          </Box>

          <Box mt="auto" p="1.5rem">
            <Divider
              sx={{
                mb: 2,
                borderColor:
                  theme.palette.mode === "dark"
                    ? "rgba(255,255,255,0.08)"
                    : theme.palette.divider,
              }}
            />
            <Typography fontWeight="bold" color={theme.palette.text.primary}>
              {profile?.name || "Administrateur"}
            </Typography>
            <Typography
              variant="body2"
              color={
                theme.palette.mode === "dark"
                  ? "rgba(255,255,255,0.62)"
                  : "text.secondary"
              }
            >
              {profile?.email || "Session active"}
            </Typography>
            <Typography
              variant="caption"
              color={
                theme.palette.mode === "dark"
                  ? "rgba(255,255,255,0.5)"
                  : "text.secondary"
              }
            >
              {profile?.role === "super_admin"
                ? "Super admin"
                : profile?.role === "chef"
                ? "Chef"
                : profile?.role === "admin"
                ? "Admin"
                : "Acces web"}
            </Typography>
          </Box>
        </Drawer>
      )}
    </Box>
  );
};

export default Sidebar;
