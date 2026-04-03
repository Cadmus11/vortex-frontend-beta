import { BrowserRouter } from "react-router"
import '../App.css'
import Layout from "./Layout"
import { ThemeProvider } from "./ThemeProvider"
import AppProtectedRoutes from "./routes"
import { ErrorBoundary } from "./ErrorBoundary"

const AppCenter = () => {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <BrowserRouter>
          <Layout>
            <AppProtectedRoutes />
          </Layout>
        </BrowserRouter>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default AppCenter
