import React from 'react';
import { useSettingsStore } from '../../stores/settingsStore';


/**
 * TopMenu - Norton Commander style top menu bar
 * Features: File/Edit/Search/Options/Help menu items, app title, settings icon
 */
const TopMenu: React.FC = () => {
  const toggleSettings = useSettingsStore((state) => state.toggleSettings);

  return (
    <header className="bg-[var(--nc-cyan)] text-black border-b-2 border-black px-4 py-2 flex justify-between items-center">
      {/* Left: Menu Items */}
      <nav className="flex gap-4 font-bold text-xl">
        <button className="hover:opacity-80">
          <span className="underline decoration-2 underline-offset-2 decoration-red-900">F</span>ile
        </button>
        <button className="hover:opacity-80">
          <span className="underline decoration-2 underline-offset-2 decoration-red-900">E</span>dit
        </button>
        <button className="hover:opacity-80">
          <span className="underline decoration-2 underline-offset-2 decoration-red-900">S</span>earch
        </button>
        <button className="hover:opacity-80" onClick={toggleSettings}>
          <span className="underline decoration-2 underline-offset-2 decoration-red-900">O</span>ptions
        </button>
        <button className="hover:opacity-80">
          <span className="underline decoration-2 underline-offset-2 decoration-red-900">H</span>elp
        </button>
      </nav>

      {/* Center: Application Title */}
      <div className="font-bold text-xl tracking-wider">
        PROMPT_MIXER_PRO.EXE
      </div>

      {/* Right: Settings Icon */}
      <button className="cursor-pointer hover:opacity-80" aria-label="Settings" onClick={toggleSettings}>
        <span className="material-symbols-outlined text-3xl">settings</span>
      </button>
    </header>
  );
};

export default TopMenu;
