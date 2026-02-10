import { create } from 'zustand';
import { load } from '@tauri-apps/plugin-store';
import type { LLMConfig } from '../lib/types';
import { DEFAULT_LLM_CONFIG } from '../lib/constants';
import * as api from '../lib/tauri';

let credentialStore: Awaited<ReturnType<typeof load>> | null = null;

async function getCredentialStore() {
  if (!credentialStore) {
    credentialStore = await load('credentials.json', { defaults: {}, autoSave: true });
  }
  return credentialStore;
}

interface SettingsState {
  config: LLMConfig;
  isConfigured: boolean;
  theme: 'dark' | 'light';

  // Performance settings (all default to false for better performance)
  enableCRTEffect: boolean;

  // UI State
  isSettingsOpen: boolean;

  // Actions
  loadSettings: () => Promise<void>;
  saveConfig: (config: LLMConfig) => Promise<void>;
  setTheme: (theme: 'dark' | 'light') => Promise<void>;
  setPerformanceSetting: (key: 'enableCRTEffect', value: boolean) => Promise<void>;
  setSettingsOpen: (open: boolean) => void;
  toggleSettings: () => void;
  checkIsConfigured: () => boolean;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  config: { ...DEFAULT_LLM_CONFIG },
  isConfigured: false,
  theme: 'dark',

  // Performance settings - all default to false for optimal performance
  enableCRTEffect: false,

  // UI State
  isSettingsOpen: false,

  loadSettings: async () => {
    try {
      const store = await getCredentialStore();

      const providerUrl = await api.getSetting('provider_url');
      const apiKey = await store.get<string>('api_key');
      const model = await api.getSetting('model');
      const temperature = await api.getSetting('temperature');
      const maxTokens = await api.getSetting('max_tokens');
      const topP = await api.getSetting('top_p');
      const theme = await api.getSetting('theme');

      // Load performance settings
      const enableCRTEffect = await api.getSetting('enable_crt_effect');

      const config: LLMConfig = {
        providerUrl: providerUrl || '',
        apiKey: apiKey || '',
        model: model || '',
        temperature: temperature ? parseFloat(temperature) : 0.7,
        maxTokens: maxTokens ? parseInt(maxTokens) : 2048,
        topP: topP ? parseFloat(topP) : 1.0,
      };

      const isConfigured = !!(config.providerUrl && config.apiKey && config.model);

      set({
        config,
        isConfigured,
        theme: (theme as 'dark' | 'light') || 'dark',
        enableCRTEffect: enableCRTEffect === 'true',
      });
    } catch (e) {
      console.error('Failed to load settings:', e);
    }
  },

  saveConfig: async (config: LLMConfig) => {
    const store = await getCredentialStore();

    await api.setSetting('provider_url', config.providerUrl);
    await store.set('api_key', config.apiKey);
    await api.setSetting('model', config.model);
    await api.setSetting('temperature', config.temperature.toString());
    await api.setSetting('max_tokens', config.maxTokens.toString());
    await api.setSetting('top_p', config.topP.toString());

    const isConfigured = !!(config.providerUrl && config.apiKey && config.model);
    set({ config, isConfigured });
  },

  setTheme: async (theme: 'dark' | 'light') => {
    await api.setSetting('theme', theme);
    set({ theme });
    document.documentElement.classList.toggle('light', theme === 'light');
  },

  setPerformanceSetting: async (key: 'enableCRTEffect', value: boolean) => {
    // Map the setting key to the storage key
    const storageKeyMap = {
      enableCRTEffect: 'enable_crt_effect',
    };

    await api.setSetting(storageKeyMap[key], value.toString());
    set({ [key]: value });
  },

  setSettingsOpen: (open: boolean) => set({ isSettingsOpen: open }),

  toggleSettings: () => set((state) => ({ isSettingsOpen: !state.isSettingsOpen })),

  checkIsConfigured: () => {
    const { config } = get();
    return !!(config.providerUrl && config.apiKey && config.model);
  },
}));
