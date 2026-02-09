import { useEffect, useState } from 'react';
import { Plus, Trash, FloppyDisk, PencilSimple, ArrowsClockwise } from '@phosphor-icons/react';
import { useMixerStore } from '../../stores/mixerStore';
import { showToast } from '../ui/Toast';
import { IconRenderer } from '../ui/IconRenderer';
import type { AnchorPreset } from '../../lib/types';

interface AnchorFormData {
  label: string;
  prompt: string;
  icon: string;
  color: string;
}

const EMPTY_FORM: AnchorFormData = { label: '', prompt: '', icon: '🎭', color: '#808080' };

function AnchorForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: AnchorFormData;
  onSave: (data: AnchorFormData) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<AnchorFormData>(initial);

  const handleSubmit = () => {
    if (!form.label.trim()) return;
    onSave({ ...form, label: form.label.trim(), prompt: form.prompt.trim() });
  };

  return (
    <div className="anchor-form nc-form">
      <div className="anchor-form-row">
        <div className="nc-field">
          <label className="anchor-form-label nc-label">Icon</label>
          <input
            className="anchor-form-input anchor-form-icon-input nc-input"
            value={form.icon}
            onChange={e => setForm(f => ({ ...f, icon: e.target.value }))}
            placeholder="Icon or Emoji"
          />
        </div>
        <div style={{ marginLeft: 8, display: 'flex', alignItems: 'center' }}>
          <IconRenderer icon={form.icon} />
        </div>
        <div className="nc-field" style={{ marginLeft: 12 }}>
          <label className="anchor-form-label nc-label">Color</label>
          <input
            type="color"
            className="anchor-form-color nc-input"
            value={form.color}
            onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
          />
        </div>
      </div>
      <div className="anchor-form-row">
        <div className="nc-field" style={{ flex: 1 }}>
          <label className="anchor-form-label nc-label">Label</label>
          <input
            className="anchor-form-input nc-input"
            placeholder="Anchor label..."
            value={form.label}
            onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
            autoFocus
            onKeyDown={e => { if (e.key === 'Escape') onCancel(); }}
          />
        </div>
      </div>
      <div className="anchor-form-row">
        <div className="nc-field" style={{ flex: 1 }}>
          <label className="anchor-form-label nc-label">Prompt</label>
          <textarea
            className="anchor-form-input anchor-form-textarea nc-input"
            placeholder="System prompt for this anchor..."
            value={form.prompt}
            onChange={e => setForm(f => ({ ...f, prompt: e.target.value }))}
            rows={3}
          />
        </div>
      </div>
      <div className="anchor-form-actions">
        <button onClick={handleSubmit} className="anchor-form-btn anchor-form-btn-save nc-button">Save</button>
        <button onClick={onCancel} className="anchor-form-btn anchor-form-btn-cancel nc-button nc-button-ghost">Cancel</button>
      </div>
    </div>
  );
}

export function PresetsView() {
  const {
    presets, activePresetId, anchors,
    loadPresets, loadPresetAnchors, savePreset, deletePreset, setView,
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
    setView('canvas');
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
    <div className="nc-panel presets-view">
      <div className="nc-header">ANCHORS_AND_PRESETS</div>
      <div className="nc-section">
        <div className="nc-section-title">Anchors</div>
        <div className="nc-divider" />
        <div className="anchor-section-actions">
          <button
            onClick={() => resetPositions()}
            className="nc-button"
            title="Reset anchor positions to default circle layout"
          >
            <ArrowsClockwise size={14} />
            Reset Positions
          </button>
        </div>

        <div className="anchor-list">
          {anchors.map((anchor, i) => (
            <div key={`${anchor.name}-${i}`}>
              {editingIndex === i ? (
                <AnchorForm
                  initial={{ label: anchor.name, prompt: anchor.prompt, icon: anchor.icon, color: anchor.color }}
                  onSave={(data) => handleEditAnchor(i, data)}
                  onCancel={() => setEditingIndex(null)}
                />
              ) : (
                <div className="anchor-list-item nc-field">
                  <span className="anchor-list-icon">
                    <IconRenderer icon={anchor.icon} />
                  </span>
                  <span className="anchor-list-swatch" style={{ backgroundColor: anchor.color }} />
                  <span className="anchor-list-label">{anchor.name}</span>
                  <div className="anchor-list-actions">
                    <button
                      onClick={() => { setEditingIndex(i); setAddingAnchor(false); }}
                      className="anchor-action-btn nc-button"
                      title="Edit anchor"
                    >
                      <PencilSimple size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteAnchor(i)}
                      className="anchor-action-btn anchor-action-btn-delete nc-button"
                      title="Delete anchor"
                    >
                      <Trash size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {addingAnchor ? (
            <AnchorForm
              initial={EMPTY_FORM}
              onSave={handleAddAnchor}
              onCancel={() => setAddingAnchor(false)}
            />
          ) : (
            <button
              onClick={() => { setAddingAnchor(true); setEditingIndex(null); }}
              className="anchor-add-btn nc-button"
            >
              <Plus size={14} />
              Add Anchor
            </button>
          )}
        </div>
      </div>

      <div className="nc-section">
        <div className="nc-section-title">Presets</div>
        <div className="nc-divider" />
        {!showSaveInput ? (
          <div className="preset-actions">
            <button
              onClick={() => setShowSaveInput(true)}
              className="nc-button"
            >
              <FloppyDisk size={14} />
              Save Current
            </button>
          </div>
        ) : (
          <div className="nc-form">
            <div className="nc-field">
              <label className="nc-label">Preset Name</label>
              <input
                className="nc-input"
                placeholder="Preset name..."
                value={newPresetName}
                onChange={e => setNewPresetName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setShowSaveInput(false); }}
                autoFocus
              />
            </div>
            <div className="preset-form-actions">
              <button onClick={handleSave} className="nc-button">Save</button>
              <button onClick={() => setShowSaveInput(false)} className="nc-button nc-button-ghost">Cancel</button>
            </div>
          </div>
        )}

        <div className="preset-list">
          {presets.length === 0 ? (
            <div className="nc-label">No saved presets</div>
          ) : (
            presets.map(preset => (
              <div
                key={preset.id}
                className="preset-list-item nc-field"
                onClick={() => handleLoad(preset)}
              >
                <div className="preset-list-main">
                  <div className="preset-list-name">{preset.name}</div>
                  <div className="nc-label">{new Date(preset.updated_at).toLocaleDateString()}</div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); deletePreset(preset.id); }}
                  className="nc-button nc-button-ghost"
                  title="Delete preset"
                >
                  <Trash size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
