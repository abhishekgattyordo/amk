import React from 'react';
import { Plus, Award, Printer, Download } from 'lucide-react';
import { RFQItem, Supplier } from '../../types';

interface RFQViewProps {
  darkMode: boolean;
  rfqs: RFQItem[];
  suppliers: Supplier[];
  getSupplierDisplayName: (supplierId?: string, supplierName?: string, millName?: string, supplierObj?: any) => string;
  onRaiseNewRfq: () => void;
  onCompareQuotes: (rfq: RFQItem) => void;
  onDuplicateRfq: (rfq: RFQItem) => void;
  onPrintRfq: (rfq: RFQItem) => void;
  onDownloadPdf: (rfq: RFQItem) => void;
}

export const RFQView: React.FC<RFQViewProps> = ({
  darkMode,
  rfqs,
  suppliers,
  getSupplierDisplayName,
  onRaiseNewRfq,
  onCompareQuotes,
  onDuplicateRfq,
  onPrintRfq,
  onDownloadPdf,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className={`text-base font-bold ${darkMode ? 'text-slate-200' : 'text-slate-800 dark:text-slate-500'}`}>Active Requests for Quotation (RFQ)</h3>
        <button
          onClick={onRaiseNewRfq}
          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md flex items-center space-x-1 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Raise New RFQ</span>
        </button>
      </div>

      <div className={`rounded-2xl border overflow-hidden ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className={`border-b font-bold uppercase tracking-wider ${darkMode ? 'bg-slate-800/80 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                <th className="p-3">RFQ Number / Date</th>
                <th className="p-3">Material Details</th>
                <th className="p-3">Qty Requested</th>
                <th className="p-3">Department / Target</th>
                <th className="p-3">Invited Suppliers</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {rfqs.map(rfq => (
                <tr key={rfq.id} className={`transition-colors ${darkMode ? 'hover:bg-slate-800/35' : 'hover:bg-slate-50/50'}`}>
                  <td className="p-3 font-mono">
                    <div className="font-bold text-emerald-500">{rfq.rfqNumber}</div>
                    <div className="text-[10px] text-slate-700 dark:text-slate-400 mt-0.5">{rfq.rfqDate}</div>
                  </td>
                  <td className="p-3">
                    <div className="font-bold text-slate-700 dark:text-slate-300">
                      {rfq.materials.length === 1 
                        ? rfq.materials[0]?.name 
                        : `${rfq.materials[0]?.name} (+${rfq.materials.length - 1} more)`}
                    </div>
                    <div className="text-[10px] text-slate-800 dark:text-slate-500 font-mono">
                      {rfq.materials.length === 1 
                        ? rfq.materials[0]?.materialCode 
                        : `${rfq.materials.length} raw materials`}
                    </div>
                  </td>
                  <td className="p-3 font-bold">
                    {rfq.materials.length === 1 
                      ? `${rfq.materials[0]?.quantity?.toLocaleString()} ${rfq.materials[0]?.unit}` 
                      : `${rfq.materials.reduce((sum, m) => sum + m.quantity, 0).toLocaleString()} total`}
                  </td>
                  <td className="p-3">
                    <div>{rfq.department}</div>
                    <div className="text-[10px] text-slate-700 dark:text-slate-400 font-bold">Target Date: {rfq.deliveryDate}</div>
                  </td>
                  <td className="p-3 font-medium text-slate-700 dark:text-slate-400">
                    {rfq.suppliers.map(s => getSupplierDisplayName(s.supplierId || (s as any).id, s.supplierName, (s as any).millName)).join(', ')}
                  </td>
                  <td className="p-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      rfq.status === 'Awarded' 
                        ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/20'
                        : 'bg-amber-500/15 text-amber-500 border border-amber-500/20'
                    }`}>
                      {rfq.status}
                    </span>
                  </td>
                  <td className="p-3 text-right space-x-1">
                    <button
                      onClick={() => onCompareQuotes(rfq)}
                      className="p-1 hover:text-emerald-500 text-slate-700 dark:text-slate-400 transition-colors cursor-pointer"
                      title="Compare Quotations"
                    >
                      <Award className="w-4 h-4 inline-block" />
                    </button>
                    <button
                      onClick={() => onDuplicateRfq(rfq)}
                      className="p-1 hover:text-blue-500 text-slate-700 dark:text-slate-400 transition-colors cursor-pointer"
                      title="Duplicate RFQ"
                    >
                      <Plus className="w-4 h-4 inline-block" />
                    </button>
                    <button
                      onClick={() => onPrintRfq(rfq)}
                      className="p-1 hover:text-slate-200 text-slate-700 dark:text-slate-400 transition-colors cursor-pointer"
                      title="Print RFQ"
                    >
                      <Printer className="w-4 h-4 inline-block" />
                    </button>
                    <button
                      onClick={() => onDownloadPdf(rfq)}
                      className="p-1 hover:text-slate-200 text-slate-700 dark:text-slate-400 transition-colors cursor-pointer"
                      title="Download PDF"
                    >
                      <Download className="w-4 h-4 inline-block" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
