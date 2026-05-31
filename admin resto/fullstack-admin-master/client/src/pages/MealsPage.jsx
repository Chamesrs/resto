import {
  AddOutlined,
  DeleteOutlined,
  EditOutlined,
  RestaurantOutlined,
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
  FormControlLabel,
  Grid,
  MenuItem,
  Stack,
  Switch,
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
import { mapFirebaseError } from "services/firebaseErrorService";
import {
  createMeal,
  deleteMeal,
  subscribeMeals,
  updateMeal,
} from "services/mealService";

const defaultMealForm = () => {
  const today = new Date();
  const isoDate = today.toISOString().slice(0, 10);

  return {
    name: "",
    category: "meal",
    description: "",
    price: "",
    calories: "",
    allergens: "",
    photoUrl: "",
    active: true,
    day: isoDate,
  };
};

const MealsPage = () => {
  const { claims, profile } = useAuth();
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState({ message: "", severity: "success" });
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState("create");
  const [formValues, setFormValues] = useState(defaultMealForm());
  const [editingMealId, setEditingMealId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const isSuperAdminActor = claims?.superAdmin || profile?.role === "super_admin";

  useEffect(() => {
    const unsubscribe = subscribeMeals(
      (nextMeals) => {
        setMeals(nextMeals);
        setError("");
        setLoading(false);
      },
      (snapshotError) => {
        setError(mapFirebaseError(snapshotError, "Impossible de charger les repas."));
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  const summary = useMemo(
    () => ({
      total: meals.length,
      active: meals.filter((meal) => meal.active !== false).length,
      inactive: meals.filter((meal) => meal.active === false).length,
      averagePrice:
        meals.length > 0
          ? meals.reduce((total, meal) => total + Number(meal.price || 0), 0) / meals.length
          : 0,
    }),
    [meals]
  );

  const columns = useMemo(
    () => [
      {
        field: "name",
        headerName: "Repas",
        minWidth: 240,
        flex: 1.2,
        renderCell: ({ row }) => (
          <Stack direction="row" spacing={1.5} alignItems="center" py={1}>
            {row.photoUrl ? (
              <Box
                component="img"
                src={row.photoUrl}
                alt={row.name}
                sx={{
                  width: 46,
                  height: 46,
                  objectFit: "cover",
                  borderRadius: "12px",
                }}
              />
            ) : (
              <Box
                sx={{
                  width: 46,
                  height: 46,
                  borderRadius: "12px",
                  display: "grid",
                  placeItems: "center",
                  backgroundColor: "action.hover",
                }}
              >
                <RestaurantOutlined fontSize="small" />
              </Box>
            )}
            <Box>
              <Typography fontWeight={700}>{row.name}</Typography>
              <Typography variant="caption" color="text.secondary">
                {row.description || "Sans description"}
              </Typography>
            </Box>
          </Stack>
        ),
      },
      { field: "category", headerName: "Categorie", minWidth: 120, flex: 0.7 },
      {
        field: "price",
        headerName: "Prix",
        minWidth: 110,
        flex: 0.6,
        renderCell: ({ value }) => `${Number(value || 0).toFixed(2)} TND`,
      },
      { field: "day", headerName: "Jour", minWidth: 120, flex: 0.7 },
      { field: "weekStart", headerName: "Semaine", minWidth: 120, flex: 0.6 },
      {
        field: "active",
        headerName: "Statut",
        minWidth: 120,
        flex: 0.6,
        renderCell: ({ value }) => (
          <StatusBadge status={value === false ? "inactive" : "success"} />
        ),
      },
      {
        field: "actions",
        headerName: "Actions",
        sortable: false,
        minWidth: 220,
        flex: 0.9,
        renderCell: ({ row }) => (
          <Stack direction="row" spacing={1} py={1}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<EditOutlined />}
              onClick={() => openEditDialog(row)}
              disabled={!isSuperAdminActor}
            >
              Editer
            </Button>
            <Button
              size="small"
              variant="outlined"
              color="error"
              startIcon={<DeleteOutlined />}
              onClick={() => setConfirmDeleteId(row.id)}
              disabled={!isSuperAdminActor}
            >
              Supprimer
            </Button>
          </Stack>
        ),
      },
    ],
    [isSuperAdminActor]
  );

  const openCreateDialog = () => {
    setFormMode("create");
    setEditingMealId(null);
    setFormValues(defaultMealForm());
    setError("");
    setFormOpen(true);
  };

  const openEditDialog = (meal) => {
    setFormMode("edit");
    setEditingMealId(meal.id);
    setFormValues({
      name: meal.name || "",
      category: meal.category || "meal",
      description: meal.description || "",
      price: String(meal.price ?? ""),
      calories: String(meal.calories ?? ""),
      allergens: Array.isArray(meal.allergens) ? meal.allergens.join(", ") : "",
      photoUrl: meal.photoUrl || "",
      active: meal.active !== false,
      day: meal.day || "",
    });
    setError("");
    setFormOpen(true);
  };

  const closeFormDialog = () => {
    setFormOpen(false);
    setEditingMealId(null);
    setFormValues(defaultMealForm());
  };

  const handleFormChange = (field) => (event) => {
    const value = field === "active" ? event.target.checked : event.target.value;
    setFormValues((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async () => {
    const payload = {
      name: formValues.name.trim(),
      category: formValues.category,
      description: formValues.description.trim(),
      price: Number(formValues.price || 0),
      calories: Number(formValues.calories || 0),
      allergens: formValues.allergens
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      photoUrl: formValues.photoUrl.trim(),
      active: formValues.active,
      day: formValues.day,
    };

    if (!payload.name) {
      setError("Le nom du repas est obligatoire.");
      return;
    }

    if (Number.isNaN(payload.price) || payload.price < 0) {
      setError("Le prix doit etre un nombre positif ou nul.");
      return;
    }

    if (Number.isNaN(payload.calories) || payload.calories < 0) {
      setError("Les calories doivent etre positives ou nulles.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      if (formMode === "create") {
        await createMeal(payload);
        setFeedback({ message: "Repas cree avec succes.", severity: "success" });
      } else {
        await updateMeal(editingMealId, payload);
        setFeedback({ message: "Repas mis a jour.", severity: "success" });
      }

      closeFormDialog();
    } catch (submitError) {
      setError(mapFirebaseError(submitError, "Enregistrement impossible."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDeleteId) return;

    try {
      await deleteMeal(confirmDeleteId);
      setFeedback({ message: "Repas supprime.", severity: "success" });
      setConfirmDeleteId(null);
    } catch (deleteError) {
      setFeedback({
        message: mapFirebaseError(deleteError, "Suppression impossible."),
        severity: "error",
      });
    }
  };

  return (
    <Box>
      <PageHeader
        title="Menus et repas"
        subtitle={
          isSuperAdminActor
            ? "Gestion de l'offre, des disponibilites et des informations nutritionnelles."
            : "Consultation des repas, menus et disponibilites."
        }
        action={isSuperAdminActor ? (
          <Button variant="contained" startIcon={<AddOutlined />} onClick={openCreateDialog}>
            Nouveau repas
          </Button>
        ) : null}
      />

      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={6} xl={3}>
          <StatCard title="Total" value={summary.total} caption="Repas enregistres" />
        </Grid>
        <Grid item xs={12} sm={6} xl={3}>
          <StatCard title="Actifs" value={summary.active} caption="Visibles a la commande" tone="success" />
        </Grid>
        <Grid item xs={12} sm={6} xl={3}>
          <StatCard title="Inactifs" value={summary.inactive} caption="Temporairement masques" tone="warning" />
        </Grid>
        <Grid item xs={12} sm={6} xl={3}>
          <StatCard
            title="Prix moyen"
            value={`${summary.averagePrice.toFixed(2)} TND`}
            caption="Sur la liste visible"
            tone="info"
          />
        </Grid>
      </Grid>

      {feedback.message ? (
        <Alert severity={feedback.severity} sx={{ mb: 2 }}>
          {feedback.message}
        </Alert>
      ) : null}

      {error && !formOpen ? <ErrorMessage title="Menus indisponibles" message={error} /> : null}

      <Card sx={{ border: 1, borderColor: "divider" }}>
        <CardContent sx={{ p: 2.5 }}>
          {!loading && !meals.length ? (
            <EmptyState
              title="Aucun repas disponible"
              description="Creez votre premier repas pour alimenter le menu de la semaine."
              icon={<RestaurantOutlined />}
              actionLabel={isSuperAdminActor ? "Ajouter un repas" : undefined}
              onAction={isSuperAdminActor ? openCreateDialog : undefined}
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
                "& .MuiDataGrid-row:hover": {
                  backgroundColor: "action.hover",
                },
              }}
            >
              <DataGrid
                rows={meals}
                columns={columns}
                getRowId={(row) => row.id}
                loading={loading}
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

      <Dialog
        open={formOpen}
        onClose={isSuperAdminActor ? closeFormDialog : undefined}
        fullWidth
        maxWidth="md"
        PaperProps={{ sx: { borderRadius: "1.25rem" } }}
      >
        <DialogTitle>{formMode === "create" ? "Creer un repas" : "Editer un repas"}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} mt={1}>
            {error ? <Alert severity="error">{error}</Alert> : null}
            <TextField label="Nom" value={formValues.name} onChange={handleFormChange("name")} fullWidth />
            <TextField
              select
              label="Categorie"
              value={formValues.category}
              onChange={handleFormChange("category")}
              fullWidth
            >
              <MenuItem value="meal">Plat</MenuItem>
              <MenuItem value="starter">Entree</MenuItem>
              <MenuItem value="dessert">Dessert</MenuItem>
            </TextField>
            <TextField
              label="Description"
              value={formValues.description}
              onChange={handleFormChange("description")}
              multiline
              minRows={3}
              fullWidth
            />
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField label="Prix" type="number" value={formValues.price} onChange={handleFormChange("price")} fullWidth />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField label="Calories" type="number" value={formValues.calories} onChange={handleFormChange("calories")} fullWidth />
              </Grid>
            </Grid>
            <TextField
              label="Allergenes"
              value={formValues.allergens}
              onChange={handleFormChange("allergens")}
              helperText="Separez les allergenes par des virgules."
              fullWidth
            />
            <TextField
              label="Image"
              value={formValues.photoUrl}
              onChange={handleFormChange("photoUrl")}
              helperText="URL d'image ou photo de presentation."
              fullWidth
            />
            <TextField
              label="Jour"
              type="date"
              value={formValues.day}
              onChange={handleFormChange("day")}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <FormControlLabel
              control={<Switch checked={formValues.active} onChange={handleFormChange("active")} />}
              label="Repas actif"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeFormDialog}>Annuler</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={submitting || !isSuperAdminActor}>
            {formMode === "create" ? "Creer" : "Enregistrer"}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={Boolean(confirmDeleteId)}
        title="Supprimer le repas"
        content="Cette action supprime definitivement le document correspondant."
        confirmLabel="Supprimer"
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={handleDelete}
        confirmDisabled={!isSuperAdminActor}
      />
    </Box>
  );
};

export default MealsPage;
