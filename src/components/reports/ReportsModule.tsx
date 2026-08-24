import React from 'react';
import { BarChart3, ArrowRight } from 'lucide-react';

interface ReportsModuleProps {
  darkMode: boolean;
  onGenerateReport: (reportTitle: string) => void;
}

export const ReportsModule: React.FC<ReportsModuleProps> = ({ darkMode, onGenerateReport }) => {
  const reportsList = [
    { title: 'Inventory Valuation Report', cat: 'Inventory', format: 'PDF / Excel' },
    { title: 'Low Stock & Reorder Analysis', cat: 'Inventory', format: 'PDF / CSV' },
    { title: 'Mill Supplier Outstanding Ledger', cat: 'Procurement', format: 'PDF / Excel' },
    { title: 'Corrugator Material Consumption Report', cat: 'Production', format: 'PDF / Excel' },
    { title: 'Finished Goods Dispatch Register', cat: 'Sales', format: 'PDF / Excel' },
    { title: 'GST Output vs Input Tax Report', cat: 'Accounts', format: 'Excel / JSON' },
  ];

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className={`text-2xl font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
          Enterprise Reports & Analytics
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Generate, export, and print comprehensive PDF and Excel reports across all ERP modules.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reportsList.map((rep, idx) => (
          <div key={idx} className={`p-6 rounded-2xl border transition-all hover:shadow-lg ${
            darkMode ? 'bg-slate-900/85 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-amber-500/10 text-amber-400">
                {rep.cat}
              </span>
              <span className="text-xs text-slate-400 font-medium">{rep.format}</span>
            </div>
            <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{rep.title}</h3>
            <p className="text-xs text-slate-500 mt-1">Ready for instant generation & export.</p>
            <div 
              onClick={() => onGenerateReport(rep.title)}
              className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-amber-500 cursor-pointer hover:underline"
            >
              <span>Generate Report</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
