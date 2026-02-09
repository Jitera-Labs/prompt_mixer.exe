import type { Anchor } from '../types';
import { CANVAS_CONSTANTS } from '../constants';
import { calculateDistance } from '../utils';

export interface DragState {
  isDraggingHandle: boolean;
  draggedAnchor: Anchor | null;
  dragOffset: { x: number; y: number };
}

export function getMousePos(canvas: HTMLCanvasElement, event: MouseEvent): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
}

function setCursor(canvas: HTMLCanvasElement, cursor: string) {
  if (canvas.style.cursor !== cursor) {
    canvas.style.cursor = cursor;
  }
}

export function handleMouseDown(
  mousePos: { x: number; y: number },
  anchors: Anchor[],
  handlePos: { x: number; y: number },
  canvas: HTMLCanvasElement
): DragState & { newHandlePos?: { x: number; y: number } } {
  // Check if clicking on an anchor
  for (let i = anchors.length - 1; i >= 0; i--) {
    const anchor = anchors[i];
    const dist = calculateDistance(mousePos, { x: anchor.displayX, y: anchor.displayY });
    if (dist <= CANVAS_CONSTANTS.EMOTION_ICON_RADIUS) {
      setCursor(canvas, 'grabbing');
      return {
        isDraggingHandle: false,
        draggedAnchor: anchor,
        dragOffset: {
          x: mousePos.x - anchor.displayX,
          y: mousePos.y - anchor.displayY,
        },
      };
    }
  }

  // Check if clicking on handle
  const distToHandle = calculateDistance(mousePos, handlePos);
  if (distToHandle <= CANVAS_CONSTANTS.HANDLE_RADIUS) {
    setCursor(canvas, 'grabbing');
    return {
      isDraggingHandle: true,
      draggedAnchor: null,
      dragOffset: {
        x: mousePos.x - handlePos.x,
        y: mousePos.y - handlePos.y,
      },
    };
  }

  // Click on empty space - move handle there
  setCursor(canvas, 'grabbing');
  return {
    isDraggingHandle: true,
    draggedAnchor: null,
    dragOffset: { x: 0, y: 0 },
    newHandlePos: { x: mousePos.x, y: mousePos.y },
  };
}

export function handleMouseMove(
  mousePos: { x: number; y: number },
  dragState: DragState,
  canvas: HTMLCanvasElement,
  anchors: Anchor[],
  handlePos: { x: number; y: number }
): { newTargetHandlePos?: { x: number; y: number }; updatedAnchor?: { anchor: Anchor; targetX: number; targetY: number } } {
  if (dragState.draggedAnchor) {
    const targetX = mousePos.x - dragState.dragOffset.x;
    const targetY = mousePos.y - dragState.dragOffset.y;
    const clampedX = Math.max(CANVAS_CONSTANTS.EMOTION_ICON_RADIUS, Math.min(canvas.width - CANVAS_CONSTANTS.EMOTION_ICON_RADIUS, targetX));
    const clampedY = Math.max(CANVAS_CONSTANTS.EMOTION_ICON_RADIUS, Math.min(canvas.height - CANVAS_CONSTANTS.EMOTION_ICON_RADIUS, targetY));
    setCursor(canvas, 'grabbing');
    return { updatedAnchor: { anchor: dragState.draggedAnchor, targetX: clampedX, targetY: clampedY } };
  }

  if (dragState.isDraggingHandle) {
    const newX = mousePos.x - dragState.dragOffset.x;
    const newY = mousePos.y - dragState.dragOffset.y;
    const clampedX = Math.max(CANVAS_CONSTANTS.HANDLE_RADIUS, Math.min(canvas.width - CANVAS_CONSTANTS.HANDLE_RADIUS, newX));
    const clampedY = Math.max(CANVAS_CONSTANTS.HANDLE_RADIUS, Math.min(canvas.height - CANVAS_CONSTANTS.HANDLE_RADIUS, newY));
    setCursor(canvas, 'grabbing');
    return { newTargetHandlePos: { x: clampedX, y: clampedY } };
  }

  // Hover detection
  let onInteractive = false;
  for (const anchor of anchors) {
    if (calculateDistance(mousePos, { x: anchor.displayX, y: anchor.displayY }) <= CANVAS_CONSTANTS.EMOTION_ICON_RADIUS) {
      setCursor(canvas, 'grab');
      onInteractive = true;
      break;
    }
  }
  if (!onInteractive && calculateDistance(mousePos, handlePos) <= CANVAS_CONSTANTS.HANDLE_RADIUS) {
    setCursor(canvas, 'grab');
    onInteractive = true;
  }
  if (!onInteractive) {
    setCursor(canvas, 'pointer');
  }

  return {};
}

export function handleMouseUp(canvas: HTMLCanvasElement): DragState {
  setCursor(canvas, 'pointer');
  return {
    isDraggingHandle: false,
    draggedAnchor: null,
    dragOffset: { x: 0, y: 0 },
  };
}
