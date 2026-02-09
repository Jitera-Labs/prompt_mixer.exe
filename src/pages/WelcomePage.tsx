import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lightning } from '@phosphor-icons/react';
import { useSettingsStore } from '../stores/settingsStore';
import { ModelSelector } from '../components/ui/ModelSelector';

export function WelcomePage() {
  const navigate = useNavigate();
  const { config, saveConfig } = useSettingsStore();
  const [providerUrl, setProviderUrl] = useState(config.providerUrl || 'https://api.openai.com/v1');
  const [apiKey, setApiKey] = useState(config.apiKey);
  const [model, setModel] = useState(config.model || 'gpt-4o-mini');
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState('');

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
    <div className="nc-screen">
      <div className="nc-center nc-welcome-center">
        <div className="nc-panel nc-welcome-panel">
        <div className="nc-header nc-welcome-header">
          <div>
            <Lightning size={24} weight="fill" />
          </div>
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
                type="url"
                value={providerUrl}
                onChange={e => setProviderUrl(e.target.value)}
                placeholder="https://api.openai.com/v1"
                className="nc-input"
              />
            </div>

            <div className="nc-field">
              <label className="nc-label">API Key</label>
              <div className="flex gap-3">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
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

            <div className="nc-field">
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
              Get Started
            </button>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
