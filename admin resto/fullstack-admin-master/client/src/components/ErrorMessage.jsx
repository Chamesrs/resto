import { Alert, AlertTitle } from "@mui/material";

const ErrorMessage = ({ title = "Une erreur est survenue", message, action }) => (
  <Alert severity="error" action={action} sx={{ borderRadius: "1rem" }}>
    <AlertTitle>{title}</AlertTitle>
    {message}
  </Alert>
);

export default ErrorMessage;
