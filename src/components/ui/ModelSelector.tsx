import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchModels } from '../../lib/tauri';

interface ModelSelectorProps {
  providerUrl: string;
  apiKey: string;
  model: string;
  onChange: (model: string) => void;
  /** Extra className for the outer wrapper */
  className?: string;
}

export function ModelSelector({
  providerUrl,
  apiKey,
  model,
  onChange,
  className = '',
}: ModelSelectorProps) {
  const [models, setModels] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [manualMode, setManualMode] = useState(false);
  const fetchedFor = useRef<string>('');

  const doFetch = useCallback(async () => {
    const url = providerUrl.trim();
    const key = apiKey.trim();
    if (!url || !key) {
      setModels([]);
      setError('');
      return;
    }
    const cacheKey = `${url}|${key}`;
    if (fetchedFor.current === cacheKey && models.length > 0) return;

    setLoading(true);
    setError('');
    try {
      const result = await fetchModels(url, key);
      setModels(result);
      fetchedFor.current = cacheKey;
      if (result.length > 0) {
        setManualMode(false);
      } else {
        setManualMode(true);
      }
    } catch (e: any) {
      console.warn('Failed to fetch models:', e);
      setError(typeof e === 'string' ? e : e?.message || 'Failed to fetch models');
      setModels([]);
      setManualMode(true);
    } finally {
      setLoading(false);
    }
  }, [providerUrl, apiKey]);

  // Auto-fetch when provider URL or API key changes (debounced)
  useEffect(() => {
    const url = providerUrl.trim();
    const key = apiKey.trim();
    if (!url || !key) return;

    const timer = setTimeout(() => {
      doFetch();
    }, 500);
    return () => clearTimeout(timer);
  }, [providerUrl, apiKey, doFetch]);

  const handleRefresh = () => {
    fetchedFor.current = '';
    doFetch();
  };

  // Manual input fallback
  if (manualMode && models.length === 0) {
    return (
      <div className={className}>
        <div className="flex gap-3">
          <input
            type="text"
            value={model}
            onChange={e => onChange(e.target.value)}
            placeholder="e.g. gpt-4o-mini"
            className="nc-input flex-1"
          />
          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading || !providerUrl.trim() || !apiKey.trim()}
            title="Retry fetching models"
            className="nc-button"
            style={{ width: '42px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
          >
            <span className={loading ? 'animate-pulse' : ''}>[R]</span>
          </button>
        </div>
        {error && (
          <p className="flex items-center gap-2 mt-2 text-sm" style={{ color: 'var(--nc-warn)' }}>
            <span className="font-bold">[!]</span>
            Could not load models — enter manually
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex gap-3">
        <div className="relative flex-1">
          <select
            value={models.includes(model) ? model : ''}
            onChange={e => {
              onChange(e.target.value);
            }}
            className="nc-select w-full cursor-pointer"
          >
            {loading && <option value="">Loading models…</option>}
            {!loading && !models.includes(model) && model && (
              <option value="" disabled>
                {model} (not in list)
              </option>
            )}
            {!loading && !model && <option value="">Select a model</option>}
            {models.map(m => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <span
            className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none font-bold"
            style={{ color: 'var(--nc-panel-text)' }}
          >
            ▼
          </span>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={loading || !providerUrl.trim() || !apiKey.trim()}
          title="Refresh models"
          className="nc-button"
          style={{ width: '42px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
        >
          <span className={loading ? 'animate-pulse' : ''}>[R]</span>
        </button>
      </div>
      {!loading && !models.includes(model) && model && (
        <p className="mt-2 text-sm">
          Currently set to "{model}" — select from dropdown or switch to manual entry
        </p>
      )}
    </div>
  );
}
