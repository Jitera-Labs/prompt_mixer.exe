import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useMixerStore } from '../stores/mixerStore';
import { showToast } from '../components/ui/Toast';
import { IconRenderer } from '../components/ui/IconRenderer';
import { AnchorForm, AnchorFormData, EMPTY_FORM } from '../components/mixer/AnchorForm';
import type { AnchorPreset } from '../lib/types';
import '../styles/mixer.css';

export function PresetsPage() {
  const navigate = useNavigate();
  const {
    presets, anchors,
    loadPresets, loadPresetAnchors, savePreset, deletePreset,
    addAnchor, updateAnchor, removeAnchor, resetPositions,
    createNewPreset,
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
  };

  const handleAddAnchor = (data: AnchorFormData) => {
    addAnchor(data);
    setAddingAnchor(false);
  };

  const handleEditAnchor = (index: number, data: AnchorFormData) => {
    updateAnchor(index, {
      name: data.label,
      prompt: data.prompt,
      iconSmall: data.iconSmall,
      iconLarge: data.iconLarge,
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

  const isEditing = editingIndex !== null || addingAnchor;

  return (
    <div className="nc-screen h-screen w-screen flex flex-col overflow-hidden p-2">
      <div className="nc-panel flex-grow flex flex-col overflow-hidden relative">
        <div className="nc-header">ANCHORS_AND_PRESETS</div>

        <div className="flex flex-col flex-grow min-h-0 overflow-hidden">
            <button
              onClick={() => navigate('/app')}
              className="nc-button self-start mb-4"
            >
              [ &lt; BACK TO MIXER ]
            </button>

            <div className="flex flex-col md:flex-row flex-grow overflow-hidden gap-4">

              {/* Left Column: Presets (Sidebar) */}
              <div className={`flex flex-col gap-4 md:w-1/3 border-b md:border-b-0 md:border-r border-[var(--nc-white)] pb-4 md:pb-0 md:pr-4 overflow-hidden flex-grow md:flex-grow-0 min-h-0 ${isEditing ? 'hidden md:flex opacity-50 pointer-events-none' : ''}`}>
                 <div className="nc-section-title border-b border-[var(--nc-white)] pb-2 mb-2 shrink-0">PRESETS</div>

                 <button
                   onClick={() => {
                     createNewPreset();
                     showToast({ message: 'Created new empty preset', type: 'info' });
                   }}
                   className="nc-button w-full mb-2 shrink-0"
                 >
                   [ NEW PRESET ]
                 </button>

                 {!showSaveInput ? (
                    <button
                      onClick={() => setShowSaveInput(true)}
                      className="nc-button w-full mb-2 shrink-0"
                    >
                      [SAVE CONFIG AS PRESET]
                    </button>
                  ) : (
                    <div className="nc-form border border-[var(--nc-cyan)] p-2 mb-2 shrink-0">
                      <div className="nc-field">
                        <label className="nc-label">PRESET NAME</label>
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
                        <button onClick={handleSave} className="nc-button flex-1">[SAVE]</button>
                        <button onClick={() => setShowSaveInput(false)} className="bg-transparent border-0 text-[var(--nc-white)] hover:bg-[var(--nc-white)] hover:text-black flex-1">[CANCEL]</button>
                      </div>
                    </div>
                  )}

                  <div className="preset-list space-y-2 overflow-y-auto flex-grow custom-scrollbar min-h-0">
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
                            <div className="preset-list-name truncate group-hover:text-[var(--nc-cyan)]">{preset.name}</div>
                            <div className="nc-label text-[var(--nc-gray)]">{new Date(preset.updated_at).toLocaleDateString()}</div>
                          </div>
                          <div className="flex items-center gap-1">
                             <button
                               onClick={(e) => { e.stopPropagation(); handleLoad(preset); }}
                               className="bg-transparent border-0 px-1 text-[var(--nc-cyan)] hover:bg-[var(--nc-cyan)] hover:text-black cursor-pointer"
                               title="Load preset"
                             >
                               [LOAD]
                             </button>
                             <button
                                onClick={(e) => { e.stopPropagation(); deletePreset(preset.id); }}
                                className="bg-transparent border-0 px-1 text-[var(--nc-yellow)] hover:bg-[var(--nc-yellow)] hover:text-black cursor-pointer"
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
              <div className="flex flex-col gap-4 md:w-2/3 flex-grow md:flex-grow-0 min-h-0 overflow-hidden relative">

                {isEditing ? (
                  // EDIT MODE
                  <div className="flex flex-col h-full overflow-hidden">
                    <div className="nc-section-title border-b border-[var(--nc-white)] pb-2 mb-2 shrink-0">
                      {addingAnchor ? 'NEW ANCHOR' : 'EDIT ANCHOR'}
                    </div>
                    <div className="flex-grow min-h-0 overflow-hidden bg-[var(--nc-bg-dark)] border border-[var(--nc-cyan)] p-4">
                      <AnchorForm
                        initial={addingAnchor ? EMPTY_FORM : {
                            label: anchors[editingIndex!]?.name || '',
                            prompt: anchors[editingIndex!]?.prompt || '',
                            iconSmall: anchors[editingIndex!]?.iconSmall || '?',
                            iconLarge: anchors[editingIndex!]?.iconLarge || '',
                            color: anchors[editingIndex!]?.color || '#808080'
                        }}
                        onSave={(data) => addingAnchor ? handleAddAnchor(data) : handleEditAnchor(editingIndex!, data)}
                        onCancel={() => { setAddingAnchor(false); setEditingIndex(null); }}
                      />
                    </div>
                  </div>
                ) : (
                  // LIST MODE
                  <div className="flex flex-col h-full overflow-hidden">
                    <div className="nc-section-title border-b border-[var(--nc-white)] pb-2 mb-2 flex justify-between items-center shrink-0">
                      <span>CURRENT CONFIGURATION</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => resetPositions()}
                          className="bg-transparent border-0 px-1 text-[var(--nc-cyan)] hover:bg-[var(--nc-cyan)] hover:text-black"
                          title="Reset anchor positions"
                        >
                          [RESET POSITIONS]
                        </button>
                      </div>
                    </div>

                    <div className="text-[var(--nc-gray)] mb-2 shrink-0">
                      These are the anchors in your current prompt mixer session. Loading a preset from the left will replace these.
                    </div>

                    <div className="anchor-list space-y-2 overflow-y-auto flex-grow custom-scrollbar min-h-0">
                      {anchors.map((anchor, i) => (
                        <div key={`${anchor.name}-${i}`} className="anchor-list-item nc-field flex flex-col p-2 border border-transparent hover:border-[var(--nc-cyan)] group gap-2">
                              {/* Header: Icon | Color Swatch | Label */}
                              <div className="flex items-center gap-2 w-full">
                                <span className="anchor-list-icon w-8 text-center flex justify-center items-center shrink-0">
                                  <IconRenderer icon={anchor.iconSmall} />
                                </span>
                                <span className="anchor-list-swatch w-3 h-3 border border-white shrink-0" style={{ backgroundColor: anchor.color }} />
                                <span className="anchor-list-label font-bold text-[var(--nc-white)]">{anchor.name}</span>
                              </div>

                              {/* Description: Prompt text */}
                              <div className="w-full text-[var(--nc-gray)] break-words whitespace-pre-wrap">
                                  {anchor.prompt}
                              </div>

                              {/* Buttons */}
                              <div className="anchor-list-actions flex gap-2 w-full">
                                <button
                                  onClick={() => { setEditingIndex(i); setAddingAnchor(false); }}
                                  className="bg-transparent border-0 px-1 text-[var(--nc-white)] hover:bg-[var(--nc-white)] hover:text-black cursor-pointer"
                                >
                                  [EDIT]
                                </button>
                                <button
                                  onClick={() => handleDeleteAnchor(i)}
                                  className="bg-transparent border-0 px-1 text-[var(--nc-white)] hover:bg-[var(--nc-white)] hover:text-black cursor-pointer"
                                >
                                  [DEL]
                                </button>
                              </div>
                            </div>
                      ))}
                    </div>

                    <div className="shrink-0 mt-2">
                        <button
                            onClick={() => { setAddingAnchor(true); setEditingIndex(null); }}
                            className="nc-button w-full py-3"
                        >
                            [ADD NEW ANCHOR]
                        </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
        </div>
      </div>
    </div>
  );
}
