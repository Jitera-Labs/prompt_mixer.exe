import { useState, useRef } from 'react';
import type { MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettingsStore } from '../stores/settingsStore';
import { ModelSelector } from '../components/ui/ModelSelector';

export function WelcomePage() {
  const navigate = useNavigate();
  const { config, saveConfig } = useSettingsStore();
  const [providerUrl, setProviderUrl] = useState(config.providerUrl || 'http://localhost:11434/v1');
  const [apiKey, setApiKey] = useState(config.apiKey);
  const [model, setModel] = useState(config.model || '');
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState('');

  const providerInputRef = useRef<HTMLInputElement>(null);
  const apiKeyInputRef = useRef<HTMLInputElement>(null);

  const handleModelInteraction = (event: MouseEvent<HTMLElement>) => {
    if (!providerUrl.trim()) {
      event.preventDefault();
      event.stopPropagation();
      setError('Please enter a Provider URL first to fetch models');
      providerInputRef.current?.focus();
      return;
    }
    if (!apiKey.trim()) {
      event.preventDefault();
      event.stopPropagation();
      setError('Please enter an API Key first to fetch models');
      apiKeyInputRef.current?.focus();
      return;
    }
  };

  const handleSubmit = async () => {
    if (!providerUrl.trim() || !apiKey.trim() || !model.trim()) {
      setError('All fields are required');
      return;
    }

    await saveConfig({
      ...config,
      providerUrl: providerUrl.trim(),
      apiKey: apiKey.trim(),
      model: model.trim(),
    });

    navigate('/app');
  };

  return (
    <div className="h-full overflow-hidden">
      <div className="h-full flex items-center justify-center">
        <div className="nc-panel nc-welcome-panel">
          <div className="nc-header nc-welcome-header">
            <div>
              <h1>Welcome to Prompt Mixer</h1>
              <p>Configure your LLM provider to get started</p>
            </div>
          </div>

          <div className="nc-section">
            <div className="nc-form">
              <div className="nc-field">
                <label className="nc-label">Provider URL</label>
                <input
                  ref={providerInputRef}
                  type="url"
                  value={providerUrl}
                  onChange={event => setProviderUrl(event.target.value)}
                  placeholder="http://localhost:11434/v1"
                  className="nc-input"
                />
              </div>

              <div className="nc-field">
                <label className="nc-label">API Key</label>
                <div className="flex gap-3">
                  <input
                    ref={apiKeyInputRef}
                    type={showKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={event => setApiKey(event.target.value)}
                    placeholder="sk-..."
                    className="nc-input flex-1"
                  />
                  <button
                    onClick={() => setShowKey(!showKey)}
                    className="nc-button"
                    style={{ minWidth: '80px' }}
                  >
                    {showKey ? 'HIDE' : 'SHOW'}
                  </button>
                </div>
              </div>

              <div className="nc-field" onClickCapture={handleModelInteraction}>
                <label className="nc-label">Model</label>
                <ModelSelector
                  providerUrl={providerUrl}
                  apiKey={apiKey}
                  model={model}
                  onChange={setModel}
                />
              </div>

              {error && (
                <p>{error}</p>
              )}

              <button
                onClick={handleSubmit}
                className="nc-button"
              >
                [Get Started]
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
