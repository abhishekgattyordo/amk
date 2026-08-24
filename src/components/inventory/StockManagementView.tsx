import React from 'react';
import { BarChart3, AlertTriangle, CheckCircle, ShieldAlert, Sparkles, TrendingUp, Loader2 } from 'lucide-react';
import { RawMaterial } from '../../types';

interface StockManagementViewProps {
  rawMaterials: RawMaterial[];
  darkMode: boolean;
  isLoading?: boolean;
}

export const StockManagementView: React.FC<StockManagementViewProps> = ({ 
  rawMaterials, 
  darkMode,
  isLoading = false 
}) => {
  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className={`text-2xl font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
          Advanced Stock Management & AI Recommendations
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Real-time stock valuation, health status color coding, and smart reorder forecasting.
        </p>
      </div>

      {/* AI Forecasting Banner */}
      <div className={`p-6 rounded-3xl border bg-gradient-to-r ${
        darkMode ? 'from-emerald-950/40 via-slate-900 to-teal-950/40 border-emerald-900/50' : 'from-emerald-50 via-teal-50 to-white border-emerald-200'
      } flex items-center justify-between`}>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500 text-white flex items-center shadow-sm">
              <Sparkles className="w-3.5 h-3.5 mr-1" /> Future AI Ready
            </span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Inventory Forecasting Engine</span>
          </div>
          <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Demand prediction & Automated Mill Purchase Suggestions are primed for activation.
          </h2>
          <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
            Based on historical consumption rates of Kraft Liner and Fluting Medium across AMK corrugated box production lines, stock levels are optimized for zero downtime.
          </p>
        </div>
      </div>

      {/* Stock Health Table */}
      <div className={`rounded-2xl border overflow-hidden ${darkMode ? 'bg-slate-900/85 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-base">Material Stock Health Status</h3>
          <div className="flex items-center space-x-4 text-xs font-semibold">
            <span className="flex items-center text-emerald-500"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-1.5"></span> Healthy</span>
            <span className="flex items-center text-amber-500"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 mr-1.5"></span> Low Stock</span>
            <span className="flex items-center text-rose-500"><span className="w-2.5 h-2.5 rounded-full bg-rose-500 mr-1.5"></span> Critical Stock</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`border-b text-xs font-bold uppercase tracking-wider ${
                darkMode ? 'bg-slate-800/80 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}>
                <th className="p-4">Material Code / Name</th>
                <th className="p-4">Current Stock</th>
                <th className="p-4">Min / Max Stock</th>
                <th className="p-4">Reorder Level</th>
                <th className="p-4">Stock Valuation</th>
                <th className="p-4">Health Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-16 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-500" />
                    <p className="text-xs font-semibold text-slate-500 mt-3">Loading stock management data, please wait...</p>
                  </td>
                </tr>
              ) : (
                rawMaterials.map(rm => {
                const valuation = rm.currentStock * rm.purchasePrice;
                const isCritical = rm.currentStock <= rm.minStock;
                const isLow = !isCritical && rm.currentStock <= rm.reorderLevel;
                const statusColor = isCritical ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : isLow ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
                const statusLabel = isCritical ? 'Critical Stock' : isLow ? 'Low Stock' : 'Healthy Stock';

                return (
                  <tr key={rm.id} className={`transition-colors ${darkMode ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50/80'}`}>
                    <td className="p-4">
                      <div className="font-bold text-xs font-mono text-emerald-500">{rm.code}</div>
                      <div className={`font-semibold text-sm mt-0.5 ${darkMode ? 'text-white' : 'text-slate-900'}`}>{rm.name}</div>
                    </td>
                    <td className="p-4 font-black text-sm">
                      {rm.currentStock.toLocaleString()} {rm.uom}
                    </td>
                    <td className="p-4 text-xs text-slate-400">
                      Min: {rm.minStock} | Max: {rm.maxStock}
                    </td>
                    <td className="p-4 font-bold text-xs">
                      {rm.reorderLevel} {rm.uom}
                    </td>
                    <td className="p-4 font-mono font-bold text-xs">
                      ₹{valuation.toLocaleString()}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${statusColor}`}>
                        <span className={`w-2 h-2 rounded-full mr-1.5 ${isCritical ? 'bg-rose-500 animate-ping' : isLow ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                        {statusLabel}
                      </span>
                    </td>
                  </tr>
                );
              })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
