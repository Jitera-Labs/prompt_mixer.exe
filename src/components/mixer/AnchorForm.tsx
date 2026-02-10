import { useState } from 'react';
import { IconRenderer } from '../ui/IconRenderer';

export interface AnchorFormData {
  label: string;
  prompt: string;
  icon: string;
  color: string;
}

export const EMPTY_FORM: AnchorFormData = { label: '', prompt: '', icon: '🎭', color: '#808080' };

export function AnchorForm({
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
        <div className="anchor-icon-preview">
          <IconRenderer icon={form.icon} />
        </div>
        <div className="nc-field">
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
        <div className="nc-field flex-1">
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
        <div className="nc-field flex-1">
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
        <button onClick={handleSubmit} className="nc-button">[SAVE]</button>
        <button onClick={onCancel} className="nc-button nc-button-ghost">[CANCEL]</button>
      </div>
    </div>
  );
}
