import {
  CancelOutlined,
  CheckCircleOutline,
  LocalDiningOutlined,
  SearchOutlined,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import EmptyState from "components/EmptyState";
import ErrorMessage from "components/ErrorMessage";
import PageHeader from "components/PageHeader";
import StatCard from "components/StatCard";
import StatusBadge from "components/StatusBadge";
import useAuth from "hooks/useAuth";
import { RESERVATION_STATUS } from "lib/reservationStatus";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { adminCapabilities } from "services/adminCapabilitiesService";
import { adminUpdateReservationStatus } from "services/adminFunctionsService";
import {
  setReservationsOpen,
  subscribeReservationConfig,
} from "services/appSettingsService";
import {
  FUNCTIONS_REQUIRED_MESSAGE,
  mapFirebaseError,
} from "services/firebaseErrorService";
import { subscribeReservations } from "services/reservationService";

const STATUS_OPTIONS = [
  { label: "Tous", value: "all" },
  { label: "Reserve", value: RESERVATION_STATUS.RESERVED },
  { label: "Prepare", value: RESERVATION_STATUS.PREPARED },
  { label: "Servi", value: RESERVATION_STATUS.SERVED },
  { label: "Annule", value: RESERVATION_STATUS.CANCELLED },
];

const ReservationsPage = () => {
  const { claims, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("all");
  const [weekStart, setWeekStart] = useState("");
  const [day, setDay] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [error, setError] = useState("");
  const [actionState, setActionState] = useState({ id: "", status: "" });
  const [reservationConfig, setReservationConfig] = useState({
    reservationsOpen: false,
  });
  const [configLoading, setConfigLoading] = useState(true);
  const isSuperAdminActor = claims?.superAdmin || profile?.role === "super_admin";
  const deferredUserSearch = useDeferredValue(userSearch);
  const liveFilters = useMemo(
    () => ({
      status,
      weekStart,
    }),
    [status, weekStart]
  );

  useEffect(() => {
    setLoading(true);
    setError("");

    const unsubscribe = subscribeReservations(
      liveFilters,
      (nextItems) => {
        setItems(nextItems);
        setLoading(false);
      },
      (loadError) => {
        setError(
          mapFirebaseError(loadError, "Impossible de charger les reservations.")
        );
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [liveFilters]);

  useEffect(() => {
    const unsubscribe = subscribeReservationConfig(
      (config) => {
        setReservationConfig(config);
        setConfigLoading(false);
      },
      (loadError) => {
        setError(
          mapFirebaseError(loadError, "Impossible de charger la configuration des reservations.")
        );
        setConfigLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  const handleStatusUpdate = async (row, nextStatus) => {
    if (!adminCapabilities.adminFunctionsEnabled) {
      return;
    }

    const previousItems = items;
    setActionState({ id: row.id, status: nextStatus });
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === row.id
          ? {
              ...item,
              status: nextStatus,
            }
          : item
      )
    );

    try {
      await adminUpdateReservationStatus({
        reservationId: row.id,
        status: nextStatus,
        reason:
          nextStatus === RESERVATION_STATUS.CANCELLED
            ? "Cancelled by admin"
            : "",
      });
    } catch (actionError) {
      setItems(previousItems);
      setError(
        mapFirebaseError(
          actionError,
          "Mise a jour du statut de reservation impossible."
        )
      );
    } finally {
      setActionState({ id: "", status: "" });
    }
  };

  const handleToggleReservations = async (nextValue) => {
    setActionState({ id: "reservation_config", status: nextValue ? "open" : "closed" });
    try {
      await setReservationsOpen(nextValue);
    } catch (configError) {
      setError(
        mapFirebaseError(
          configError,
          "Mise a jour de l'ouverture des reservations impossible."
        )
      );
    } finally {
      setActionState({ id: "", status: "" });
    }
  };

  const getAvailableActions = (statusValue) => {
    switch (statusValue) {
      case RESERVATION_STATUS.RESERVED:
        return [
          {
            key: RESERVATION_STATUS.PREPARED,
            label: "Preparer",
            icon: <LocalDiningOutlined />,
            color: "secondary",
            variant: "outlined",
          },
          {
            key: RESERVATION_STATUS.SERVED,
            label: "Servir",
            icon: <CheckCircleOutline />,
            color: "success",
            variant: "contained",
          },
          {
            key: RESERVATION_STATUS.CANCELLED,
            label: "Annuler",
            icon: <CancelOutlined />,
            color: "error",
            variant: "outlined",
          },
        ];
      case RESERVATION_STATUS.PREPARED:
        return [
          {
            key: RESERVATION_STATUS.SERVED,
            label: "Servir",
            icon: <CheckCircleOutline />,
            color: "success",
            variant: "contained",
          },
          {
            key: RESERVATION_STATUS.CANCELLED,
            label: "Annuler",
            icon: <CancelOutlined />,
            color: "error",
            variant: "outlined",
          },
        ];
      default:
        return [];
    }
  };

  const visibleItems = useMemo(() => {
    const dayFilter = String(day || "").trim();
    const searchNeedle = String(deferredUserSearch || "").trim().toLowerCase();

    return items.filter((item) => {
      const dayMatches = !dayFilter || item.day === dayFilter;
      const searchMatches =
        !searchNeedle ||
        String(item.userName || "").toLowerCase().includes(searchNeedle) ||
        String(item.userEmail || "").toLowerCase().includes(searchNeedle);

      return dayMatches && searchMatches;
    });
  }, [day, deferredUserSearch, items]);

  const summary = useMemo(() => {
    const weeklyCount = visibleItems.filter((item) =>
      weekStart ? item.weekStart === weekStart : true
    ).length;
    const topMealsMap = visibleItems.reduce((accumulator, item) => {
      const key = item.mealName || "Repas";
      accumulator[key] = (accumulator[key] || 0) + 1;
      return accumulator;
    }, {});

    return {
      total: visibleItems.length,
      weeklyCount,
      revenueEstimate: visibleItems.reduce(
        (total, item) => total + Number(item.priceSnapshot || 0),
        0
      ),
      topMeals: Object.entries(topMealsMap)
        .sort((left, right) => right[1] - left[1])
        .slice(0, 4),
    };
  }, [visibleItems, weekStart]);

  const columns = [
    {
      field: "userName",
      headerName: "Utilisateur",
      minWidth: 210,
      flex: 1.1,
      renderCell: ({ row }) => (
        <Stack spacing={0.3} py={1}>
          <Typography fontWeight={700}>{row.userName || "Utilisateur"}</Typography>
          <Typography variant="caption" color="text.secondary">
            {row.userEmail || "Email non renseigne"}
          </Typography>
        </Stack>
      ),
    },
    { field: "mealName", headerName: "Repas", minWidth: 180, flex: 1 },
    { field: "day", headerName: "Jour", minWidth: 120, flex: 0.7 },
    { field: "weekStart", headerName: "Semaine", minWidth: 120, flex: 0.7 },
    {
      field: "priceSnapshot",
      headerName: "Prix",
      minWidth: 110,
      flex: 0.6,
      renderCell: ({ value }) => `${Number(value || 0).toFixed(2)} TND`,
    },
    {
      field: "status",
      headerName: "Statut",
      minWidth: 120,
      flex: 0.7,
      renderCell: ({ value }) => <StatusBadge status={value} />,
    },
    {
      field: "actions",
      headerName: "Actions",
      sortable: false,
      minWidth: 320,
      flex: 1.4,
      renderCell: ({ row }) => {
        const actions = getAvailableActions(row.status);

        if (!actions.length || !isSuperAdminActor) {
          return (
            <Typography variant="caption" color="text.secondary">
              Lecture seule
            </Typography>
          );
        }

        return (
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap py={1}>
            {actions.map((action) => (
              <Button
                key={action.key}
                size="small"
                variant={action.variant}
                color={action.color}
                startIcon={action.icon}
                disabled={
                  !adminCapabilities.adminFunctionsEnabled ||
                  !isSuperAdminActor ||
                  actionState.id === row.id
                }
                onClick={() => handleStatusUpdate(row, action.key)}
              >
                {action.label}
              </Button>
            ))}
          </Stack>
        );
      },
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Reservations"
        subtitle="Lecture des reservations, suivi semaine et ouverture/fermeture des prises de commande."
      />

      <Alert severity={reservationConfig.reservationsOpen ? "success" : "warning"} sx={{ mb: 2 }}>
        Reservations employe {reservationConfig.reservationsOpen ? "ouvertes" : "fermees"}.
        <Button
          size="small"
          sx={{ ml: 2 }}
          disabled={configLoading || actionState.id === "reservation_config"}
          onClick={() => handleToggleReservations(!reservationConfig.reservationsOpen)}
        >
          {reservationConfig.reservationsOpen ? "Fermer" : "Ouvrir"}
        </Button>
      </Alert>

      {!adminCapabilities.adminFunctionsEnabled ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          La page reste en lecture seule dans ce mode. {FUNCTIONS_REQUIRED_MESSAGE}
        </Alert>
      ) : null}

      {error ? <ErrorMessage title="Reservations indisponibles" message={error} /> : null}

      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={6} xl={3}>
          <StatCard title="Reservations" value={summary.total} caption="Periode visible" />
        </Grid>
        <Grid item xs={12} sm={6} xl={3}>
          <StatCard title="Semaine" value={summary.weeklyCount} caption="Semaine filtree" tone="info" />
        </Grid>
        <Grid item xs={12} sm={6} xl={3}>
          <StatCard
            title="Montant estime"
            value={`${summary.revenueEstimate.toFixed(2)} TND`}
            caption="Total des prix enregistres"
            tone="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} xl={3}>
          <StatCard
            title="Plat le plus reserve"
            value={summary.topMeals[0]?.[0] || "-"}
            caption={
              summary.topMeals[0]
                ? `${summary.topMeals[0][1]} reservations`
                : "Pas encore de donnees"
            }
            tone="warning"
          />
        </Grid>
      </Grid>

      <Card sx={{ border: 1, borderColor: "divider", mb: 2.5 }}>
        <CardContent sx={{ p: 2.5 }}>
          <Stack direction={{ xs: "column", lg: "row" }} spacing={2}>
            <TextField
              fullWidth
              placeholder="Rechercher un utilisateur"
              value={userSearch}
              onChange={(event) => setUserSearch(event.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchOutlined fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              sx={{ minWidth: 180 }}
            >
              {STATUS_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Semaine"
              type="date"
              value={weekStart}
              onChange={(event) => setWeekStart(event.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Jour"
              type="date"
              value={day}
              onChange={(event) => setDay(event.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
        </CardContent>
      </Card>

      <Grid container spacing={2} mb={2.5}>
        <Grid item xs={12} lg={4}>
          <Card sx={{ border: 1, borderColor: "divider", height: "100%" }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="h4" mb={2}>
                Plats les plus reserves
              </Typography>
              {!summary.topMeals.length ? (
                <EmptyState
                  title="Aucune reservation"
                  description="Les plats les plus reserves apparaitront ici."
                />
              ) : (
                <Stack spacing={1.5}>
                  {summary.topMeals.map(([mealName, count]) => (
                    <Stack key={mealName} direction="row" justifyContent="space-between">
                      <Typography fontWeight={600}>{mealName}</Typography>
                      <Typography color="text.secondary">{count}</Typography>
                    </Stack>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} lg={8}>
          <Card sx={{ border: 1, borderColor: "divider" }}>
            <CardContent sx={{ p: 2.5 }}>
              {!loading && !visibleItems.length ? (
                <EmptyState
                  title="Aucune reservation"
                  description="Aucune reservation ne correspond aux filtres en cours."
                />
              ) : (
                <Box
                  sx={{
                    height: "60vh",
                    "& .MuiDataGrid-root": { border: 0 },
                    "& .MuiDataGrid-columnHeaders": {
                      backgroundColor: "action.hover",
                      borderBottom: 0,
                    },
                    "& .MuiDataGrid-cell": {
                      borderColor: "divider",
                      alignItems: "center",
                    },
                    "& .MuiDataGrid-row:hover": {
                      backgroundColor: "action.hover",
                    },
                  }}
                >
                  <DataGrid
                    rows={visibleItems}
                    columns={columns}
                    getRowId={(row) => row.id}
                    disableRowSelectionOnClick
                    loading={loading}
                    initialState={{
                      pagination: { paginationModel: { pageSize: 10 } },
                    }}
                    pageSizeOptions={[10, 25, 50]}
                  />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ReservationsPage;
