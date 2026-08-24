import React from 'react';
import { Mail, CheckCircle2, X } from 'lucide-react';

export interface EmailToastNotice {
  id: string;
  recipient: string;
  subject: string;
  preview: string;
  timestamp: string;
}

interface EmailToastProps {
  toasts: EmailToastNotice[];
  onDismiss: (id: string) => void;
}

export const EmailToastContainer: React.FC<EmailToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-20 right-5 z-50 space-y-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto bg-slate-900/95 text-slate-100 border border-blue-500/40 rounded-2xl p-4 shadow-2xl backdrop-blur-md animate-in slide-in-from-top-3 fade-in duration-300"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-400">
                  Email Notification Sent
                </span>
                <span className="text-[10px] text-slate-400 block font-mono">To: {toast.recipient}</span>
              </div>
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-2 text-xs font-bold text-white truncate">
            {toast.subject}
          </div>

          <div className="mt-1 text-[11px] text-slate-300 leading-snug line-clamp-2 bg-slate-800/60 p-2 rounded-lg border border-slate-700/50">
            {toast.preview}
          </div>

          <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
            <span className="flex items-center text-emerald-400 font-semibold">
              <CheckCircle2 className="w-3 h-3 mr-1" /> Delivered
            </span>
            <span>{toast.timestamp}</span>
          </div>
        </div>
      ))}
    </div>
  );
};
