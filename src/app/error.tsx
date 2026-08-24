'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('App Router Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
      <div className="max-w-md p-8 bg-white rounded-3xl shadow-xl border border-slate-200">
        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
          !
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Something went wrong</h2>
        <p className="text-slate-600 mb-8 text-sm leading-relaxed">
          {error.message || 'An unexpected error occurred in the application.'}
        </p>
        <button
          onClick={() => reset()}
          className="w-full px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg transition-all"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
