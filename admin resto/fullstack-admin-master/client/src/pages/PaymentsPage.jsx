import { Box } from "@mui/material";
import AdminRechargeWorkspace from "components/AdminRechargeWorkspace";
import PageHeader from "components/PageHeader";

const PaymentsPage = () => {
  return (
    <Box>
      <PageHeader
        title="Recharge compte employe"
        subtitle="Recherche par nom, email, matricule ou CIN, puis chargement direct du solde avec historique associe."
        statusLabel="Guichet admin"
      />
      <AdminRechargeWorkspace
        title="Poste de recharge"
        subtitle="Module complet de recherche employe, chargement de compte et suivi des transactions."
      />
    </Box>
  );
};

export default PaymentsPage;
