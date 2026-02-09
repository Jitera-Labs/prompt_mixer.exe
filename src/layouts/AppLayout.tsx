import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/chat/Sidebar';
import { ChatArea } from '../components/chat/ChatArea';
import { PromptMixer } from '../components/mixer/PromptMixer';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import FunctionBar from '../components/layout/FunctionBar';
import CRTEffect from '../components/layout/CRTEffect';

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
      case 9: // F9 - Settings
        navigate('/settings');
        break;
      default:
        console.log(`Function key F${key} pressed`);
    }
  };

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="nc-screen h-screen w-screen overflow-hidden flex flex-col">
      <CRTEffect />

      <div
        className="flex-grow grid gap-1 px-[var(--nc-pad-sm)] pb-[var(--nc-pad-sm)] pt-8 bg-[var(--nc-black)] min-h-0"
        style={{
          gridTemplateColumns: isSidebarOpen ? '260px 400px 1fr' : '50px 400px 1fr',
          gridTemplateRows: '1fr',
          transition: 'all 0.3s ease',
        }}
      >
        {/* Left Sidebar - Chat */}
        <aside className="sidebar-left max-md:hidden overflow-visible h-full min-h-0">
          <Sidebar collapsed={!isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
        </aside>

        {/* Main Content Area - Chat Thread */}
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

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 1024px) {
          .nc-screen > div.grid {
            grid-template-columns: ${isSidebarOpen ? '200px' : '50px'} 300px 1fr !important;
          }
        }

        @media (max-width: 768px) {
          .nc-screen > div.grid {
            grid-template-columns: 0px 1fr 0px !important;
          }
          /* Hide elements when width is 0 */
          .sidebar-left, .mixer-right {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
