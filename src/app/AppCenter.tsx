import { BrowserRouter } from "react-router"
import '../App.css'
import Layout from "./Layout"
import AppProtectedRoutes from "./routes"
import { ErrorBoundary } from "./ErrorBoundary"

const AppCenter = () => {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Layout>
          <AppProtectedRoutes />
        </Layout>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default AppCenter
