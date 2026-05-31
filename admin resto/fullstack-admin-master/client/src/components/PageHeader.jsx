import { CalendarTodayOutlined } from "@mui/icons-material";
import { Box, Chip, Stack, Typography, useTheme } from "@mui/material";
import BrandLogo from "components/BrandLogo";

function formatToday() {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
}

const PageHeader = ({
  title,
  subtitle,
  action,
  statusLabel,
  eyebrow = "Administration",
  showBrandLogo = false,
}) => {
  const theme = useTheme();

  return (
    <Stack
      direction={{ xs: "column", md: "row" }}
      justifyContent="space-between"
      alignItems={{ xs: "flex-start", md: "flex-start" }}
      spacing={2}
      mb={3}
      sx={{
        p: { xs: 2.5, md: 3 },
        borderRadius: "1.6rem",
        border: `1px solid ${theme.palette.divider}`,
        background:
          theme.palette.mode === "dark"
            ? "linear-gradient(135deg, rgba(166,31,45,0.14), rgba(255,255,255,0.02))"
            : "linear-gradient(135deg, rgba(166,31,45,0.08), rgba(255,255,255,0.8))",
      }}
    >
      <Box>
        {showBrandLogo ? (
          <Box mb={1.5}>
            <BrandLogo compact />
          </Box>
        ) : null}
        <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1.6, fontWeight: 700 }}>
          {eyebrow}
        </Typography>
        <Typography variant="h2" mt={0.5}>
          {title}
        </Typography>
        {subtitle ? (
          <Typography mt={1} color="text.secondary" maxWidth="70ch">
            {subtitle}
          </Typography>
        ) : null}
      </Box>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} width={{ xs: "100%", md: "auto" }}>
        <Chip
          icon={<CalendarTodayOutlined sx={{ fontSize: 16 }} />}
          label={formatToday()}
          variant="outlined"
        />
        {statusLabel ? <Chip label={statusLabel} color="success" variant="filled" /> : null}
        {action}
      </Stack>
    </Stack>
  );
};

export default PageHeader;
