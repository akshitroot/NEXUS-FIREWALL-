import React from 'react';
import { Settings, Terminal, Code2, MessageSquare, Box, Globe, Shield } from 'lucide-react';

interface AppIconProps {
  name: string;
  className?: string;
  size?: number;
}

export const AppIcon: React.FC<AppIconProps> = ({ name, className = '', size = 18 }) => {
  const normalized = name.toLowerCase();

  if (normalized.includes('chrome')) {
    return (
      <div 
        className={`inline-flex items-center justify-center shrink-0 rounded-full overflow-hidden ${className}`}
        style={{ width: size, height: size }}
        title="Google Chrome"
      >
        <svg viewBox="0 0 48 48" className="w-full h-full">
          <circle cx="24" cy="24" r="20" fill="#EA4335" />
          <path d="M24 4C14.1 4 5.9 11.2 4.3 20.6L16.2 27.5C17.5 21.6 23.3 17.5 29.5 18.8C31.5 19.2 33.3 20.2 34.6 21.6L43.7 12.5C38.7 7.2 31.6 4 24 4Z" fill="#EA4335" />
          <path d="M43.7 12.5C46.4 16.5 48 21.3 48 26.5C48 37.5 39.8 46.6 29 48.7L36.3 36C40.6 33.5 42 28 39.5 23.7C38.6 22.2 37.3 21 35.7 20.2L43.7 12.5Z" fill="#FBBC05" />
          <path d="M29 48.7C20.6 50.3 12.2 46.5 7.9 39.5L16.3 25C17.5 30.9 23.3 35 29.5 33.7C31.5 33.3 33.3 32.3 34.6 30.9L29 48.7Z" fill="#34A853" />
          <circle cx="24" cy="24" r="9" fill="#FFFFFF" />
          <circle cx="24" cy="24" r="7" fill="#4285F4" />
        </svg>
      </div>
    );
  }

  if (normalized.includes('github') || normalized.includes('git')) {
    return (
      <div 
        className={`inline-flex items-center justify-center shrink-0 rounded-full bg-slate-900 text-white ${className}`}
        style={{ width: size, height: size }}
        title="GitHub"
      >
        <svg viewBox="0 0 24 24" className="w-3/4 h-3/4 fill-current">
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
        </svg>
      </div>
    );
  }

  if (normalized.includes('ssh')) {
    return (
      <div 
        className={`inline-flex items-center justify-center shrink-0 rounded-md bg-slate-800 text-white font-mono text-[9px] font-bold ${className}`}
        style={{ width: size, height: size }}
        title="SSH Client"
      >
        &gt;_
      </div>
    );
  }

  if (normalized.includes('system')) {
    return (
      <div 
        className={`inline-flex items-center justify-center shrink-0 rounded-full bg-slate-100 text-slate-600 ${className}`}
        style={{ width: size, height: size }}
        title="System Process"
      >
        <Settings size={size * 0.75} className="text-slate-600" />
      </div>
    );
  }

  if (normalized.includes('code') || normalized.includes('vs code')) {
    return (
      <div 
        className={`inline-flex items-center justify-center shrink-0 rounded bg-sky-50 text-sky-600 ${className}`}
        style={{ width: size, height: size }}
        title="Visual Studio Code"
      >
        <Code2 size={size * 0.75} />
      </div>
    );
  }

  if (normalized.includes('discord')) {
    return (
      <div 
        className={`inline-flex items-center justify-center shrink-0 rounded-full bg-indigo-50 text-indigo-600 ${className}`}
        style={{ width: size, height: size }}
        title="Discord"
      >
        <MessageSquare size={size * 0.75} />
      </div>
    );
  }

  if (normalized.includes('docker')) {
    return (
      <div 
        className={`inline-flex items-center justify-center shrink-0 rounded-md bg-blue-50 text-blue-600 ${className}`}
        style={{ width: size, height: size }}
        title="Docker Engine"
      >
        <Box size={size * 0.75} />
      </div>
    );
  }

  return (
    <div 
      className={`inline-flex items-center justify-center shrink-0 rounded-full bg-slate-100 text-slate-600 ${className}`}
      style={{ width: size, height: size }}
      title={name}
    >
      <Globe size={size * 0.75} />
    </div>
  );
};
