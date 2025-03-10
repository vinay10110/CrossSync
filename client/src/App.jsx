import Dashboard from "./pages/Dashboard/Dashboard";
import Authentication from "./pages/Authentication/Authentication";
import SignInPage from "./pages/Authentication/SignInPage";
import SignUpPage from "./pages/Authentication/SignUpPage";
import RoleSelection from "./pages/Authentication/RoleSelection";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Notifications } from "@mantine/notifications";
import "@mantine/notifications/styles.css";
import { ModalsProvider } from "@mantine/modals";
import Messages from "./pages/Messages";

function AppContent() {
  return (
    <ModalsProvider>
      <Notifications position="top-right" />
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Authentication />} />
          <Route path="/auth/signin" element={<SignInPage />} />
          <Route path="/auth/signup" element={<SignUpPage />} />
          <Route path="/auth/role-selection" element={<RoleSelection />} />
          <Route path="/dashboard/*" element={<Dashboard />} />
          <Route path="/messages" element={<Messages />} />
          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ModalsProvider>
  );
}

function App() {
  return (
    <ModalsProvider>
      <AppContent />
    </ModalsProvider>
  );
}

export default App;