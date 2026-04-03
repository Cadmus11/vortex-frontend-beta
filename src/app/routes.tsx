import LoginForm from "@/features/auth/LoginForm";
import RegisterForm from "@/features/auth/RegisterForm";
import ResetPassword from "@/features/auth/ResetPassword";
import CandidatesManagement from "@/features/candidates/Candidatemanagement";
import Dashboard from "@/features/dashboard/Dashboard";
import FaceGate from "@/features/face/FaceGate";
import Info from "@/features/info/Info";
import UserInfo from "@/features/info/UserInfo";
import VoterProfile from "@/features/profile/VoterProfile";
import ElectionSetup from "@/features/voting/ElectionSetup";
import VotingPanel from "@/features/voting/VotingPanel";
import { Route, Routes, Outlet, Navigate } from "react-router";
import ProtectedRoute from "./ProtectedRoute";
import UsersAdmin from "@/features/users/UsersAdmin";
import AdminElection from "@/features/elections/AdminElection";
import AdminPositions from "@/features/positions/AdminPositions";
import CampaignPlatform from "@/features/campaigns/CampaignPlatform";

import NotFound from "@/pages/NotFound";

const AdminRoutes = () => {
  return (
    <ProtectedRoute roles={["admin"]}>
      <Outlet />
    </ProtectedRoute>
  );
};

const VoterRoutes = () => {
  return (
    <ProtectedRoute roles={["voter"]}>
      <Outlet />
    </ProtectedRoute>
  );
};

const AppProtectedRoutes = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginForm />} />
      <Route path="/register" element={<RegisterForm />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Admin routes */}
      <Route element={<AdminRoutes />}>
        <Route path="/admin/dashboard" element={<Dashboard />} />
        <Route path="/admin/election" element={<ElectionSetup />} />
        <Route path="/admin/positions" element={<AdminPositions />} />
        <Route path="/admin/election/positions" element={<AdminElection />} />
        <Route path="/admin/users" element={<UsersAdmin />} />
        <Route path="/admin/candidate-mgt" element={<CandidatesManagement />} />
        <Route path="/admin/info" element={<Info />} />
        <Route path="/admin/campaigns" element={<CampaignPlatform />} />
        <Route path="/admin/face-verification" element={<FaceGate />} />
      </Route>

      {/* Voter routes */}
      <Route element={<VoterRoutes />}>
        
        <Route path="/voter/dashboard" element={<Dashboard />} />
        <Route path="/voter/info" element={<UserInfo />} />
        <Route path="/voter/profile" element={<VoterProfile />} />
        <Route path="/voter/campaigns" element={<CampaignPlatform />} />
        <Route path="/voter/cast-votes" element={<VotingPanel />} />
        <Route path="/voter/face-verification" element={<FaceGate />} />
        <Route path="/voter/reset-password" element={<ResetPassword />} />
      </Route>

      {/* Redirect root to login */}
      <Route path="/" element={<Navigate to="/login" replace />} />
       <Route path='/reset-password' element={<ResetPassword/>}/>
      {/* Catch-all */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};





export default AppProtectedRoutes;
