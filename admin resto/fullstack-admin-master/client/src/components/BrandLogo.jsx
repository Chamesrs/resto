import { Box, Stack, Typography, useTheme } from "@mui/material";
import logo from "assets/logo_slama.png";

const BrandLogo = ({
  compact = false,
  showCaption = true,
  caption = "Slama Poterie",
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Stack
      direction="row"
      spacing={1.25}
      alignItems="center"
      sx={{
        minWidth: 0,
      }}
    >
      <Box
        sx={{
          width: compact ? 54 : 72,
          height: compact ? 54 : 72,
          p: compact ? 0.75 : 1,
          borderRadius: compact ? "16px" : "20px",
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
          bgcolor: isDark ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.78)",
          border: `1px solid ${
            isDark ? "rgba(255,255,255,0.10)" : "rgba(123,107,99,0.12)"
          }`,
          boxShadow: isDark
            ? "0 14px 30px rgba(0,0,0,0.28)"
            : "0 14px 30px rgba(90, 61, 37, 0.12)",
        }}
      >
        <Box
          component="img"
          src={logo}
          alt="Logo Slama"
          loading="eager"
          sx={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
          }}
        />
      </Box>

      {showCaption ? (
        <Box sx={{ minWidth: 0 }}>
          <Typography variant={compact ? "subtitle2" : "h6"} fontWeight={800} noWrap>
            {caption}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            Interface restauration
          </Typography>
        </Box>
      ) : null}
    </Stack>
  );
};

export default BrandLogo;
