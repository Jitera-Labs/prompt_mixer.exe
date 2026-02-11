import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useSettingsStore } from './stores/settingsStore';
import { useMixerStore } from './stores/mixerStore';
import { AppLayout } from './layouts/AppLayout';
import TopMenu from './components/layout/TopMenu';
import { WelcomePage } from './pages/WelcomePage';
import { PresetsPage } from './pages/PresetsPage';
import { ToastContainer } from './components/ui/Toast';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import CRTEffect from './components/layout/CRTEffect';

function App() {
  const { loadSettings, isConfigured, theme } = useSettingsStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      loadSettings(),
      useMixerStore.getState().loadPresets(),
      useMixerStore.getState().loadSession()
    ]).finally(() => setIsLoading(false));
  }, []);

  // Apply theme to root element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

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
        <div className="flex flex-col h-screen w-screen overflow-hidden bg-[var(--nc-black)] border-2 border-[#808080] box-border">
          <div className="shrink-0 z-50">
            <TopMenu />
          </div>
          <div className="flex-1 overflow-hidden relative">
            <Routes>
              <Route path="/welcome" element={<WelcomePage />} />
              <Route path="/app" element={<AppLayout />} />
              <Route path="/presets" element={<PresetsPage />} />
              <Route path="*" element={<Navigate to={isConfigured ? "/app" : "/welcome"} replace />} />
            </Routes>
          </div>
        </div>
        <CRTEffect />
        <ToastContainer />
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
