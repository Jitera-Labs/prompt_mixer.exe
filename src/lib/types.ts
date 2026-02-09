export interface Chat {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ChatWithPreview {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
  last_message: string | null;
  last_message_role: string | null;
}

export interface Message {
  id: number;
  chat_id: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

export interface AnchorPreset {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface PresetAnchor {
  id: number;
  preset_id: number;
  label: string;
  prompt: string;
  icon: string;
  color: string;
  position_x: number;
  position_y: number;
  influence_radius: number;
  sort_order: number;
}

export interface NewPresetAnchor {
  label: string;
  prompt: string;
  icon: string;
  color: string;
  position_x: number;
  position_y: number;
  influence_radius: number;
  sort_order: number;
}

export interface Anchor {
  name: string;
  icon: string;
  color: string;
  isNeutral: boolean;
  prompt: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  displayX: number;
  displayY: number;
  D_influence: number;
}

export interface WeightedAnchorInput {
  label: string;
  prompt: string;
  weight: number;
}

export interface LLMConfig {
  providerUrl: string;
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
}

export interface EmotionValues {
  [name: string]: number;
}

export type MixerStatus = 'Mixing' | 'Writing' | 'Done' | '';
export type Speed = 'slow' | 'fast';
export type ConnectionStatus = 'connected' | 'disconnected' | 'error';
