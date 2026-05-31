import { Box, Button, Typography, useTheme } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

const NotFoundPage = () => {
  const theme = useTheme();

  return (
    <Box
      minHeight="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      bgcolor={theme.palette.background.default}
      p="2rem"
    >
      <Box textAlign="center" display="grid" gap="1rem">
        <Typography variant="h1" color={theme.palette.secondary[100]}>
          404
        </Typography>
        <Typography variant="h4" color={theme.palette.secondary[200]}>
          Page introuvable
        </Typography>
        <Button component={RouterLink} to="/dashboard" variant="contained">
          Retour au dashboard
        </Button>
      </Box>
    </Box>
  );
};

export default NotFoundPage;
