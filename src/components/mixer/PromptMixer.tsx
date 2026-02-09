import { useMixerStore } from '../../stores/mixerStore';
import { MixerCanvas } from './MixerCanvas';
import { MixerControls } from './MixerControls';
import { ValueDisplay } from './ValueDisplay';
import '../../styles/mixer.css';

export function PromptMixer() {
  return (
    <div className="flex flex-col h-full overflow-visible pb-1">
      {/* Main Canvas Panel - Full Height */}
      <div className="nc-panel flex-grow relative flex flex-col overflow-visible"> {/** Changed overflow-hidden to overflow-visible and added padding-bottom 1px */}
        <div className="nc-header">CANVAS_MIXER</div>
        <div className="flex items-center justify-between px-2 pt-4 pb-2 border-b border-dashed border-white">
          <MixerControls />
          <div className="text-[var(--nc-yellow)] text-sm">PRESETS: [DEFAULT]</div>
        </div>
        <div className="flex-grow relative overflow-hidden">
          <MixerCanvas />
        </div>
      </div>

      {/* Floating Weights Panel - Bottom Strip */}
      <div className="nc-panel h-1/2 relative flex flex-col overflow-visible mt-2">
        <div className="nc-header">ANCHOR_WEIGHTS</div>
        <ValueDisplay />
      </div>
    </div>
  );
}
