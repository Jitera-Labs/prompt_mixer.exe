import type { Anchor } from '../types';
import { CANVAS_CONSTANTS } from '../constants';
import { lerp } from '../utils';
import { calculateEmotionValues } from './anchors';

export interface AnimationState {
  handlePos: { x: number; y: number };
  targetHandlePos: { x: number; y: number };
  smoothedValues: Record<string, number>;
  lastUpdateTime: number;
  deltaTime: number;
  isDraggingHandle: boolean;
  draggedAnchor: Anchor | null;
}

export function updateAnimation(
  state: AnimationState,
  anchors: Anchor[],
  currentTime: number
): { needsUpdate: boolean; emotionChanged: boolean } {
  const deltaTime = currentTime - state.lastUpdateTime;
  state.deltaTime = deltaTime / 1000;
  state.lastUpdateTime = currentTime;
  let needsUpdate = false;

  // Lerp handle position
  const handleDistX = Math.abs(state.handlePos.x - state.targetHandlePos.x);
  const handleDistY = Math.abs(state.handlePos.y - state.targetHandlePos.y);
  if (handleDistX > CANVAS_CONSTANTS.MIN_DELTA || handleDistY > CANVAS_CONSTANTS.MIN_DELTA) {
    state.handlePos.x = lerp(state.handlePos.x, state.targetHandlePos.x, CANVAS_CONSTANTS.POSITION_LERP_SPEED);
    state.handlePos.y = lerp(state.handlePos.y, state.targetHandlePos.y, CANVAS_CONSTANTS.POSITION_LERP_SPEED);
    needsUpdate = true;
  }

  // Lerp anchor positions (three-layer system)
  for (const anchor of anchors) {
    // targetX/Y → x/y
    if (anchor.targetX !== undefined && anchor.targetY !== undefined) {
      const distX = Math.abs(anchor.x - anchor.targetX);
      const distY = Math.abs(anchor.y - anchor.targetY);
      if (distX > CANVAS_CONSTANTS.MIN_DELTA || distY > CANVAS_CONSTANTS.MIN_DELTA) {
        anchor.x = lerp(anchor.x, anchor.targetX, CANVAS_CONSTANTS.POSITION_LERP_SPEED);
        anchor.y = lerp(anchor.y, anchor.targetY, CANVAS_CONSTANTS.POSITION_LERP_SPEED);
        needsUpdate = true;
      }
    }

    // x/y → displayX/Y
    const displayDistX = Math.abs(anchor.displayX - anchor.x);
    const displayDistY = Math.abs(anchor.displayY - anchor.y);
    if (displayDistX > CANVAS_CONSTANTS.MIN_DELTA || displayDistY > CANVAS_CONSTANTS.MIN_DELTA) {
      anchor.displayX = lerp(anchor.displayX, anchor.x, CANVAS_CONSTANTS.POSITION_LERP_SPEED);
      anchor.displayY = lerp(anchor.displayY, anchor.y, CANVAS_CONSTANTS.POSITION_LERP_SPEED);
      needsUpdate = true;
    }
  }

  // Smooth emotion values
  const targetValues = calculateEmotionValues(anchors, state.handlePos);
  let emotionChanged = false;
  for (const name in targetValues) {
    const target = targetValues[name];
    const current = state.smoothedValues[name] || 0;
    if (Math.abs(current - target) > CANVAS_CONSTANTS.MIN_DELTA) {
      state.smoothedValues[name] = lerp(current, target, CANVAS_CONSTANTS.LERP_SPEED);
      emotionChanged = true;
    } else {
      state.smoothedValues[name] = target;
    }
  }

  return { needsUpdate, emotionChanged };
}
