import { Box, CircularProgress, Stack, Typography, useTheme } from "@mui/material";
import BrandLogo from "components/BrandLogo";

const LoadingScreen = ({ label = "Chargement..." }) => {
  const theme = useTheme();

  return (
    <Box
      minHeight="100vh"
      display="grid"
      placeItems="center"
      bgcolor={theme.palette.background.default}
    >
      <Stack spacing={2} alignItems="center">
        <BrandLogo compact={false} />
        <CircularProgress color="secondary" />
        <Typography color="text.secondary">{label}</Typography>
      </Stack>
    </Box>
  );
};

export default LoadingScreen;
