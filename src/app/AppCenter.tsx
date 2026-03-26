// src/app/App.tsx
import { AuthProvider } from "@/hooks/useAuth"
import { BrowserRouter } from "react-router"
import '../App.css'
import Layout from "./Layout"
import { ThemeProvider } from "./ThemeProvider"
import AppProtectedRoutes from "./routes"
import { ErrorBoundary } from "./ErrorBoundary"



const AppCenter = () => {
  return (
    <ErrorBoundary>
    <AuthProvider>
    <ThemeProvider >
    
      <BrowserRouter>
      <Layout>
  <AppProtectedRoutes/>
      </Layout>
      </BrowserRouter>
    

    </ThemeProvider>
    </AuthProvider>
    </ErrorBoundary>
  )
}

export default AppCenter
