import React from 'react';
import { X, Bell, Mail, Shield, Check, RotateCcw, Info, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { NotificationSettingRule } from '../../types';

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  rules: NotificationSettingRule[];
  onUpdateRule: (updatedRule: NotificationSettingRule) => void;
  onResetRules: () => void;
  darkMode: boolean;
}

export const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({
  isOpen,
  onClose,
  rules,
  onUpdateRule,
  onResetRules,
  darkMode
}) => {
  if (!isOpen) return null;

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'Info':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20">
            <Info className="w-3 h-3 mr-1 shrink-0" /> Info
          </span>
        );
      case 'Warning':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <AlertTriangle className="w-3 h-3 mr-1 shrink-0" /> Warning
          </span>
        );
      case 'Success':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3 mr-1 shrink-0" /> Success
          </span>
        );
      case 'Error':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20">
            <XCircle className="w-3 h-3 mr-1 shrink-0" /> Error
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
      <div className={`w-full max-w-4xl rounded-3xl shadow-2xl border p-6 relative max-h-[90vh] flex flex-col ${
        darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/40">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Procurement Notification Settings</h2>
              <p className="text-xs text-slate-400">
                Configure event-driven In-App alerts and outbound Email notification dispatch rules.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800/50 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto py-4 space-y-3 flex-1 pr-1">
          <div className="grid grid-cols-1 gap-3">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  darkMode
                    ? 'bg-slate-800/40 border-slate-800 hover:border-slate-700'
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-bold">{rule.eventName}</h4>
                    {getPriorityBadge(rule.priority)}
                  </div>
                  <div className="flex items-center space-x-3 mt-1 text-xs text-slate-400">
                    <span className="flex items-center">
                      <Shield className="w-3.5 h-3.5 mr-1 text-emerald-500" />
                      Recipients: <strong className="ml-1 text-slate-300">{rule.recipients}</strong>
                    </span>
                  </div>
                </div>

                {/* Toggles */}
                <div className="flex items-center space-x-6 shrink-0 bg-slate-900/40 p-2.5 rounded-xl border border-slate-800/40">
                  {/* In-App Toggle */}
                  <label className="flex items-center space-x-2 cursor-pointer select-none">
                    <div className={`p-1.5 rounded-lg ${rule.inAppEnabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                      <Bell className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">In-App</div>
                      <div className={`text-xs font-bold ${rule.inAppEnabled ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {rule.inAppEnabled ? 'Enabled' : 'Disabled'}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onUpdateRule({ ...rule, inAppEnabled: !rule.inAppEnabled })}
                      className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        rule.inAppEnabled ? 'bg-emerald-600' : 'bg-slate-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          rule.inAppEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </label>

                  {/* Divider */}
                  <div className="h-6 w-px bg-slate-800" />

                  {/* Email Toggle */}
                  <label className="flex items-center space-x-2 cursor-pointer select-none">
                    <div className={`p-1.5 rounded-lg ${rule.emailEnabled ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-500'}`}>
                      <Mail className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Email</div>
                      <div className={`text-xs font-bold ${rule.emailEnabled ? 'text-blue-400' : 'text-slate-500'}`}>
                        {rule.emailEnabled ? 'Enabled' : 'Disabled'}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onUpdateRule({ ...rule, emailEnabled: !rule.emailEnabled })}
                      className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        rule.emailEnabled ? 'bg-blue-600' : 'bg-slate-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          rule.emailEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800/40 flex items-center justify-between">
          <button
            onClick={onResetRules}
            className="px-3.5 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold flex items-center space-x-2 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Defaults</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 flex items-center space-x-2 transition-all cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Save Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
};
