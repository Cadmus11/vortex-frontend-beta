import './App.css';
import AppCenter from "./app/AppCenter";
import { ClerkProvider } from '@clerk/clerk-react';

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

const App = () => {
  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY || "pk_test_dev_mode"}>
      <AppCenter />
    </ClerkProvider>
  );
};

export default App;
