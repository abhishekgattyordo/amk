import React from 'react';
import { Settings as SettingsIcon, ShieldCheck, Database, Building2, Users } from 'lucide-react';

interface SettingsModuleProps {
  darkMode: boolean;
}

export const SettingsModule: React.FC<SettingsModuleProps> = ({ darkMode }) => {
  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className={`text-2xl font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
          Enterprise Settings & User Roles
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Company profile, financial year configuration, tax settings, and role-based access control.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900/85 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`text-base font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Company Profile</h3>
              <p className="text-xs text-slate-400">AMK Carton Mills Ltd - HQ</p>
            </div>
          </div>
          <div className="space-y-3 text-xs text-slate-300">
            <div className="flex justify-between py-2 border-b border-slate-800">
              <span className="text-slate-400">GSTIN</span>
              <span className="font-mono font-bold">27AAMCA8891P1ZU</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-800">
              <span className="text-slate-400">Financial Year</span>
              <span className="font-bold">2026 - 2027</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-800">
              <span className="text-slate-400">Base Currency</span>
              <span className="font-bold">INR (₹)</span>
            </div>
          </div>
        </div>

        <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900/85 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`text-base font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>User Roles & Permissions</h3>
              <p className="text-xs text-slate-400">Role-based access security</p>
            </div>
          </div>
          <div className="space-y-2 text-xs">
            {['Administrator', 'Inventory Manager', 'Purchase Manager', 'Production Manager', 'Accountant'].map((role, idx) => (
              <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/40 border border-slate-800">
                <span className="font-bold">{role}</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">Full Access</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
