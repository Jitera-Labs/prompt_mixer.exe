import { create } from 'zustand';
import type { Anchor, EmotionValues, MixerStatus, Speed, WeightedAnchorInput, AnchorPreset, PresetAnchor, NewPresetAnchor } from '../lib/types';
import { DEFAULT_ANCHORS, CANVAS_CONSTANTS } from '../lib/constants';
import * as api from '../lib/tauri';

interface MixerState {
  // Canvas state
  anchors: Anchor[];
  handlePos: { x: number; y: number };
  targetHandlePos: { x: number; y: number };
  canvasSize: { width: number; height: number };
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
  setCanvasSize: (width: number, height: number) => void;
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
  handlePos: { x: -1, y: -1 },
  targetHandlePos: { x: -1, y: -1 },
  canvasSize: { width: 0, height: 0 },
  emotionValues: {},
  status: '',
  isPaused: false,
  speed: 'slow',
  connectionStatus: 'connected',
  presets: [],
  activePresetId: null,
  view: 'canvas',

  initAnchors: (canvasWidth: number, canvasHeight: number) => {
    set({ canvasSize: { width: canvasWidth, height: canvasHeight } });
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

  setCanvasSize: (width: number, height: number) => {
    set({ canvasSize: { width, height } });
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
          handlePos: parsed.handlePos || { x: -1, y: -1 },
          targetHandlePos: parsed.handlePos || { x: -1, y: -1 },
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

    // Check if anchors have uninitialized positions (0,0)
    const needsLayout = presetAnchors.length > 0 && presetAnchors.every(pa => pa.position_x === 0 && pa.position_y === 0);
    const { canvasSize } = get();

    // Use stored dimensions or defaults
    const canvasW = canvasSize.width || 600;
    const canvasH = canvasSize.height || 400;
    const centerX = canvasW / 2;
    const centerY = canvasH / 2;
    const placementRadius = Math.min(centerX, centerY) * CANVAS_CONSTANTS.PLACEMENT_RADIUS_FACTOR;

    // Convert PresetAnchor[] to Anchor[]
    const anchors: Anchor[] = presetAnchors.map((pa, i) => {
      let x = pa.position_x;
      let y = pa.position_y;

      if (needsLayout) {
        // Lay out in a circle/diamond if uninitialized
        const angle = (i / presetAnchors.length) * 2 * Math.PI - (Math.PI / 2); // Start at top
        x = centerX + placementRadius * Math.cos(angle);
        y = centerY + placementRadius * Math.sin(angle);
      }

      return {
        name: pa.label,
        iconSmall: pa.icon_small,
        iconLarge: pa.icon_large,
        color: pa.color,
        isNeutral: pa.label === 'Neutral',
        prompt: pa.prompt,
        x,
        y,
        targetX: x,
        targetY: y,
        displayX: x,
        displayY: y,
        D_influence: pa.influence_radius,
      };
    });
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
    const { anchors, canvasSize } = get();
    // Calculate position: place at a reasonable spot on the circle

    // Use stored canvas dimensions if available, otherwise estimate
    const canvasW = canvasSize.width || 600;
    const canvasH = canvasSize.height || 400;
    const centerX = canvasW / 2;
    const centerY = canvasH / 2;

    const placementRadius = Math.min(centerX, centerY) * CANVAS_CONSTANTS.PLACEMENT_RADIUS_FACTOR;
    const influenceRadius = anchors[0]?.D_influence || Math.min(canvasW, canvasH) * CANVAS_CONSTANTS.INFLUENCE_RADIUS_FACTOR;

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
    const { anchors, canvasSize } = get();
    if (anchors.length === 0) return;

    // Use stored canvas dimensions if available, otherwise estimate
    const canvasW = canvasSize.width || 600;
    const canvasH = canvasSize.height || 400;
    const centerX = canvasW / 2;
    const centerY = canvasH / 2;

    const placementRadius = Math.min(centerX, centerY) * CANVAS_CONSTANTS.PLACEMENT_RADIUS_FACTOR;
    const influenceRadius = Math.min(canvasW, canvasH) * CANVAS_CONSTANTS.INFLUENCE_RADIUS_FACTOR;

    const nonNeutral = anchors.filter(a => !a.isNeutral);
    let nonNeutralIndex = 0;

    const reset: Anchor[] = anchors.map(a => {
      let x: number, y: number;
      if (a.isNeutral) {
        x = centerX;
        y = centerY;
      } else {
        const angle = (nonNeutralIndex / nonNeutral.length) * 2 * Math.PI;
        x = centerX + placementRadius * Math.cos(angle);
        y = centerY + placementRadius * Math.sin(angle);
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
