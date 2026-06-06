import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import App from './App.jsx';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { isConfigured } from './api';
import SetupNotice from './components/SetupNotice.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isConfigured ? (
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    ) : (
      <SetupNotice />
    )}
  </React.StrictMode>
);
