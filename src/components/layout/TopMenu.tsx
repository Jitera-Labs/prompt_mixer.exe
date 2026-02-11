import React, { useEffect, useState } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { useSettingsStore } from '../../stores/settingsStore';
import './TopMenu.css';

/**
 * TopMenu - Custom Title Bar & Menu
 * Features: Options menu item, app title, window controls
 */
const TopMenu: React.FC = () => {
  const toggleSettings = useSettingsStore((state) => state.toggleSettings);
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    const appWindow = getCurrentWindow();

    // Initial check
    appWindow.isMaximized().then(setIsMaximized);

    // Listen for resize to update maximized state (e.g. if snapped via OS gestures)
    const unlistenPromise = appWindow.listen('tauri://resize', async () => {
      setIsMaximized(await appWindow.isMaximized());
    });

    return () => {
      unlistenPromise.then((unlisten) => unlisten());
    };
  }, []);

  const handleMinimize = () => getCurrentWindow().minimize();
  const handleMaximize = async () => {
    const appWindow = getCurrentWindow();
    if (await appWindow.isMaximized()) {
      await appWindow.unmaximize();
    } else {
      await appWindow.maximize();
    }
  };
  const handleClose = () => getCurrentWindow().close();

  return (
    <header
      data-tauri-drag-region
      className="text-[#c0c0c0] px-4 py-2 flex justify-between items-center select-none relative overflow-hidden"
    >
      <div className="dither-container"></div>
      <svg style={{ height: 0, width: 0, position: 'absolute', pointerEvents: 'none' }}>
        <filter id="dither" colorInterpolationFilters="sRGB" x="0" y="0" width="100%" height="100%">
          <feImage width="4" height="4" xlinkHref="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAASElEQVR42gXBgQAAIAxFwW8QwhBCCCGEIYQQQgghhBBCCEMYwutOkphzYmbsvdG9l9YaEYG7o1or5xxKKay1UGYyxuC9R++dD7yGJkTj6F0HAAAAAElFTkSuQmCC" result="pattern" />
          <feTile in="pattern" result="pattern" />
          <feComposite operator="arithmetic" k1="2" k2="1" k3="1" k4="-0.5" in="SourceGraphic" in2="pattern" />
          <feComponentTransfer>
            <feFuncR type="discrete" tableValues="0 1"/>
            <feFuncG type="discrete" tableValues="0 1"/>
            <feFuncB type="discrete" tableValues="0 1"/>
          </feComponentTransfer>
        </filter>
      </svg>
      {/* Left: Functional Menu Items */}
      <nav className="flex gap-4 font-bold text-xl relative z-10">
      </nav>

      {/* Center: Application Title */}
      <div
        data-tauri-drag-region
        className="font-bold text-xl tracking-wider absolute left-1/2 transform -translate-x-1/2 cursor-default text-white z-10"
      >
        PROMPT_MIXER.EXE
      </div>

      {/* Right: Window Controls */}
      <div className="flex gap-4 items-center z-10 relative">
        {/* Window Controls (TUI Style) */}
        <div className="flex gap-2 font-bold font-mono text-xl ml-2 text-[#c0c0c0]">
          <button
            className="nc-window-control px-1 transition-colors"
            onClick={handleMinimize}
            title="Minimize"
          >
            [_]
          </button>
          <button
            className="nc-window-control px-1 transition-colors"
            onClick={handleMaximize}
            title={isMaximized ? "Restore" : "Maximize"}
          >
            {isMaximized ? '[^]' : '[□]'}
          </button>
          <button
            className="nc-window-control px-1 transition-colors"
            onClick={handleClose}
            title="Close"
          >
            [X]
          </button>
        </div>
      </div>
    </header>
  );
};

export default TopMenu;
