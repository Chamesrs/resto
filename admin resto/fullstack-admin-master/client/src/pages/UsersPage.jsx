import {
  AdminPanelSettingsOutlined,
  DeleteOutlineOutlined,
  EditOutlined,
  EngineeringOutlined,
  PaymentsOutlined,
  SearchOutlined,
  ShieldOutlined,
  VisibilityOutlined,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  InputAdornment,
  MenuItem,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import ConfirmDialog from "components/ConfirmDialog";
import EmptyState from "components/EmptyState";
import ErrorMessage from "components/ErrorMessage";
import PageHeader from "components/PageHeader";
import StatCard from "components/StatCard";
import StatusBadge from "components/StatusBadge";
import useAuth from "hooks/useAuth";
import { useEffect, useMemo, useState } from "react";
import { adminCapabilities } from "services/adminCapabilitiesService";
import { mapFirebaseError } from "services/firebaseErrorService";
import {
  getLocalAdminHealth,
  localApiAdjustUserBalance,
  localApiApproveUser,
  localApiDeleteUser,
  localApiFindEmployer,
  localApiRejectUser,
  localApiUpdateUserProfile,
  localApiUpdateUserRole,
} from "services/localAdminApiService";
import { subscribeUsers } from "services/userService";
import { subscribeEmployerTransactions } from "services/transactionService";

const FILTERS = [
  { label: "Tous", value: "all" },
  { label: "En attente", value: "pending" },
  { label: "Approuves", value: "approved" },
  { label: "Employes", value: "employer" },
  { label: "Chefs", value: "chef" },
  { label: "Admins", value: "admin" },
  { label: "Super admins", value: "super_admin" },
];

function getDisplayName(user) {
  return user?.name || user?.displayName || "Sans nom";
}

function getUserId(user) {
  return user?.uid || user?.id || "";
}

function formatCurrency(value) {
  return `${Number(value || 0).toFixed(2)} TND`;
}

function formatDateValue(value) {
  if (!value) return "Non renseignee";
  const date =
    typeof value?.toDate === "function" ? value.toDate() : new Date(value?._seconds ? value._seconds * 1000 : value);
  if (Number.isNaN(date.getTime())) return "Non renseignee";
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

const UsersPage = () => {
  const { claims, profile } = useAuth();
  const isSuperAdminActor = claims?.superAdmin || profile?.role === "super_admin";
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState({ message: "", severity: "success" });
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [lookupQuery, setLookupQuery] = useState("");
  const [lookupState, setLookupState] = useState({
    loading: false,
    error: "",
    items: [],
  });
  const [selectedUser, setSelectedUser] = useState(null);
  const [editUser, setEditUser] = useState(null);
  const [balanceUser, setBalanceUser] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [backendState, setBackendState] = useState({
    loading: adminCapabilities.localApiEnabled,
    connected: false,
    error: "",
  });
  const [editForm, setEditForm] = useState({
    name: "",
    cin: "",
    employerCode: "",
  });
  const [balanceForm, setBalanceForm] = useState({
    amount: "",
    adminNote: "",
  });
  const [transactionsState, setTransactionsState] = useState({
    loading: false,
    error: "",
    items: [],
    uid: "",
  });

  const actionModeReady = adminCapabilities.localApiEnabled && backendState.connected;

  useEffect(() => {
    const unsubscribe = subscribeUsers(
      (nextUsers) => {
        setUsers(nextUsers);
        setSelectedUser((current) => {
          const currentId = getUserId(current);
          return currentId ? nextUsers.find((user) => getUserId(user) === currentId) || current : current;
        });
        setBalanceUser((current) => {
          const currentId = getUserId(current);
          return currentId ? nextUsers.find((user) => getUserId(user) === currentId) || current : current;
        });
        setError("");
        setLoading(false);
      },
      (snapshotError) => {
        setError(mapFirebaseError(snapshotError, "Impossible de charger les utilisateurs."));
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  useEffect(() => {
    let active = true;

    if (!adminCapabilities.localApiEnabled) {
      setBackendState({
        loading: false,
        connected: false,
        error: "Le dashboard admin doit fonctionner en mode local-api.",
      });
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

  useEffect(() => {
    const uid = getUserId(selectedUser);
    if (!uid || selectedUser?.role !== "employer") {
      setTransactionsState({ loading: false, error: "", items: [], uid: "" });
      return;
    }

    let active = true;
    setTransactionsState((current) => ({
      ...current,
      loading: true,
      error: "",
      uid,
    }));

    const unsubscribe = subscribeEmployerTransactions(
      uid,
      (items) => {
        if (!active) return;
        setTransactionsState({ loading: false, error: "", items, uid });
      },
      (transactionError) => {
        if (!active) return;
        setTransactionsState({
          loading: false,
          error: transactionError.message || mapFirebaseError(transactionError, "Impossible de charger l'historique des transactions."),
          items: [],
          uid,
        });
      }
    );

    return () => {
      active = false;
      unsubscribe();
    };
  }, [selectedUser]);

  const visibleUsers = useMemo(() => {
    const scopedUsers = isSuperAdminActor
      ? users
      : users.filter((user) => String(user.role || "employer") === "employer");
    const needle = search.trim().toLowerCase();

    return scopedUsers.filter((user) => {
      const matchesSearch =
        !needle ||
        getDisplayName(user).toLowerCase().includes(needle) ||
        String(user.email || "").toLowerCase().includes(needle) ||
        String(user.cin || "").toLowerCase().includes(needle) ||
        String(user.employerCode || "").toLowerCase().includes(needle);

      if (!matchesSearch) return false;
      if (filter === "all") return true;
      if (filter === "pending") return !user.approved;
      if (filter === "approved") return user.approved;
      return String(user.role || "employer") === filter;
    });
  }, [filter, isSuperAdminActor, search, users]);

  const summary = useMemo(() => {
    const scopedUsers = isSuperAdminActor
      ? users
      : users.filter((user) => String(user.role || "employer") === "employer");

    return {
      total: scopedUsers.length,
      pending: scopedUsers.filter((user) => !user.approved).length,
      approved: scopedUsers.filter((user) => user.approved).length,
      employers: scopedUsers.filter((user) => user.role === "employer").length,
      chefs: scopedUsers.filter((user) => user.role === "chef").length,
      admins: scopedUsers.filter((user) => user.role === "admin").length,
      superAdmins: scopedUsers.filter((user) => user.role === "super_admin").length,
    };
  }, [isSuperAdminActor, users]);

  const closeFeedback = () => {
    setFeedback({ message: "", severity: "success" });
  };

  const openEditDialog = (user) => {
    setEditUser(user);
    setEditForm({
      name: getDisplayName(user),
      cin: String(user.cin || ""),
      employerCode: String(user.employerCode || ""),
    });
  };

  const openBalanceDialog = (user) => {
    setBalanceUser(user);
    setBalanceForm({
      amount: "",
      adminNote: `Recharge admin pour ${getDisplayName(user)}`,
    });
  };

  const handleEmployerLookup = async () => {
    const query = lookupQuery.trim();
    if (!query) {
      setLookupState({ loading: false, error: "Saisissez un CIN ou un code employe.", items: [] });
      return;
    }

    setLookupState({ loading: true, error: "", items: [] });
    try {
      const items = await localApiFindEmployer(query);
      setLookupState({ loading: false, error: "", items });
    } catch (lookupError) {
      setLookupState({
        loading: false,
        error: mapFirebaseError(lookupError, "Employe introuvable pour ce CIN ou ce code."),
        items: [],
      });
    }
  };

  const executeSensitiveAction = async () => {
    if (!confirmAction) return;

    const { user, type, role } = confirmAction;
    const uid = getUserId(user);
    setSubmitting(true);

    try {
      if (type === "delete") {
        await localApiDeleteUser(uid);
        setFeedback({
          message: `Le compte de ${getDisplayName(user)} a ete supprime.`,
          severity: "success",
        });
        setSelectedUser(null);
      } else if (type === "approve") {
        await localApiApproveUser(uid);
        setFeedback({
          message: `${getDisplayName(user)} a ete accepte comme employe.`,
          severity: "success",
        });
      } else if (type === "reject") {
        await localApiRejectUser(uid);
        setFeedback({
          message: `${getDisplayName(user)} a ete remis en attente.`,
          severity: "success",
        });
      } else {
        await localApiUpdateUserRole({ uid, role });
        setFeedback({
          message: `${getDisplayName(user)} a maintenant le role ${role}.`,
          severity: "success",
        });
      }

      setConfirmAction(null);
    } catch (actionError) {
      setFeedback({
        message: mapFirebaseError(actionError, "Action utilisateur impossible."),
        severity: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editUser) return;

    setSubmitting(true);
    try {
      await localApiUpdateUserProfile({
        uid: getUserId(editUser),
        name: editForm.name,
        cin: editForm.cin,
        employerCode: editForm.employerCode,
      });
      setFeedback({
        message: `Le profil de ${getDisplayName(editUser)} a ete mis a jour.`,
        severity: "success",
      });
      setEditUser(null);
    } catch (saveError) {
      setFeedback({
        message: mapFirebaseError(saveError, "Mise a jour impossible."),
        severity: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdjustBalance = async () => {
    if (!balanceUser) return;

    const amount = Number(balanceForm.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setFeedback({
        message: "Le montant a charger doit etre un nombre positif.",
        severity: "error",
      });
      return;
    }

    setSubmitting(true);
    try {
      await localApiAdjustUserBalance({
        uid: getUserId(balanceUser),
        amount,
        adminNote: balanceForm.adminNote,
      });
      setFeedback({
        message: `Le solde de ${getDisplayName(balanceUser)} a ete recharge.`,
        severity: "success",
      });
      setBalanceUser(null);
      if (selectedUser && getUserId(selectedUser) === getUserId(balanceUser)) {
        setSelectedUser({ ...selectedUser, balance: Number(selectedUser.balance || 0) + amount });
      }
    } catch (saveError) {
      setFeedback({
        message: mapFirebaseError(saveError, "Recharge impossible."),
        severity: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const columns = useMemo(() => {
    const baseColumns = [
      {
        field: "displayName",
        headerName: isSuperAdminActor ? "Utilisateur" : "Employe",
        flex: 1.2,
        minWidth: 220,
        renderCell: ({ row }) => (
          <Stack spacing={0.3} py={1}>
            <Typography fontWeight={700}>{getDisplayName(row)}</Typography>
            <Typography variant="caption" color="text.secondary">
              {row.email || "Email non renseigne"}
            </Typography>
          </Stack>
        ),
      },
      {
        field: "cin",
        headerName: "CIN",
        minWidth: 120,
        flex: 0.7,
        renderCell: ({ row }) => row.cin || "-",
      },
      {
        field: "employerCode",
        headerName: "Code employe",
        minWidth: 150,
        flex: 0.8,
        renderCell: ({ row }) => row.employerCode || "-",
      },
      {
        field: "approval",
        headerName: "Validation",
        minWidth: 130,
        flex: 0.7,
        renderCell: ({ row }) => <StatusBadge status={row.approved ? "approved" : "pending"} />,
      },
      {
        field: "balance",
        headerName: "Solde",
        minWidth: 120,
        flex: 0.7,
        renderCell: ({ row }) => formatCurrency(row.balance ?? 0),
      },
    ];

    if (isSuperAdminActor) {
      baseColumns.splice(1, 0, {
        field: "role",
        headerName: "Role",
        minWidth: 120,
        flex: 0.7,
        renderCell: ({ row }) => <StatusBadge status={row.role || "employer"} />,
      });
    }

    baseColumns.push({
      field: "actions",
      headerName: "Actions",
      sortable: false,
      minWidth: isSuperAdminActor ? 520 : 460,
      flex: 1.9,
      renderCell: ({ row }) => (
        <Stack spacing={1.1} py={1.1} width="100%">
          <Stack direction="row" spacing={0.9} flexWrap="wrap" useFlexGap>
            <Chip
              label="Actions principales"
              size="small"
              sx={{
                fontWeight: 700,
                bgcolor: "rgba(47,125,87,0.10)",
                color: "success.main",
                borderRadius: "999px",
              }}
            />
            <Button
              size="small"
              variant="outlined"
              color="success"
              onClick={() => setConfirmAction({ user: row, type: "approve", role: "" })}
              disabled={!actionModeReady || submitting || row.role !== "employer"}
              sx={{
                minWidth: 122,
                borderRadius: "0.9rem",
                justifyContent: "center",
                px: 1.5,
              }}
            >
              Accepter
            </Button>
            <Button
              size="small"
              variant="contained"
              startIcon={<PaymentsOutlined />}
              onClick={() => openBalanceDialog(row)}
              disabled={!actionModeReady || submitting || row.role !== "employer"}
              sx={{
                minWidth: 148,
                borderRadius: "0.9rem",
                justifyContent: "center",
                px: 1.5,
              }}
            >
              Charger compte
            </Button>
          </Stack>

          <Stack direction="row" spacing={0.9} flexWrap="wrap" useFlexGap>
            <Chip
              label="Actions secondaires"
              size="small"
              sx={{
                fontWeight: 700,
                bgcolor: "action.hover",
                color: "text.secondary",
                borderRadius: "999px",
              }}
            />
            <Button
              size="small"
              variant="outlined"
              startIcon={<VisibilityOutlined />}
              onClick={() => setSelectedUser(row)}
              sx={{
                minWidth: 108,
                borderRadius: "0.9rem",
                justifyContent: "center",
                px: 1.5,
              }}
            >
              Details
            </Button>
            <Button
              size="small"
              variant="outlined"
              startIcon={<EditOutlined />}
              onClick={() => openEditDialog(row)}
              disabled={!actionModeReady || submitting}
              sx={{
                minWidth: 112,
                borderRadius: "0.9rem",
                justifyContent: "center",
                px: 1.5,
              }}
            >
              Modifier
            </Button>
            <Button
              size="small"
              variant="outlined"
              color="error"
              startIcon={<DeleteOutlineOutlined />}
              onClick={() => setConfirmAction({ user: row, type: "delete", role: "" })}
              disabled={!actionModeReady || submitting || (!isSuperAdminActor && row.role !== "employer")}
              sx={{
                minWidth: 118,
                borderRadius: "0.9rem",
                justifyContent: "center",
                px: 1.5,
                color: "error.main",
                borderColor: "rgba(193,73,88,0.28)",
                bgcolor: "rgba(193,73,88,0.04)",
                "&:hover": {
                  borderColor: "error.main",
                  bgcolor: "rgba(193,73,88,0.08)",
                },
              }}
            >
              Supprimer
            </Button>
          </Stack>
        </Stack>
      ),
    });

    return baseColumns;
  }, [actionModeReady, isSuperAdminActor, submitting]);

  return (
    <Box>
      <PageHeader
        title={isSuperAdminActor ? "Utilisateurs" : "Employes et recharge"}
        subtitle={
          isSuperAdminActor
            ? "Vue complete des comptes, des validations et des roles web/mobile."
            : "Guichet admin: recherche employe par CIN/code, chargement de solde et gestion des comptes employe."
        }
        statusLabel={actionModeReady ? "Backend admin local connecte" : ""}
      />

      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={6} lg={4} xl={2}>
          <StatCard title="Total" value={summary.total} caption="Comptes visibles" />
        </Grid>
        <Grid item xs={12} sm={6} lg={4} xl={2}>
          <StatCard title="En attente" value={summary.pending} caption="A traiter" tone="warning" />
        </Grid>
        <Grid item xs={12} sm={6} lg={4} xl={2}>
          <StatCard title="Approuves" value={summary.approved} caption="Comptes actifs" tone="success" />
        </Grid>
        <Grid item xs={12} sm={6} lg={4} xl={2}>
          <StatCard title="Employes" value={summary.employers} caption="Guichet" tone="info" />
        </Grid>
        {isSuperAdminActor ? (
          <>
            <Grid item xs={12} sm={6} lg={4} xl={2}>
              <StatCard title="Chefs" value={summary.chefs} caption="APK cuisine" tone="warning" />
            </Grid>
            <Grid item xs={12} sm={6} lg={4} xl={2}>
              <StatCard title="Admins web" value={summary.admins + summary.superAdmins} caption="Web only" tone="danger" />
            </Grid>
          </>
        ) : null}
      </Grid>

      {error ? <ErrorMessage title="Utilisateurs indisponibles" message={error} /> : null}
      {!backendState.loading && !backendState.connected ? (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {backendState.error || "Le backend admin local doit etre demarre pour gerer les employes."}
        </Alert>
      ) : null}

      <Card sx={{ border: 1, borderColor: "divider", mb: 2.5 }}>
        <CardContent sx={{ p: 2.5 }}>
          <Stack direction={{ xs: "column", lg: "row" }} spacing={2} alignItems={{ lg: "flex-end" }}>
            <TextField
              fullWidth
              label="Recherche guichet"
              placeholder="Entrer CIN ou code employe"
              value={lookupQuery}
              onChange={(event) => setLookupQuery(event.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchOutlined fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
            <Button variant="contained" onClick={handleEmployerLookup} disabled={!actionModeReady || lookupState.loading}>
              Rechercher employe
            </Button>
          </Stack>

          {lookupState.error ? (
            <Alert severity="error" sx={{ mt: 2 }}>
              {lookupState.error}
            </Alert>
          ) : null}

          {lookupState.items.length ? (
            <Grid container spacing={2} mt={0.5}>
              {lookupState.items.map((user) => (
                <Grid item xs={12} md={6} key={getUserId(user)}>
                  <Card variant="outlined">
                    <CardContent>
                      <Stack spacing={1.2}>
                        <Typography variant="h4">{getDisplayName(user)}</Typography>
                        <Typography color="text.secondary">
                          CIN {user.cin || "-"} • Code {user.employerCode || "-"}
                        </Typography>
                        <Typography color="text.secondary">
                          Solde actuel: {formatCurrency(user.balance)}
                        </Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                          <Button variant="contained" onClick={() => openBalanceDialog(user)} disabled={!actionModeReady}>
                            Charger compte
                          </Button>
                          <Button variant="outlined" onClick={() => setSelectedUser(user)}>
                            Voir details
                          </Button>
                          <Button variant="outlined" onClick={() => openEditDialog(user)} disabled={!actionModeReady}>
                            Modifier
                          </Button>
                        </Stack>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : null}
        </CardContent>
      </Card>

      <Card sx={{ border: 1, borderColor: "divider" }}>
        <CardContent sx={{ p: 2.5 }}>
          <Stack direction={{ xs: "column", lg: "row" }} spacing={2} justifyContent="space-between" mb={2.5}>
            <TextField
              placeholder="Rechercher nom, email, CIN ou code employe"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchOutlined fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
            <TextField select value={filter} onChange={(event) => setFilter(event.target.value)} sx={{ minWidth: 180 }}>
              {FILTERS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Stack>

          {!loading && !visibleUsers.length ? (
            <EmptyState title="Aucun compte a afficher" description="Ajustez les filtres ou attendez de nouveaux comptes." />
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
                    "& .MuiDataGrid-cell[data-field='actions']": {
                      alignItems: "flex-start",
                      py: 0.5,
                    },
                    "& .MuiDataGrid-columnHeader[data-field='actions']": {
                      minWidth: isSuperAdminActor ? 520 : 460,
                    },
                  }}
                >
              <DataGrid
                rows={visibleUsers}
                columns={columns}
                getRowId={(row) => row.id}
                loading={loading}
                rowHeight={110}
                disableRowSelectionOnClick
                initialState={{
                  pagination: { paginationModel: { pageSize: 10 } },
                }}
                pageSizeOptions={[10, 25, 50]}
              />
            </Box>
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(selectedUser)} onClose={() => setSelectedUser(null)} fullWidth maxWidth="md">
        <DialogTitle>Fiche utilisateur</DialogTitle>
        <DialogContent dividers>
          {selectedUser ? (
            <Stack spacing={2.5}>
              <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
                <Box>
                  <Typography variant="h4">{getDisplayName(selectedUser)}</Typography>
                  <Typography color="text.secondary">{selectedUser.email || "Email non renseigne"}</Typography>
                </Box>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <StatusBadge status={selectedUser.role || "employer"} />
                  <StatusBadge status={selectedUser.approved ? "approved" : "pending"} />
                </Stack>
              </Stack>

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Stack spacing={1}>
                        <Typography variant="subtitle2" color="text.secondary">CIN</Typography>
                        <Typography>{selectedUser.cin || "Non renseigne"}</Typography>
                        <Typography variant="subtitle2" color="text.secondary">Code employe</Typography>
                        <Typography>{selectedUser.employerCode || "Non attribue"}</Typography>
                        <Typography variant="subtitle2" color="text.secondary">Solde</Typography>
                        <Typography>{formatCurrency(selectedUser.balance ?? 0)}</Typography>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Stack spacing={1}>
                        <Typography variant="subtitle2" color="text.secondary">Role courant</Typography>
                        <Typography>{selectedUser.role || "employer"}</Typography>
                        <Typography variant="subtitle2" color="text.secondary">Poste</Typography>
                        <Typography>{selectedUser.poste || "Non renseigne"}</Typography>
                        <Typography variant="subtitle2" color="text.secondary">Derniere mise a jour</Typography>
                        <Typography>{formatDateValue(selectedUser.updatedAt || selectedUser.createdAt)}</Typography>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {selectedUser.role === "employer" ? (
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h5" mb={1.5}>Historique transactions</Typography>
                    {transactionsState.error ? (
                      <Alert severity="error">{transactionsState.error}</Alert>
                    ) : transactionsState.loading ? (
                      <Typography color="text.secondary">Chargement des transactions...</Typography>
                    ) : !transactionsState.items.length ? (
                      <Typography color="text.secondary">Aucune transaction enregistree.</Typography>
                    ) : (
                      <Stack spacing={1}>
                        {transactionsState.items.map((item) => (
                          <Stack key={item.id} direction="row" justifyContent="space-between" spacing={2}>
                            <Box>
                              <Typography fontWeight={700}>
                                {item.type === "credit" ? "Credit" : "Debit"} {formatCurrency(item.amount)}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {item.note || item.source || "Transaction"}
                              </Typography>
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                              {formatDateValue(item.createdAt)}
                            </Typography>
                          </Stack>
                        ))}
                      </Stack>
                    )}
                  </CardContent>
                </Card>
              ) : null}

              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Button variant="contained" onClick={() => openBalanceDialog(selectedUser)} disabled={!actionModeReady || selectedUser.role !== "employer"}>
                  Charger compte
                </Button>
                <Button variant="outlined" startIcon={<EditOutlined />} onClick={() => openEditDialog(selectedUser)} disabled={!actionModeReady}>
                  Modifier
                </Button>
                <Button
                  variant="outlined"
                  color="success"
                  onClick={() => setConfirmAction({ user: selectedUser, type: "approve", role: "" })}
                  disabled={!actionModeReady || selectedUser.role !== "employer"}
                >
                  Accepter
                </Button>
                <Button
                  variant="outlined"
                  color="warning"
                  onClick={() => setConfirmAction({ user: selectedUser, type: "reject", role: "" })}
                  disabled={!actionModeReady || selectedUser.role !== "employer"}
                >
                  Remettre en attente
                </Button>
                {isSuperAdminActor ? (
                  <>
                    <Button variant="outlined" startIcon={<EngineeringOutlined />} onClick={() => setConfirmAction({ user: selectedUser, type: "role", role: "employer" })} disabled={!actionModeReady}>
                      Role employe
                    </Button>
                    <Button variant="outlined" startIcon={<EngineeringOutlined />} onClick={() => setConfirmAction({ user: selectedUser, type: "role", role: "chef" })} disabled={!actionModeReady}>
                      Role chef
                    </Button>
                    <Button variant="outlined" color="error" startIcon={<AdminPanelSettingsOutlined />} onClick={() => setConfirmAction({ user: selectedUser, type: "role", role: "admin" })} disabled={!actionModeReady}>
                      Role admin
                    </Button>
                    <Button variant="outlined" color="error" startIcon={<ShieldOutlined />} onClick={() => setConfirmAction({ user: selectedUser, type: "role", role: "super_admin" })} disabled={!actionModeReady}>
                      Super admin
                    </Button>
                  </>
                ) : null}
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteOutlineOutlined />}
                  onClick={() => setConfirmAction({ user: selectedUser, type: "delete", role: "" })}
                  disabled={!actionModeReady || (!isSuperAdminActor && selectedUser.role !== "employer")}
                >
                  Supprimer
                </Button>
              </Stack>
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedUser(null)}>Fermer</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(editUser)} onClose={() => setEditUser(null)} fullWidth maxWidth="sm">
        <DialogTitle>Modifier le profil</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} mt={1}>
            <TextField label="Nom" value={editForm.name} onChange={(event) => setEditForm((current) => ({ ...current, name: event.target.value }))} fullWidth />
            <TextField label="CIN" value={editForm.cin} onChange={(event) => setEditForm((current) => ({ ...current, cin: event.target.value }))} fullWidth />
            <TextField label="Code employe" value={editForm.employerCode} onChange={(event) => setEditForm((current) => ({ ...current, employerCode: event.target.value }))} fullWidth />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditUser(null)}>Annuler</Button>
          <Button variant="contained" onClick={handleSaveEdit} disabled={submitting || !actionModeReady}>
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(balanceUser)} onClose={() => setBalanceUser(null)} fullWidth maxWidth="sm">
        <DialogTitle>Paiement / Recharge solde</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} mt={1}>
            <Typography color="text.secondary">
              {balanceUser ? `Employe: ${getDisplayName(balanceUser)} • ${balanceUser.employerCode || "-"}` : ""}
            </Typography>
            <TextField
              label="Montant a charger"
              type="number"
              value={balanceForm.amount}
              onChange={(event) => setBalanceForm((current) => ({ ...current, amount: event.target.value }))}
              fullWidth
            />
            <TextField
              label="Note admin"
              value={balanceForm.adminNote}
              onChange={(event) => setBalanceForm((current) => ({ ...current, adminNote: event.target.value }))}
              multiline
              minRows={2}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBalanceUser(null)}>Annuler</Button>
          <Button variant="contained" onClick={handleAdjustBalance} disabled={submitting || !actionModeReady}>
            Charger compte
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={Boolean(confirmAction)}
        title="Confirmer l'action"
        content={
          confirmAction?.type === "delete"
            ? `Supprimer definitivement le compte de ${getDisplayName(confirmAction?.user || {})} ?`
            : confirmAction?.type === "approve"
            ? `Accepter ${getDisplayName(confirmAction?.user || {})} comme employe ?`
            : confirmAction?.type === "reject"
            ? `Remettre ${getDisplayName(confirmAction?.user || {})} en attente ?`
            : `Changer le role de ${getDisplayName(confirmAction?.user || {})} vers ${confirmAction?.role} ?`
        }
        confirmLabel={confirmAction?.type === "delete" ? "Supprimer" : "Confirmer"}
        confirmColor={confirmAction?.type === "delete" ? "error" : "primary"}
        confirmDisabled={submitting || !actionModeReady}
        onClose={() => setConfirmAction(null)}
        onConfirm={executeSensitiveAction}
      />

      <Snackbar
        open={Boolean(feedback.message)}
        autoHideDuration={5000}
        onClose={closeFeedback}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert onClose={closeFeedback} severity={feedback.severity} variant="filled" sx={{ width: "100%" }}>
          {feedback.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default UsersPage;
