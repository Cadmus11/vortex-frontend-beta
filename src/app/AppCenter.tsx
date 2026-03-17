// src/app/App.tsx
import { AuthProvider } from "@/hooks/useAuth"
import { BrowserRouter } from "react-router"
import '../App.css'
import Layout from "./Layout"
import { ThemeProvider } from "./ThemeProvider"
import AppRoutes from "./routes"



const AppCenter = () => {
  return (
    
    <AuthProvider>
    <ThemeProvider >
    
      <BrowserRouter>
      <Layout>
      <AppRoutes/>
      </Layout>
      </BrowserRouter>
    

    </ThemeProvider>
    </AuthProvider>
  )
}

export default AppCenter
