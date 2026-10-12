/**
 * Utility functions for NEXUS Firewall frontend
 */

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function getActionBadgeClasses(action: 'ALLOW' | 'BLOCK' | 'REJECT' | 'PENDING'): {
  bg: string;
  text: string;
  dot: string;
} {
  switch (action) {
    case 'ALLOW':
      return {
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
        text: 'text-emerald-700',
        dot: 'bg-emerald-500',
      };
    case 'BLOCK':
      return {
        bg: 'bg-rose-50 text-rose-700 border-rose-200/60',
        text: 'text-rose-700',
        dot: 'bg-rose-500',
      };
    case 'REJECT':
      return {
        bg: 'bg-amber-50 text-amber-700 border-amber-200/60',
        text: 'text-amber-700',
        dot: 'bg-amber-500',
      };
    case 'PENDING':
      return {
        bg: 'bg-amber-50 text-amber-700 border-amber-200/60',
        text: 'text-amber-700',
        dot: 'bg-amber-400 animate-pulse',
      };
  }
}

export function getDirectionBadgeClasses(direction: 'INBOUND' | 'OUTBOUND' | 'BOTH'): {
  bg: string;
  text: string;
} {
  switch (direction) {
    case 'OUTBOUND':
      return {
        bg: 'bg-sky-50 text-sky-700 border-sky-200/60',
        text: 'text-sky-700',
      };
    case 'INBOUND':
      return {
        bg: 'bg-rose-50 text-rose-700 border-rose-200/60',
        text: 'text-rose-700',
      };
    case 'BOTH':
      return {
        bg: 'bg-purple-50 text-purple-700 border-purple-200/60',
        text: 'text-purple-700',
      };
  }
}

export function getSeverityBadgeClasses(severity: 'critical' | 'high' | 'medium' | 'low' | 'info'): {
  bg: string;
  text: string;
  dot: string;
} {
  switch (severity) {
    case 'info':
      return {
        bg: 'bg-blue-50 text-blue-700 border-blue-200/60',
        text: 'text-blue-700',
        dot: 'bg-blue-500',
      };
    case 'low':
      return {
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
        text: 'text-emerald-700',
        dot: 'bg-emerald-500',
      };
    case 'medium':
      return {
        bg: 'bg-amber-50 text-amber-700 border-amber-200/60',
        text: 'text-amber-700',
        dot: 'bg-amber-500',
      };
    case 'high':
      return {
        bg: 'bg-rose-50 text-rose-700 border-rose-200/60',
        text: 'text-rose-700',
        dot: 'bg-rose-500',
      };
    case 'critical':
      return {
        bg: 'bg-red-100 text-red-900 border-red-300 font-semibold',
        text: 'text-red-800',
        dot: 'bg-red-600 animate-pulse',
      };
  }
}
