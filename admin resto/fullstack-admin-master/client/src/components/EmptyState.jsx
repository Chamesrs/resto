import { Box, Button, Stack, Typography, useTheme } from "@mui/material";

const EmptyState = ({
  title,
  description,
  icon,
  actionLabel,
  onAction,
}) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        borderRadius: "1.5rem",
        border: `1px dashed ${theme.palette.divider}`,
        background:
          theme.palette.mode === "dark"
            ? "linear-gradient(180deg, rgba(255,255,255,0.02), rgba(166,31,45,0.03))"
            : "linear-gradient(180deg, rgba(255,255,255,1), rgba(166,31,45,0.03))",
        p: { xs: 3, md: 5 },
      }}
    >
      <Stack spacing={2} alignItems="flex-start">
        {icon ? (
          <Box
            sx={{
              width: 52,
              height: 52,
              borderRadius: "18px",
              display: "grid",
              placeItems: "center",
              backgroundColor: theme.palette.action.hover,
              color: theme.palette.primary.main,
            }}
          >
            {icon}
          </Box>
        ) : null}
        <Box>
          <Typography variant="h4" fontWeight={700}>
            {title}
          </Typography>
          <Typography mt={1} color="text.secondary">
            {description}
          </Typography>
        </Box>
        {actionLabel && onAction ? (
          <Button variant="contained" onClick={onAction}>
            {actionLabel}
          </Button>
        ) : null}
      </Stack>
    </Box>
  );
};

export default EmptyState;
