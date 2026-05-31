import { Box, Card, CardContent, Stack, Typography, useTheme } from "@mui/material";

const StatCard = ({
  title,
  value,
  caption,
  icon,
  tone = "info",
  action,
  unavailable = false,
}) => {
  const theme = useTheme();
  const toneColors = {
    success: theme.palette.success.main,
    warning: theme.palette.warning.main,
    danger: theme.palette.error.main,
    info: theme.palette.info.main,
    neutral: theme.palette.secondary[300],
  };

  return (
    <Card
      sx={{
        height: "100%",
        borderRadius: "1.5rem",
        border: `1px solid ${theme.palette.divider}`,
        background: unavailable
          ? theme.palette.background.paper
          : `linear-gradient(180deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.alt} 100%)`,
        boxShadow:
          theme.palette.mode === "dark"
            ? "0 18px 40px rgba(0, 0, 0, 0.22)"
            : "0 18px 40px rgba(69, 39, 30, 0.08)",
        position: "relative",
        overflow: "hidden",
        "&:before": unavailable
          ? undefined
          : {
              content: '""',
              position: "absolute",
              inset: 0,
              background: `radial-gradient(circle at top right, ${(toneColors[tone] || toneColors.info)}14, transparent 36%)`,
              pointerEvents: "none",
            },
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
            <Typography
              variant="h3"
              mt={1}
              fontWeight={700}
              color={unavailable ? "text.secondary" : "text.primary"}
            >
              {unavailable ? "Indisponible" : value}
            </Typography>
          </Box>
          {icon ? (
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: "14px",
                display: "grid",
                placeItems: "center",
                color: toneColors[tone] || toneColors.info,
                backgroundColor: `${toneColors[tone] || toneColors.info}18`,
              }}
            >
              {icon}
            </Box>
          ) : null}
        </Stack>
        {caption ? (
          <Typography mt={1.5} variant="body2" color="text.secondary">
            {caption}
          </Typography>
        ) : null}
        {action ? <Box mt={2}>{action}</Box> : null}
      </CardContent>
    </Card>
  );
};

export default StatCard;
