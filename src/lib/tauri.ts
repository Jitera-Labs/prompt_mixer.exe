import { invoke } from '@tauri-apps/api/core';
import type { Chat, ChatWithPreview, Message, AnchorPreset, PresetAnchor, NewPresetAnchor, WeightedAnchorInput } from './types';

// Chat commands
export const createChat = (title: string) => invoke<Chat>('create_chat', { title });
export const listChats = () => invoke<ChatWithPreview[]>('list_chats');
export const getChat = (chatId: number) => invoke<Chat>('get_chat', { chatId });
export const deleteChat = (chatId: number) => invoke<void>('delete_chat', { chatId });
export const updateChatTitle = (chatId: number, title: string) => invoke<void>('update_chat_title', { chatId, title });

// Message commands
export const getMessages = (chatId: number) => invoke<Message[]>('get_messages', { chatId });
export const addMessage = (chatId: number, role: string, content: string) => invoke<Message>('add_message', { chatId, role, content });
export const deleteMessagesAfter = (chatId: number, messageId: number) => invoke<void>('delete_messages_after', { chatId, messageId });
export const updateMessage = (messageId: number, content: string) => invoke<void>('update_message', { messageId, content });

// Preset commands
export const listPresets = () => invoke<AnchorPreset[]>('list_presets');
export const createPreset = (name: string, anchors: NewPresetAnchor[]) => invoke<AnchorPreset>('create_preset', { name, anchors });
export const updatePreset = (presetId: number, name: string, anchors: NewPresetAnchor[]) => invoke<void>('update_preset', { presetId, name, anchors });
export const deletePreset = (presetId: number) => invoke<void>('delete_preset', { presetId });
export const getPresetAnchors = (presetId: number) => invoke<PresetAnchor[]>('get_preset_anchors', { presetId });

// Settings commands
export const getSetting = (key: string) => invoke<string | null>('get_setting', { key });
export const setSetting = (key: string, value: string) => invoke<void>('set_setting', { key, value });
export const fetchModels = (providerUrl: string, apiKey: string) => invoke<string[]>('fetch_models', { providerUrl, apiKey });

// LLM commands
export const startMixingSession = (params: {
  chatId: number;
  anchors: WeightedAnchorInput[];
  providerUrl: string;
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
}) => invoke<void>('start_mixing_session', params);

export const updateWeights = (params: {
  anchors: WeightedAnchorInput[];
  providerUrl: string;
  apiKey: string;
  model: string;
}) => invoke<void>('update_weights', params);

export const togglePause = () => invoke<boolean>('toggle_pause');
export const setSpeed = (speed: string) => invoke<void>('set_speed', { speed });
export const cancelSession = () => invoke<void>('cancel_session');
