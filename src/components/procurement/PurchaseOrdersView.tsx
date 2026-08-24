import React from 'react';
import { Plus, Loader2, Check, XCircle, Printer } from 'lucide-react';
import { ProcurementPO, RawMaterial, User } from '../../types';

interface PurchaseOrdersViewProps {
  darkMode: boolean;
  isLoading: boolean;
  purchaseOrders: ProcurementPO[];
  rawMaterials: RawMaterial[];
  currentUser: User | null;
  getSupplierDisplayName: (supplierId?: string, supplierName?: string, millName?: string, supplierObj?: any) => string;
  onSelectMaterial?: (id: string) => void;
  setIsPoModalOpen: (open: boolean) => void;
  handleApprovePo: (po: ProcurementPO) => void;
  handleRejectPo: (po: ProcurementPO) => void;
  handleInwardClick: (po: ProcurementPO) => void;
  handlePrintPo: (po: ProcurementPO) => void;
}

export const PurchaseOrdersView: React.FC<PurchaseOrdersViewProps> = ({
  darkMode,
  isLoading,
  purchaseOrders,
  rawMaterials,
  currentUser,
  getSupplierDisplayName,
  onSelectMaterial,
  setIsPoModalOpen,
  handleApprovePo,
  handleRejectPo,
  handleInwardClick,
  handlePrintPo,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className={`text-base font-bold ${darkMode ? 'text-slate-200' : 'text-slate-800 dark:text-slate-500'}`}>Purchase Orders Ledger</h3>
        <button
          onClick={() => setIsPoModalOpen(true)}
          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md flex items-center space-x-1 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Raise PO directly</span>
        </button>
      </div>

      <div className={`rounded-2xl border overflow-hidden ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className={`border-b font-bold uppercase tracking-wider ${darkMode ? 'bg-slate-800/80 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                <th className="p-3">PO Number</th>
                <th className="p-3">Supplier Name</th>
                <th className="p-3">Material Details</th>
                <th className="p-3 text-right">Ordered / Received</th>
                <th className="p-3">Total Value</th>
                <th className="p-3">PO Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-500" />
                  </td>
                </tr>
              ) : purchaseOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-500">No data found</td>
                </tr>
              ) : purchaseOrders.map(po => (
                <tr key={po.id} className={`transition-colors ${darkMode ? 'hover:bg-slate-800/35' : 'hover:bg-slate-50/50'}`}>
                  <td className="p-3 font-mono">
                    <div className="font-bold text-blue-400">{po.poNumber}</div>
                    <div className="text-[10px] text-slate-700 dark:text-slate-400 mt-0.5">{po.date}</div>
                  </td>
                  <td className="p-3 font-semibold">{getSupplierDisplayName(po.supplierId, po.supplierName, (po as any).supplier?.millName, (po as any).supplier)}</td>
                  <td className="p-3">
                    <div 
                      className={`font-bold text-emerald-500 ${onSelectMaterial ? 'cursor-pointer hover:underline' : ''}`}
                      onClick={() => {
                        if (onSelectMaterial && po.items[0]) {
                          const m = rawMaterials.find(mat => mat.code === po.items[0].materialCode);
                          if (m) onSelectMaterial(m.id);
                        }
                      }}
                    >
                      {po.items[0]?.materialCode}
                    </div>
                    <div className="text-[10px] text-slate-700 dark:text-slate-400 truncate max-w-[150px]">{po.items[0]?.materialName}</div>
                  </td>
                  <td className="p-3 text-right">
                    <div className="font-bold">{po.items[0]?.quantityOrdered?.toLocaleString()} Kg</div>
                    <div className="text-[10px] text-slate-700 dark:text-slate-400">Rec: {po.items[0]?.quantityReceived?.toLocaleString()} Kg</div>
                  </td>
                  <td className="p-3 font-mono font-bold text-emerald-500">₹{po.items[0]?.total?.toLocaleString()}</td>
                  <td className="p-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      po.status === 'Completed' ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30' :
                      po.status === 'Approved' ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30' :
                      po.status === 'Rejected' ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' :
                      'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                    }`}>
                      {po.status}
                    </span>
                  </td>
                  <td className="p-3 text-right space-x-1.5">
                    {(po.status === 'Pending Approval' || po.status === 'Draft' || po.status === 'Pending') && (
                      <>
                        <button
                          onClick={() => handleApprovePo(po)}
                          className="px-2 py-1 rounded text-[10px] font-bold bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white transition-all cursor-pointer inline-flex items-center space-x-1"
                          title="Approve Purchase Order"
                        >
                          <Check className="w-3 h-3" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => handleRejectPo(po)}
                          className="px-2 py-1 rounded text-[10px] font-bold bg-rose-600/20 text-rose-400 hover:bg-rose-600 hover:text-white transition-all cursor-pointer inline-flex items-center space-x-1"
                          title="Reject Purchase Order"
                        >
                          <XCircle className="w-3 h-3" />
                          <span>Reject</span>
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleInwardClick(po)}
                      disabled={po.status === 'Completed' || po.status === 'Rejected'}
                      className={`px-2 py-1 rounded text-[10px] font-bold ${
                        po.status === 'Completed' || po.status === 'Rejected'
                          ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                          : 'bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white transition-all cursor-pointer'
                      }`}
                    >
                      {po.items[0]?.materialCode.toLowerCase().includes('kraft') ? 'Reel Inward' : 'Inward Gate'}
                    </button>
                    <button
                      onClick={() => handlePrintPo(po)}
                      className="p-1 hover:text-slate-200 text-slate-700 dark:text-slate-400 inline-block align-middle cursor-pointer"
                    >
                      <Printer className="w-4 h-4" />
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
