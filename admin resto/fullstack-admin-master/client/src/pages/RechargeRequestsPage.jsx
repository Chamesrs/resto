import {
  CheckCircleOutline,
  ClearOutlined,
  SearchOutlined,
  VisibilityOutlined,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import ConfirmDialog from "components/ConfirmDialog";
import EmptyState from "components/EmptyState";
import ManualActionCard from "components/ManualActionCard";
import PageHeader from "components/PageHeader";
import StatCard from "components/StatCard";
import StatusBadge from "components/StatusBadge";
import { useEffect, useMemo, useState } from "react";
import { adminCapabilities } from "services/adminCapabilitiesService";
import {
  approveRechargeRequest as approveRechargeWithFunctions,
  rejectRechargeRequest as rejectRechargeWithFunctions,
} from "services/adminFunctionsService";
import { buildRechargeProcessingCommand } from "services/adminScriptService";
import { mapFirebaseError } from "services/firebaseErrorService";
import {
  getLocalAdminHealth,
  localApiProcessRecharge,
} from "services/localAdminApiService";
import { subscribeRechargeRequests } from "services/rechargeService";

const STATUS_OPTIONS = [
  { label: "Tous", value: "all" },
  { label: "En attente", value: "pending" },
  { label: "Approuvees", value: "approved" },
  { label: "Rejetees", value: "rejected" },
];

const RechargeRequestsPage = () => {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("all");
  const [userSearch, setUserSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [feedback, setFeedback] = useState({ message: "", severity: "success" });
  const [selectedItem, setSelectedItem] = useState(null);
  const [actionTarget, setActionTarget] = useState(null);
  const [actionType, setActionType] = useState("approve");
  const [adminNote, setAdminNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [backendState, setBackendState] = useState({
    loading: adminCapabilities.localApiEnabled,
    connected: false,
    error: "",
  });

  useEffect(() => {
    setLoading(true);

    const unsubscribe = subscribeRechargeRequests(
      { status, userSearch, dateFrom, dateTo },
      (nextItems) => {
        setItems(nextItems);
        setLoading(false);
      },
      (error) => {
        setFeedback({
          message: mapFirebaseError(
            error,
            "Impossible de charger les demandes de recharge."
          ),
          severity: "error",
        });
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [dateFrom, dateTo, status, userSearch]);

  useEffect(() => {
    let active = true;

    if (!adminCapabilities.localApiEnabled) {
      setBackendState({ loading: false, connected: false, error: "" });
      return () => {
        active = false;
      };
    }

    getLocalAdminHealth().then((result) => {
      if (!active) return;
      setBackendState({
        loading: false,
        connected: result.connected,
        error: result.error || "",
      });
    });

    return () => {
      active = false;
    };
  }, []);

  const summary = useMemo(
    () => ({
      pending: items.filter((item) => item.status === "pending").length,
      approved: items.filter((item) => item.status === "approved").length,
      rejected: items.filter((item) => item.status === "rejected").length,
      totalAmount: items.reduce(
        (total, item) => total + Number(item.amount || 0),
        0
      ),
    }),
    [items]
  );

  const manualFallbackNeeded =
    adminCapabilities.manualMode ||
    (adminCapabilities.localApiEnabled && !backendState.connected);

  const handleOpenAction = (item, action) => {
    setActionTarget(item);
    setActionType(action);
    setAdminNote("");
  };

  const handleProcess = async () => {
    if (!actionTarget) return;

    if (manualFallbackNeeded) {
      setSelectedItem(actionTarget);
      setActionTarget(null);
      return;
    }

    setSubmitting(true);
    setFeedback({ message: "", severity: "success" });

    try {
      let result;

      if (adminCapabilities.localApiEnabled) {
        result = await localApiProcessRecharge({
          requestId: actionTarget.id,
          action: actionType,
          adminNote,
        });
      } else if (actionType === "approve") {
        result = await approveRechargeWithFunctions({
          requestId: actionTarget.id,
          adminNote,
        });
      } else {
        result = await rejectRechargeWithFunctions({
          requestId: actionTarget.id,
          adminNote,
        });
      }

      setFeedback({
        message:
          actionType === "approve"
            ? `Recharge approuvee${
                result?.balanceAfter != null
                  ? `, nouveau solde ${Number(result.balanceAfter).toFixed(2)} TND.`
                  : "."
              }`
            : "Recharge rejetee.",
        severity: "success",
      });
      setActionTarget(null);
      setSelectedItem(null);
    } catch (error) {
      setFeedback({
        message: mapFirebaseError(error, "Traitement impossible."),
        severity: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      field: "userName",
      headerName: "Utilisateur",
      minWidth: 220,
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
    {
      field: "amount",
      headerName: "Montant",
      minWidth: 120,
      flex: 0.6,
      renderCell: ({ value }) => `${Number(value || 0).toFixed(2)} TND`,
    },
    {
      field: "status",
      headerName: "Statut",
      minWidth: 130,
      flex: 0.7,
      renderCell: ({ value }) => <StatusBadge status={value} />,
    },
    {
      field: "createdAt",
      headerName: "Date",
      minWidth: 130,
      flex: 0.8,
      renderCell: ({ value }) => String(value || "").slice(0, 10) || "-",
    },
    {
      field: "actions",
      headerName: "Actions",
      sortable: false,
      minWidth: 280,
      flex: 1.1,
      renderCell: ({ row }) => (
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap py={1}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<VisibilityOutlined />}
            onClick={() => setSelectedItem(row)}
          >
            Details
          </Button>
          <Button
            size="small"
            variant="contained"
            color="success"
            disabled={row.status !== "pending"}
            startIcon={<CheckCircleOutline />}
            onClick={() => handleOpenAction(row, "approve")}
          >
            Approuver
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="error"
            disabled={row.status !== "pending"}
            startIcon={<ClearOutlined />}
            onClick={() => handleOpenAction(row, "reject")}
          >
            Rejeter
          </Button>
        </Stack>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Demandes de recharge"
        subtitle="Lecture, verification et traitement des demandes de recharge."
        statusLabel={manualFallbackNeeded ? "" : "Actions admin disponibles"}
      />

      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={6} xl={3}>
          <StatCard title="En attente" value={summary.pending} caption="A traiter" tone="warning" />
        </Grid>
        <Grid item xs={12} sm={6} xl={3}>
          <StatCard title="Approuvees" value={summary.approved} caption="Demandes validees" tone="success" />
        </Grid>
        <Grid item xs={12} sm={6} xl={3}>
          <StatCard title="Rejetees" value={summary.rejected} caption="Demandes cloturees" tone="danger" />
        </Grid>
        <Grid item xs={12} sm={6} xl={3}>
          <StatCard
            title="Montant total"
            value={`${summary.totalAmount.toFixed(2)} TND`}
            caption="Periode visible"
            tone="info"
          />
        </Grid>
      </Grid>

      {feedback.message ? (
        <Alert severity={feedback.severity} sx={{ mb: 2 }}>
          {feedback.message}
        </Alert>
      ) : null}

      <Card sx={{ border: 1, borderColor: "divider" }}>
        <CardContent sx={{ p: 2.5 }}>
          <Stack direction={{ xs: "column", lg: "row" }} spacing={2} mb={2.5}>
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
              label="Du"
              type="date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Au"
              type="date"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Stack>

          {manualFallbackNeeded ? (
            <Alert severity="info" sx={{ mb: 2 }}>
              Les actions sensibles restent disponibles depuis la fiche d'une demande si le service local n'est pas accessible.
            </Alert>
          ) : null}

          {!loading && !items.length ? (
            <EmptyState
              title="Aucune demande de recharge"
              description="Aucune demande ne correspond aux filtres en cours."
              icon={<VisibilityOutlined />}
            />
          ) : (
            <Box
              sx={{
                height: "68vh",
                "& .MuiDataGrid-root": { border: 0 },
                "& .MuiDataGrid-columnHeaders": {
                  backgroundColor: "action.hover",
                  borderBottom: 0,
                },
                "& .MuiDataGrid-cell": {
                  borderColor: "divider",
                  alignItems: "center",
                },
              }}
            >
              <DataGrid
                rows={items}
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

      <Dialog
        open={Boolean(selectedItem)}
        onClose={() => setSelectedItem(null)}
        fullWidth
        maxWidth="md"
        PaperProps={{ sx: { borderRadius: "1.25rem" } }}
      >
        <DialogTitle>Detail de la demande</DialogTitle>
        <DialogContent dividers>
          {selectedItem ? (
            <Stack spacing={2.5}>
              <Stack
                direction={{ xs: "column", md: "row" }}
                justifyContent="space-between"
                spacing={2}
              >
                <Box>
                  <Typography variant="h4">{selectedItem.userName || "Utilisateur"}</Typography>
                  <Typography color="text.secondary">{selectedItem.userEmail || "Email non renseigne"}</Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                  <StatusBadge status={selectedItem.status} />
                </Stack>
              </Stack>

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Stack spacing={1}>
                        <Typography variant="subtitle2" color="text.secondary">Montant</Typography>
                        <Typography>{Number(selectedItem.amount || 0).toFixed(2)} TND</Typography>
                        <Typography variant="subtitle2" color="text.secondary">Date</Typography>
                        <Typography>{String(selectedItem.createdAt || "").slice(0, 19) || "-"}</Typography>
                        <Typography variant="subtitle2" color="text.secondary">UID</Typography>
                        <Typography sx={{ wordBreak: "break-word" }}>{selectedItem.userId || "-"}</Typography>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Stack spacing={1}>
                        <Typography variant="subtitle2" color="text.secondary">Note utilisateur</Typography>
                        <Typography>{selectedItem.note || "Aucune note"}</Typography>
                        <Typography variant="subtitle2" color="text.secondary">Note admin</Typography>
                        <Typography>{selectedItem.adminNote || "Aucune note"}</Typography>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {manualFallbackNeeded ? (
                <Stack spacing={2}>
                  <Alert severity="warning">
                    {backendState.error || "Le service admin local est indisponible. Utilisez la procedure locale pour traiter cette demande."}
                  </Alert>
                  <ManualActionCard
                    title="Approuver la recharge"
                    description="Validez la demande et creditez le solde via le backend Admin SDK local."
                    command={buildRechargeProcessingCommand(selectedItem.id, "approve")}
                  />
                  <ManualActionCard
                    title="Rejeter la recharge"
                    description="Cloturez la demande sans mouvement de solde."
                    command={buildRechargeProcessingCommand(selectedItem.id, "reject")}
                  />
                </Stack>
              ) : null}
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedItem(null)}>Fermer</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={Boolean(actionTarget)}
        title={actionType === "approve" ? "Approuver la recharge" : "Rejeter la recharge"}
        content={
          actionTarget
            ? `${actionType === "approve" ? "Confirmer l'approbation" : "Confirmer le rejet"} de la demande de ${Number(actionTarget.amount || 0).toFixed(2)} TND pour ${actionTarget.userName || "cet utilisateur"} ?`
            : ""
        }
        confirmLabel={actionType === "approve" ? "Approuver" : "Rejeter"}
        confirmColor={actionType === "approve" ? "success" : "error"}
        confirmDisabled={submitting}
        onClose={() => setActionTarget(null)}
        onConfirm={handleProcess}
      />
    </Box>
  );
};

export default RechargeRequestsPage;
