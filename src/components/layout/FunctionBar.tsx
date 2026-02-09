import React from 'react';

interface FunctionBarProps {
  onAction?: (key: number) => void;
}

interface FunctionKey {
  key: number;
  label: string;
}

const FUNCTION_KEYS: FunctionKey[] = [
  { key: 9, label: 'Settings' },
];

/**
 * FunctionBar - Norton Commander style bottom function key bar
 * Displays F9 (Settings) - the only functional key
 */
const FunctionBar: React.FC<FunctionBarProps> = ({ onAction }) => {
  const handleClick = (key: number) => {
    if (onAction) {
      onAction(key);
    }
  };

  return (
    <footer className="flex justify-start gap-[var(--nc-gap)] p-[var(--nc-pad-sm)] bg-[var(--nc-black)] border-t-2 border-[var(--nc-white)]">
      {FUNCTION_KEYS.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => handleClick(key)}
          className="nc-button border-[var(--nc-cyan)] text-[var(--nc-cyan)] hover:bg-[var(--nc-cyan)] hover:text-[var(--nc-black)] px-3 py-1"
        >
          {key} {label}
        </button>
      ))}
    </footer>
  );
};

export default FunctionBar;
