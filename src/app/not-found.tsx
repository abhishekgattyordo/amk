import React from 'react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 text-slate-800 p-6">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-200 p-8 text-center">
        <div className="w-16 h-16 bg-rose-500/10 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl font-black">
          404
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-2">Page Not Found</h1>
        <p className="text-sm text-slate-500 mb-6">
          The ERP module or page you are looking for does not exist or has been moved.
        </p>
        <Link 
          href="/"
          className="inline-flex w-full items-center justify-center px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/20 transition-colors"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}

