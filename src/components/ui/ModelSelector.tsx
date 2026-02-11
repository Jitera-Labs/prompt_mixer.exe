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
    } catch (e: any) {
      console.warn('Failed to fetch models:', e);
      setError(typeof e === 'string' ? e : e?.message || 'Failed to fetch models');
      setModels([]);
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

  useEffect(() => {
    if (models.length > 0 && model && !models.includes(model)) {
      onChange('');
    }
  }, [models, model, onChange]);

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
            {!loading && models.length === 0 && (
              <option value="">API conection required</option>
            )}
            {!loading && models.length > 0 && !model && (
              <option value="">Select a model</option>
            )}
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
      {error && (
        <p className="mt-2 text-sm" style={{ color: 'var(--nc-warn)' }}>
          Could not load models from API
        </p>
      )}
    </div>
  );
}
