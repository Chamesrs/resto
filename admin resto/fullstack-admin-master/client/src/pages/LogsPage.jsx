import { Box, Card, CardContent, Grid } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import EmptyState from "components/EmptyState";
import ErrorMessage from "components/ErrorMessage";
import PageHeader from "components/PageHeader";
import StatCard from "components/StatCard";
import useAuth from "hooks/useAuth";
import { useEffect, useMemo, useState } from "react";
import { mapFirebaseError } from "services/firebaseErrorService";
import { subscribeActivityLogs } from "services/activityLogService";

function formatDate(value) {
  if (!value) return "-";
  const date =
    typeof value?.toDate === "function" ? value.toDate() : new Date(value?._seconds ? value._seconds * 1000 : value);
  return Number.isNaN(date.getTime())
    ? "-"
    : new Intl.DateTimeFormat("fr-FR", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
}

const LogsPage = () => {
  const { profile } = useAuth();
  const [state, setState] = useState({
    loading: true,
    error: "",
    items: [],
  });

  useEffect(() => {
    let active = true;

    if (profile?.role !== "super_admin") {
      setState({
        loading: false,
        error: "Acces reserve au super admin.",
        items: [],
      });
      return () => {
        active = false;
      };
    }

    const unsubscribe = subscribeActivityLogs(
      (items) => {
        if (!active) return;
        setState({ loading: false, error: "", items });
      },
      (error) => {
        if (!active) return;
        setState({
          loading: false,
          error: error.message || mapFirebaseError(error, "Impossible de charger les logs d'activite."),
          items: [],
        });
      },
      100
    );

    return () => {
      active = false;
      unsubscribe();
    };
  }, [profile?.role]);

  const summary = useMemo(
    () => ({
      total: state.items.length,
      adminActions: state.items.filter((item) => String(item.actorRole || "").includes("admin")).length,
      chefActions: state.items.filter((item) => item.actorRole === "chef").length,
      employerActions: state.items.filter((item) => item.actorRole === "employer").length,
    }),
    [state.items]
  );

  const columns = [
    { field: "createdAt", headerName: "Date", minWidth: 180, flex: 0.9, renderCell: ({ row }) => formatDate(row.createdAt) },
    { field: "actorRole", headerName: "Role", minWidth: 120, flex: 0.7 },
    { field: "actorId", headerName: "Acteur", minWidth: 180, flex: 0.9 },
    { field: "action", headerName: "Action", minWidth: 180, flex: 0.9 },
    { field: "targetType", headerName: "Cible", minWidth: 120, flex: 0.7 },
    { field: "description", headerName: "Description", minWidth: 320, flex: 1.8 },
  ];

  return (
    <Box>
      <PageHeader title="Logs d'activite" subtitle="Journal global des actions admin, chef et employe." />

      {state.error ? <ErrorMessage title="Logs indisponibles" message={state.error} /> : null}

      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={6} xl={3}>
          <StatCard title="Total" value={summary.total} caption="Entrees chargees" />
        </Grid>
        <Grid item xs={12} sm={6} xl={3}>
          <StatCard title="Actions admin" value={summary.adminActions} caption="Admin et super admin" tone="danger" />
        </Grid>
        <Grid item xs={12} sm={6} xl={3}>
          <StatCard title="Actions chef" value={summary.chefActions} caption="Cuisine" tone="warning" />
        </Grid>
        <Grid item xs={12} sm={6} xl={3}>
          <StatCard title="Actions employe" value={summary.employerActions} caption="Reservations et annulations" tone="info" />
        </Grid>
      </Grid>

      <Card sx={{ border: 1, borderColor: "divider" }}>
        <CardContent sx={{ p: 2.5 }}>
          {!state.loading && !state.items.length ? (
            <EmptyState title="Aucun log" description="Les prochaines actions journalisees apparaitront ici." />
          ) : (
            <Box
              sx={{
                height: "68vh",
                "& .MuiDataGrid-root": { border: 0 },
                "& .MuiDataGrid-columnHeaders": {
                  backgroundColor: "action.hover",
                  borderBottom: 0,
                },
                "& .MuiDataGrid-row:hover": {
                  backgroundColor: "action.hover",
                },
              }}
            >
              <DataGrid
                rows={state.items}
                columns={columns}
                getRowId={(row) => row.id}
                loading={state.loading}
                disableRowSelectionOnClick
                initialState={{
                  pagination: { paginationModel: { pageSize: 20 } },
                }}
                pageSizeOptions={[20, 50, 100]}
              />
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default LogsPage;
