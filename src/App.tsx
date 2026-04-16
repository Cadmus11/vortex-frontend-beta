import './App.css';
import AppCenter from "./app/AppCenter";
import { AuthProvider } from "./context/AuthContext";

const App = () => {
  return (
    <AuthProvider>
      <AppCenter />
    </AuthProvider>
  );
};

export default App;
