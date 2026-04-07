import { Routes, Route, Navigate } from "react-router";
import { SignIn, SignUp } from "@clerk/clerk-react";

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
import NotFound from "@/pages/NotFound";

const SignInPage = () => (
  <div className='w-dvw h-dvh flex justify-center items-center'>
    <SignIn routing="path" path="/login" signUpUrl="/register" afterSignInUrl="/voter/dashboard" />
  </div>
);

const SignUpPage = () => (
  <div className='w-dvw h-dvh flex justify-center items-center'>
    <SignUp routing="path" path="/register" signInUrl="/login" afterSignUpUrl="/voter/dashboard" />
  </div>
);

const AppProtectedRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<SignInPage />} />
      <Route path="/login/:path" element={<SignInPage />} />
      <Route path="/register" element={<SignUpPage />} />
      <Route path="/register/:path" element={<SignUpPage />} />

      <Route element={<ProtectedRoute roles={["voter"]} />}>
        <Route path="/voter/dashboard" element={<Dashboard />} />
        <Route path="/voter/profile" element={<VoterProfile />} />
        <Route path="/voter/campaigns" element={<CampaignPlatform />} />
        <Route path="/voter/cast-vote" element={<VotingPanel />} />
        <Route path="/voter/face-verification" element={<FaceGate />} />
      </Route>

      <Route element={<ProtectedRoute roles={["admin"]} />}>
        <Route path="/admin/dashboard" element={<Dashboard />} />
        <Route path="/admin/election" element={<ElectionSetup />} />
        <Route path="/admin/positions" element={<AdminPositions />} />
        <Route path="/admin/election/:id" element={<AdminElection />} />
        <Route path="/admin/users" element={<UsersAdmin />} />
        <Route path="/admin/candidates" element={<CandidatesManagement />} />
        <Route path="/admin/campaigns" element={<CampaignPlatform />} />
        <Route path="/admin/face-verification" element={<FaceGate />} />
      </Route>

      <Route path="/" element={<Navigate to="/voter/dashboard" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppProtectedRoutes;
