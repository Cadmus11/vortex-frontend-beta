import './App.css';
import AppCenter from "./app/AppCenter";
import { AuthProvider } from './hooks/useAuth'


const App = () => {
  return (
    <AuthProvider>
      <AppCenter/>
    </AuthProvider>
  )
}

export default App
