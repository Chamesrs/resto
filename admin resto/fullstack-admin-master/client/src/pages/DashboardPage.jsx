import {
  AdminPanelSettingsOutlined,
  CreditScoreOutlined,
  GroupOutlined,
  LocalDiningOutlined,
  PendingActionsOutlined,
  PointOfSaleOutlined,
  TodayOutlined,
} from "@mui/icons-material";
import {
  Box,
  Card,
  CardContent,
  Grid,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";
import AdminRechargeWorkspace from "components/AdminRechargeWorkspace";
import EmptyState from "components/EmptyState";
import ErrorMessage from "components/ErrorMessage";
import LoadingCardSkeleton from "components/LoadingCardSkeleton";
import PageHeader from "components/PageHeader";
import StatCard from "components/StatCard";
import StatusBadge from "components/StatusBadge";
import useAuth from "hooks/useAuth";
import { useEffect, useMemo, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { normalizeRole } from "lib/accessControl";
import { subscribeDashboardMetrics } from "services/dashboardService";
import { mapFirebaseError } from "services/firebaseErrorService";

function formatCurrency(value) {
  return `${Number(value || 0).toFixed(2)} TND`;
}

const DashboardPage = () => {
  const { claims, profile } = useAuth();
  const role = normalizeRole(claims?.role || profile?.role);
  const isSuperAdmin = role === "super_admin";
  const isAdmin = role === "admin";
  const isChef = role === "chef";
  const [state, setState] = useState({
    loading: true,
    error: "",
    metrics: null,
  });

  useEffect(() => {
    let active = true;

    const unsubscribe = subscribeDashboardMetrics(
      (metrics) => {
        if (!active) return;
        setState({ loading: false, error: "", metrics });
      },
      (error) => {
        if (!active) return;
        setState({
          loading: false,
          error: mapFirebaseError(
            error,
            "Impossible de charger le tableau de bord."
          ),
          metrics: null,
        });
      }
    );

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const pageTitle = isChef
    ? "Dashboard cuisine"
    : isSuperAdmin
    ? "Dashboard global"
    : "Dashboard admin";
  const pageSubtitle = isChef
    ? "Suivi des réservations, de l'activité du jour et des repas servis depuis le poste cuisine."
    : "Vue claire des employés, des recharges et des réservations du jour avec un poste de chargement intégré.";

  const quickLinks = useMemo(() => {
    if (isChef) {
      return [
        { label: "Réservations", helper: "Suivi du jour", to: "/reservations" },
        { label: "Menus", helper: "Carte et disponibilités", to: "/meals" },
      ];
    }

    return [
      { label: "Employés", helper: "Comptes et validations", to: "/users" },
      { label: "Recharge", helper: "Guichet de chargement", to: "/payments" },
      { label: "Réservations", helper: "Suivi de service", to: "/reservations" },
      { label: "Menus", helper: "Repas et disponibilités", to: "/meals" },
      ...(isSuperAdmin
        ? [{ label: "Logs", helper: "Actions sensibles", to: "/logs" }]
        : []),
    ];
  }, [isChef, isSuperAdmin]);

  if (state.loading) {
    return (
      <Box>
        <PageHeader title={pageTitle} subtitle={pageSubtitle} />
        <Grid container spacing={2}>
          {Array.from({ length: 6 }).map((_, index) => (
            <Grid key={index} item xs={12} sm={6} xl={4}>
              <LoadingCardSkeleton />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  if (state.error) {
    return <ErrorMessage title="Dashboard indisponible" message={state.error} />;
  }

  const { metrics } = state;
  const recentOperations = (metrics.balanceTransactions || []).slice(0, 6);
  const recentLogs = (metrics.activityLogs || []).slice(0, 5);
  const pendingUsers = (metrics.users || [])
    .filter((user) => !user.approved)
    .slice(0, 5);

  const highlightStats = [
    {
      title: "Employes",
      value: metrics.totalEmployers,
      caption: "Comptes employes visibles",
      icon: <GroupOutlined />,
      tone: "info",
    },
    {
      title: "Recharges aujourd'hui",
      value: metrics.todayBalanceTransactionsCount || 0,
      caption: "Opérations de guichet du jour",
      icon: <PointOfSaleOutlined />,
      tone: "success",
    },
    {
      title: "Montant charge",
      value: formatCurrency(metrics.todayBalanceTransactionsAmount || 0),
      caption: "Total des montants charges aujourd'hui",
      icon: <CreditScoreOutlined />,
      tone: "warning",
    },
    {
      title: "Reservations du jour",
      value: metrics.todayReservationsCount || 0,
      caption: "Demandes de service en cours",
      icon: <TodayOutlined />,
      tone: "info",
    },
  ];

  return (
    <Box>
      <PageHeader
        title={pageTitle}
        subtitle={pageSubtitle}
        statusLabel={isChef ? "Role chef" : isSuperAdmin ? "Super admin" : "Admin"}
      />

      <Grid container spacing={2.5}>
        {highlightStats.map((item) => (
          <Grid key={item.title} item xs={12} sm={6} xl={3}>
            <StatCard
              title={item.title}
              value={item.value}
              caption={item.caption}
              icon={item.icon}
              tone={item.tone}
            />
          </Grid>
        ))}

        {(isAdmin || isSuperAdmin) && (
          <Grid item xs={12} xl={3}>
            <StatCard
              title="Comptes en attente"
              value={metrics.pendingUsers}
              caption="Validations a traiter"
              icon={<PendingActionsOutlined />}
              tone="warning"
            />
          </Grid>
        )}

        {isSuperAdmin && (
          <Grid item xs={12} xl={3}>
            <StatCard
              title="Admins web"
              value={metrics.totalAdmins + metrics.totalSuperAdmins}
              caption="Admin et super_admin"
              icon={<AdminPanelSettingsOutlined />}
              tone="danger"
            />
          </Grid>
        )}

        {isChef && (
          <Grid item xs={12} xl={3}>
            <StatCard
              title="Repas actifs"
              value={metrics.activeMeals}
              caption="Menus visibles actuellement"
              icon={<LocalDiningOutlined />}
              tone="success"
            />
          </Grid>
        )}

        <Grid item xs={12} lg={7}>
          <Card
            sx={{
              border: 1,
              borderColor: "divider",
              height: "100%",
              background:
                "linear-gradient(135deg, rgba(201,128,69,0.12), rgba(255,255,255,0.96))",
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Stack spacing={2.5}>
                <Box>
                  <Typography variant="h4">
                    {isChef ? "Vue opérationnelle cuisine" : "Centre de pilotage admin"}
                  </Typography>
                  <Typography color="text.secondary" mt={0.75}>
                    {isChef
                      ? "Accès rapide aux modules utiles en cuisine et à la charge de réservations."
                      : "Accès rapide au guichet de recharge, aux réservations et au suivi des comptes."}
                  </Typography>
                </Box>

                <Grid container spacing={1.5}>
                  {quickLinks.map((item) => (
                    <Grid key={item.to} item xs={12} sm={6} md={isChef ? 6 : 4}>
                      <Card
                        component={RouterLink}
                        to={item.to}
                        sx={{
                          textDecoration: "none",
                          border: 1,
                          borderColor: "divider",
                          backgroundColor: "background.paper",
                        }}
                      >
                        <CardContent>
                          <Typography fontWeight={800} color="text.primary">
                            {item.label}
                          </Typography>
                          <Typography color="text.secondary" mt={0.5}>
                            {item.helper}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>

                {!isChef && (
                  <Stack spacing={1.25}>
                    <Typography variant="h5">Opérations récentes</Typography>
                    {!recentOperations.length ? (
                      <EmptyState
                        title="Aucune opération récente"
                        description="Les recharges employés apparaîtront ici."
                      />
                    ) : (
                      <List disablePadding>
                        {recentOperations.map((item) => (
                          <ListItem
                            key={item.id}
                            disableGutters
                            sx={{
                              py: 1.25,
                              borderBottom: "1px solid",
                              borderColor: "divider",
                            }}
                          >
                            <ListItemText
                              primary={
                                item.userName ||
                                item.userEmail ||
                                item.userId ||
                                "Employe"
                              }
                              secondary={`${formatCurrency(item.amount)} • ${
                                item.note || item.type || "Recharge"
                              }`}
                              primaryTypographyProps={{ fontWeight: 700 }}
                              secondaryTypographyProps={{ color: "text.secondary" }}
                            />
                            <StatusBadge status={item.type || "credit"} />
                          </ListItem>
                        ))}
                      </List>
                    )}
                  </Stack>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={5}>
          <Card sx={{ border: 1, borderColor: "divider", height: "100%" }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h4">
                {isChef ? "Surveillance service" : "Suivi prioritaire"}
              </Typography>
              <Typography color="text.secondary" mt={0.75} mb={2.5}>
                {isChef
                  ? "Reservations et repas a surveiller pendant le service."
                  : "Elements a traiter en priorite par l'administration."}
              </Typography>

              {isChef ? (
                <Stack spacing={2}>
                  <StatCard
                    title="Reservations semaine"
                    value={metrics.weeklyReservationsCount}
                    caption={`Semaine du ${metrics.currentWeekStart}`}
                    tone="success"
                  />
                  <StatCard
                    title="Catalogue repas"
                    value={metrics.totalMeals}
                    caption="Nombre de repas references"
                    tone="info"
                  />
                </Stack>
              ) : !pendingUsers.length ? (
                <EmptyState
                  title="Aucun compte en attente"
                  description="Les validations employees a traiter apparaitront ici."
                />
              ) : (
                <List disablePadding>
                  {pendingUsers.map((user) => (
                    <ListItem
                      key={user.id}
                      disableGutters
                      sx={{
                        py: 1.25,
                        borderBottom: "1px solid",
                        borderColor: "divider",
                      }}
                    >
                      <ListItemText
                        primary={user.name || "Sans nom"}
                        secondary={user.email || user.employerCode || user.id}
                        primaryTypographyProps={{ fontWeight: 700 }}
                        secondaryTypographyProps={{ color: "text.secondary" }}
                      />
                      <StatusBadge status="pending" />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {(isAdmin || isSuperAdmin) && (
          <Grid item xs={12}>
            <AdminRechargeWorkspace
              title="Chargement des comptes employes"
              subtitle="Recherchez un employe par nom, email, matricule, CIN ou code employe, puis rechargez son compte depuis le dashboard."
              compact
            />
          </Grid>
        )}

        {isSuperAdmin && (
          <Grid item xs={12}>
            <Card sx={{ border: 1, borderColor: "divider" }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h4">Historique administratif recent</Typography>
                <Typography color="text.secondary" mt={0.75} mb={2.5}>
                  Dernieres actions sensibles journalisees sur le panel web.
                </Typography>
                {!recentLogs.length ? (
                  <EmptyState
                    title="Aucun log recent"
                    description="Les actions journalisees apparaitront ici."
                  />
                ) : (
                  <List disablePadding>
                    {recentLogs.map((log) => (
                      <ListItem
                        key={log.id}
                        disableGutters
                        sx={{
                          py: 1.25,
                          borderBottom: "1px solid",
                          borderColor: "divider",
                        }}
                      >
                        <ListItemText
                          primary={log.description || log.action || "Action"}
                          secondary={`${log.actorRole || "system"} • ${
                            log.targetType || "n/a"
                          }`}
                          primaryTypographyProps={{ fontWeight: 700 }}
                          secondaryTypographyProps={{ color: "text.secondary" }}
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default DashboardPage;
