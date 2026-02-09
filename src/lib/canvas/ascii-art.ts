/**
 * ASCII art templates and patterns for retro emotion rendering
 * Uses box-drawing characters and block elements for authentic CLI/TUI appearance
 */

export interface EmotionIcon {
  /** Single character representation */
  char: string;
  /** Multi-line ASCII art pattern (3-5 lines) */
  blockPattern: string[];
}

/**
 * Box-drawing characters reference:
 * ═ ║ ╔ ╗ ╚ ╝ ╬ ┼ ─ │ ┌ ┐ └ ┘
 *
 * Block elements reference:
 * █ ▓ ▒ ░ ▀ ▄ ▌ ▐ ● ○ ■ □ ▲ ▼ ◆ ◇
 */

/**
 * Retro ASCII art icons
 * Keyed by Icon Name (e.g. Smiley, Heart) matching IconRenderer and DEFAULT_ANCHORS
 */
export const RETRO_ICONS: Record<string, EmotionIcon> = {
  Smiley: {
    char: '☺',
    blockPattern: [
      '╔═══╗',
      '║● ●║',
      '║ ◡ ║',
      '╚═══╝',
    ],
  },

  Heart: {
    char: '♥',
    blockPattern: [
      '▄▀▄▀▄',
      '█▀█▀█',
      '▀█▄█▀',
      ' ▀█▀ ',
    ],
  },

  Fire: {
    char: '▲', // Updated from ★ to be more like fire/upward
    blockPattern: [
      '  ▲  ',
      ' ▲█▲ ',
      '▲███▲',
      ' ▀█▀ ',
    ],
  },

  Star: {
    char: '*', // Updated from ! to *
    blockPattern: [
      '╔═══╗',
      '║○ ○║',
      '║ O ║',
      '╚═══╝',
    ],
  },

  Question: {
    char: '?',
    blockPattern: [
      '╔═══╗',
      '║◔ ◔║',
      '║ ~ ║',
      '╚═══╝',
    ],
  },

  SmileyWink: {
    char: ';)',
    blockPattern: [
      '┌───┐',
      '│◔ ─│',
      '│ ◡ │',
      '└───┘',
    ],
  },

  Skull: {
    char: '#',
    blockPattern: [
      '▄▄▄▄▄',
      '█● ●█',
      '▀▄█▄▀',
      ' ▀ ▀ ',
    ],
  },

  // Other common icons
  SmileyXEyes: {
    char: 'X(',
    blockPattern: [
      '┌───┐',
      '│× ×│',
      '│ ∩ │',
      '└───┘',
    ],
  },

  Ghost: {
    char: 'oo',
    blockPattern: [
      ' ▄▄▄ ',
      '▐○ ○▌',
      '▐   ▌',
      '▀▀▀▀▀',
    ],
  },

  SmileySad: {
    char: ':(',
    blockPattern: [
      '╔═══╗',
      '║● ●║',
      '║ ∩ ║',
      '╚═══╝',
    ],
  },

  EyeSlash: {
    char: '0',
    blockPattern: [
      '┌───┐',
      '│- -│',
      '│ ─ │',
      '└───┘',
    ],
  },

  SmileyMeh: {
    char: ':|',
    blockPattern: [
      '┌───┐',
      '│● ●│',
      '│ ─ │',
      '└───┘',
    ],
  },

  Neutral: {
    char: '─',
    blockPattern: [
      '┌───┐',
      '│● ●│',
      '│ ─ │',
      '└───┘',
    ],
  },
};

/**
 * Get retro icon by name
 * @param iconName - Icon name (e.g. Smiley, Heart)
 * @returns EmotionIcon or default neutral icon
 */
export function getRetroIcon(iconName: string): EmotionIcon {
  // Try exact match first
  if (RETRO_ICONS[iconName]) {
    return RETRO_ICONS[iconName];
  }

  // Try case-insensitive matching
  const keys = Object.keys(RETRO_ICONS);
  const match = keys.find(k => k.toLowerCase() === iconName.toLowerCase());
  if (match) {
    return RETRO_ICONS[match];
  }

  // Default to neutral
  return RETRO_ICONS.Neutral;
}

/**
 * Additional ASCII art decorative elements
 */
export const ASCII_DECORATIONS = {
  /** Corners for boxes */
  CORNERS: {
    TL: '┌', TR: '┐', BL: '└', BR: '┘',
    TL_DOUBLE: '╔', TR_DOUBLE: '╗', BL_DOUBLE: '╚', BR_DOUBLE: '╝',
  },

  /** Lines for boxes */
  LINES: {
    H: '─', V: '│',
    H_DOUBLE: '═', V_DOUBLE: '║',
  },

  /** Shading characters for gradients and dithering */
  SHADES: ['░', '▒', '▓', '█'],

  /** Block characters for pixel art */
  BLOCKS: {
    FULL: '█',
    DARK: '▓',
    MEDIUM: '▒',
    LIGHT: '░',
    TOP: '▀',
    BOTTOM: '▄',
    LEFT: '▌',
    RIGHT: '▐',
  },

  /** Geometric shapes */
  SHAPES: {
    CIRCLE_FILLED: '●',
    CIRCLE_EMPTY: '○',
    SQUARE_FILLED: '■',
    SQUARE_EMPTY: '□',
    TRIANGLE_UP: '▲',
    TRIANGLE_DOWN: '▼',
    DIAMOND_FILLED: '◆',
    DIAMOND_EMPTY: '◇',
  },
};

/**
 * Get shade character based on intensity (0-1)
 * @param intensity - Shade intensity (0 = lightest, 1 = darkest)
 * @returns Shade character
 */
export function getShadeCharacter(intensity: number): string {
  const clampedIntensity = Math.max(0, Math.min(1, intensity));
  const index = Math.floor(clampedIntensity * (ASCII_DECORATIONS.SHADES.length - 1));
  return ASCII_DECORATIONS.SHADES[index];
}

/**
 * Create a bordered box of ASCII art
 * @param content - Array of lines to put in the box
 * @param useDouble - Use double-line borders
 * @returns Array of lines with border
 */
export function createBorderedBox(content: string[], useDouble = false): string[] {
  const corners = useDouble ? ASCII_DECORATIONS.CORNERS : ASCII_DECORATIONS.CORNERS;
  const lines = useDouble ? ASCII_DECORATIONS.LINES : ASCII_DECORATIONS.LINES;

  const tl = useDouble ? corners.TL_DOUBLE : corners.TL;
  const tr = useDouble ? corners.TR_DOUBLE : corners.TR;
  const bl = useDouble ? corners.BL_DOUBLE : corners.BL;
  const br = useDouble ? corners.BR_DOUBLE : corners.BR;
  const h = useDouble ? lines.H_DOUBLE : lines.H;
  const v = useDouble ? lines.V_DOUBLE : lines.V;

  const maxWidth = Math.max(...content.map(line => line.length));
  const top = tl + h.repeat(maxWidth) + tr;
  const bottom = bl + h.repeat(maxWidth) + br;

  const borderedContent = content.map(line => {
    const padded = line.padEnd(maxWidth, ' ');
    return v + padded + v;
  });

  return [top, ...borderedContent, bottom];
}

/**
 * Available icon names
 */
export const ICON_NAMES = Object.keys(RETRO_ICONS);
