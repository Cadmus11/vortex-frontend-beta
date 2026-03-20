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
import { useAuth } from "@/hooks/useAuth";
import Profile from "@/features/extra/Profile";
import Settings from "@/features/extra/Settings";

const AppProtectedRoutes = () => {

  const {user} = useAuth()
  return (
    <Routes>
      <Route path="/login" element={<LoginForm/>}/>
      <Route path="/register" element={<RegisterForm/>}/>
      <Route path="/" element={<Dashboard />} />
      <Route path="/voter-info" element={<UserInfo />} />
      <Route path="/profile" element={user?  <Profile/> : <LoginForm/>}/>
      <Route path="/settings" element={user? <Settings/> : <LoginForm/>}/>

      {/* ADMIN */}
      <Route path="/admin/info"
      element={
        <ProtectedRoute roles={["admin"]}>
          <Info/>
        </ProtectedRoute>
      }/>
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute roles={["admin"]}>
            <Dashboard />
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
        path="/admin/election"
        element={
          <ProtectedRoute roles={["admin"]}>
            <ElectionSetup />
          </ProtectedRoute>
        }
      />
      {/* <Route
        path="/campaigns"
        element={
          <ProtectedRoute roles={["admin"]}>
            <CandidatesEngagementPage />
          </ProtectedRoute>
        }
      /> */}
        <Route
        path="/campaigns"
        element={
         
            <CandidatesEngagementPage />
          
        }
      />

      {/* VOTER */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute roles={["voter"]}>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/cast-votes"
        element={
          <ProtectedRoute roles={["voter"]}>
            <VotingPanel />
          </ProtectedRoute>
        }
      />
      <Route
        path="/face-verification"
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