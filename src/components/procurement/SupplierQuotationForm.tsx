import React from 'react';
import { Plus, X, Trash2, FileText, AlertTriangle } from 'lucide-react';
import { Supplier, RawMaterial } from '../../types';

interface SupplierQuotationFormProps {
  darkMode: boolean;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  quoteForm: any; 
  setQuoteForm: (form: any) => void;
  quoteLineItems: any[];
  handleAddQuoteLineItem: () => void;
  handleUpdateQuoteLineItem: (index: number, field: string, value: any) => void;
  handleRemoveQuoteLineItem: (index: number) => void;
  quoteSupplierSearch: string;
  setQuoteSupplierSearch: (search: string) => void;
  suppliers: Supplier[];
  rfqs: any[];
  rawMaterials: RawMaterial[];
  editingQuoteId: string | null;
  quoteSubmitError: string | null;
  isSubmittingQuote: boolean;
  handleSelectRfqInQuoteForm: (rfqId: string) => void;
  getSupplierDisplayName: (id: string, name: string, mill: string) => string;
}

export const SupplierQuotationForm: React.FC<SupplierQuotationFormProps> = ({
  darkMode, isOpen, onClose, onSubmit, quoteForm, setQuoteForm,
  quoteLineItems, handleAddQuoteLineItem, handleUpdateQuoteLineItem,
  handleRemoveQuoteLineItem, quoteSupplierSearch, setQuoteSupplierSearch,
  suppliers, rfqs, rawMaterials, editingQuoteId, quoteSubmitError,
  isSubmittingQuote, handleSelectRfqInQuoteForm, getSupplierDisplayName
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className={`w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl border p-6 relative flex flex-col ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
        <button 
          onClick={onClose} 
          className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-slate-800/50 text-slate-700 dark:text-slate-400 hover:text-white cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="mb-4">
          <h2 className="text-base font-bold flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-500" />
            <span>{editingQuoteId ? 'Edit Supplier Quotation' : 'Create New Supplier Quotation'}</span>
          </h2>
          <p className="text-xs text-slate-700 dark:text-slate-400 mt-0.5">
            Each Supplier Quotation must belong to exactly <strong className="text-emerald-400">one supplier</strong>. Multi-select is not allowed.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 overflow-y-auto pr-1 flex-1">
          {/* Header Fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 rounded-2xl border bg-slate-500/5 border-slate-800/20">
            {/* Linked RFQ */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400 mb-1">
                Linked RFQ Number *
              </label>
              <select
                required
                value={quoteForm.rfqId}
                onChange={(e) => handleSelectRfqInQuoteForm(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800 dark:text-slate-500'}`}
              >
                <option value="">-- Choose RFQ --</option>
                {rfqs.map(r => (
                  <option key={r.id} value={r.id}>{r.rfqNumber} ({r.department})</option>
                ))}
              </select>
            </div>

            {/* Quotation Number */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400 mb-1">
                Quotation Number *
              </label>
              <input
                type="text"
                required
                value={quoteForm.quotationNumber}
                onChange={(e) => setQuoteForm({ ...quoteForm, quotationNumber: e.target.value })}
                placeholder="e.g., QTN-2026-001"
                className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200'}`}
              />
            </div>

            {/* Single Supplier Dropdown */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-1">
                Supplier (Searchable Single Select) *
              </label>
              <div className="space-y-1">
                <input
                  type="text"
                  placeholder="Filter suppliers by name or code..."
                  value={quoteSupplierSearch}
                  onChange={(e) => setQuoteSupplierSearch(e.target.value)}
                  className={`w-full px-2.5 py-1 rounded-lg border text-[11px] ${darkMode ? 'bg-slate-800/60 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                />
                <select
                  required
                  value={quoteForm.supplierId}
                  onChange={(e) => setQuoteForm({ ...quoteForm, supplierId: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-bold border-emerald-500/50 ${darkMode ? 'bg-slate-800 text-white' : 'bg-white text-slate-900'}`}
                >
                  <option value="">-- Select Single Supplier --</option>
                  {suppliers
                    .filter(sup => 
                      quoteSupplierSearch === '' ||
                      sup.supplierName.toLowerCase().includes(quoteSupplierSearch.toLowerCase()) ||
                      sup.millName.toLowerCase().includes(quoteSupplierSearch.toLowerCase()) ||
                      sup.category.toLowerCase().includes(quoteSupplierSearch.toLowerCase())
                    )
                    .map(sup => (
                      <option key={sup.id} value={sup.id}>
                        {getSupplierDisplayName(sup.id, sup.supplierName, sup.millName)}{sup.category ? ` - ${sup.category}` : ''}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* Quotation Date */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400 mb-1">
                Quotation Date
              </label>
              <input
                type="date"
                value={quoteForm.quotationDate}
                onChange={(e) => setQuoteForm({ ...quoteForm, quotationDate: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl border text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200'}`}
              />
            </div>

            {/* Valid Until */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400 mb-1">
                Valid Until Date
              </label>
              <input
                type="date"
                value={quoteForm.validUntil}
                onChange={(e) => setQuoteForm({ ...quoteForm, validUntil: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl border text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200'}`}
              />
            </div>

            {/* Delivery Time (Days) */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400 mb-1">
                Delivery Time (Days)
              </label>
              <input
                type="number"
                min="1"
                value={quoteForm.deliveryDays}
                onChange={(e) => setQuoteForm({ ...quoteForm, deliveryDays: Number(e.target.value) || 1 })}
                className={`w-full px-3 py-2 rounded-xl border text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200'}`}
              />
            </div>

            {/* Payment Terms */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400 mb-1">
                Payment Terms
              </label>
              <input
                type="text"
                value={quoteForm.paymentTerms}
                onChange={(e) => setQuoteForm({ ...quoteForm, paymentTerms: e.target.value })}
                placeholder="e.g., Net 30 Days"
                className={`w-full px-3 py-2 rounded-xl border text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200'}`}
              />
            </div>

            {/* Currency */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400 mb-1">
                Currency
              </label>
              <select
                value={quoteForm.currency}
                onChange={(e) => setQuoteForm({ ...quoteForm, currency: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl border text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200'}`}
              >
                <option value="INR (₹)">INR (₹)</option>
                <option value="USD ($)">USD ($)</option>
                <option value="EUR (€)">EUR (€)</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400 mb-1">
                Quotation Status
              </label>
              <select
                value={quoteForm.status}
                onChange={(e) => setQuoteForm({ ...quoteForm, status: e.target.value as any })}
                className={`w-full px-3 py-2 rounded-xl border text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200'}`}
              >
                <option value="Pending">Pending Evaluation</option>
                <option value="Awarded">Awarded</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400">
                Quotation Raw Material Line Items ({quoteLineItems.length})
              </h3>
              <button
                type="button"
                onClick={handleAddQuoteLineItem}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow flex items-center space-x-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Material Line Item</span>
              </button>
            </div>

            <div className={`rounded-2xl border overflow-x-auto ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className={`border-b font-bold uppercase tracking-wider ${darkMode ? 'bg-slate-800/80 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                    <th className="p-2.5">Raw Material</th>
                    <th className="p-2.5 w-24">Quantity</th>
                    <th className="p-2.5 w-16">Unit</th>
                    <th className="p-2.5 w-28">Unit Price</th>
                    <th className="p-2.5 w-20">Tax %</th>
                    <th className="p-2.5 w-28 text-right">Tax Amount</th>
                    <th className="p-2.5 w-32 text-right">Total Amount</th>
                    <th className="p-2.5 w-16 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {quoteLineItems.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-6 text-center text-slate-700 dark:text-slate-400">
                        No materials added. Click "Add Material Line Item" or select an RFQ above.
                      </td>
                    </tr>
                  ) : (
                    quoteLineItems.map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-2">
                          <select
                            value={item.materialCode}
                            onChange={(e) => handleUpdateQuoteLineItem(idx, 'materialCode', e.target.value)}
                            className={`w-full px-2 py-1.5 rounded-lg border text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                          >
                            <option value="">-- Select Material --</option>
                            {rawMaterials.map(rm => (
                              <option key={rm.id} value={rm.code}>{rm.code} - {rm.name}</option>
                            ))}
                          </select>
                        </td>

                        <td className="p-2">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleUpdateQuoteLineItem(idx, 'quantity', Number(e.target.value) || 1)}
                            className={`w-full px-2 py-1.5 rounded-lg border text-xs text-right font-bold ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                          />
                        </td>

                        <td className="p-2">
                          <input
                            type="text"
                            value={item.unit}
                            onChange={(e) => handleUpdateQuoteLineItem(idx, 'unit', e.target.value)}
                            className={`w-full px-2 py-1.5 rounded-lg border text-xs text-center ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                          />
                        </td>

                        <td className="p-2">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.unitPrice}
                            onChange={(e) => handleUpdateQuoteLineItem(idx, 'unitPrice', Number(e.target.value) || 0)}
                            className={`w-full px-2 py-1.5 rounded-lg border text-xs text-right font-mono font-bold text-emerald-500 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}
                          />
                        </td>

                        <td className="p-2">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={item.taxPercent}
                            onChange={(e) => handleUpdateQuoteLineItem(idx, 'taxPercent', Number(e.target.value) || 0)}
                            className={`w-full px-2 py-1.5 rounded-lg border text-xs text-right ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                          />
                        </td>

                        <td className="p-2 text-right font-mono text-slate-700 dark:text-slate-400 font-semibold">
                          ₹{item.taxAmount?.toLocaleString() || '0.00'}
                        </td>

                        <td className="p-2 text-right font-mono font-bold text-emerald-400">
                          ₹{item.totalAmount?.toLocaleString() || '0.00'}
                        </td>

                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveQuoteLineItem(idx)}
                            title="Remove Line Item"
                            className="p-1 rounded-lg hover:bg-rose-500/20 text-slate-700 dark:text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400 mb-1">
              Supplier Remarks & Offer Conditions
            </label>
            <textarea
              rows={2}
              value={quoteForm.remarks}
              onChange={(e) => setQuoteForm({ ...quoteForm, remarks: e.target.value })}
              placeholder="e.g., Special pricing valid for bulk paper reels delivery..."
              className={`w-full px-3 py-2 rounded-xl border text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200'}`}
            />
          </div>

          {quoteSubmitError && (
            <div className="p-3 my-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center space-x-2 text-sm">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{quoteSubmitError}</span>
            </div>
          )}

          {/* Submit / Cancel Buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-800/20">
            <div className="text-xs text-slate-700 dark:text-slate-400 font-semibold">
              Grand Total: <span className="text-emerald-400 font-bold font-mono">₹{quoteLineItems.reduce((sum, item) => sum + (item.totalAmount || 0), 0).toLocaleString()}</span>
            </div>
            <div className="flex space-x-2">
              <button 
                type="button" 
                onClick={onClose} 
                className="px-4 py-2 rounded-xl border text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={isSubmittingQuote}
                className="px-6 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow hover:bg-emerald-500 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isSubmittingQuote ? 'Saving...' : 'Save Supplier Quotation'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
