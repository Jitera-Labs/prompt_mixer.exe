import type { Anchor } from '../types';
import { CANVAS_CONSTANTS } from '../constants';

export function setupAnchors(
  anchors: Array<{
    name: string;
    iconSmall: string;
    iconLarge: string;
    color: string;
    isNeutral: boolean;
    prompt: string
  }>,
  canvasWidth: number,
  canvasHeight: number
): Anchor[] {
  const centerX = canvasWidth / 2;
  const centerY = canvasHeight / 2;
  const nonNeutral = anchors.filter(a => !a.isNeutral);
  const placementRadius = Math.min(centerX, centerY) * CANVAS_CONSTANTS.PLACEMENT_RADIUS_FACTOR;
  const influenceRadius = Math.min(canvasWidth, canvasHeight) * CANVAS_CONSTANTS.INFLUENCE_RADIUS_FACTOR;

  let nonNeutralIndex = 0;
  return anchors.map((emotion) => {
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
}

export function calculateEmotionValues(
  anchors: Anchor[],
  handlePos: { x: number; y: number },
  out?: Record<string, number>
): Record<string, number> {
  const values = out || {};

  for (const anchor of anchors) {
    const dx = handlePos.x - anchor.x;
    const dy = handlePos.y - anchor.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist <= CANVAS_CONSTANTS.EMOTION_ICON_RADIUS) {
      values[anchor.name] = 1.0;
    } else if (dist <= anchor.D_influence) {
      const normalizedDist = (dist - CANVAS_CONSTANTS.EMOTION_ICON_RADIUS) / (anchor.D_influence - CANVAS_CONSTANTS.EMOTION_ICON_RADIUS);
      values[anchor.name] = Math.max(0, 1 - normalizedDist);
    } else {
      values[anchor.name] = 0;
    }
  }

  return values;
}
