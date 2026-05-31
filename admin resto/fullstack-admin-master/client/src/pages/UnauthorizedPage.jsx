import { Alert, Box, Button, Card, CardContent, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { signOutUser } from "services/authService";

const UnauthorizedPage = () => (
  <Box minHeight="100vh" display="grid" placeItems="center" p={3}>
    <Card sx={{ maxWidth: 620, width: "100%", borderRadius: "1.5rem", border: 1, borderColor: "divider" }}>
      <CardContent sx={{ p: { xs: 3, md: 4 } }}>
        <Stack spacing={2.5}>
          <Box>
            <Typography variant="h2">Acces non autorise</Typography>
            <Typography mt={1} color="text.secondary">
              Ce compte n'a pas les droits necessaires pour acceder a l'administration.
            </Typography>
          </Box>
          <Alert severity="warning">
            Utilisez le script local <code>set-user-access.js</code> pour appliquer les droits admin, puis reconnectez-vous.
          </Alert>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <Button variant="contained" component={RouterLink} to="/login">
              Retour a la connexion
            </Button>
            <Button variant="outlined" onClick={signOutUser}>
              Se deconnecter
            </Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  </Box>
);

export default UnauthorizedPage;
