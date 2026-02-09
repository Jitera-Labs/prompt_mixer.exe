/**
 * Retro rendering utilities for pixelated, DOS-style graphics
 * All rendering functions disable anti-aliasing for authentic retro look
 */

import { DOS_PALETTE, quantizeToDOSPalette, hexToRgb, createDitherPattern } from './dos-palette';
import { getShadeCharacter, ASCII_DECORATIONS } from './ascii-art';

export interface RetroTextOptions {
  /** Font size in pixels */
  fontSize?: number;
  /** Font family (defaults to VT323) */
  fontFamily?: string;
  /** Text color */
  color?: string;
  /** Enable text shadow */
  shadow?: boolean;
  /** Shadow color */
  shadowColor?: string;
  /** Shadow offset X */
  shadowOffsetX?: number;
  /** Shadow offset Y */
  shadowOffsetY?: number;
  /** Text alignment */
  align?: CanvasTextAlign;
  /** Text baseline */
  baseline?: CanvasTextBaseline;
}

export interface ASCIIPatternOptions {
  /** Character size in pixels */
  charSize?: number;
  /** Font family */
  fontFamily?: string;
  /** Text color */
  color?: string;
  /** Background color (optional) */
  backgroundColor?: string;
  /** Line height multiplier */
  lineHeight?: number;
}

/**
 * Setup canvas context for retro rendering
 * Disables anti-aliasing and sets default retro font
 * @param ctx - Canvas rendering context
 * @param canvas - Canvas element
 */
export function setupRetroCanvas(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement
): void {
  // Disable anti-aliasing for crisp pixel art
  ctx.imageSmoothingEnabled = false;

  // Set default retro font
  ctx.font = '16px Geist Pixel, monospace';
  ctx.textBaseline = 'top';

  // Force sharp edges
  (ctx as any).webkitImageSmoothingEnabled = false;
  (ctx as any).mozImageSmoothingEnabled = false;
  (ctx as any).msImageSmoothingEnabled = false;
}

/**
 * Draw text with retro styling
 * @param ctx - Canvas rendering context
 * @param text - Text to draw
 * @param x - X position
 * @param y - Y position
 * @param options - Text rendering options
 */
export function drawRetroText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  options: RetroTextOptions = {}
): void {
  const {
    fontSize = 16,
    fontFamily = 'Geist Pixel, monospace',
    color = DOS_PALETTE.WHITE,
    shadow = false,
    shadowColor = DOS_PALETTE.BLACK,
    shadowOffsetX = 2,
    shadowOffsetY = 2,
    align = 'left',
    baseline = 'top',
  } = options;

  ctx.save();

  // Setup font
  ctx.font = `${fontSize}px ${fontFamily}`;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;

  // Draw shadow if enabled
  if (shadow) {
    ctx.fillStyle = shadowColor;
    ctx.fillText(text, x + shadowOffsetX, y + shadowOffsetY);
  }

  // Draw main text
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);

  ctx.restore();
}

/**
 * Draw multi-line ASCII art pattern
 * @param ctx - Canvas rendering context
 * @param pattern - Array of text lines
 * @param x - X position (top-left)
 * @param y - Y position (top-left)
 * @param options - Pattern rendering options
 */
export function drawASCIIPattern(
  ctx: CanvasRenderingContext2D,
  pattern: string[],
  x: number,
  y: number,
  options: ASCIIPatternOptions = {}
): void {
  const {
    charSize = 12,
    fontFamily = 'Geist Pixel, monospace',
    color = DOS_PALETTE.WHITE,
    backgroundColor,
    lineHeight = 1.2,
  } = options;

  ctx.save();

  ctx.font = `${charSize}px ${fontFamily}`;
  ctx.textBaseline = 'top';

  const lineHeightPx = charSize * lineHeight;

  pattern.forEach((line, index) => {
    const lineY = y + (index * lineHeightPx);

    // Draw background if specified
    if (backgroundColor) {
      const textMetrics = ctx.measureText(line);
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(x, lineY, textMetrics.width, charSize);
    }

    // Draw text
    ctx.fillStyle = color;
    ctx.fillText(line, x, lineY);
  });

  ctx.restore();
}



/**
 * Draw a dithered block using shade characters or patterns
 * @param ctx - Canvas rendering context
 * @param x - Center X
 * @param y - Center Y
 * @param size - Block size
 * @param color - Fill color
 * @param intensity - Dithering intensity (0-1)
 */
export function drawDitheredBlock(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
  intensity: number = 0.5
): void {
  ctx.save();

  const quantizedColor = quantizeToDOSPalette(color);
  const shadeChar = getShadeCharacter(intensity);

  const fontSize = Math.max(8, Math.floor(size / 6));
  ctx.font = `${fontSize}px Geist Pixel, monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = quantizedColor;

  // Draw block using dither characters
  const step = fontSize * 0.8;
  const halfSize = size / 2;

  for (let py = -halfSize; py <= halfSize; py += step) {
    for (let px = -halfSize; px <= halfSize; px += step) {
      // No circular distance check - pure block
      // Use simpler uniform shading for blocks, or slight gradient from center
      const distance = Math.sqrt(px * px + py * py);
      const normalizedDistance = Math.min(1, distance / (size * 0.7)); // Adjusted falloff
      const shadeIntensity = intensity * (1 - normalizedDistance * 0.3); // Less falloff for blocks
      const char = getShadeCharacter(shadeIntensity);

      // Ensure we stay within bounds
      if (Math.abs(px) < halfSize && Math.abs(py) < halfSize) {
        ctx.fillText(char, x + px, y + py);
      }
    }
  }

  ctx.restore();
}

/**
 * Draw a retro-style handle with ASCII art
 * @param ctx - Canvas rendering context
 * @param x - Center X
 * @param y - Center Y
 * @param palette - Color palette
 */
export function drawRetroHandle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  palette = DOS_PALETTE
): void {
  ctx.save();

  // Draw handle as a pixelated crosshair
  const handleSize = 12;
  const pixelSize = 3;

  ctx.fillStyle = palette.YELLOW;

  // Vertical line
  ctx.fillRect(
    Math.floor(x - pixelSize / 2),
    Math.floor(y - handleSize),
    pixelSize,
    handleSize * 2
  );

  // Horizontal line
  ctx.fillRect(
    Math.floor(x - handleSize),
    Math.floor(y - pixelSize / 2),
    handleSize * 2,
    pixelSize
  );

  // Center square
  ctx.fillStyle = palette.WHITE;
  ctx.fillRect(
    Math.floor(x - pixelSize),
    Math.floor(y - pixelSize),
    pixelSize * 2,
    pixelSize * 2
  );

  // Outer corner markers
  ctx.fillStyle = palette.LIGHT_CYAN;
  const markerSize = pixelSize;
  const markerDist = handleSize + pixelSize;

  // Four corners
  ctx.fillRect(Math.floor(x - markerDist), Math.floor(y - markerDist), markerSize, markerSize);
  ctx.fillRect(Math.floor(x + markerDist), Math.floor(y - markerDist), markerSize, markerSize);
  ctx.fillRect(Math.floor(x - markerDist), Math.floor(y + markerDist), markerSize, markerSize);
  ctx.fillRect(Math.floor(x + markerDist), Math.floor(y + markerDist), markerSize, markerSize);

  ctx.restore();
}

/**
 * Draw a background grid pattern using text characters
 * @param ctx - Canvas rendering context
 * @param width - Canvas width
 * @param height - Canvas height
 * @param palette - Color palette (optional, defaults to DOS_PALETTE)
 */
export function drawBackgroundGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  palette = DOS_PALETTE
): void {
  ctx.save();

  const gridSize = 40;

  ctx.fillStyle = palette.DARK_GRAY;
  ctx.font = '12px Geist Pixel, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Draw grid points as '+' characters
  for (let x = 0; x <= width; x += gridSize) {
    for (let y = 0; y <= height; y += gridSize) {
      ctx.fillText('+', x, y);
    }
  }

  ctx.restore();
}

/**
 * Draw a pixelated rectangle with optional border
 * @param ctx - Canvas rendering context
 * @param x - X position
 * @param y - Y position
 * @param width - Rectangle width
 * @param height - Rectangle height
 * @param fillColor - Fill color
 * @param borderColor - Border color (optional)
 * @param borderWidth - Border width in pixels
 */
export function drawPixelatedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  fillColor: string,
  borderColor?: string,
  borderWidth: number = 2
): void {
  ctx.save();

  const quantizedFill = quantizeToDOSPalette(fillColor);

  // Draw fill
  ctx.fillStyle = quantizedFill;
  ctx.fillRect(Math.floor(x), Math.floor(y), Math.floor(width), Math.floor(height));

  // Draw border if specified
  if (borderColor) {
    const quantizedBorder = quantizeToDOSPalette(borderColor);
    ctx.strokeStyle = quantizedBorder;
    ctx.lineWidth = borderWidth;
    ctx.strokeRect(
      Math.floor(x) + 0.5,
      Math.floor(y) + 0.5,
      Math.floor(width) - 1,
      Math.floor(height) - 1
    );
  }

  ctx.restore();
}

/**
 * Draw a dithered gradient between two colors
 * @param ctx - Canvas rendering context
 * @param x - X position
 * @param y - Y position
 * @param width - Gradient width
 * @param height - Gradient height
 * @param color1 - Start color
 * @param color2 - End color
 * @param horizontal - Horizontal gradient if true, vertical if false
 */
export function drawDitheredGradient(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  color1: string,
  color2: string,
  horizontal: boolean = true
): void {
  ctx.save();

  const quantizedColor1 = quantizeToDOSPalette(color1);
  const quantizedColor2 = quantizeToDOSPalette(color2);

  const ditherSize = 2; // 2x2 Bayer matrix
  const steps = horizontal ? Math.floor(width / ditherSize) : Math.floor(height / ditherSize);

  for (let i = 0; i < steps; i++) {
    const t = i / steps;
    const pattern = createDitherPattern(quantizedColor1, quantizedColor2, t);

    for (let dy = 0; dy < ditherSize; dy++) {
      for (let dx = 0; dx < ditherSize; dx++) {
        const colorIndex = dy * ditherSize + dx;
        ctx.fillStyle = pattern[colorIndex % pattern.length];

        const px = horizontal ? x + i * ditherSize + dx : x + dx;
        const py = horizontal ? y + dy : y + i * ditherSize + dy;

        if (px < x + width && py < y + height) {
          ctx.fillRect(Math.floor(px), Math.floor(py), 1, 1);
        }
      }
    }
  }

  ctx.restore();
}
