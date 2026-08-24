import React from 'react';
import { Plus, ArrowUp, ArrowDown, X, Copy, Trash2 } from 'lucide-react';
import { DatePicker } from '../common/DatePicker';
import { ServerSearchableDropdown } from '../common/ServerSearchableDropdown';
import { RawMaterial, Supplier } from '../../types';

interface RFQFormProps {
  newRfq: any;
  setNewRfq: (rfq: any) => void;
  rfqItems: any[];
  setRfqItems: (items: any[]) => void;
  suppliers: Supplier[];
  darkMode: boolean;
  handleAddRfqItem: () => void;
  handleUpdateRfqItem: (index: number, field: string, value: any) => void;
  handleMoveRfqItem: (index: number, direction: 'up' | 'down') => void;
  handleRemoveRfqItem: (index: number) => void;
  handleDuplicateRfqItem: (index: number) => void;
  allowDuplicateMaterials: boolean;
  setAllowDuplicateMaterials: (val: boolean) => void;
  handleSubmit: (e: React.FormEvent) => void;
}

export const RFQForm: React.FC<RFQFormProps> = ({
  newRfq, setNewRfq, rfqItems, setRfqItems, suppliers, darkMode,
  handleAddRfqItem, handleUpdateRfqItem, handleMoveRfqItem, handleRemoveRfqItem,
  handleDuplicateRfqItem, allowDuplicateMaterials, setAllowDuplicateMaterials, handleSubmit
}) => {
  const selectedSuppliers = newRfq.selectedSuppliers || [];
  const setSelectedSuppliers = (ids: string[]) => setNewRfq({...newRfq, selectedSuppliers: ids});

  return (
    <form onSubmit={handleSubmit} className="space-y-5 overflow-y-auto pr-1 flex-1">
      {/* Header Details */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 rounded-2xl border bg-slate-500/5 border-slate-800/20">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400 mb-1">Originating Department</label>
          <select value={newRfq.department} onChange={(e) => setNewRfq({ ...newRfq, department: e.target.value })} className={`w-full px-3 py-2 rounded-xl border text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200'}`}>
            <option value="Production">Production Plant</option>
            <option value="Adhesives">Adhesives Dept</option>
            <option value="Maintenance">Maintenance</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400 mb-1">Priority Level</label>
          <select value={newRfq.priority} onChange={(e) => setNewRfq({ ...newRfq, priority: e.target.value as any })} className={`w-full px-3 py-2 rounded-xl border text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200'}`}>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High Priority</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400 mb-1">Default Target Delivery Date</label>
          <DatePicker
            value={newRfq.deliveryDate}
            onChange={(date) => setNewRfq({ ...newRfq, deliveryDate: date })}
            darkMode={darkMode}
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400 mb-1">RFQ Brief Description</label>
          <input type="text" value={newRfq.description} onChange={(e) => setNewRfq({ ...newRfq, description: e.target.value })} placeholder="e.g., Raw material replenishment for Box Line 2" className={`w-full px-3 py-2 rounded-xl border text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200'}`} />
        </div>
      </div>

      {/* Dynamic Line-Item Table */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
            <div className="flex items-center space-x-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400 flex items-center gap-1.5">
                    Requested Raw Materials Line Items
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                    {rfqItems.length} {rfqItems.length === 1 ? 'Item' : 'Items'}
                </span>
            </div>
            <div className="flex items-center space-x-3">
                <label className="flex items-center space-x-1.5 text-xs text-slate-700 dark:text-slate-400 cursor-pointer select-none">
                    <input type="checkbox" checked={allowDuplicateMaterials} onChange={(e) => setAllowDuplicateMaterials(e.target.checked)} className="rounded accent-emerald-600" />
                    <span>Allow duplicate materials</span>
                </label>
                <button
                    type="button"
                    onClick={handleAddRfqItem}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow flex items-center space-x-1 cursor-pointer transition-all"
                >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Raw Material Item</span>
                </button>
            </div>
        </div>

        <div className={`rounded-2xl border overflow-x-auto ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className={`border-b font-bold uppercase tracking-wider text-[10px] ${darkMode ? 'bg-slate-800/80 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
                <th className="p-2.5 w-12 text-center">#</th>
                <th className="p-2.5 min-w-[180px]">Raw Material *</th>
                <th className="p-2.5 min-w-[150px]">Description</th>
                <th className="p-2.5 w-20">Unit</th>
                <th className="p-2.5 w-28">Quantity *</th>
                <th className="p-2.5 w-28">Expected Price (₹)</th>
                <th className="p-2.5 w-32">Req. Delivery Date</th>
                <th className="p-2.5 min-w-[120px]">Remarks</th>
                <th className="p-2.5 w-24 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/30">
              {rfqItems.map((item, index) => (
                <tr key={index} className={`hover:bg-slate-500/5 transition-colors`}>
                  <td className="p-2 text-center font-mono text-[10px] text-slate-700 dark:text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-0.5">
                        <span>{index + 1}</span>
                        <div className="flex items-center space-x-0.5">
                            <button type="button" disabled={index === 0} onClick={() => handleMoveRfqItem(index, 'up')} className="p-0.5 rounded hover:bg-slate-700/50 text-slate-700 dark:text-slate-400 disabled:opacity-20 cursor-pointer"><ArrowUp className="w-2.5 h-2.5" /></button>
                            <button type="button" disabled={index === rfqItems.length - 1} onClick={() => handleMoveRfqItem(index, 'down')} className="p-0.5 rounded hover:bg-slate-700/50 text-slate-700 dark:text-slate-400 disabled:opacity-20 cursor-pointer"><ArrowDown className="w-2.5 h-2.5" /></button>
                        </div>
                      </div>
                  </td>
                  <td className="p-2">
                    <ServerSearchableDropdown
                      darkMode={darkMode}
                      value={item.materialId || ''}
                      onChange={(id, mat) => handleUpdateRfqItem(index, 'materialId', mat?.id)}
                      placeholder="Search material..."
                    />
                  </td>
                  <td className="p-2"><input type="text" value={item.description} onChange={(e) => handleUpdateRfqItem(index, 'description', e.target.value)} className={`w-full px-2 py-1.5 rounded-lg border text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} /></td>
                  <td className="p-2"><input type="text" value={item.unit} onChange={(e) => handleUpdateRfqItem(index, 'unit', e.target.value)} className={`w-full px-2 py-1.5 rounded-lg border text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} /></td>
                  <td className="p-2"><input type="number" value={item.quantity || ''} onChange={(e) => handleUpdateRfqItem(index, 'quantity', Number(e.target.value))} className={`w-full px-2 py-1.5 rounded-lg border text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} /></td>
                  <td className="p-2"><input type="number" value={item.expectedPrice ?? ''} onChange={(e) => handleUpdateRfqItem(index, 'expectedPrice', e.target.value ? Number(e.target.value) : undefined)} className={`w-full px-2 py-1.5 rounded-lg border text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} /></td>
                  <td className="p-2">
                    <input type="date" value={item.requiredDate || newRfq.deliveryDate} onChange={(e) => handleUpdateRfqItem(index, 'requiredDate', e.target.value)} className={`w-full px-1.5 py-1.5 rounded-lg border text-[11px] ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} />
                  </td>
                  <td className="p-2"><input type="text" value={item.remarks} onChange={(e) => handleUpdateRfqItem(index, 'remarks', e.target.value)} className={`w-full px-2 py-1.5 rounded-lg border text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} /></td>
                  <td className="p-2 text-center">
                    <div className="flex items-center justify-center space-x-1">
                        <button type="button" onClick={() => handleDuplicateRfqItem(index)} className="p-1 rounded-lg hover:bg-slate-700/50 text-slate-700 dark:text-slate-400 hover:text-white transition-colors cursor-pointer"><Copy className="w-3.5 h-3.5" /></button>
                        <button type="button" onClick={() => handleRemoveRfqItem(index)} className="p-1 rounded-lg hover:bg-rose-500/20 text-slate-700 dark:text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Suppliers */}
      <div>
         <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400 mb-2">Target Suppliers</label>
         <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {suppliers.map(s => (
                <label key={s.id} className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer ${selectedSuppliers.includes(s.id) ? 'bg-emerald-600/10 border-emerald-600' : 'bg-slate-50 border-slate-200'}`}>
                    <input type="checkbox" checked={selectedSuppliers.includes(s.id)} onChange={(e) => {
                        if (e.target.checked) setSelectedSuppliers([...selectedSuppliers, s.id]);
                        else setSelectedSuppliers(selectedSuppliers.filter(id => id !== s.id));
                    }} />
                    {s.supplierName}
                </label>
            ))}
         </div>
      </div>

      <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold">Submit RFQ</button>
    </form>
  );
};