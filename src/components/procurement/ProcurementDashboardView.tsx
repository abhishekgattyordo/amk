import React from 'react';
import { FileText, ShoppingCart, Award, Truck } from 'lucide-react';
import { RawMaterial } from '../../types';

interface ProcurementDashboardViewProps {
  darkMode: boolean;
  totalRfqCount: number;
  pendingRfqCount: number;
  approvedPoCount: number;
  pendingDelCount: number;
  totalProcValue: number;
  activeSups: number;
  lowStockItems: RawMaterial[];
  getSupplierDisplayName: (supplierId?: string, supplierName?: string, millName?: string, supplierObj?: any) => string;
  handleInitiateRfq: (rm: RawMaterial) => void;
}

export const ProcurementDashboardView: React.FC<ProcurementDashboardViewProps> = ({
  darkMode,
  totalRfqCount,
  pendingRfqCount,
  approvedPoCount,
  pendingDelCount,
  totalProcValue,
  activeSups,
  lowStockItems,
  getSupplierDisplayName,
  handleInitiateRfq,
}) => {
  return (
    <div className="space-y-6">
      {/* KPI Widget Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Total RFQs Sent', val: totalRfqCount, detail: `${pendingRfqCount} Pending response`, icon: FileText, color: 'text-amber-500 bg-amber-500/10' },
          { title: 'Approved POs Raised', val: approvedPoCount, detail: `${pendingDelCount} Pending delivery`, icon: ShoppingCart, color: 'text-emerald-500 bg-emerald-500/10' },
          { title: 'Procurement Value', val: `₹${(totalProcValue / 1000).toFixed(1)}k`, detail: 'Total spending year-to-date', icon: Award, color: 'text-blue-500 bg-blue-500/10' },
          { title: 'Active Suppliers', val: activeSups, detail: '100% on-time delivery metric', icon: Truck, color: 'text-rose-500 bg-rose-500/10' },
        ].map((kpi, i) => (
          <div key={i} className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-400 uppercase tracking-wider">{kpi.title}</span>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${kpi.color}`}>
                <kpi.icon className="w-4 h-4" />
              </div>
            </div>
            <div className={`text-2xl font-extrabold mt-1 ${darkMode ? 'text-white' : 'text-slate-950'}`}>{kpi.val}</div>
            <p className="text-[10px] text-slate-700 dark:text-slate-400 mt-1">{kpi.detail}</p>
          </div>
        ))}
      </div>

      {/* Charts & Trends panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Purchase Trend Chart (SVG) */}
        <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <h3 className={`text-sm font-bold mb-4 ${darkMode ? 'text-slate-200' : 'text-slate-800 dark:text-slate-500'}`}>Monthly Purchases Trend (₹)</h3>
          <div className="h-44 flex items-end justify-between space-x-2 px-2 pt-2 border-b border-l border-slate-700/30">
            {[
              { month: 'Mar', val: 120000, h: 'h-[30%]' },
              { month: 'Apr', val: 180000, h: 'h-[45%]' },
              { month: 'May', val: 240000, h: 'h-[60%]' },
              { month: 'Jun', val: 190000, h: 'h-[48%]' },
              { month: 'Jul', val: 310000, h: 'h-[78%]' },
              { month: 'Aug', val: totalProcValue, h: 'h-[95%]' }
            ].map((bar, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center group relative cursor-pointer">
                <div className="absolute -top-7 scale-0 group-hover:scale-100 transition-all bg-slate-800 text-white text-[10px] px-1.5 py-0.5 rounded shadow">
                  ₹{bar.val.toLocaleString()}
                </div>
                <div className={`w-full ${bar.h} bg-emerald-600 group-hover:bg-emerald-500 rounded-t-md transition-colors`}></div>
                <span className="text-[10px] text-slate-700 dark:text-slate-400 mt-2">{bar.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Spending Share */}
        <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <h3 className={`text-sm font-bold mb-4 ${darkMode ? 'text-slate-200' : 'text-slate-800 dark:text-slate-500'}`}>Procurement Material Breakdown</h3>
          <div className="space-y-3.5">
            {[
              { label: 'Virgin Kraft reels (180 GSM / 200 GSM)', val: '₹312,500', share: '75%', color: 'bg-emerald-500' },
              { label: 'Semi-Chemical Fluting Medium', val: '₹96,000', share: '20%', color: 'bg-blue-500' },
              { label: 'Adhesives (Modified Corn Starch)', val: '₹12,200', share: '5%', color: 'bg-amber-500' }
            ].map((item, i) => (
              <div key={i} className="text-xs">
                <div className="flex justify-between font-medium mb-1">
                  <span className={darkMode ? 'text-slate-300' : 'text-slate-700 dark:text-slate-400'}>{item.label}</span>
                  <span className="font-bold">{item.val} ({item.share})</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800/50 rounded-full overflow-hidden">
                  <div className={`h-full ${item.color}`} style={{ width: item.share }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Low Stock Alerts & Suggested Procurement */}
      <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className={`text-sm font-bold ${darkMode ? 'text-slate-200' : 'text-slate-800 dark:text-slate-500'}`}>Low Stock Purchase Suggestions</h3>
            <p className="text-[11px] text-slate-700 dark:text-slate-400">Calculated based on real-time inventory minimum stock thresholds</p>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-500">
            {lowStockItems.length} Materials Flagged
          </span>
        </div>

        {lowStockItems.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-700 dark:text-slate-400">
            ✓ All raw materials are well stocked above reorder levels.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/40">
            {lowStockItems.map((rm) => (
              <div key={rm.id} className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-xs text-amber-500">{rm.code}</span>
                    <span className={`text-xs font-bold ${darkMode ? 'text-white' : 'text-slate-950'}`}>{rm.name}</span>
                  </div>
                  <div className="text-[10px] text-slate-700 dark:text-slate-400 mt-0.5">
                    Current: <strong className="text-rose-500">{rm.currentStock} {rm.uom}</strong> | Reorder Level: {rm.reorderLevel} {rm.uom} | Mill Supplier: {getSupplierDisplayName(rm.supplierId, rm.supplier?.supplierName, (rm.supplier as any)?.millName, rm.supplier)}
                  </div>
                </div>
                <button
                  onClick={() => handleInitiateRfq(rm)}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600/10 hover:bg-emerald-600 hover:text-white text-emerald-500 font-bold text-[10px] transition-all self-start sm:self-center cursor-pointer"
                >
                  Raise Suggestion RFQ
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
