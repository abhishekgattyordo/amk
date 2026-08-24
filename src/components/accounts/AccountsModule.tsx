import React from 'react';
import { FileSpreadsheet, ArrowRight } from 'lucide-react';

interface AccountsModuleProps {
  darkMode: boolean;
}

export const AccountsModule: React.FC<AccountsModuleProps> = ({ darkMode }) => {
  const sections = [
    { title: 'Chart of Accounts', count: 110, desc: 'Assets, liabilities, equity, revenues & expenses' },
    { title: 'General Ledger', count: 450, desc: 'Double-entry bookkeeping journal entries' },
    { title: 'Cash & Bank Books', count: 6, desc: 'Bank reconciliation and cash flow monitoring' },
    { title: 'Profit & Loss Statement', count: 1, desc: 'Real-time manufacturing revenue vs cogs' },
    { title: 'Balance Sheet', count: 1, desc: 'Assets, liabilities & net worth summary' },
    { title: 'GST & Tax Reports', count: 12, desc: 'GSTR-1, GSTR-3B & Input Tax Credit registers' },
  ];

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className={`text-2xl font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
          Accounts & Financial Management
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          General ledger, profit & loss, balance sheet, and GST tax filings.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sections.map((sec, idx) => (
          <div key={idx} className={`p-6 rounded-2xl border transition-all hover:shadow-lg ${
            darkMode ? 'bg-slate-900/85 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-purple-400">
                {sec.count} Views
              </span>
            </div>
            <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{sec.title}</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">{sec.desc}</p>
            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-purple-400 cursor-pointer hover:underline">
              <span>Open Ledger</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
