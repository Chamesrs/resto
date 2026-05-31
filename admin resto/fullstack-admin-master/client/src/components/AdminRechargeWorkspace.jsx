import { SearchOutlined } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Grid,
  InputAdornment,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import EmptyState from "components/EmptyState";
import ErrorMessage from "components/ErrorMessage";
import StatCard from "components/StatCard";
import StatusBadge from "components/StatusBadge";
import { useCallback, useEffect, useMemo, useState } from "react";
import { adminCapabilities } from "services/adminCapabilitiesService";
import { mapFirebaseError } from "services/firebaseErrorService";
import { getLocalAdminHealth } from "services/localAdminApiService";
import {
  adjustEmployerBalance,
  getEmployerTransactions,
} from "services/transactionService";
import { searchEmployers } from "services/userService";

function formatCurrency(value) {
  return `${Number(value || 0).toFixed(2)} TND`;
}

function formatDate(value) {
  if (!value) return "-";
  const date =
    typeof value?.toDate === "function"
      ? value.toDate()
      : new Date(value?._seconds ? value._seconds * 1000 : value);
  return Number.isNaN(date.getTime())
    ? "-"
    : new Intl.DateTimeFormat("fr-FR", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
}

const transactionColumns = [
  {
    field: "createdAt",
    headerName: "Date",
    minWidth: 180,
    flex: 0.9,
    renderCell: ({ row }) => formatDate(row.createdAt),
  },
  {
    field: "type",
    headerName: "Type",
    minWidth: 100,
    flex: 0.6,
    renderCell: ({ row }) => <StatusBadge status={row.type || "credit"} />,
  },
  {
    field: "amount",
    headerName: "Montant",
    minWidth: 120,
    flex: 0.7,
    renderCell: ({ row }) => formatCurrency(row.amount),
  },
  {
    field: "balanceAfter",
    headerName: "Solde apres",
    minWidth: 120,
    flex: 0.8,
    renderCell: ({ row }) => formatCurrency(row.balanceAfter),
  },
  {
    field: "note",
    headerName: "Motif",
    minWidth: 280,
    flex: 1.8,
    renderCell: ({ row }) => row.note || row.source || "-",
  },
];

const AdminRechargeWorkspace = ({
  title = "Chargement des comptes employes",
  subtitle = "Recherche, recharge et historique recent depuis le guichet admin.",
  compact = false,
}) => {
  const [backendState, setBackendState] = useState({
    loading: adminCapabilities.localApiEnabled,
    connected: false,
    error: "",
  });
  const [searchValue, setSearchValue] = useState("");
  const [searchState, setSearchState] = useState({
    loading: false,
    error: "",
    items: [],
  });
  const [selectedEmployer, setSelectedEmployer] = useState(null);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("Recharge admin");
  const [submitting, setSubmitting] = useState(false);
  const [transactionsState, setTransactionsState] = useState({
    loading: false,
    error: "",
    items: [],
  });
  const [feedback, setFeedback] = useState({ message: "", severity: "success" });

  const actionModeReady =
    adminCapabilities.localApiEnabled && backendState.connected;

  useEffect(() => {
    let active = true;

    if (!adminCapabilities.localApiEnabled) {
      setBackendState({
        loading: false,
        connected: false,
        error:
          "Le backend admin local doit etre configure pour charger les comptes.",
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

  const loadTransactions = useCallback(async (employer) => {
    if (!employer?.uid) {
      setTransactionsState({ loading: false, error: "", items: [] });
      return;
    }

    setTransactionsState((current) => ({
      ...current,
      loading: true,
      error: "",
    }));

    try {
      const items = await getEmployerTransactions(employer.uid);
      setTransactionsState({ loading: false, error: "", items });
    } catch (error) {
      setTransactionsState({
        loading: false,
        error: mapFirebaseError(
          error,
          "Impossible de charger l'historique des transactions."
        ),
        items: [],
      });
    }
  }, []);

  useEffect(() => {
    if (!selectedEmployer) {
      setTransactionsState({ loading: false, error: "", items: [] });
      return;
    }

    loadTransactions(selectedEmployer);
  }, [loadTransactions, selectedEmployer]);

  const handleSearch = async () => {
    const query = searchValue.trim();
    if (!query) {
      setSearchState({
        loading: false,
        error: "Saisissez un nom, un email, un matricule ou un code employe.",
        items: [],
      });
      return;
    }

    setSearchState({ loading: true, error: "", items: [] });
    try {
      const items = await searchEmployers(query);
      setSearchState({ loading: false, error: "", items });
      if (items.length === 1) {
        setSelectedEmployer(items[0]);
      }
    } catch (error) {
      setSearchState({
        loading: false,
        error: mapFirebaseError(error, "Employe introuvable."),
        items: [],
      });
    }
  };

  const handleRecharge = async () => {
    if (!selectedEmployer?.uid) {
      setFeedback({ message: "Selectionnez un employe.", severity: "error" });
      return;
    }

    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setFeedback({
        message: "Le montant doit etre un nombre positif.",
        severity: "error",
      });
      return;
    }

    setSubmitting(true);
    try {
      const result = await adjustEmployerBalance(
        selectedEmployer.uid,
        parsedAmount,
        reason.trim() || "Recharge admin"
      );
      const nextEmployer = {
        ...selectedEmployer,
        balance: Number(result.balanceAfter ?? selectedEmployer.balance),
      };
      setSelectedEmployer(nextEmployer);
      setSearchState((current) => ({
        ...current,
        items: current.items.map((item) =>
          item.uid === nextEmployer.uid ? nextEmployer : item
        ),
      }));
      setAmount("");
      setFeedback({
        message: "Compte recharge avec succes.",
        severity: "success",
      });
      await loadTransactions(nextEmployer);
    } catch (error) {
      setFeedback({
        message: mapFirebaseError(error, "Erreur lors du chargement."),
        severity: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const summary = useMemo(
    () => ({
      results: searchState.items.length,
      currentBalance: selectedEmployer?.balance ?? 0,
      transactions: transactionsState.items.length,
    }),
    [
      searchState.items.length,
      selectedEmployer?.balance,
      transactionsState.items.length,
    ]
  );

  return (
    <Box>
      {!backendState.loading && !backendState.connected ? (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {backendState.error ||
            "Le backend admin local doit etre demarre pour charger les comptes."}
        </Alert>
      ) : null}

      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={4}>
          <StatCard
            title="Resultats"
            value={summary.results}
            caption="Employes trouves"
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard
            title="Solde courant"
            value={formatCurrency(summary.currentBalance)}
            caption="Employe selectionne"
            tone="success"
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard
            title="Transactions"
            value={summary.transactions}
            caption="Historique charge"
            tone="info"
          />
        </Grid>
      </Grid>

      <Grid container spacing={2.5}>
        <Grid item xs={12} lg={compact ? 12 : 5}>
          <Card sx={{ border: 1, borderColor: "divider", height: "100%" }}>
            <CardContent sx={{ p: 2.5 }}>
              <Stack spacing={2.5}>
                <Box>
                  <Typography variant="h4">{title}</Typography>
                  <Typography color="text.secondary" mt={0.75}>
                    {subtitle}
                  </Typography>
                </Box>

                <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
                  <TextField
                    label="Rechercher un employe"
                    placeholder="Nom, email, matricule, CIN ou code employe"
                    value={searchValue}
                    onChange={(event) => setSearchValue(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        handleSearch();
                      }
                    }}
                    fullWidth
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchOutlined fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                  />
                  <Button
                    variant="contained"
                    onClick={handleSearch}
                    disabled={!actionModeReady || searchState.loading}
                  >
                    {searchState.loading ? "Recherche..." : "Rechercher"}
                  </Button>
                </Stack>

                {searchState.error ? (
                  <Alert severity="error">{searchState.error}</Alert>
                ) : null}

                {!!searchState.items.length ? (
                  <Grid container spacing={1.5}>
                    {searchState.items.slice(0, compact ? 3 : 6).map((item) => {
                      const isSelected = selectedEmployer?.uid === item.uid;
                      return (
                        <Grid item xs={12} key={item.uid}>
                          <Card
                            variant="outlined"
                            sx={{
                              borderColor: isSelected ? "secondary.main" : "divider",
                              background: isSelected
                                ? "linear-gradient(135deg, rgba(201,128,69,0.10), rgba(255,255,255,0.92))"
                                : undefined,
                            }}
                          >
                            <CardContent sx={{ p: 2 }}>
                              <Stack
                                direction={{ xs: "column", md: "row" }}
                                spacing={1.5}
                                justifyContent="space-between"
                              >
                                <Box>
                                  <Typography fontWeight={800}>
                                    {item.name || "Employe"}
                                  </Typography>
                                  <Typography color="text.secondary">
                                    {item.email || "Email non renseigne"}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    Matricule: {item.employerCode || "-"} • CIN:{" "}
                                    {item.cin || "-"}
                                  </Typography>
                                </Box>
                                <Stack
                                  direction={{ xs: "column", sm: "row" }}
                                  spacing={1}
                                  alignItems={{ sm: "center" }}
                                >
                                  <Typography fontWeight={700}>
                                    {formatCurrency(item.balance)}
                                  </Typography>
                                  <StatusBadge
                                    status={item.approved ? "approved" : "pending"}
                                  />
                                  <Button
                                    variant={isSelected ? "contained" : "outlined"}
                                    onClick={() => setSelectedEmployer(item)}
                                  >
                                    {isSelected ? "Selectionne" : "Choisir"}
                                  </Button>
                                </Stack>
                              </Stack>
                            </CardContent>
                          </Card>
                        </Grid>
                      );
                    })}
                  </Grid>
                ) : null}

                <Divider />

                {!selectedEmployer ? (
                  <EmptyState
                    title="Aucun employe selectionne"
                    description="Choisissez un employe pour saisir le montant et lancer la recharge."
                  />
                ) : (
                  <Stack spacing={2}>
                    <Alert severity="info">
                      {selectedEmployer.name || "Employe"} •{" "}
                      {selectedEmployer.employerCode || "Sans matricule"}
                    </Alert>
                    <TextField
                      label="Email"
                      value={selectedEmployer.email || ""}
                      InputProps={{ readOnly: true }}
                    />
                    <TextField
                      label="Montant"
                      type="number"
                      value={amount}
                      onChange={(event) => setAmount(event.target.value)}
                      disabled={submitting}
                    />
                    <TextField
                      label="Motif"
                      value={reason}
                      onChange={(event) => setReason(event.target.value)}
                      disabled={submitting}
                    />
                    <Button
                      variant="contained"
                      size="large"
                      onClick={handleRecharge}
                      disabled={!actionModeReady || submitting}
                    >
                      {submitting ? "Chargement..." : "Charger le compte"}
                    </Button>
                  </Stack>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={compact ? 12 : 7}>
          <Card sx={{ border: 1, borderColor: "divider", height: "100%" }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="h4" mb={1}>
                Historique recent
              </Typography>
              <Typography color="text.secondary" mb={2.5}>
                Dernieres operations du compte selectionne.
              </Typography>
              {transactionsState.error ? (
                <ErrorMessage
                  title="Historique indisponible"
                  message={transactionsState.error}
                />
              ) : !selectedEmployer ? (
                <EmptyState
                  title="Historique non disponible"
                  description="Selectionnez un employe pour afficher ses operations."
                />
              ) : !transactionsState.loading && !transactionsState.items.length ? (
                <EmptyState
                  title="Aucune transaction"
                  description="Les prochaines recharges apparaitront ici."
                />
              ) : (
                <Box
                  sx={{
                    height: compact ? 420 : "58vh",
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
                    rows={transactionsState.items}
                    columns={transactionColumns}
                    getRowId={(row) => row.id}
                    loading={transactionsState.loading}
                    disableRowSelectionOnClick
                    initialState={{
                      pagination: { paginationModel: { pageSize: 10 } },
                    }}
                    pageSizeOptions={[10, 20, 50]}
                  />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Snackbar
        open={Boolean(feedback.message)}
        autoHideDuration={4000}
        onClose={() => setFeedback({ message: "", severity: "success" })}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setFeedback({ message: "", severity: "success" })}
          severity={feedback.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {feedback.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminRechargeWorkspace;
