import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import MainApp from './components/MainApp';
import './index.css';

const rootElement = document.getElementById('root');

if (rootElement) {
  try {
    createRoot(rootElement).render(
      <StrictMode>
        <LanguageProvider>
          <AuthProvider>
            <MainApp />
          </AuthProvider>
        </LanguageProvider>
      </StrictMode>
    );
  } catch (error) {
    console.error('❌ Failed to render app:', error);
    rootElement.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #f3f4f6; font-family: system-ui;">
        <div style="text-align: center; padding: 2rem; background: white; border-radius: 0.5rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <h1 style="color: #dc2626; font-size: 1.5rem; margin-bottom: 1rem;">Σφάλμα Εφαρμογής</h1>
          <p style="color: #6b7280; margin-bottom: 1rem;">Κάτι πήγε στραβά κατά τη φόρτωση της εφαρμογής.</p>
          <button onclick="window.location.reload()" style="background: #2563eb; color: white; padding: 0.5rem 1rem; border: none; border-radius: 0.375rem; cursor: pointer;">
            Ανανέωση Σελίδας
          </button>
          <pre style="margin-top: 1rem; padding: 1rem; background: #f3f4f6; border-radius: 0.375rem; text-align: left; font-size: 0.875rem; overflow: auto;">${error}</pre>
        </div>
      </div>
    `;
  }
} else {
  console.error('❌ Root element not found');
}