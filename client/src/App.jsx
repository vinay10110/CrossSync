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
import { RedirectToSignIn, SignedIn, SignedOut, useUser } from "@clerk/clerk-react";

const ProtectedRoute = ({ children }) => {
  const { isSignedIn, isLoaded } = useUser();

  if (!isLoaded) return null;
  
  if (!isSignedIn) {
    return <Navigate to="/auth/signin" replace />;
  }

  return children;
};

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
          
          {/* Protected routes */}
          <Route
            path="/auth/role-selection"
            element={
              <ProtectedRoute>
                <RoleSelection />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/*"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/messages"
            element={
              <ProtectedRoute>
                <Messages />
              </ProtectedRoute>
            }
          />
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