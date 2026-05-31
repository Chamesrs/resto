import { CssBaseline, ThemeProvider } from "@mui/material";
import { createTheme } from "@mui/material/styles";
import { useMemo } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "components/ProtectedRoute";
import LoadingScreen from "components/LoadingScreen";
import AuthProvider from "context/AuthContext";
import AppLayout from "layout/AppLayout";
import DashboardPage from "pages/DashboardPage";
import LoginPage from "pages/LoginPage";
import LogsPage from "pages/LogsPage";
import MealsPage from "pages/MealsPage";
import NotFoundPage from "pages/NotFoundPage";
import PaymentsPage from "pages/PaymentsPage";
import ReservationsPage from "pages/ReservationsPage";
import UnauthorizedPage from "pages/UnauthorizedPage";
import UsersPage from "pages/UsersPage";
import { themeSettings } from "theme";

function App() {
  const mode = "light";
  const theme = useMemo(() => createTheme(themeSettings(mode)), [mode]);

  return (
    <div className="app">
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/unauthorized" element={<UnauthorizedPage />} />

              <Route
                element={
                  <ProtectedRoute
                    allowedRoles={["super_admin", "admin", "chef"]}
                    fallback={<LoadingScreen label="Vérification de la session..." />}
                  />
                }
              >
                <Route
                  element={
                    <AppLayout />
                  }
                >
                  <Route element={<ProtectedRoute allowedRoles={["super_admin", "admin", "chef"]} />}>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<DashboardPage />} />
                  </Route>
                  <Route element={<ProtectedRoute allowedRoles={["super_admin", "admin"]} />}>
                    <Route path="/users" element={<UsersPage />} />
                    <Route path="/payments" element={<PaymentsPage />} />
                  </Route>
                  <Route element={<ProtectedRoute allowedRoles={["super_admin", "admin", "chef"]} />}>
                    <Route path="/reservations" element={<ReservationsPage />} />
                    <Route path="/meals" element={<MealsPage />} />
                  </Route>
                  <Route element={<ProtectedRoute allowedRoles={["super_admin"]} />}>
                    <Route path="/logs" element={<LogsPage />} />
                  </Route>
                </Route>
              </Route>

              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
