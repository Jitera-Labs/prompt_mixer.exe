import { useMixerStore } from '../../stores/mixerStore';
import { useSettingsStore } from '../../stores/settingsStore';

export function MixerControls() {
  const isPaused = useMixerStore(s => s.isPaused);
  const speed = useMixerStore(s => s.speed);
  const togglePause = useMixerStore(s => s.togglePause);
  const toggleSpeed = useMixerStore(s => s.toggleSpeed);

  return (
    <div className="flex gap-2">
      <button
        onClick={togglePause}
        className="bg-transparent border-none text-[var(--nc-cyan)] hover:bg-[var(--nc-cyan)] hover:text-[var(--nc-black)] py-0 px-1 cursor-pointer"
      >
        {isPaused ? '[PLAY]' : '[PAUSE]'}
      </button>
      <button
        onClick={toggleSpeed}
        className="bg-transparent border-none text-[var(--nc-cyan)] hover:bg-[var(--nc-cyan)] hover:text-[var(--nc-black)] py-0 px-1 cursor-pointer"
      >
        {speed === 'slow' ? '[SLOW]' : '[FAST]'}
      </button>
    </div>
  );
}
