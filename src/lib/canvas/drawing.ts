import type { Anchor } from '../types';
import { CANVAS_CONSTANTS } from '../constants';
import { quantizeToDOSPalette, DOS_PALETTE, getPalette } from './dos-palette';
import { RETRO_EMOTION_ICONS, getEmotionIcon } from './ascii-art';
import {
  drawDitheredBlock,
  drawASCIIPattern,
  drawRetroHandle,
  drawBackgroundGrid
} from './retro-drawing';

/**
 * Main drawing function with retro CLI/TUI Norton Commander style
 * Uses ASCII art, pixelated circles, and DOS color palette
 */
export function draw(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  anchors: Anchor[],
  handlePos: { x: number; y: number },
  emotionValues: Record<string, number>,
  draggedAnchor: Anchor | null,
  deltaTime: number,
  theme: 'dark' | 'light' = 'dark'
) {
  const PALETTE = getPalette(theme);

  // Clear and draw background
  ctx.fillStyle = PALETTE.BLACK;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Optional: Draw background grid for coordinate feel
  drawBackgroundGrid(ctx, canvas.width, canvas.height, PALETTE);

  // Draw each emotion anchor with retro style
  for (const anchor of anchors) {
    const value = emotionValues[anchor.name] || 0;

    // Scale logic (keeping same calculations as original)
    const sizeMultiplier = 1.5;
    const dynamicFontSize = (CANVAS_CONSTANTS.ICON_FONT_BASE_SIZE + (value * CANVAS_CONSTANTS.ICON_FONT_SCALE_MAX_ADDITION)) * sizeMultiplier;
    // Calculate size (diameter/width) instead of radius for block drawing
    const dynamicSize = (CANVAS_CONSTANTS.EMOTION_ICON_RADIUS + (value * CANVAS_CONSTANTS.EMOTION_ICON_RADIUS * 1.2)) * 2.2;

    // Quantize color to DOS palette (keep original hue but maybe map to theme later if needed)
    // For now, we keep anchor colors from DOS palette as they are iconic
    const quantizedColor = quantizeToDOSPalette(anchor.color);

    // Draw background block only if value is significant
    if (value > 0.1) {
      // Use dithering intensity based on emotion value
      const ditherIntensity = Math.min(0.9, value);

      // Draw dithered block for background
      drawDitheredBlock(
        ctx,
        anchor.displayX,
        anchor.displayY,
        dynamicSize,
        quantizedColor,
        ditherIntensity
      );
    }

    // Get ASCII art for this emotion
    const emotionIcon = getEmotionIcon(anchor.name);

    // Calculate character size based on value
    const charSize = 16 + (value * 20);

    // Draw ASCII art icon
    if (value > 0.3) {
      // Draw full block pattern for higher values
      const lineHeight = 1.0;
      const patternHeight = emotionIcon.blockPattern.length * charSize * lineHeight;
      const patternStartY = anchor.displayY - (patternHeight / 2);

      // Estimate pattern width for centering
      const estimatedCharWidth = charSize * 0.6; // Font aspect ratio estimate
      const maxLineLength = Math.max(...emotionIcon.blockPattern.map(line => line.length));
      const patternWidth = maxLineLength * estimatedCharWidth;
      const patternStartX = anchor.displayX - (patternWidth / 2);

      drawASCIIPattern(
        ctx,
        emotionIcon.blockPattern,
        patternStartX,
        patternStartY,
        {
          charSize: charSize,
          fontFamily: 'Geist Pixel, monospace',
          color: PALETTE.WHITE,
          lineHeight: lineHeight,
        }
      );
    } else {
      // Draw single character for lower values
      ctx.save();
      ctx.font = `${charSize}px Geist Pixel, monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = PALETTE.WHITE;
      ctx.fillText(emotionIcon.char, anchor.displayX, anchor.displayY);
      ctx.restore();
    }
  }

  // Draw handle with retro crosshair style
  drawRetroHandle(ctx, handlePos.x, handlePos.y, PALETTE);
}

