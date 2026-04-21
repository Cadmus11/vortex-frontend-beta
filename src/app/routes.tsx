import { Routes, Route, Navigate } from "react-router";

import Dashboard from "@/features/dashboard/Dashboard";
import FaceGate from "@/features/face/FaceGate";
import VoterProfile from "@/features/profile/VoterProfile";
import ElectionSetup from "@/features/voting/ElectionSetup";
import VotingPanel from "@/features/voting/VotingPanel";
import ProtectedRoute from "./ProtectedRoute";
import UsersAdmin from "@/features/users/UsersAdmin";
import AdminElection from "@/features/elections/AdminElection";
import AdminPositions from "@/features/positions/AdminPositions";
import CampaignPlatform from "@/features/campaigns/CampaignPlatform";
import CandidatesManagement from "@/features/candidates/Candidatemanagement";
import ElectionResults from "@/features/results/ElectionResults";
import NotFound from "@/pages/NotFound";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import ForgotPasswordPage from "@/pages/PasswordPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import AdminWelcome from "@/pages/AdminWelcome";
import SettingsPage from "@/pages/SettingsPage";
import { useAuth } from "@/context/AuthContext";

const HomeRedirect = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to={user?.role === "admin" ? "/admin/dashboard" : "/voter/dashboard"} replace />;
};

const AppProtectedRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

      <Route element={<ProtectedRoute roles={["voter"]} />}>
        <Route path="/voter/dashboard" element={<Dashboard />} />
        <Route path="/voter/profile" element={<VoterProfile />} />
        <Route path="/voter/campaigns" element={<CampaignPlatform />} />
        <Route path="/voter/cast-vote" element={<VotingPanel />} />
        <Route path="/voter/face-verification" element={<FaceGate />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      <Route element={<ProtectedRoute roles={["admin"]} />}>
        <Route path="/admin" element={<AdminWelcome />} />
        <Route path="/admin/dashboard" element={<Dashboard />} />
        <Route path="/admin/election" element={<ElectionSetup />} />
        <Route path="/admin/positions" element={<AdminPositions />} />
        <Route path="/admin/election/:id" element={<AdminElection />} />
        <Route path="/admin/users" element={<UsersAdmin />} />
        <Route path="/admin/candidates" element={<CandidatesManagement />} />
        <Route path="/admin/cast-vote" element={<VotingPanel />} />
        <Route path="/admin/campaigns" element={<CampaignPlatform />} />
        <Route path="/admin/face-verification" element={<FaceGate />} />
        <Route path="/admin/results" element={<ElectionResults />} />
        <Route path="/admin/settings" element={<SettingsPage />} />
      </Route>

      <Route path="/" element={<HomeRedirect />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppProtectedRoutes;
