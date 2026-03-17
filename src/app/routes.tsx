import LoginForm from "@/features/auth/LoginForm"
import RegisterForm from "@/features/auth/RegisterForm"
import AddCandidate from "@/features/candidates/Addcandidate"
import CandidatesManagement from "@/features/candidates/Candidatemanagement"
import CandidatesEngagementPage from "@/features/candidates/CandidatesEngagement"
import Dashboard from "@/features/dashboard/Dashboard"
import FaceGate from "@/features/face/FaceGate"
import Info from "@/features/info/Info"
import UserInfo from "@/features/info/UserInfo"
import ElectionSetup from "@/features/voting/ElectionSetup"
import VotingPanel from "@/features/voting/VotingPanel"
import { Route, Routes } from "react-router"
import ProtectedRoute from "./ProtectedRoute"


const AppRoutes = () => {
   
  return (
    <>
    <Routes>
      <Route path="/login" element={<LoginForm/>}/>
      <Route path="/register" element={<RegisterForm/>}/>
        <Route path="/" element={<Dashboard/>}/>
        <Route path="/admin/info" element={<Info/>}/>
        <Route path="/userinfo" element={<UserInfo/>}/>
        <Route path='/face' element={
          <ProtectedRoute><FaceGate/></ProtectedRoute>}/>
        <Route path='/admin/add-candidate' element={
          <ProtectedRoute><AddCandidate/></ProtectedRoute>}/>
        <Route path='/admin/candidate-mgt' element={
          <ProtectedRoute><CandidatesManagement/></ProtectedRoute>}/>
        <Route path="/vote" element={
          <ProtectedRoute><VotingPanel/></ProtectedRoute>}/>
        <Route path='/election' element={
          <ProtectedRoute><ElectionSetup/></ProtectedRoute>}/>
        <Route path='/engagement' element={
          <ProtectedRoute><CandidatesEngagementPage/></ProtectedRoute>}/>
    </Routes> 
    
    </>
  )
}

export default AppRoutes