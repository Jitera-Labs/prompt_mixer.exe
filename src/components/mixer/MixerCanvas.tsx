import { useRef, useEffect, useCallback, useMemo } from 'react';
import { useMixerStore } from '../../stores/mixerStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { CANVAS_CONSTANTS, DEFAULT_ANCHORS } from '../../lib/constants';
import { lerp, calculateDistance, debounce } from '../../lib/utils';
import { setupAnchors, calculateEmotionValues } from '../../lib/canvas/anchors';
import { draw } from '../../lib/canvas/drawing';
import { setupRetroCanvas } from '../../lib/canvas/retro-drawing';
import { getMousePos, handleMouseDown as processMouseDown, handleMouseMove as processMouseMove, handleMouseUp as processMouseUp, DragState } from '../../lib/canvas/interaction';
import { AnimationState, updateAnimation } from '../../lib/canvas/animation';
import { MixerControls } from './MixerControls';
import { MixerStatus } from './MixerStatus';
import { ConnectionIndicator } from './ConnectionIndicator';
import { ValueDisplay } from './ValueDisplay';
import * as api from '../../lib/tauri';
import type { Anchor } from '../../lib/types';

export function MixerCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animStateRef = useRef<AnimationState>({
    handlePos: { x: 0, y: 0 },
    targetHandlePos: { x: 0, y: 0 },
    smoothedValues: {},
    lastUpdateTime: 0,
    deltaTime: 0,
    isDraggingHandle: false,
    draggedAnchor: null,
  });
  const anchorsRef = useRef<Anchor[]>([]);
  const dragStateRef = useRef<DragState>({
    isDraggingHandle: false,
    draggedAnchor: null,
    dragOffset: { x: 0, y: 0 },
  });
  const rafRef = useRef<number>(0);
  const prevSizeRef = useRef<{ w: number; h: number } | null>(null);

  const updateEmotionValues = useMixerStore(s => s.updateEmotionValues);
  const activePresetId = useMixerStore(s => s.activePresetId);
  const anchors = useMixerStore(s => s.anchors);
  const { config, theme } = useSettingsStore();

  // Sync canvas state when store anchors change (e.g. reset, preset load)
  useEffect(() => {
    if (anchors.length > 0 && !dragStateRef.current.isDraggingHandle && !dragStateRef.current.draggedAnchor) {
      anchorsRef.current = anchors.map(a => ({ ...a }));
      const state = useMixerStore.getState();
      animStateRef.current.handlePos = { ...state.handlePos };
      animStateRef.current.targetHandlePos = { ...state.handlePos };
    }
  }, [anchors]);

  // Debounced weight update to backend
  const debouncedUpdateWeights = useMemo(
    () => debounce((values: Record<string, number>) => {
      const weighted = anchorsRef.current
        .filter(a => (values[a.name] || 0) > 0)
        .map(a => ({ label: a.name, prompt: a.prompt, weight: values[a.name] || 0 }));

      if (weighted.length > 0 && config.providerUrl) {
        api.updateWeights({
          anchors: weighted,
          providerUrl: config.providerUrl,
          apiKey: config.apiKey,
          model: config.model,
        }).catch(console.error);
      }
    }, 500),
    [config]
  );

  // Refs to avoid stale closures in the canvas event handlers
  const updateWeightsRef = useRef(debouncedUpdateWeights);
  useEffect(() => {
    updateWeightsRef.current = debouncedUpdateWeights;
  }, [debouncedUpdateWeights]);

  const updateEmotionValuesRef = useRef(updateEmotionValues);
  useEffect(() => {
    updateEmotionValuesRef.current = updateEmotionValues;
  }, [updateEmotionValues]);

  const valuesRef = useRef<Record<string, number>>({});
  const lastStoreUpdateRef = useRef<number>(0);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Setup retro canvas rendering (disable anti-aliasing for pixelated look)
    setupRetroCanvas(ctx, canvas);

    const resize = () => {
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;

      // Prevent initialization or scaling if the container has no size (e.g. hidden or initializing)
      if (newWidth === 0 || newHeight === 0) return;

      canvas.width = newWidth;
      canvas.height = newHeight;

      // Restore retro context settings lost on resize
      setupRetroCanvas(ctx, canvas);

      let currentAnchors = anchorsRef.current.length > 0 ? anchorsRef.current : useMixerStore.getState().anchors;

      // Check if we are resizing (valid prev size) or mounting (first load or tab switch)
      if (prevSizeRef.current && prevSizeRef.current.w > 0 && prevSizeRef.current.h > 0 && newWidth > 0 && newHeight > 0 && currentAnchors.length > 0) {
        // Resizing: Scale existing anchors and handle
        const scaleX = newWidth / prevSizeRef.current.w;
        const scaleY = newHeight / prevSizeRef.current.h;

        anchorsRef.current = currentAnchors.map(a => ({
          ...a,
          x: a.x * scaleX,
          y: a.y * scaleY,
          targetX: a.targetX * scaleX,
          targetY: a.targetY * scaleY,
        }));

        animStateRef.current.handlePos.x *= scaleX;
        animStateRef.current.handlePos.y *= scaleY;
        animStateRef.current.targetHandlePos.x *= scaleX;
        animStateRef.current.targetHandlePos.y *= scaleY;

      } else if (currentAnchors.length > 0) {
        // Mount with existing anchors (e.g. from store): Preserve them
        anchorsRef.current = [...currentAnchors];

        // Restore handle position from store
        const storeState = useMixerStore.getState();
        animStateRef.current.handlePos = { ...storeState.handlePos };
        animStateRef.current.targetHandlePos = { ...storeState.targetHandlePos };

      } else {
        // First mount, no state: Initialize defaults
        anchorsRef.current = setupAnchors(DEFAULT_ANCHORS, canvas.width, canvas.height);

        const neutralAnchor = anchorsRef.current.find(a => a.isNeutral);
        const center = neutralAnchor
          ? { x: neutralAnchor.x, y: neutralAnchor.y }
          : { x: canvas.width / 2, y: canvas.height / 2 };

        animStateRef.current.handlePos = { ...center };
        animStateRef.current.targetHandlePos = { ...center };
      }

      // Initialize values and smoothedValues based on current (possibly restored) state
      calculateEmotionValues(anchorsRef.current, animStateRef.current.handlePos, valuesRef.current);
      animStateRef.current.smoothedValues = { ...valuesRef.current };

      updateEmotionValues(valuesRef.current);
      useMixerStore.getState().setAnchors(anchorsRef.current);
      useMixerStore.getState().setHandlePos(animStateRef.current.handlePos.x, animStateRef.current.handlePos.y);

      prevSizeRef.current = { w: newWidth, h: newHeight };
    };

    resize();
    animStateRef.current.lastUpdateTime = performance.now();

    // Render initial static state
    draw(ctx, canvas, anchorsRef.current, animStateRef.current.handlePos, valuesRef.current, null, 0, theme);

    // Mouse handlers
    const onMouseDown = (e: MouseEvent) => {
      const mousePos = getMousePos(canvas, e);
      const result = processMouseDown(mousePos, anchorsRef.current, animStateRef.current.handlePos, canvas);
      dragStateRef.current = { isDraggingHandle: result.isDraggingHandle, draggedAnchor: result.draggedAnchor, dragOffset: result.dragOffset };
      animStateRef.current.isDraggingHandle = result.isDraggingHandle;
      animStateRef.current.draggedAnchor = result.draggedAnchor;
      if (result.newHandlePos) {
        animStateRef.current.handlePos = { ...result.newHandlePos };
        animStateRef.current.targetHandlePos = { ...result.newHandlePos };
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      const mousePos = getMousePos(canvas, e);
      const result = processMouseMove(mousePos, dragStateRef.current, canvas, anchorsRef.current, animStateRef.current.handlePos);

      if (result.newTargetHandlePos) {
        animStateRef.current.targetHandlePos = result.newTargetHandlePos;
      }

      if (result.updatedAnchor) {
        const anchor = result.updatedAnchor.anchor;
        anchor.targetX = result.updatedAnchor.targetX;
        anchor.targetY = result.updatedAnchor.targetY;
      }
    };

    const onMouseUp = () => {
      const newState = processMouseUp(canvas);
      dragStateRef.current = newState;
      animStateRef.current.isDraggingHandle = false;
      animStateRef.current.draggedAnchor = null;

      // Persist handle position and anchors to store matching store persistence
      const { x, y } = animStateRef.current.handlePos;
      useMixerStore.getState().setHandlePos(x, y);
      useMixerStore.getState().setAnchors(anchorsRef.current);
    };

    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseup', onMouseUp);

    const resizeObserver = new ResizeObserver(() => resize());
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(rafRef.current);
      canvas.removeEventListener('mousedown', onMouseDown);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mouseup', onMouseUp);
      resizeObserver.disconnect();
    };
  }, []);

  // Sync anchors from store when a preset is loaded
  useEffect(() => {
    if (activePresetId === null) return;
    const storeAnchors = useMixerStore.getState().anchors;
    if (storeAnchors.length > 0 && storeAnchors !== anchorsRef.current) {
      anchorsRef.current = storeAnchors;
      const neutral = storeAnchors.find(a => a.isNeutral);
      const center = neutral
        ? { x: neutral.x, y: neutral.y }
        : { x: storeAnchors[0].x, y: storeAnchors[0].y };
      animStateRef.current.handlePos = { ...center };
      animStateRef.current.targetHandlePos = { ...center };
      animStateRef.current.smoothedValues = calculateEmotionValues(storeAnchors, center);
      updateEmotionValues(animStateRef.current.smoothedValues);
    }
  }, [activePresetId, updateEmotionValues]);

  // Main animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Cancel any existing animation loop
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }

    // Animation loop
    const loop = (currentTime: number) => {
      const state = animStateRef.current;
      const { needsUpdate, emotionChanged } = updateAnimation(state, anchorsRef.current, currentTime);

      calculateEmotionValues(anchorsRef.current, state.handlePos, valuesRef.current);

      if (emotionChanged || needsUpdate || state.isDraggingHandle || state.draggedAnchor) {
        if (currentTime - lastStoreUpdateRef.current > 32) {
          updateEmotionValuesRef.current({ ...valuesRef.current });
          lastStoreUpdateRef.current = currentTime;
        }
        updateWeightsRef.current({ ...valuesRef.current });
      }

      draw(ctx, canvas, anchorsRef.current, state.handlePos, valuesRef.current, state.draggedAnchor, state.deltaTime, theme);
      rafRef.current = requestAnimationFrame(loop);
    };

    // Start animation loop
    animStateRef.current.lastUpdateTime = performance.now();
    rafRef.current = requestAnimationFrame(loop);

    // Cleanup on setting change
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      }
    };
  }, [theme]);

  return (
    <div ref={containerRef} className="mixer-canvas relative w-full h-full">
      <canvas ref={canvasRef} className="w-full h-full" />
      <MixerStatus />
      <ConnectionIndicator />
    </div>
  );
}
