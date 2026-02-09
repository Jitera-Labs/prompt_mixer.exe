import { create } from 'zustand';
import type { Chat, ChatWithPreview, Message } from '../lib/types';
import * as api from '../lib/tauri';
import { truncateAtWordBoundary } from '../lib/utils';

export interface ChatError {
  message: string;
  chatId: number;
  type: 'error' | 'interrupted';
}

interface ChatState {
  chats: ChatWithPreview[];
  activeChatId: number | null;
  messages: Message[];
  isLoading: boolean;
  streamingContent: string;
  isStreaming: boolean;
  pendingRegenerate: boolean;
  error: ChatError | null;
  inputValue: string;

  // Actions
  loadChats: () => Promise<void>;
  createChat: (firstMessage: string) => Promise<number>;
  selectChat: (chatId: number) => Promise<void>;
  deleteChat: (chatId: number) => Promise<void>;
  updateChatTitle: (chatId: number, title: string) => Promise<void>;
  addMessage: (role: string, content: string) => Promise<Message | undefined>;
  editMessage: (messageId: number, content: string) => Promise<void>;
  appendStreamingContent: (token: string) => void;
  finalizeStreaming: () => Promise<void>;
  setIsStreaming: (streaming: boolean) => void;
  clearStreaming: () => void;
  setPendingRegenerate: (v: boolean) => void;
  regenerateMessage: (assistantMessageId: number) => Promise<void>;
  setError: (error: ChatError | null) => void;
  clearError: () => void;
  setInputValue: (value: string) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  chats: [],
  activeChatId: null,
  messages: [],
  isLoading: false,
  streamingContent: '',
  isStreaming: false,
  pendingRegenerate: false,
  error: null,
  inputValue: '',

  loadChats: async () => {
    const chats = await api.listChats();
    set({ chats });
  },

  createChat: async (firstMessage: string) => {
    const title = truncateAtWordBoundary(firstMessage, 50);
    const chat = await api.createChat(title);
    await get().loadChats();
    set({ activeChatId: chat.id, messages: [] });
    return chat.id;
  },

  selectChat: async (chatId: number) => {
    set({ isLoading: true, activeChatId: chatId });
    const messages = await api.getMessages(chatId);
    set({ messages, isLoading: false });
  },

  deleteChat: async (chatId: number) => {
    await api.deleteChat(chatId);
    const { activeChatId } = get();
    if (activeChatId === chatId) {
      set({ activeChatId: null, messages: [] });
    }
    await get().loadChats();
  },

  updateChatTitle: async (chatId: number, title: string) => {
    await api.updateChatTitle(chatId, title);
    await get().loadChats();
  },

  addMessage: async (role: string, content: string) => {
    const { activeChatId } = get();
    if (!activeChatId) return;
    const message = await api.addMessage(activeChatId, role, content);
    set((state) => ({ messages: [...state.messages, message] }));
    await get().loadChats();
    return message;
  },

  editMessage: async (messageId: number, content: string) => {
    const { activeChatId, messages } = get();
    if (!activeChatId) return;
    await api.updateMessage(messageId, content);
    await api.deleteMessagesAfter(activeChatId, messageId);
    const updatedMessages = await api.getMessages(activeChatId);
    set({ messages: updatedMessages });
  },

  appendStreamingContent: (token: string) => {
    set((state) => ({ streamingContent: state.streamingContent + token }));
  },

  finalizeStreaming: async () => {
    const { activeChatId, streamingContent } = get();
    if (!activeChatId || !streamingContent) return;
    const message = await api.addMessage(activeChatId, 'assistant', streamingContent);
    set((state) => ({
      messages: [...state.messages, message],
      streamingContent: '',
      isStreaming: false,
    }));
    await get().loadChats();
  },

  setIsStreaming: (streaming: boolean) => set({ isStreaming: streaming }),
  clearStreaming: () => set({ streamingContent: '', isStreaming: false }),
  setPendingRegenerate: (v: boolean) => set({ pendingRegenerate: v }),
  setError: (error: ChatError | null) => set({ error }),
  clearError: () => set({ error: null }),
  setInputValue: (value: string) => set({ inputValue: value }),

  regenerateMessage: async (assistantMessageId: number) => {
    const { activeChatId, messages } = get();
    if (!activeChatId) return;
    const idx = messages.findIndex(m => m.id === assistantMessageId);
    if (idx < 0) return;
    // Find the preceding user message
    const userMsg = messages.slice(0, idx).reverse().find(m => m.role === 'user');
    if (!userMsg) return;
    // Delete the assistant message and everything after it
    await api.deleteMessagesAfter(activeChatId, userMsg.id);
    const updatedMessages = await api.getMessages(activeChatId);
    set({ messages: updatedMessages, pendingRegenerate: true });
  },
}));
