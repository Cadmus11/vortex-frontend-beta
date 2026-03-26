import './App.css';
import AppCenter from "./app/AppCenter";
import { AuthProvider } from './hooks/useAuth'
import { CookiesProvider } from 'react-cookie';
import { useState } from 'react';


const App = () => {
  const [showConsent, setShowConsent] = useState(() => {
    return !document.cookie.includes('cookieConsent=true');
  });

  const acceptCookies = () => {
    document.cookie = 'cookieConsent=true; path=/; max-age=' + (7 * 24 * 60 * 60);
    setShowConsent(false);
  };

  return (
    <CookiesProvider>
      <AuthProvider>
        <AppCenter/>
      </AuthProvider>
      {showConsent && (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-800 text-white p-4 flex justify-between items-center z-50">
          <p>This website uses cookies to ensure you get the best experience.</p>
          <button 
            onClick={acceptCookies}
            className="bg-blue-500 px-4 py-2 rounded hover:bg-blue-600"
          >
            Accept
          </button>
        </div>
      )}
    </CookiesProvider>
  )
}

export default App
