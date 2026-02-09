/**
 * DOS/EGA 16-color palette and color quantization utilities
 * Used for authentic retro rendering with color quantization
 */

export interface RGB {
  r: number;
  g: number;
  b: number;
}

/**
 * The classic DOS/EGA 16-color palette
 * These are the exact colors from the original IBM EGA/VGA standard
 */
export const DOS_PALETTE = {
  BLACK: '#000000',
  BLUE: '#0000AA',
  GREEN: '#00AA00',
  CYAN: '#00AAAA',
  RED: '#AA0000',
  MAGENTA: '#AA00AA',
  BROWN: '#AA5500',
  LIGHT_GRAY: '#AAAAAA',
  DARK_GRAY: '#555555',
  LIGHT_BLUE: '#5555FF',
  LIGHT_GREEN: '#55FF55',
  LIGHT_CYAN: '#55FFFF',
  LIGHT_RED: '#FF5555',
  LIGHT_MAGENTA: '#FF55FF',
  YELLOW: '#FFFF55',
  WHITE: '#FFFFFF',
} as const;

/**
 * Light theme palette - Inverted or high contrast
 */
export const LIGHT_THEME_PALETTE = {
  BLACK: '#F0F0F0',         // Inverted Background (Light Gray/White)
  BLUE: '#2222FF',          // Blue
  GREEN: '#008800',         // Dark Green
  CYAN: '#008888',          // Dark Teal
  RED: '#CC0000',           // Red
  MAGENTA: '#880088',       // Dark Magenta
  BROWN: '#664400',         // Dark Brown
  LIGHT_GRAY: '#555555',    // Dark Gray (Inverted)
  DARK_GRAY: '#BBBBBB',     // Light Gray (for subtle grid)
  LIGHT_BLUE: '#0000CC',    // Brighter Blue
  LIGHT_GREEN: '#00CC00',   // Brighter Green
  LIGHT_CYAN: '#00CCCC',    // Brighter Teal
  LIGHT_RED: '#FF0000',     // Bright Red
  LIGHT_MAGENTA: '#CC00CC', // Brighter Magenta
  YELLOW: '#AA5500',        // Brown/Orange for High Visibility instead of Yellow
  WHITE: '#111111',         // Inverted Foreground (Almost Black)
} as const;

/**
 * Helper to get palette based on theme
 */
export const getPalette = (theme: 'dark' | 'light' = 'dark') => {
  return theme === 'light' ? LIGHT_THEME_PALETTE : DOS_PALETTE;
};

/**
 * Array of DOS palette colors for iteration
 */
export const DOS_COLORS = Object.values(DOS_PALETTE);

/**
 * Color names for easy reference
 */
export type DOSColorName = keyof typeof DOS_PALETTE;

/**
 * Parse hex color string to RGB object
 * @param hex - Hex color string (e.g., '#FF5500' or 'FF5500')
 * @returns RGB object or null if invalid
 */
export function hexToRgb(hex: string): RGB | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Convert RGB to hex color string
 * @param rgb - RGB color object
 * @returns Hex color string
 */
export function rgbToHex(rgb: RGB): string {
  const toHex = (n: number) => {
    const hex = Math.round(Math.max(0, Math.min(255, n))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

/**
 * Calculate Euclidean distance between two colors in RGB space
 * @param c1 - First RGB color
 * @param c2 - Second RGB color
 * @returns Distance value
 */
function colorDistance(c1: RGB, c2: RGB): number {
  const dr = c1.r - c2.r;
  const dg = c1.g - c2.g;
  const db = c1.b - c2.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

/**
 * Quantize any color to the nearest DOS palette color
 * Uses Euclidean distance in RGB space for color matching
 * @param hexColor - Input hex color string
 * @returns Nearest DOS palette hex color
 */
export function quantizeToDOSPalette(hexColor: string): string {
  const inputRgb = hexToRgb(hexColor);
  if (!inputRgb) {
    return DOS_PALETTE.BLACK; // Default to black for invalid colors
  }

  let nearestColor: string = DOS_PALETTE.BLACK;
  let minDistance = Infinity;

  for (const dosColor of DOS_COLORS) {
    const dosRgb = hexToRgb(dosColor);
    if (!dosRgb) continue;

    const distance = colorDistance(inputRgb, dosRgb);
    if (distance < minDistance) {
      minDistance = distance;
      nearestColor = dosColor;
    }
  }

  return nearestColor;
}

/**
 * Get a DOS color by name
 * @param name - DOS color name
 * @returns Hex color string
 */
export function getDOSColor(name: DOSColorName): string {
  return DOS_PALETTE[name];
}

/**
 * Create a dithering pattern for two colors
 * @param color1 - First color (dominant)
 * @param color2 - Second color (accent)
 * @param intensity - Mix intensity (0-1, where 0 is all color1, 1 is all color2)
 * @returns Array of colors for dithering pattern
 */
export function createDitherPattern(
  color1: string,
  color2: string,
  intensity: number
): string[] {
  const clampedIntensity = Math.max(0, Math.min(1, intensity));

  // Bayer 2x2 dithering pattern
  if (clampedIntensity < 0.25) {
    return [color1, color1, color1, color1];
  } else if (clampedIntensity < 0.5) {
    return [color1, color2, color1, color1];
  } else if (clampedIntensity < 0.75) {
    return [color1, color2, color2, color1];
  } else {
    return [color2, color2, color2, color1];
  }
}
