import React from 'react';

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  className?: string;
}

export function Checkbox({ checked, onChange, label, className = '' }: CheckboxProps) {
  return (
    <label className={`cursor-pointer inline-flex items-center gap-3 select-none group ${className}`} onClick={(e) => e.stopPropagation()}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="hidden"
      />
      <span className="font-mono text-xl text-[var(--nc-white)] group-hover:text-[var(--nc-bright-white)]">
        [{checked ? <span className="text-[var(--nc-cyan)] font-bold">x</span> : <span className="invisible font-bold">x</span>}]
      </span>
      {label && (
        <span className={`uppercase ${checked ? 'text-[var(--nc-bright-white)]' : 'text-[var(--nc-white)]'} group-hover:text-[var(--nc-bright-white)]`}>
          {label}
        </span>
      )}
    </label>
  );
}
