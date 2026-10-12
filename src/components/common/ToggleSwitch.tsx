import React from 'react';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  showText?: boolean;
  disabled?: boolean;
  id?: string;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  checked,
  onChange,
  size = 'md',
  label,
  showText = false,
  disabled = false,
  id,
}) => {
  const handleToggle = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      onChange(!checked);
    }
  };

  if (size === 'lg') {
    return (
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label || 'Toggle firewall status'}
        disabled={disabled}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        className={`relative inline-flex items-center justify-between h-9 w-[70px] rounded-full p-1 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 ${
          checked ? 'bg-emerald-500' : 'bg-slate-300'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer shadow-sm'}`}
      >
        <span
          className={`text-[11px] font-bold text-white transition-opacity select-none pl-2.5 ${
            checked ? 'opacity-100' : 'opacity-0'
          }`}
        >
          ON
        </span>
        <span
          className={`text-[11px] font-bold text-slate-500 transition-opacity select-none pr-2.5 ${
            !checked ? 'opacity-100' : 'opacity-0'
          }`}
        >
          OFF
        </span>
        <span
          className={`absolute top-1 left-1 bg-white h-7 w-7 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
            checked ? 'translate-x-[34px]' : 'translate-x-0'
          }`}
        />
      </button>
    );
  }

  // Small or Medium (for rules table rows)
  const isSm = size === 'sm';
  const width = isSm ? 'w-8' : 'w-10';
  const height = isSm ? 'h-4.5' : 'h-5.5';
  const thumbSize = isSm ? 'h-3.5 w-3.5' : 'h-4.5 w-4.5';
  const translate = isSm ? 'translate-x-3.5' : 'translate-x-4.5';

  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label || 'Toggle status'}
      disabled={disabled}
      onClick={handleToggle}
      onKeyDown={handleKeyDown}
      className={`relative inline-flex items-center ${width} ${height} rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
        checked ? 'bg-blue-600' : 'bg-slate-300'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span
        className={`inline-block ${thumbSize} transform rounded-full bg-white shadow transition-transform duration-200 ease-in-out ml-0.5 ${
          checked ? translate : 'translate-x-0'
        }`}
      />
    </button>
  );
};
