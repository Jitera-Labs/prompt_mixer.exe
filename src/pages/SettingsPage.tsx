import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettingsStore } from '../stores/settingsStore';
import { ModelSelector } from '../components/ui/ModelSelector';
import { Checkbox } from '../components/ui/Checkbox';

export function SettingsPage() {
  const navigate = useNavigate();
  const {
    config,
    theme,
    saveConfig,
    setTheme,
    enableCRTEffect,
    setPerformanceSetting
  } = useSettingsStore();

  const [providerUrl, setProviderUrl] = useState(config.providerUrl);
  const [apiKey, setApiKey] = useState(config.apiKey);
  const [model, setModel] = useState(config.model);
  const [temperature, setTemperature] = useState(config.temperature);
  const [maxTokens, setMaxTokens] = useState(config.maxTokens);
  const [topP, setTopP] = useState(config.topP);
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setProviderUrl(config.providerUrl);
    setApiKey(config.apiKey);
    setModel(config.model);
    setTemperature(config.temperature);
    setMaxTokens(config.maxTokens);
    setTopP(config.topP);
  }, [config]);

  const handleSave = async () => {
    await saveConfig({
      providerUrl: providerUrl.trim(),
      apiKey: apiKey.trim(),
      model: model.trim(),
      temperature,
      maxTokens,
      topP,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="nc-screen-scroll">
      <div className="nc-center" style={{ paddingBottom: '2rem' }}>
        <div className="nc-panel" style={{ width: '600px', maxWidth: '90%' }}>
          <div className="nc-header">SETTINGS</div>

          <div className="nc-form">
            <div className="nc-field" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <button
                type="button"
                onClick={() => navigate('/app')}
                className="nc-button"
                style={{ border: 'none' }}
              >
                [ &lt; BACK ]
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="nc-button"
                style={{ border: 'none' }}
              >
                {saved ? '[ SAVED ]' : '[ SAVE ]'}
              </button>
            </div>

            <div className="nc-field">
              <label className="nc-label">LLM PROVIDER</label>
            </div>

            <div className="nc-field">
              <label className="nc-label">PROVIDER URL</label>
              <input
                type="url"
                value={providerUrl}
                onChange={e => setProviderUrl(e.target.value)}
                className="nc-input"
              />
            </div>

            <div className="nc-field">
              <label className="nc-label">API KEY</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  className="nc-input"
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="nc-button"
                  style={{ minWidth: '80px' }}
                >
                  {showKey ? '[ HIDE ]' : '[ SHOW ]'}
                </button>
              </div>
            </div>

            <div className="nc-field">
              <label className="nc-label">MODEL</label>
              <ModelSelector
                providerUrl={providerUrl}
                apiKey={apiKey}
                model={model}
                onChange={setModel}
              />
            </div>

            <div className="nc-field" style={{ marginTop: '1rem' }}>
              <label className="nc-label">MODEL CONFIGURATION</label>
            </div>

            <div className="nc-field">
              <label className="nc-label">TEMPERATURE: {temperature.toFixed(1)}</label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={temperature}
                onChange={e => setTemperature(parseFloat(e.target.value))}
                className="nc-input"
              />
            </div>

            <div className="nc-field">
              <label className="nc-label">MAX TOKENS: {maxTokens}</label>
              <input
                type="range"
                min="1"
                max="8192"
                step="1"
                value={maxTokens}
                onChange={e => setMaxTokens(parseInt(e.target.value))}
                className="nc-input"
              />
            </div>

            <div className="nc-field">
              <label className="nc-label">TOP P: {topP.toFixed(2)}</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={topP}
                onChange={e => setTopP(parseFloat(e.target.value))}
                className="nc-input"
              />
            </div>

            <div className="nc-field" style={{ marginTop: '1rem' }}>
              <label className="nc-label">APPEARANCE</label>
            </div>

            <div className="nc-field">
              <label className="nc-label">THEME</label>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className="nc-button"
                >
                  {theme === 'dark' ? '[ * DARK ]' : '[ DARK ]'}
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className="nc-button"
                >
                  {theme === 'light' ? '[ * LIGHT ]' : '[ LIGHT ]'}
                </button>
              </div>
            </div>

            <div className="nc-field" style={{ marginTop: '1rem' }}>
              <Checkbox
                checked={enableCRTEffect}
                onChange={(checked) => setPerformanceSetting('enableCRTEffect', checked)}
                label="CRT SCANLINE EFFECT"
              />
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
