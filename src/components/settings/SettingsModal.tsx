import { useState, useEffect } from 'react';
import { useSettingsStore } from '../../stores/settingsStore';
import { ModelSelector } from '../ui/ModelSelector';
import { Checkbox } from '../ui/Checkbox';
import { Modal } from '../ui/Modal';

export function SettingsModal() {
  const {
    config,
    theme,
    saveConfig,
    setTheme,
    enableCRTEffect,
    enableDitherFilter,
    setPerformanceSetting,
    isSettingsOpen,
    setSettingsOpen
  } = useSettingsStore();

  const [providerUrl, setProviderUrl] = useState(config.providerUrl || '');
  const [apiKey, setApiKey] = useState(config.apiKey || '');
  const [model, setModel] = useState(config.model || '');
  const [temperature, setTemperature] = useState(config.temperature ?? 0.7);
  const [maxTokens, setMaxTokens] = useState(config.maxTokens ?? 2048);
  const [topP, setTopP] = useState(config.topP ?? 0.9);
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (isSettingsOpen) {
      setProviderUrl(config.providerUrl);
      setApiKey(config.apiKey);
      setModel(config.model);
      setTemperature(config.temperature);
      setMaxTokens(config.maxTokens);
      setTopP(config.topP);
    }
  }, [config, isSettingsOpen]);

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
    <Modal
      isOpen={isSettingsOpen}
      onClose={() => setSettingsOpen(false)}
      title="SETTINGS"
    >
      <div className="nc-form">
        <div className="nc-field" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
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

        <div className="nc-field">
          <Checkbox
            checked={enableDitherFilter}
            onChange={(checked) => setPerformanceSetting('enableDitherFilter', checked)}
            label="DITHER FILTER"
          />
        </div>

      </div>
    </Modal>
  );
}
