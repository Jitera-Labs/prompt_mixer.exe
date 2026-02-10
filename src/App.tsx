import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useSettingsStore } from './stores/settingsStore';
import { AppLayout } from './layouts/AppLayout';
import { WelcomePage } from './pages/WelcomePage';
import { SettingsPage } from './pages/SettingsPage';
import { PresetsPage } from './pages/PresetsPage';
import { ToastContainer } from './components/ui/Toast';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import CRTEffect from './components/layout/CRTEffect';

function App() {
  const { loadSettings, isConfigured, enableVisualEffects, theme } = useSettingsStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings().finally(() => setIsLoading(false));
  }, []);

  // Apply theme and visual effects to root element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-visual-effects', String(enableVisualEffects));
  }, [theme, enableVisualEffects]);

  if (isLoading) {
    return (
      <div className="nc-screen nc-center">
        <div className="nc-panel">
          <div className="nc-header">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/welcome" element={<WelcomePage />} />
          <Route path="/app" element={<AppLayout />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/presets" element={<PresetsPage />} />
          <Route path="*" element={<Navigate to={isConfigured ? "/app" : "/welcome"} replace />} />
        </Routes>
        <CRTEffect />
        <ToastContainer />
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
