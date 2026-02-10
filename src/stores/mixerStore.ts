import { create } from 'zustand';
import type { Anchor, EmotionValues, MixerStatus, Speed, WeightedAnchorInput, AnchorPreset, PresetAnchor, NewPresetAnchor } from '../lib/types';
import { DEFAULT_ANCHORS, CANVAS_CONSTANTS } from '../lib/constants';
import * as api from '../lib/tauri';

interface MixerState {
  // Canvas state
  anchors: Anchor[];
  handlePos: { x: number; y: number };
  targetHandlePos: { x: number; y: number };
  emotionValues: EmotionValues;

  // Session state
  status: MixerStatus;
  isPaused: boolean;
  speed: Speed;
  connectionStatus: 'connected' | 'disconnected' | 'error';

  // Preset state
  presets: AnchorPreset[];
  activePresetId: number | null;
  view: 'canvas' | 'presets';

  // Actions
  initAnchors: (canvasWidth: number, canvasHeight: number) => void;
  setHandlePos: (x: number, y: number) => void;
  updateEmotionValues: (values: EmotionValues) => void;
  setStatus: (status: MixerStatus) => void;
  togglePause: () => void;
  toggleSpeed: () => void;
  setConnectionStatus: (status: 'connected' | 'disconnected' | 'error') => void;
  setView: (view: 'canvas' | 'presets') => void;
  setAnchors: (anchors: Anchor[]) => void;

  // Preset actions
  loadPresets: () => Promise<void>;
  loadPresetAnchors: (presetId: number) => Promise<void>;
  savePreset: (name: string) => Promise<void>;
  deletePreset: (presetId: number) => Promise<void>;
  renamePreset: (presetId: number, name: string) => Promise<void>;
  duplicatePreset: (presetId: number, newName: string) => Promise<void>;
  saveCurrentToPreset: () => Promise<void>;

  // Session actions
  loadSession: () => Promise<void>;
  saveSession: () => Promise<void>;

  // Anchor management actions
  addAnchor: (anchor: { label: string; prompt: string; iconSmall: string; iconLarge: string; color: string }) => void;
  updateAnchor: (index: number, updates: Partial<Anchor>) => void;
  removeAnchor: (index: number) => boolean;
  resetPositions: () => void;
  createNewPreset: () => void;

  // Get current weighted anchors for LLM
  getWeightedAnchors: () => WeightedAnchorInput[];
}

export const useMixerStore = create<MixerState>((set, get) => ({
  anchors: [],
  handlePos: { x: 0, y: 0 },
  targetHandlePos: { x: 0, y: 0 },
  emotionValues: {},
  status: '',
  isPaused: false,
  speed: 'slow',
  connectionStatus: 'connected',
  presets: [],
  activePresetId: null,
  view: 'canvas',

  initAnchors: (canvasWidth: number, canvasHeight: number) => {
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    const nonNeutral = DEFAULT_ANCHORS.filter(a => !a.isNeutral);
    const placementRadius = Math.min(centerX, centerY) * CANVAS_CONSTANTS.PLACEMENT_RADIUS_FACTOR;
    const influenceRadius = Math.min(canvasWidth, canvasHeight) * CANVAS_CONSTANTS.INFLUENCE_RADIUS_FACTOR;

    let nonNeutralIndex = 0;
    const anchors: Anchor[] = DEFAULT_ANCHORS.map((emotion) => {
      let x: number, y: number;
      if (emotion.isNeutral) {
        x = centerX;
        y = centerY;
      } else {
        const angle = (nonNeutralIndex / nonNeutral.length) * 2 * Math.PI;
        x = centerX + placementRadius * Math.cos(angle);
        y = centerY + placementRadius * Math.sin(angle);
        nonNeutralIndex++;
      }

      return {
        ...emotion,
        x, y,
        targetX: x,
        targetY: y,
        displayX: x,
        displayY: y,
        D_influence: influenceRadius,
      };
    });

    set({
      anchors,
      handlePos: { x: centerX, y: centerY },
      targetHandlePos: { x: centerX, y: centerY },
    });
  },

  setHandlePos: (x: number, y: number) => {
    set({
      handlePos: { x, y },
      targetHandlePos: { x, y }
    });
    get().saveSession().catch(console.error);
  },

  updateEmotionValues: (values: EmotionValues) => {
    set({ emotionValues: values });
  },

  setStatus: (status: MixerStatus) => set({ status }),

  togglePause: () => {
    set((state) => ({ isPaused: !state.isPaused }));
    api.togglePause().catch(console.error);
  },

  toggleSpeed: () => {
    const newSpeed = get().speed === 'slow' ? 'fast' : 'slow';
    set({ speed: newSpeed });
    api.setSpeed(newSpeed).catch(console.error);
  },

  setConnectionStatus: (status) => set({ connectionStatus: status }),
  setView: (view) => set({ view }),
  setAnchors: (anchors) => {
    set({ anchors });
    get().saveSession().catch(console.error);
  },

  loadSession: async () => {
    try {
      const savedState = await api.getSetting('last_session_state');
      if (savedState) {
        const parsed = JSON.parse(savedState);
        set({
          anchors: parsed.anchors || [],
          handlePos: parsed.handlePos || { x: 0, y: 0 },
          targetHandlePos: parsed.handlePos || { x: 0, y: 0 },
          activePresetId: parsed.activePresetId ?? null,
        });
      }
    } catch (e) {
      console.warn('Failed to load session:', e);
    }
  },

  saveSession: async () => {
    const { anchors, handlePos, activePresetId } = get();
    // Only save if we have valid data
    if (anchors.length === 0) return;

    const stateToSave = {
      anchors: anchors.map(a => ({
        ...a,
        // Ensure we save current positions
        x: a.x,
        y: a.y,
        targetX: a.targetX,
        targetY: a.targetY,
        displayX: a.displayX,
        displayY: a.displayY
      })),
      handlePos,
      activePresetId
    };

    await api.setSetting('last_session_state', JSON.stringify(stateToSave));
  },

  loadPresets: async () => {
    const presets = await api.listPresets();
    set({ presets });
  },

  loadPresetAnchors: async (presetId: number) => {
    const presetAnchors = await api.getPresetAnchors(presetId);
    // Convert PresetAnchor[] to Anchor[] — positions will be recalculated by canvas
    const anchors: Anchor[] = presetAnchors.map(pa => ({
      name: pa.label,
      iconSmall: pa.icon_small,
      iconLarge: pa.icon_large,
      color: pa.color,
      isNeutral: pa.label === 'Neutral',
      prompt: pa.prompt,
      x: pa.position_x,
      y: pa.position_y,
      targetX: pa.position_x,
      targetY: pa.position_y,
      displayX: pa.position_x,
      displayY: pa.position_y,
      D_influence: pa.influence_radius,
    }));
    set({ anchors, activePresetId: presetId });
    get().saveSession().catch(console.error);
  },

  savePreset: async (name: string) => {
    const { anchors } = get();
    const newAnchors: NewPresetAnchor[] = anchors.map((a, i) => ({
      label: a.name,
      prompt: a.prompt,
      icon_small: a.iconSmall,
      icon_large: a.iconLarge,
      color: a.color,
      position_x: a.x,
      position_y: a.y,
      influence_radius: a.D_influence,
      sort_order: i,
    }));
    await api.createPreset(name, newAnchors);
    await get().loadPresets();
  },

  deletePreset: async (presetId: number) => {
    await api.deletePreset(presetId);
    if (get().activePresetId === presetId) {
      set({ activePresetId: null });
    }
    await get().loadPresets();
  },

  renamePreset: async (presetId: number, name: string) => {
    await api.renamePreset(presetId, name);
    await get().loadPresets();
  },

  duplicatePreset: async (presetId: number, newName: string) => {
    const presetAnchors = await api.getPresetAnchors(presetId);
    const newAnchors: NewPresetAnchor[] = presetAnchors.map(pa => ({
      label: pa.label,
      prompt: pa.prompt,
      icon_small: pa.icon_small,
      icon_large: pa.icon_large,
      color: pa.color,
      position_x: pa.position_x,
      position_y: pa.position_y,
      influence_radius: pa.influence_radius,
      sort_order: pa.sort_order,
    }));
    await api.createPreset(newName, newAnchors);
    await get().loadPresets();
  },

  saveCurrentToPreset: async () => {
    const { activePresetId, presets, anchors } = get();
    if (activePresetId === null) throw new Error("No active preset");

    const currentPreset = presets.find(p => p.id === activePresetId);
    if (!currentPreset) throw new Error("Preset not found");

    const newAnchors: NewPresetAnchor[] = anchors.map((a, i) => ({
      label: a.name,
      prompt: a.prompt,
      icon_small: a.iconSmall,
      icon_large: a.iconLarge,
      color: a.color,
      position_x: a.x,
      position_y: a.y,
      influence_radius: a.D_influence,
      sort_order: i,
    }));

    await api.updatePreset(activePresetId, currentPreset.name, newAnchors);
    await get().loadPresets();
  },

  addAnchor: (anchor: { label: string; prompt: string; iconSmall: string; iconLarge: string; color: string }) => {
    const { anchors } = get();
    // Calculate position: place at a reasonable spot on the circle
    // Estimate canvas size from existing anchors
    const xs = anchors.map(a => a.x);
    const ys = anchors.map(a => a.y);
    const centerX = (Math.min(...xs) + Math.max(...xs)) / 2;
    const centerY = (Math.min(...ys) + Math.max(...ys)) / 2;
    const placementRadius = Math.min(centerX, centerY) * CANVAS_CONSTANTS.PLACEMENT_RADIUS_FACTOR;
    const influenceRadius = anchors[0]?.D_influence || 100;

    const nonNeutralCount = anchors.filter(a => !a.isNeutral).length + 1;
    const angle = ((nonNeutralCount - 1) / nonNeutralCount) * 2 * Math.PI;
    const x = centerX + placementRadius * Math.cos(angle);
    const y = centerY + placementRadius * Math.sin(angle);

    const newAnchor: Anchor = {
      name: anchor.label,
      iconSmall: anchor.iconSmall,
      iconLarge: anchor.iconLarge,
      color: anchor.color,
      isNeutral: false,
      prompt: anchor.prompt,
      x, y,
      targetX: x,
      targetY: y,
      displayX: x,
      displayY: y,
      D_influence: influenceRadius,
    };

    set({ anchors: [...anchors, newAnchor] });
  },

  updateAnchor: (index, updates) => {
    const { anchors } = get();
    if (index < 0 || index >= anchors.length) return;
    const updated = [...anchors];
    updated[index] = {
      ...updated[index],
      ...updates,
      // Keep name in sync with label if provided
      ...(updates.name !== undefined ? { name: updates.name } : {}),
    };
    set({ anchors: updated });
  },

  removeAnchor: (index) => {
    const { anchors } = get();
    if (anchors.length <= 1) return false;
    if (index < 0 || index >= anchors.length) return false;
    set({ anchors: anchors.filter((_, i) => i !== index) });
    return true;
  },

  resetPositions: () => {
    const { anchors } = get();
    if (anchors.length === 0) return;
    // Estimate canvas dimensions from current anchor positions
    const xs = anchors.map(a => a.x);
    const ys = anchors.map(a => a.y);
    const centerX = (Math.min(...xs) + Math.max(...xs)) / 2;
    const centerY = (Math.min(...ys) + Math.max(...ys)) / 2;
    const canvasW = centerX * 2 || 600;
    const canvasH = centerY * 2 || 400;
    const placementRadius = Math.min(canvasW / 2, canvasH / 2) * CANVAS_CONSTANTS.PLACEMENT_RADIUS_FACTOR;
    const influenceRadius = Math.min(canvasW, canvasH) * CANVAS_CONSTANTS.INFLUENCE_RADIUS_FACTOR;

    const nonNeutral = anchors.filter(a => !a.isNeutral);
    let nonNeutralIndex = 0;

    const reset: Anchor[] = anchors.map(a => {
      let x: number, y: number;
      if (a.isNeutral) {
        x = canvasW / 2;
        y = canvasH / 2;
      } else {
        const angle = (nonNeutralIndex / nonNeutral.length) * 2 * Math.PI;
        x = canvasW / 2 + placementRadius * Math.cos(angle);
        y = canvasH / 2 + placementRadius * Math.sin(angle);
        nonNeutralIndex++;
      }
      return {
        ...a,
        x, y,
        targetX: x,
        targetY: y,
        displayX: x,
        displayY: y,
        D_influence: influenceRadius,
      };
    });

    set({
      anchors: reset,
      handlePos: { x: canvasW / 2, y: canvasH / 2 },
      targetHandlePos: { x: canvasW / 2, y: canvasH / 2 },
    });
    get().saveSession().catch(console.error);
  },

  createNewPreset: () => {
    set({
      anchors: [],
      activePresetId: null,
      emotionValues: {},
    });
  },

  getWeightedAnchors: () => {
    const { anchors, emotionValues } = get();
    return anchors
      .filter(a => (emotionValues[a.name] || 0) > 0)
      .map(a => ({
        label: a.name,
        prompt: a.prompt,
        weight: emotionValues[a.name] || 0,
      }));
  },
}));
