import React from 'react';
import { NexusLogo } from '../common/NexusLogo';

export const BrandingCard: React.FC = () => {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-linear-to-b from-sky-50/50 via-white to-slate-100/70 p-5 shadow-xs">
      <div className="relative z-10 flex items-center gap-3 mb-2">
        <NexusLogo size={28} />
        <div>
          <h4 className="text-xs font-bold text-slate-900 leading-tight">
            NEXUS Firewall
          </h4>
          <p className="text-[10px] text-slate-500 font-medium">
            Advanced security. Simple control.
          </p>
        </div>
      </div>

      {/* Stylized vector mountain ranges backdrop */}
      <div className="relative h-20 w-full overflow-hidden rounded-lg mt-2 opacity-85">
        <svg
          viewBox="0 0 400 120"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full"
        >
          <defs>
            <linearGradient id="mnt-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e0f2fe" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#f8fafc" stopOpacity="0.9" />
            </linearGradient>
            <linearGradient id="mnt-back" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#bae6fd" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#e2e8f0" stopOpacity="0.8" />
            </linearGradient>
            <linearGradient id="mnt-mid" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#93c5fd" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#cbd5e1" stopOpacity="0.9" />
            </linearGradient>
            <linearGradient id="mnt-fore" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#e2e8f0" stopOpacity="0.95" />
            </linearGradient>
          </defs>

          {/* Sky background */}
          <rect width="400" height="120" fill="url(#mnt-sky)" />

          {/* Distant peaks */}
          <polygon points="0,120 40,55 90,85 160,35 240,90 320,40 370,75 400,60 400,120" fill="url(#mnt-back)" />

          {/* Mid peaks with snow ridge */}
          <polygon points="0,120 70,68 120,45 190,80 270,30 350,85 400,65 400,120" fill="url(#mnt-mid)" />

          {/* Foreground crests */}
          <polygon points="0,120 30,95 100,75 160,95 230,55 310,95 380,70 400,85 400,120" fill="url(#mnt-fore)" />
        </svg>
      </div>
    </div>
  );
};
