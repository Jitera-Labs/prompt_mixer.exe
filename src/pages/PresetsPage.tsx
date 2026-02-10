import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useMixerStore } from '../stores/mixerStore';
import { showToast } from '../components/ui/Toast';
import { IconRenderer } from '../components/ui/IconRenderer';
import { AnchorForm, AnchorFormData, EMPTY_FORM } from '../components/mixer/AnchorForm';
import type { AnchorPreset } from '../lib/types';
import '../styles/mixer.css'; // Ensure mixer styles are available

export function PresetsPage() {
  const navigate = useNavigate();
  const {
    presets, anchors,
    loadPresets, loadPresetAnchors, savePreset, deletePreset,
    addAnchor, updateAnchor, removeAnchor, resetPositions,
  } = useMixerStore();

  const [newPresetName, setNewPresetName] = useState('');
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [addingAnchor, setAddingAnchor] = useState(false);

  useEffect(() => { loadPresets(); }, []);

  const handleSave = async () => {
    if (!newPresetName.trim()) return;
    await savePreset(newPresetName.trim());
    setNewPresetName('');
    setShowSaveInput(false);
  };

  const handleLoad = async (preset: AnchorPreset) => {
    await loadPresetAnchors(preset.id);
    showToast({ message: `Loaded preset: ${preset.name}`, type: 'success' });
    // Intentionally not navigating away so user can edit anchors immediately
  };

  const handleAddAnchor = (data: AnchorFormData) => {
    addAnchor(data);
    setAddingAnchor(false);
  };

  const handleEditAnchor = (index: number, data: AnchorFormData) => {
    updateAnchor(index, {
      name: data.label,
      prompt: data.prompt,
      icon: data.icon,
      color: data.color,
    });
    setEditingIndex(null);
  };

  const handleDeleteAnchor = (index: number) => {
    const success = removeAnchor(index);
    if (!success) {
      showToast({ message: 'Cannot delete the last remaining anchor', type: 'error' });
    }
  };

  return (
    <div className="nc-screen-scroll">
      <div className="nc-center" style={{ paddingBottom: '2rem' }}>
        <div className="nc-panel" style={{ width: '900px', maxWidth: '95%' }}>
          <div className="nc-header">ANCHORS_AND_PRESETS</div>

          <div className="p-4">
            <button
              onClick={() => navigate('/app')}
              className="nc-button mb-4"
            >
              [ &lt; BACK TO MIXER ]
            </button>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

              {/* Left Column: Presets (Sidebar) */}
              <div className="flex flex-col gap-4 md:col-span-1 border-b md:border-b-0 md:border-r border-[var(--nc-white)] pb-4 md:pb-0 md:pr-4">
                 <div className="nc-section-title border-b border-[var(--nc-white)] pb-2 mb-2">PRESETS</div>

                 {!showSaveInput ? (
                    <button
                      onClick={() => setShowSaveInput(true)}
                      className="nc-button w-full mb-2 text-sm"
                    >
                      [SAVE CONFIG AS PRESET]
                    </button>
                  ) : (
                    <div className="nc-form border border-[var(--nc-cyan)] p-2 mb-2">
                      <div className="nc-field">
                        <label className="nc-label text-xs">PRESET NAME</label>
                        <input
                          className="nc-input w-full"
                          placeholder="PRESET NAME..."
                          value={newPresetName}
                          onChange={e => setNewPresetName(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setShowSaveInput(false); }}
                          autoFocus
                        />
                      </div>
                      <div className="preset-form-actions flex gap-2 mt-2">
                        <button onClick={handleSave} className="nc-button flex-1 text-xs">[SAVE]</button>
                        <button onClick={() => setShowSaveInput(false)} className="nc-button nc-button-ghost flex-1 text-xs">[CANCEL]</button>
                      </div>
                    </div>
                  )}

                  <div className="preset-list space-y-2 overflow-y-auto max-h-[60vh] custom-scrollbar">
                    {presets.length === 0 ? (
                      <div className="nc-label text-center py-4">NO SAVED PRESETS</div>
                    ) : (
                      presets.map(preset => (
                        <div
                          key={preset.id}
                          className="preset-list-item nc-field p-2 border border-transparent hover:border-[var(--nc-cyan)] cursor-pointer flex justify-between items-center group"
                          onClick={() => handleLoad(preset)}
                        >
                          <div className="preset-list-main overflow-hidden">
                            <div className="preset-list-name font-bold truncate group-hover:text-[var(--nc-cyan)] text-sm">{preset.name}</div>
                            <div className="nc-label text-[10px] opacity-70">{new Date(preset.updated_at).toLocaleDateString()}</div>
                          </div>
                          <div className="flex items-center gap-1">
                             <span className="text-xs text-[var(--nc-cyan)] opacity-0 group-hover:opacity-100 mr-1">[LOAD]</span>
                             <button
                                onClick={(e) => { e.stopPropagation(); deletePreset(preset.id); }}
                                className="nc-button nc-button-ghost px-1 py-0 text-red-400 hover:text-red-500 text-xs"
                                title="Delete preset"
                              >
                                [DEL]
                              </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
              </div>

              {/* Right Column: Anchors (Main Area) */}
              <div className="flex flex-col gap-4 md:col-span-2">
                <div className="nc-section-title border-b border-[var(--nc-white)] pb-2 mb-2 flex justify-between items-center">
                  <span>CURRENT CONFIGURATION</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => resetPositions()}
                      className="nc-button text-xs"
                      title="Reset anchor positions"
                    >
                      [RESET POSITIONS]
                    </button>
                  </div>
                </div>

                <div className="text-xs opacity-70 mb-2">
                  These are the anchors in your current prompt mixer session. Loading a preset from the left will replace these.
                </div>

                <div className="anchor-list space-y-2">
                  {anchors.map((anchor, i) => (
                    <div key={`${anchor.name}-${i}`}>
                      {editingIndex === i ? (
                        <div className="border border-[var(--nc-cyan)] p-2 bg-[var(--nc-bg-dark)]">
                          <AnchorForm
                            initial={{ label: anchor.name, prompt: anchor.prompt, icon: anchor.icon, color: anchor.color }}
                            onSave={(data) => handleEditAnchor(i, data)}
                            onCancel={() => setEditingIndex(null)}
                          />
                        </div>
                      ) : (
                       <div className="anchor-list-item nc-field flex items-center gap-2 p-2 border border-transparent hover:border-[var(--nc-cyan)]">
                          <span className="anchor-list-icon w-8 text-center text-xl">
                            <IconRenderer icon={anchor.icon} />
                          </span>
                          <span className="anchor-list-swatch w-4 h-4 border border-white" style={{ backgroundColor: anchor.color }} />
                          <div className="flex flex-col flex-grow overflow-hidden">
                              <span className="anchor-list-label font-bold truncate">{anchor.name}</span>
                              <span className="text-xs opacity-60 truncate">{anchor.prompt.substring(0, 60)}{anchor.prompt.length > 60 ? '...' : ''}</span>
                          </div>
                          <div className="anchor-list-actions flex gap-1">
                            <button
                              onClick={() => { setEditingIndex(i); setAddingAnchor(false); }}
                              className="nc-button nc-button-ghost px-2 py-0"
                            >
                              [EDIT]
                            </button>
                            <button
                              onClick={() => handleDeleteAnchor(i)}
                              className="nc-button nc-button-ghost px-2 py-0"
                            >
                              [DEL]
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {addingAnchor ? (
                    <div className="border border-[var(--nc-cyan)] p-2 bg-[var(--nc-bg-dark)] mt-2">
                       <AnchorForm
                        initial={EMPTY_FORM}
                        onSave={handleAddAnchor}
                        onCancel={() => setAddingAnchor(false)}
                      />
                    </div>
                  ) : (
                    <button
                      onClick={() => { setAddingAnchor(true); setEditingIndex(null); }}
                      className="nc-button w-full mt-2"
                    >
                      [ADD NEW ANCHOR]
                    </button>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
