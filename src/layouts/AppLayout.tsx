import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/chat/Sidebar';
import { ChatArea } from '../components/chat/ChatArea';
import { PromptMixer } from '../components/mixer/PromptMixer';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useSettingsStore } from '../stores/settingsStore';
import { SettingsModal } from '../components/settings/SettingsModal';
import FunctionBar from '../components/layout/FunctionBar';
import TopMenu from '../components/layout/TopMenu';

export function AppLayout() {
  const navigate = useNavigate();
  useKeyboardShortcuts();

  // Network connectivity state
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Function key handler
  const handleFunctionKey = (key: number) => {
    switch (key) {
      case 8: // F8 - Presets
        navigate('/presets');
        break;
      case 9: // F9 - Settings
        useSettingsStore.getState().toggleSettings();
        break;
      default:
        console.log(`Function key F${key} pressed`);
    }
  };

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="nc-screen h-screen w-screen overflow-hidden flex flex-col">
      <div
        className="flex-grow grid gap-2 px-[var(--nc-pad-sm)] pb-[var(--nc-pad-sm)] pt-2 bg-[var(--nc-black)] min-h-0"
        style={{
          gridTemplateColumns: isSidebarOpen ? '260px 450px 1fr' : '50px 450px 1fr',
          gridTemplateRows: '1fr',
          transition: 'all 0.3s ease',
        }}
      >
        {/* Left Sidebar - Chat */}
        <aside className="sidebar-left max-md:hidden overflow-visible h-full min-h-0">
          <Sidebar collapsed={!isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
        </aside>

        {/* Main Content Area - Chat Area */}
        <main className="relative overflow-visible h-full min-h-0">
          <ChatArea />
        </main>

        {/* Right Sidebar - Prompt Mixer */}
        <aside className="mixer-right max-md:hidden overflow-visible h-full min-h-0">
          <PromptMixer />
        </aside>
      </div>

      {/* Function Bar - Fixed at bottom */}
      <div className="shrink-0">
        <FunctionBar onAction={handleFunctionKey} />
      </div>

      <SettingsModal />

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 1024px) {
          .nc-screen > div.grid {
            grid-template-columns: ${isSidebarOpen ? '200px' : '50px'} 350px 1fr !important;
          }
        }

        @media (max-width: 768px) {
          .nc-screen > div.grid {
            grid-template-columns: 1fr !important;
            grid-template-rows: 1fr 1fr !important;
          }
          /* Hide left sidebar */
          .sidebar-left {
            display: none !important;
          }
          /* Show Chat (main) and place on top */
          main {
            grid-row: 1;
          }
          /* Place Mixer on bottom and show it */
          .mixer-right {
            display: block !important;
            grid-row: 2;
          }
        }
      `}</style>
    </div>
  );
}
