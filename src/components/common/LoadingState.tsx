import React from 'react';

interface LoadingStateProps {
  type?: 'cards' | 'table' | 'dashboard';
  rows?: number;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  type = 'table',
  rows = 5,
  className = '',
}) => {
  if (type === 'cards') {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse ${className}`}>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
            <div className="h-3 w-24 bg-slate-200 rounded mb-3" />
            <div className="h-7 w-16 bg-slate-200 rounded mb-2" />
            <div className="h-3 w-32 bg-slate-100 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (type === 'dashboard') {
    return (
      <div className={`space-y-6 animate-pulse ${className}`}>
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className="xl:col-span-8 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 h-52">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 bg-slate-200 rounded-2xl" />
                  <div className="space-y-2">
                    <div className="h-3 w-28 bg-slate-200 rounded" />
                    <div className="h-6 w-20 bg-slate-200 rounded" />
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-4 pt-4 border-t border-slate-100">
                  <div className="h-8 bg-slate-100 rounded" />
                  <div className="h-8 bg-slate-100 rounded" />
                  <div className="h-8 bg-slate-100 rounded" />
                  <div className="h-8 bg-slate-100 rounded" />
                </div>
              </div>
              <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 h-52 flex items-center justify-center">
                <div className="w-28 h-28 rounded-full border-8 border-slate-200" />
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-5 h-64">
              <div className="h-4 w-40 bg-slate-200 rounded mb-4" />
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-9 bg-slate-50 rounded" />
                ))}
              </div>
            </div>
          </div>
          <div className="xl:col-span-4 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 h-44" />
            <div className="bg-white rounded-2xl border border-slate-200 p-5 h-64" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 animate-pulse ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="h-4 w-36 bg-slate-200 rounded" />
        <div className="h-4 w-20 bg-slate-100 rounded" />
      </div>
      <div className="space-y-3">
        {[...Array(rows)].map((_, i) => (
          <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-md bg-slate-200" />
              <div className="h-3 w-32 bg-slate-200 rounded" />
            </div>
            <div className="h-3 w-20 bg-slate-100 rounded" />
            <div className="h-3 w-16 bg-slate-100 rounded" />
            <div className="h-5 w-14 bg-slate-200 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
};
