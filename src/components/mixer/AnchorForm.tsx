import { useState } from 'react';

export interface AnchorFormData {
  label: string;
  prompt: string;
  iconSmall: string;
  iconLarge: string;
  color: string;
}

export const EMPTY_FORM: AnchorFormData = { label: '', prompt: '', iconSmall: '?', iconLarge: '╔═══╗\n║ ? ║\n╚═══╝', color: '#808080' };

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
    <div className="anchor-form nc-form flex flex-col h-full w-full overflow-hidden">
      <div className="flex gap-4 mb-4 shrink-0">
        <div className="nc-field flex-grow">
          <label className="anchor-form-label nc-label">LABEL</label>
          <input
            className="anchor-form-input nc-input w-full"
            placeholder="ANCHOR LABEL..."
            value={form.label}
            onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
            autoFocus
            onKeyDown={e => { if (e.key === 'Escape') onCancel(); }}
          />
        </div>
        <div className="nc-field">
          <label className="anchor-form-label nc-label">COLOR</label>
          <input
            type="color"
            className="anchor-form-color nc-input h-10 w-20 p-1 cursor-pointer"
            value={form.color}
            onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
          />
        </div>
      </div>

      <div className="flex gap-4 mb-4 shrink-0">
        <div className="nc-field">
          <label className="anchor-form-label nc-label">SMALL ICON (2 chars)</label>
          <input
            className="anchor-form-input nc-input text-center"
            value={form.iconSmall}
            onChange={e => setForm(f => ({ ...f, iconSmall: e.target.value.slice(0, 2) }))}
            placeholder="??"
          />
        </div>
        <div className="nc-field flex-1">
          <label className="anchor-form-label nc-label">LARGE ICON (ASCII)</label>
          <textarea
            className="anchor-form-input nc-textarea font-mono resize-none"
            value={form.iconLarge}
            onChange={e => setForm(f => ({ ...f, iconLarge: e.target.value }))}
            placeholder="ASCII ART"
          />
        </div>
      </div>

      <div className="nc-field flex-grow flex flex-col min-h-0 mb-4">
        <label className="anchor-form-label nc-label">PROMPT DEFINITION</label>
        <textarea
          className="anchor-form-input anchor-form-textarea nc-textarea flex-grow w-full resize-none custom-scrollbar"
          style={{ minHeight: '300px' }}
          placeholder="SYSTEM PROMPT FOR THIS ANCHOR..."
          value={form.prompt}
          onChange={e => setForm(f => ({ ...f, prompt: e.target.value }))}
        />
      </div>

      <div className="anchor-form-actions flex gap-4 shrink-0">
        <button onClick={handleSubmit} className="nc-button min-w-[100px]">[SAVE]</button>
        <button
          onClick={onCancel}
          className="bg-transparent border-0 text-[var(--nc-white)] hover:bg-[var(--nc-white)] hover:text-black min-w-[100px]"
        >
          [CANCEL]
        </button>
      </div>
    </div>
  );
}
