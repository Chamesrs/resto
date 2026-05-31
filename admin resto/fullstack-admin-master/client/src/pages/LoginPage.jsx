import {
  EmailOutlined,
  LockOutlined,
  VisibilityOffOutlined,
  VisibilityOutlined,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import BrandLogo from "components/BrandLogo";
import useAuth from "hooks/useAuth";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { resolveHomePath } from "lib/accessControl";
import { signInAdmin } from "services/authService";
import { mapFirebaseError } from "services/firebaseErrorService";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { claims, user, isLoading } = useAuth();
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({
    email: "",
    password: "",
    submit: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const nextPath = useMemo(() => {
    const guardedPath = location.state?.from?.pathname;
    return guardedPath || resolveHomePath(claims?.role);
  }, [claims?.role, location.state?.from?.pathname]);

  useEffect(() => {
    if (!isLoading && user && claims?.approved) {
      navigate(nextPath, { replace: true });
    }
  }, [claims?.approved, isLoading, navigate, nextPath, user]);

  const handleChange = (field) => (event) => {
    setForm((current) => ({
      ...current,
      [field]: event.target.value,
    }));
    setErrors((current) => ({
      ...current,
      [field]: "",
      submit: "",
    }));
  };

  const validate = () => {
    const nextErrors = {
      email: "",
      password: "",
      submit: "",
    };

    if (!form.email.trim()) {
      nextErrors.email = "L'email est obligatoire.";
    } else if (!emailPattern.test(form.email.trim())) {
      nextErrors.email = "Saisissez un email valide.";
    }

    if (!form.password) {
      nextErrors.password = "Le mot de passe est obligatoire.";
    }

    setErrors(nextErrors);
    return !nextErrors.email && !nextErrors.password;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting || !validate()) {
      return;
    }

    setSubmitting(true);

    try {
      const result = await signInAdmin(form.email, form.password);
      navigate(
        location.state?.from?.pathname || resolveHomePath(result.claims?.role),
        { replace: true }
      );
    } catch (error) {
      setErrors((current) => ({
        ...current,
        submit: mapFirebaseError(error, "Connexion impossible."),
      }));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box
      minHeight="100vh"
      display="grid"
      placeItems="center"
      px={{ xs: 2, md: 4 }}
      py={{ xs: 3, md: 5 }}
      sx={{
        background:
          "linear-gradient(135deg, #fff7ee 0%, #f7efe6 50%, #f2f0e8 100%)",
      }}
    >
      <Card
        sx={{
          width: "100%",
          maxWidth: 1120,
          overflow: "hidden",
          borderRadius: { xs: "1.5rem", md: "2rem" },
          border: "1px solid rgba(123,107,99,0.12)",
          boxShadow: "0 28px 70px rgba(90, 61, 37, 0.10)",
        }}
      >
        <Box
          display="grid"
          gridTemplateColumns={{ xs: "1fr", md: "1.05fr 0.95fr" }}
        >
          <Box
            sx={{
              position: "relative",
              minHeight: { xs: 220, md: 680 },
              p: { xs: 3, md: 5 },
              color: "#fffaf4",
              background:
                "linear-gradient(180deg, rgba(109,54,28,0.96), rgba(72,40,25,0.96))",
            }}
          >
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                background:
                  "radial-gradient(circle at 20% 20%, rgba(255,198,120,0.28), transparent 18%), radial-gradient(circle at 80% 30%, rgba(124,177,135,0.18), transparent 22%), radial-gradient(circle at 60% 78%, rgba(255,255,255,0.10), transparent 18%)",
              }}
            />

            <Stack
              position="relative"
              height="100%"
              justifyContent="space-between"
              spacing={3}
            >
              <Box
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                }}
              >
                <BrandLogo showCaption={false} />
              </Box>

              <Box maxWidth={420}>
                <Typography
                  variant="overline"
                  sx={{ letterSpacing: 2.2, fontWeight: 800, opacity: 0.82 }}
                >
                  Restaurant Moderne
                </Typography>
                <Typography
                  mt={1.5}
                  sx={{
                    fontSize: { xs: 28, md: 48 },
                    lineHeight: 1.06,
                    fontWeight: 800,
                  }}
                >
                  Une connexion simple pour gérer votre espace restaurant.
                </Typography>
                <Typography
                  mt={2}
                  color="rgba(255,250,244,0.82)"
                  sx={{ fontSize: { xs: 14, md: 16 } }}
                >
                  Accédez rapidement au dashboard, aux réservations, à la cuisine
                  et aux recharges dans une interface plus claire.
                </Typography>
              </Box>

              <Stack direction="row" spacing={1.25} flexWrap="wrap" useFlexGap>
                {["Design propre", "Accès sécurisé", "Interface responsive"].map(
                  (item) => (
                    <Box
                      key={item}
                      sx={{
                        px: 1.75,
                        py: 1,
                        borderRadius: "999px",
                        bgcolor: "rgba(255,248,240,0.12)",
                        border: "1px solid rgba(255,255,255,0.14)",
                        backdropFilter: "blur(14px)",
                      }}
                    >
                      <Typography fontSize={12} fontWeight={700}>
                        {item}
                      </Typography>
                    </Box>
                  )
                )}
              </Stack>
            </Stack>
          </Box>

          <CardContent
            sx={{
              p: { xs: 3, sm: 4, md: 5 },
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: "rgba(255,255,255,0.94)",
            }}
          >
            <Box component="form" width="100%" maxWidth={420} onSubmit={handleSubmit}>
              <Stack spacing={2.5}>
                <Box>
                  <Typography
                    variant="overline"
                    color="secondary.main"
                    sx={{ letterSpacing: 2, fontWeight: 800 }}
                  >
                    Bienvenue
                  </Typography>
                  <Typography variant="h2" mt={0.5}>
                    Se connecter
                  </Typography>
                  <Typography mt={1} color="text.secondary">
                    Entrez votre email et votre mot de passe pour accéder à
                    votre espace.
                  </Typography>
                </Box>

                <TextField
                  label="Adresse email"
                  type="email"
                  value={form.email}
                  onChange={handleChange("email")}
                  error={Boolean(errors.email)}
                  helperText={errors.email}
                  fullWidth
                  autoComplete="email"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailOutlined fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  label="Mot de passe"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={handleChange("password")}
                  error={Boolean(errors.password)}
                  helperText={errors.password}
                  fullWidth
                  autoComplete="current-password"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlined fontSize="small" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          edge="end"
                          onClick={() => setShowPassword((current) => !current)}
                          aria-label={
                            showPassword
                              ? "Masquer le mot de passe"
                              : "Afficher le mot de passe"
                          }
                        >
                          {showPassword ? (
                            <VisibilityOffOutlined fontSize="small" />
                          ) : (
                            <VisibilityOutlined fontSize="small" />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                {errors.submit ? <Alert severity="error">{errors.submit}</Alert> : null}

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={submitting}
                  sx={{
                    py: 1.4,
                    borderRadius: "1rem",
                    background:
                      "linear-gradient(135deg, rgba(166,31,45,1) 0%, rgba(201,128,69,1) 100%)",
                  }}
                >
                  {submitting ? "Connexion..." : "Se connecter"}
                </Button>

              </Stack>
            </Box>
          </CardContent>
        </Box>
      </Card>
    </Box>
  );
};

export default LoginPage;
