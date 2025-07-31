import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import HelpPage from "./pages/HelpPage";
import Layout from "./components/Layout";
import UploadPage from "./pages/UploadPage";
import useAuthStore from './stores/authStore';
import AdminUsersPage from "./pages/AdminUsersPage";
import LicenseSetupModal from "./components/LicenseSetupModal";
import SchemaStore from "./pages/SchemaStore"
import NonAdminSettingsPage from "./pages/NonAdminSettingPage"
import { Toaster } from "react-hot-toast";

function App() {
  const loadUser = useAuthStore((s) => s.loadUserFromStorage);

  useEffect(() => {
    loadUser();
  }, []);

  return (
    <>
    <LicenseSetupModal />
    <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<Layout><DashboardPage /></Layout>} />
        <Route path="/upload" element={<Layout><UploadPage /></Layout>} />
        <Route path="/admin/users" element={<Layout><AdminUsersPage /></Layout>}/>
        <Route path="/help" element={<Layout><HelpPage /></Layout>}/>
        <Route path="/schema-store" element={<Layout><SchemaStore /></Layout>}/>
        <Route path="/settings" element={<Layout><NonAdminSettingsPage /></Layout>}/>
      </Routes>
    </Router>
    </>
  );
}

export default App;
