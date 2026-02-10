import { useMixerStore } from '../../stores/mixerStore';
import { MixerCanvas } from './MixerCanvas';
import { MixerControls } from './MixerControls';
import { ValueDisplay } from './ValueDisplay';
import { PresetsView } from './PresetsView';
import '../../styles/mixer.css';

export function PromptMixer() {
  const view = useMixerStore(s => s.view);
  const presets = useMixerStore(s => s.presets);
  const activePresetId = useMixerStore(s => s.activePresetId);

  const activePresetName = activePresetId
    ? presets.find(p => p.id === activePresetId)?.name.toUpperCase() || 'CUSTOM'
    : 'DEFAULT';

  return (
    <div className="min-h-0 flex flex-col h-full overflow-hidden pb-1">
      {/* Main Canvas Panel - Full Height */}
      <div className="nc-panel flex-grow relative flex flex-col overflow-hidden">
        <div className="nc-header">{view === 'canvas' ? 'CANVAS_MIXER' : 'ANCHORS_AND_PRESETS'}</div>
        <div className="flex items-center justify-between px-2 pt-4 pb-2 border-b border-dashed border-white">
          <MixerControls />
          <div className="text-[var(--nc-yellow)] text-sm">PRESETS: [{activePresetName}]</div>
        </div>
        <div className="flex-grow relative overflow-hidden">
          {view === 'canvas' ? <MixerCanvas /> : <PresetsView />}
        </div>
      </div>

      {/* Floating Weights Panel - Bottom Strip */}
      <div className="nc-panel h-[30%] relative flex flex-col overflow-hidden mt-2 shrink-0">
        <div className="nc-header">ANCHOR_WEIGHTS</div>
        <ValueDisplay />
      </div>
    </div>
  );
}
