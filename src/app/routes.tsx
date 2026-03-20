import LoginForm from "@/features/auth/LoginForm";
import RegisterForm from "@/features/auth/RegisterForm";
import AddCandidate from "@/features/candidates/Addcandidate";
import CandidatesManagement from "@/features/candidates/Candidatemanagement";
import CandidatesEngagementPage from "@/features/candidates/CandidatesEngagement";
import Dashboard from "@/features/dashboard/Dashboard";
import FaceGate from "@/features/face/FaceGate";
import Info from "@/features/info/Info";
import UserInfo from "@/features/info/UserInfo";
import ElectionSetup from "@/features/voting/ElectionSetup";
import VotingPanel from "@/features/voting/VotingPanel";
import { Route, Routes } from "react-router";
import ProtectedRoute from "./ProtectedRoute";

const AppProtectedRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginForm/>}/>
      <Route path="/register" element={<RegisterForm/>}/>
      <Route path="/" element={<Dashboard />} />
      <Route path="/userinfo" element={<UserInfo />} />

      {/* ADMIN */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute roles={["admin"]}>
            <Info />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/add-candidate"
        element={
          <ProtectedRoute roles={["admin"]}>
            <AddCandidate />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/candidate-mgt"
        element={
          <ProtectedRoute roles={["admin"]}>
            <CandidatesManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/election"
        element={
          <ProtectedRoute roles={["admin"]}>
            <ElectionSetup />
          </ProtectedRoute>
        }
      />
      <Route
        path="/engagement"
        element={
          <ProtectedRoute roles={["admin"]}>
            <CandidatesEngagementPage />
          </ProtectedRoute>
        }
      />

      {/* VOTER */}
      <Route
        path="/voter/dashboard"
        element={
          <ProtectedRoute roles={["voter"]}>
            <VotingPanel />
          </ProtectedRoute>
        }
      />
      <Route
        path="/vote"
        element={
          <ProtectedRoute roles={["voter"]}>
            <VotingPanel />
          </ProtectedRoute>
        }
      />
      <Route
        path="/face"
        element={
          <ProtectedRoute roles={["voter"]}>
            <FaceGate />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

export default AppProtectedRoutes;