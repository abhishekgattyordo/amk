import React from 'react';
import { Plus, Award, Sparkles } from 'lucide-react';
import { RFQItem } from '../../types';

interface SupplierQuotesViewProps {
  darkMode: boolean;
  rfqs: RFQItem[];
  quotes: any[];
  selectedRfqForQuotes: RFQItem | null;
  setSelectedRfqForQuotes: (rfq: RFQItem | null) => void;
  getSupplierDisplayName: (supplierId?: string, supplierName?: string, millName?: string, supplierObj?: any) => string;
  handleOpenNewQuoteModal: () => void;
  handleOpenEditQuoteModal: (q: any) => void;
  onDeleteQuote: (quoteId: string) => void;
  handleAwardQuote: (q: any) => void;
  handleConvertQuoteToPo: (q: any) => void;
}

export const SupplierQuotesView: React.FC<SupplierQuotesViewProps> = ({
  darkMode,
  rfqs,
  quotes,
  selectedRfqForQuotes,
  setSelectedRfqForQuotes,
  getSupplierDisplayName,
  handleOpenNewQuoteModal,
  handleOpenEditQuoteModal,
  onDeleteQuote,
  handleAwardQuote,
  handleConvertQuoteToPo,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className={`text-base font-bold ${darkMode ? 'text-slate-200' : 'text-slate-800 dark:text-slate-500'}`}>Quotation Comparison Workspace</h3>
          <p className="text-[11px] text-slate-700 dark:text-slate-400">Manage individual supplier quotations. Each quotation is linked to exactly one supplier.</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <select
            value={selectedRfqForQuotes?.id || ''}
            onChange={(e) => setSelectedRfqForQuotes(rfqs.find(r => r.id === e.target.value) || null)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200'}`}
          >
            <option value="">-- Choose RFQ to Compare --</option>
            {rfqs.map(r => (
              <option key={r.id} value={r.id}>{r.rfqNumber} ({(r.materials?.[0]?.name || 'Multi-Item').substring(0, 25)}...)</option>
            ))}
          </select>

          <button
            onClick={handleOpenNewQuoteModal}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow flex items-center space-x-1 cursor-pointer transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Create Supplier Quotation</span>
          </button>
        </div>
      </div>

      {selectedRfqForQuotes ? (
        <div className="space-y-4">
          <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-slate-700 dark:text-slate-400 block uppercase font-bold text-[10px]">Requested Materials ({selectedRfqForQuotes.materials.length})</span>
                <strong className={darkMode ? 'text-white' : 'text-slate-900'}>{selectedRfqForQuotes.materials[0]?.name || 'N/A'}</strong>
              </div>
              <div>
                <span className="text-slate-700 dark:text-slate-400 block uppercase font-bold text-[10px]">Total Required Quantity</span>
                <strong className={darkMode ? 'text-white' : 'text-slate-900'}>{selectedRfqForQuotes.materials.reduce((s, m) => s + (m.quantity || 0), 0).toLocaleString()} Kg</strong>
              </div>
              <div>
                <span className="text-slate-700 dark:text-slate-400 block uppercase font-bold text-[10px]">Department</span>
                <strong className="text-amber-500">{selectedRfqForQuotes.department}</strong>
              </div>
              <div>
                <span className="text-slate-700 dark:text-slate-400 block uppercase font-bold text-[10px]">RFQ Status</span>
                <strong className="text-emerald-500">{selectedRfqForQuotes.status}</strong>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quotes
              .filter(q => q.rfqId === selectedRfqForQuotes.id)
              .map(q => {
                const rfqQuotes = quotes.filter(oq => oq.rfqId === q.rfqId);
                const isLowest = q.totalPrice <= Math.min(...rfqQuotes.map(oq => oq.totalPrice));
                return (
                  <div key={q.id} className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                    q.status === 'Awarded' 
                      ? 'border-emerald-500 bg-emerald-500/5' 
                      : q.status === 'Rejected'
                      ? 'border-slate-800/60 opacity-75'
                      : darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                  }`}>
                    <div>
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded-full font-mono text-slate-700 dark:text-slate-300">
                              {q.quotationNumber || `QTN-${q.id}`}
                            </span>
                            {q.quotationDate && (
                              <span className="text-[10px] text-slate-700 dark:text-slate-400 font-mono">{q.quotationDate}</span>
                            )}
                          </div>
                          <h4 className={`text-sm font-extrabold mt-1.5 ${darkMode ? 'text-white' : 'text-slate-950'}`}>
                            {getSupplierDisplayName(q.supplierId, q.supplierName)}
                          </h4>
                        </div>
                        <div className="flex items-center space-x-1">
                          {isLowest && q.status !== 'Awarded' && (
                            <span className="px-2 py-0.5 bg-emerald-500 text-white text-[9px] font-extrabold uppercase rounded-md shadow">L1 Lowest</span>
                          )}
                          {q.status === 'Awarded' && (
                            <span className="px-2 py-0.5 bg-emerald-600 text-white text-[9px] font-extrabold uppercase rounded-md shadow">Awarded</span>
                          )}
                          {q.status === 'Rejected' && (
                            <span className="px-2 py-0.5 bg-rose-500/20 text-rose-400 text-[9px] font-bold uppercase rounded-md border border-rose-500/20">Rejected</span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 my-3 text-xs">
                        <div className={`p-2.5 rounded-xl ${darkMode ? 'bg-slate-950/40' : 'bg-slate-50'}`}>
                          <span className="text-slate-700 dark:text-slate-400 block text-[10px] font-bold">AVG RATE</span>
                          <span className="text-sm font-extrabold text-emerald-500">₹{q.unitPrice} / Unit</span>
                        </div>
                        <div className={`p-2.5 rounded-xl ${darkMode ? 'bg-slate-950/40' : 'bg-slate-50'}`}>
                          <span className="text-slate-700 dark:text-slate-400 block text-[10px] font-bold">TOTAL PROPOSAL</span>
                          <span className="text-sm font-extrabold text-slate-200">₹{q.totalPrice.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-slate-700 dark:text-slate-400 text-[10px] block font-bold">LEAD TIME</span>
                          <strong>{q.deliveryDays} Days Delivery</strong>
                        </div>
                        <div>
                          <span className="text-slate-700 dark:text-slate-400 text-[10px] block font-bold">CREDIT & VALIDITY</span>
                          <strong>{q.paymentTerms} (Till {q.validUntil})</strong>
                        </div>
                      </div>

                      {/* Line Items Detail inside Quote Card */}
                      {q.items && q.items.length > 0 && (
                        <div className="my-3 border-t border-slate-800/40 pt-2">
                          <span className="text-[10px] font-bold uppercase text-slate-700 dark:text-slate-400 block mb-1">
                            Quotation Line Items ({q.items.length})
                          </span>
                          <div className="max-h-28 overflow-y-auto rounded-lg border border-slate-800/40">
                            <table className="w-full text-left text-[11px]">
                              <thead className="bg-slate-800/40 text-slate-700 dark:text-slate-400 font-semibold">
                                <tr>
                                  <th className="p-1.5">Material</th>
                                  <th className="p-1.5 text-right">Qty</th>
                                  <th className="p-1.5 text-right">Rate</th>
                                  <th className="p-1.5 text-right">Total</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-800/20">
                                {q.items.map((item: any, idx: number) => (
                                  <tr key={idx}>
                                    <td className="p-1.5 font-medium">{item.materialName || item.materialCode}</td>
                                    <td className="p-1.5 text-right font-mono">{item.quantity} {item.unit}</td>
                                    <td className="p-1.5 text-right font-mono text-emerald-400">₹{item.unitPrice}</td>
                                    <td className="p-1.5 text-right font-mono font-bold">₹{item.totalAmount?.toLocaleString()}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {q.remarks && (
                        <div className="text-[11px] text-slate-700 dark:text-slate-400 border-t border-slate-800/40 pt-2 mb-3">
                          <strong>Remarks:</strong> {q.remarks}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-800/30 pt-3 mt-2">
                      <div className="flex space-x-1">
                        <button
                          onClick={() => handleOpenEditQuoteModal(q)}
                          className="px-2.5 py-1 rounded-lg border text-slate-700 dark:text-slate-300 hover:text-white hover:border-slate-600 text-[10px] font-semibold transition-all cursor-pointer"
                          title="Edit Quotation"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onDeleteQuote(q.id)}
                          className="px-2.5 py-1 rounded-lg border border-rose-500/20 text-rose-400 hover:bg-rose-500/10 text-[10px] font-semibold transition-all cursor-pointer"
                          title="Delete Quotation"
                        >
                          Delete
                        </button>
                      </div>

                      <div className="flex space-x-2">
                        {q.status === 'Pending' && (
                          <button
                            onClick={() => handleAwardQuote(q)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] shadow transition-all cursor-pointer"
                          >
                            Award Quotation
                          </button>
                        )}
                        {q.status === 'Awarded' && (
                          <button
                            onClick={() => handleConvertQuoteToPo(q)}
                            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[10px] shadow flex items-center space-x-1 transition-all cursor-pointer"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>1-Click Convert to PO</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      ) : (
        <div className={`p-10 rounded-2xl border text-center text-xs text-slate-700 dark:text-slate-400 ${darkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
          <Award className="w-10 h-10 mx-auto text-emerald-500/20 mb-3" />
          <p>Please select an active RFQ in the dropdown selector above to analyze or create supplier bids.</p>
        </div>
      )}
    </div>
  );
};
