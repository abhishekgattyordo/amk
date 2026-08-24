import React from 'react';
import { X, AlertTriangle, Loader2, Sparkles, Plus, Trash2 } from 'lucide-react';
import { InvoiceScanner } from '../common/InvoiceScanner';
import { DatePicker } from '../common/DatePicker';
import { UniversalServerSelect } from '../common/UniversalServerSelect';
import { Supplier, RawMaterial, ProcurementPO } from '../../types';

interface PurchaseOrderFormProps {
  darkMode: boolean;
  isOpen: boolean;
  onClose: () => void;
  newPo: any;
  setNewPo: (po: any) => void;
  supplierSearch: string;
  setSupplierSearch: (s: string) => void;
  isSupplierDropdownOpen: boolean;
  setIsSupplierDropdownOpen: (open: boolean) => void;
  suppliers: Supplier[];
  rawMaterials: RawMaterial[];
  scanError: string | null;
  setScanError: (err: string | null) => void;
  scanStatus: string;
  setScanStatus: (status: string) => void;
  isScanning: boolean;
  setIsScanning: (scanning: boolean) => void;
  isMatching: boolean;
  setIsMatching: (matching: boolean) => void;
  handlePoAiInvoiceDataExtracted: (data: any) => void;
  getSupplierDisplayName: (id: string, name: string, mill: string) => string;
  handleSubmit: (e: React.FormEvent) => void;
}

export const PurchaseOrderForm: React.FC<PurchaseOrderFormProps> = ({
  darkMode, isOpen, onClose, newPo, setNewPo, supplierSearch, setSupplierSearch,
  isSupplierDropdownOpen, setIsSupplierDropdownOpen, suppliers, rawMaterials,
  scanError, setScanError, scanStatus, setScanStatus, isScanning, setIsScanning,
  isMatching, setIsMatching, handlePoAiInvoiceDataExtracted, getSupplierDisplayName, handleSubmit
}) => {
  if (!isOpen) return null;

  const addItem = () => {
    const items = newPo.items || [];
    setNewPo({
      ...newPo,
      items: [...items, { materialId: '', materialCode: '', materialName: '', quantity: 1000, unitPrice: 50, uom: 'Kg', gst: 18 }]
    });
  };

  const removeItem = (index: number) => {
    const items = [...(newPo.items || [])];
    items.splice(index, 1);
    setNewPo({ ...newPo, items });
  };

  const updateItem = (index: number, field: string, value: any) => {
    const items = [...(newPo.items || [])];
    items[index] = { ...items[index], [field]: value };
    setNewPo({ ...newPo, items });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className={`w-full max-w-2xl rounded-3xl shadow-2xl border p-6 relative max-h-[90vh] overflow-y-auto ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
        <button onClick={onClose} className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-slate-800/50 text-slate-700 dark:text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
        <h2 className="text-base font-bold mb-1">Direct Purchase Order</h2>
        <p className="text-xs text-slate-700 dark:text-slate-400 mb-4">Direct PO generation skipping RFQ workflow with server-side material search.</p>

        {scanError && (
          <div className="mb-4 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-bold">Extraction Error</p>
              <p className="text-xs opacity-80">{scanError}</p>
            </div>
            <button onClick={() => setScanError(null)} className="p-1 hover:bg-white/10 rounded-lg"><X className="w-4 h-4" /></button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="mb-4">
            <InvoiceScanner 
              darkMode={darkMode}
              onScanStart={() => {
                setIsScanning(true);
                setScanStatus('Scanning document for Direct PO...');
                setScanError(null);
              }}
              onScanError={(err) => {
                setIsScanning(false);
                setScanError(err);
              }}
              onDataExtracted={handlePoAiInvoiceDataExtracted}
            />

            {(isScanning || isMatching) && !scanError && (
              <div className={`mt-2 p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 flex items-center space-x-3 animate-in fade-in slide-in-from-top-2 duration-300`}>
                <div className="relative">
                  <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
                  <Sparkles className="w-2.5 h-2.5 text-amber-400 absolute -top-1 -right-1" />
                </div>
                <div>
                  <p className="text-xs font-bold text-emerald-500">{scanStatus || 'Processing...'}</p>
                  <p className="text-[10px] text-slate-700 dark:text-slate-400">Please wait...</p>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400 mb-1">Select Supplier Mill</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search supplier..."
                value={supplierSearch}
                onChange={(e) => {
                  setSupplierSearch(e.target.value);
                  setIsSupplierDropdownOpen(true);
                }}
                onFocus={() => setIsSupplierDropdownOpen(true)}
                className={`w-full px-3 py-2.5 rounded-xl border text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
              />
              {isSupplierDropdownOpen && (
                <div className={`absolute z-10 w-full mt-1 rounded-xl border overflow-hidden shadow-lg ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                  {suppliers
                    .filter(s => s.supplierName.toLowerCase().includes(supplierSearch.toLowerCase()) || s.millName.toLowerCase().includes(supplierSearch.toLowerCase()) || s.id.toLowerCase().includes(supplierSearch.toLowerCase()))
                    .map(s => (
                      <div
                        key={s.id}
                        className={`px-3 py-2 text-xs cursor-pointer ${darkMode ? 'hover:bg-slate-700 text-white' : 'hover:bg-slate-100'}`}
                        onClick={() => {
                          setNewPo({ ...newPo, supplierId: s.id });
                          setSupplierSearch(getSupplierDisplayName(s.id, s.supplierName, s.millName));
                          setIsSupplierDropdownOpen(false);
                        }}
                      >
                        {getSupplierDisplayName(s.id, s.supplierName, s.millName)}
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400">Order Items</label>
              <button
                type="button"
                onClick={addItem}
                className="px-2.5 py-1 bg-emerald-600/15 text-emerald-400 hover:bg-emerald-600 hover:text-white rounded-lg text-[11px] font-bold transition-all flex items-center space-x-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            {(!newPo.items || newPo.items.length === 0) && (
              <div className="p-4 rounded-xl border border-dashed text-center text-xs text-slate-400">
                No items added. Click "Add Item" to search and add materials.
              </div>
            )}

            {(newPo.items || []).map((item: any, idx: number) => (
              <div key={idx} className={`p-4 rounded-2xl border space-y-3 relative ${darkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                {newPo.items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    className="absolute top-3 right-3 p-1 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400 mb-1">Search Material (Item #{idx + 1})</label>
                  <UniversalServerSelect
                    endpoint="/api/raw-materials"
                    value={item.materialId || ''}
                    onChange={(id, mat) => {
                      const items = [...newPo.items];
                      items[idx] = {
                        ...items[idx],
                        materialId: id,
                        materialCode: mat?.code || '',
                        materialName: mat?.name || '',
                        unitPrice: mat?.purchasePrice || items[idx].unitPrice || 50,
                        uom: mat?.uom || 'Kg',
                        quantity: items[idx].quantity || 1000
                      };
                      setNewPo({ ...newPo, items });
                    }}
                    placeholder="Search material code or name (e.g. RM-2494)..."
                    searchPlaceholder="Search RM code or name..."
                    darkMode={darkMode}
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400 mb-1">Quantity</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={item.quantity || 1000}
                      onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))}
                      className={`w-full px-2.5 py-2 rounded-xl border text-xs ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200'}`}
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400 mb-1">UOM</label>
                    <input
                      type="text"
                      value={item.uom || 'Kg'}
                      onChange={(e) => updateItem(idx, 'uom', e.target.value)}
                      className={`w-full px-2.5 py-2 rounded-xl border text-xs ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200'}`}
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400 mb-1">Rate (₹)</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={item.unitPrice || 50}
                      onChange={(e) => updateItem(idx, 'unitPrice', Number(e.target.value))}
                      className={`w-full px-2.5 py-2 rounded-xl border text-xs ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200'}`}
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400 mb-1">GST %</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={item.gst !== undefined ? item.gst : 18}
                      onChange={(e) => updateItem(idx, 'gst', Number(e.target.value))}
                      className={`w-full px-2.5 py-2 rounded-xl border text-xs ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200'}`}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400 mb-1">Delivery Date</label>
            <DatePicker
              value={newPo.deliveryDate}
              onChange={(date) => setNewPo({ ...newPo, deliveryDate: date })}
              darkMode={darkMode}
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400 mb-1">Remarks / Notes</label>
            <input
              type="text"
              placeholder="Optional remarks or delivery terms..."
              value={newPo.remarks || ''}
              onChange={(e) => setNewPo({ ...newPo, remarks: e.target.value })}
              className={`w-full px-3 py-2 rounded-xl border text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800/20">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border text-xs font-semibold">Cancel</button>
            <button type="submit" className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow hover:bg-emerald-500 transition-all cursor-pointer">Raise PO</button>
          </div>
        </form>
      </div>
    </div>
  );
};
