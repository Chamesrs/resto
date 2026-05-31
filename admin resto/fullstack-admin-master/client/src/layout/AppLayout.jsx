import { Box, useMediaQuery } from "@mui/material";
import { useState } from "react";
import { Outlet } from "react-router-dom";
import AdminModeBanner from "components/AdminModeBanner";
import Navbar from "components/Navbar";
import Sidebar from "components/Sidebar";

const AppLayout = () => {
  const isNonMobile = useMediaQuery("(min-width: 900px)");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <Box display={isNonMobile ? "flex" : "block"} width="100%" minHeight="100%">
      <Sidebar
        isNonMobile={isNonMobile}
        drawerWidth="280px"
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />
      <Box flexGrow={1} minWidth={0}>
        <Navbar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
        <AdminModeBanner />
        <Box px={{ xs: 2, md: 3 }} py={{ xs: 2, md: 3 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default AppLayout;
