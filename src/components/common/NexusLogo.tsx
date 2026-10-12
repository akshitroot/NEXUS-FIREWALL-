import React from 'react';

export const NexusLogo: React.FC<{ size?: number; className?: string }> = ({ size = 32, className = '' }) => {
  return (
    <div className={`relative flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
      <svg
        viewBox="0 0 40 44"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-sm"
      >
        {/* Outer Shield Shield Shape */}
        <path
          d="M20 2L3 8.5V21C3 31.8 10.4 41.5 20 44C29.6 41.5 37 31.8 37 21V8.5L20 2Z"
          fill="url(#nexus-shield-grad)"
        />
        {/* Inner geometric accent */}
        <path
          d="M20 7L7 12V21C7 29.5 12.8 37.2 20 39.5C27.2 37.2 33 29.5 33 21V12L20 7Z"
          fill="url(#nexus-inner-grad)"
          opacity="0.9"
        />
        {/* Central Core Dynamic Cut */}
        <path
          d="M20 12L12 15.5V22C12 27 15.5 31.5 20 33C24.5 31.5 28 27 28 22V15.5L20 12Z"
          fill="#FFFFFF"
          fillOpacity="0.25"
        />
        <path
          d="M20 15L15 17.5V22.5C15 25.8 17.2 28.8 20 29.8V15Z"
          fill="#FFFFFF"
          fillOpacity="0.4"
        />
        <defs>
          <linearGradient id="nexus-shield-grad" x1="3" y1="2" x2="37" y2="44" gradientUnits="userSpaceOnUse">
            <stop stopColor="#2563EB" />
            <stop stopColor="#1D4ED8" />
          </linearGradient>
          <linearGradient id="nexus-inner-grad" x1="7" y1="7" x2="33" y2="39.5" gradientUnits="userSpaceOnUse">
            <stop stopColor="#3B82F6" />
            <stop stopColor="#1E40AF" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};
