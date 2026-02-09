import { CSSProperties } from 'react';

// Map icon names to text/ASCII/Unicode representation
// Using CP437-like characters or Unicode equivalents where appropriate for TUI feel
const TEXT_ICONS: Record<string, string> = {
  // Existing from icons.ts
  Smiley: ':)',
  Heart: '<3',
  Fire: '^',
  Star: '*',
  Question: '?',
  SmileyWink: ';)',
  Skull: '#',
  SmileyXEyes: 'X(',
  Ghost: 'oo',
  SmileySad: ':(',
  HandPalm: '_/',
  EyeSlash: '0',
  SmileyMeh: ':|',

  // Requested / Common
  Brain: '{}',
  Robot: '[]',

  // Common generic fallbacks
  Check: '√',
  X: 'X',
  Warning: '!',
  Info: 'i',
  Spinner: '...',
};

interface IconRendererProps {
  icon: string;
  className?: string;
  fallback?: string;
}

export function IconRenderer({ icon, className, fallback = '?' }: IconRendererProps) {
  // Check if we have a mapping
  const text = TEXT_ICONS[icon];

  const display = text || (icon.length <= 2 ? icon : fallback);

  return (
    <span
      className={className}
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
        lineHeight: 1,
        fontFamily: 'inherit'
      }}
      aria-label={icon}
      role="img"
    >
      {display}
    </span>
  );
}
