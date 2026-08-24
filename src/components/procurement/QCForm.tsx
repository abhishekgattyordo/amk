import React from 'react';
import { X, Sparkles, Plus, Trash2, MapPin, CheckCircle2, AlertCircle } from 'lucide-react';
import { InvoiceScanner } from '../common/InvoiceScanner';

export const QCForm = ({ 
  qcForm, 
  setQcForm, 
  reelsInward, 
  warehouses = [],
  binLocations = [],
  handlePerformQc, 
  initializeQcFormForReel, 
  handleAddQcRow, 
  handleUpdateQcRow, 
  handleDeleteQcRow, 
  darkMode, 
  handleQcAiInvoiceDataExtracted,
  onCancel 
}: any) => {
  const selectedWarehouseBins = qcForm.warehouseId
    ? binLocations.filter((b: any) => b.warehouseId === qcForm.warehouseId)
    : binLocations;

  const handleWarehouseChange = (whId: string) => {
    setQcForm((prev: any) => {
      const whBins = binLocations.filter((b: any) => b.warehouseId === whId);
      const defaultBin = whBins[0]?.id || '';
      return {
        ...prev,
        warehouseId: whId,
        defaultBinId: defaultBin,
        rows: prev.rows.map((r: any) => ({
          ...r,
          binId: r.binId || defaultBin
        }))
      };
    });
  };

  const handleApplyDefaultBinToAll = (binId: string) => {
    setQcForm((prev: any) => ({
      ...prev,
      defaultBinId: binId,
      rows: prev.rows.map((r: any) => ({
        ...r,
        binId: binId
      }))
    }));
  };

  return (
    <div className={`w-full max-w-6xl rounded-3xl shadow-2xl border p-6 relative ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
        <button onClick={onCancel} className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-slate-800/50 text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
        
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-base font-bold">Paper Reel Quality Assurance Ledger</h2>
            <p className="text-xs text-slate-400">Record verification, physical parameters, & automatic bin storage allocation upon QC approval.</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${qcForm.status === 'Passed' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'}`}>
              QA Status: {qcForm.status}
            </span>
          </div>
        </div>

        <form onSubmit={handlePerformQc} className="space-y-5">
          {/* AI Document Scanner integration */}
          <div className="p-3.5 rounded-2xl bg-slate-950/20 border border-slate-800/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                AI Instant Specification Extractor
              </span>
              <span className="text-[10px] text-slate-500">Scan mill test certificates & invoices</span>
            </div>
            <InvoiceScanner 
              darkMode={darkMode}
              onDataExtracted={handleQcAiInvoiceDataExtracted}
            />
          </div>

          {/* Structural/Reference Fields Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-950/10 p-4 rounded-2xl border border-slate-800/10">
            {/* Reel Inward Select */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Select Inward Challan</label>
              <select
                required
                value={qcForm.reelInwardId}
                onChange={(e) => {
                  const selected = reelsInward.find(r => r.id === e.target.value);
                  if (selected) {
                    initializeQcFormForReel(selected);
                  }
                }}
                className={`w-full px-3 py-2 rounded-xl border text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
              >
                <option value="">-- Choose Reel --</option>
                {reelsInward.map((ri: any) => (
                  <option key={ri.id} value={ri.id}>
                    {ri.reelNumber} ({ri.millName || ri.supplierName || 'Pending'} - {ri.weight} Kgs)
                  </option>
                ))}
              </select>
            </div>

            {/* Supplier Name */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Supplier / Mill Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Rahul Paper Agencies"
                value={qcForm.supplierName}
                onChange={(e) => setQcForm({ ...qcForm, supplierName: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl border text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
              >
              </input>
            </div>

            {/* Item / Commodity */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Item / Commodity Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Kraft Paper 180GSM"
                value={qcForm.itemCommodity}
                onChange={(e) => setQcForm({ ...qcForm, itemCommodity: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl border text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
              />
            </div>

            {/* Invoice No */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Invoice / Challan No</label>
              <input
                type="text"
                required
                placeholder="INV-1094"
                value={qcForm.invoiceNo}
                onChange={(e) => setQcForm({ ...qcForm, invoiceNo: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl border text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
              />
            </div>

            {/* Invoice Date */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Invoice Date</label>
              <input
                type="date"
                required
                value={qcForm.invoiceDate}
                onChange={(e) => setQcForm({ ...qcForm, invoiceDate: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl border text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
              />
            </div>

            {/* Quantity Received */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Declared Invoice Qty (Kg)</label>
              <input
                type="number"
                required
                value={qcForm.quantityReceived}
                onChange={(e) => setQcForm({ ...qcForm, quantityReceived: Number(e.target.value) })}
                className={`w-full px-3 py-2 rounded-xl border text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
              />
            </div>

            {/* Destination Warehouse */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-1">Destination Warehouse</label>
              <select
                value={qcForm.warehouseId || ''}
                onChange={(e) => handleWarehouseChange(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold ${darkMode ? 'bg-slate-800 border-emerald-500/40 text-emerald-300' : 'bg-emerald-50/50 border-emerald-300 text-emerald-800'}`}
              >
                <option value="">-- Main Warehouse (Default) --</option>
                {warehouses.map((w: any) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Default Storage Bin */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-emerald-400">Default Storage Bin</label>
                {qcForm.defaultBinId && (
                  <button
                    type="button"
                    onClick={() => handleApplyDefaultBinToAll(qcForm.defaultBinId)}
                    className="text-[9px] text-emerald-400 hover:underline cursor-pointer"
                  >
                    Apply All
                  </button>
                )}
              </div>
              <select
                value={qcForm.defaultBinId || ''}
                onChange={(e) => handleApplyDefaultBinToAll(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold ${darkMode ? 'bg-slate-800 border-emerald-500/40 text-emerald-300' : 'bg-emerald-50/50 border-emerald-300 text-emerald-800'}`}
              >
                <option value="">-- Auto-Assign Available Bin --</option>
                {selectedWarehouseBins.map((bin: any) => (
                  <option key={bin.id} value={bin.id}>
                    {bin.code} ({bin.name})
                  </option>
                ))}
              </select>
            </div>

            {/* Qty As Checked */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Qty As Checked / Written</label>
                {(() => {
                  const sumObserved = qcForm.rows.reduce((sum: number, r: any) => sum + Number(r.netWeight || 0), 0);
                  const diff = Math.abs(sumObserved - qcForm.quantityReceived);
                  return diff > 50 ? (
                    <span className="text-[8px] px-1 bg-amber-500/20 text-amber-400 font-bold rounded">Discrepancy</span>
                  ) : (
                    <span className="text-[8px] px-1 bg-emerald-500/20 text-emerald-400 font-bold rounded">Matched</span>
                  );
                })()}
              </div>
              <input
                type="text"
                placeholder="Computed automatically"
                value={qcForm.quantityAsWritten}
                onChange={(e) => setQcForm({ ...qcForm, quantityAsWritten: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl border text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
              />
            </div>

            {/* Tested On */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Tested On (QA Date)</label>
              <input
                type="date"
                required
                value={qcForm.testedOn}
                onChange={(e) => setQcForm({ ...qcForm, testedOn: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl border text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
              />
            </div>

            {/* Overall QA Status */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Overall QA Decision</label>
              <select
                value={qcForm.status}
                onChange={(e) => setQcForm({ ...qcForm, status: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl border text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
              >
                <option value="Passed">Passed / Approved (Stock to Bins)</option>
                <option value="Failed">Failed / Quarantined</option>
              </select>
            </div>

            {/* Prepared By */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Prepared By (Inspector)</label>
              <input
                type="text"
                required
                value={qcForm.preparedBy}
                onChange={(e) => setQcForm({ ...qcForm, preparedBy: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl border text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
              />
            </div>

            {/* Checked By */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Checked By (Supervisor)</label>
              <input
                type="text"
                required
                value={qcForm.checkedBy}
                onChange={(e) => setQcForm({ ...qcForm, checkedBy: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl border text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
              />
            </div>
          </div>

          {/* Multi-Row Parameters Inspection Ledger Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold">Physical Parameters & Storage Bin Ledger</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
                  Passed reels will automatically store to designated bins
                </span>
              </div>
              <button
                type="button"
                onClick={handleAddQcRow}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-[10px] shadow transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Verification Row</span>
              </button>
            </div>

            <div className="overflow-x-auto border rounded-2xl max-h-[340px] overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className={`border-b text-[10px] font-bold uppercase tracking-wider ${darkMode ? 'bg-slate-950/55 text-slate-400 border-slate-800' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                    <th className="p-2 w-10 text-center">SL</th>
                    <th className="p-2 min-w-[110px]">Reel No</th>
                    <th className="p-2 w-16">Deckle</th>
                    <th className="p-2 w-14">Std. BF</th>
                    <th className="p-2 w-14">Std. GSM</th>
                    <th className="p-2 w-16">Obs. GSM</th>
                    <th className="p-2 w-16">Obs. BF</th>
                    <th className="p-2 w-14">Cobb</th>
                    <th className="p-2 w-16">Moisture %</th>
                    <th className="p-2 w-20">Net Wt (Kg)</th>
                    <th className="p-2 min-w-[90px]">Verdict</th>
                    <th className="p-2 min-w-[160px] text-emerald-400 font-extrabold">Target Bin Location *</th>
                    <th className="p-2 min-w-[130px]">Remarks</th>
                    <th className="p-2 w-10 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/10 text-xs">
                  {qcForm.rows.map((row: any, idx: number) => (
                    <tr key={idx} className={`hover:bg-slate-800/5 ${darkMode ? 'border-slate-800 text-slate-200' : 'border-slate-200 text-slate-700'}`}>
                      <td className="p-2 text-center text-slate-400 font-semibold">{row.slNo}</td>
                      <td className="p-1"><input type="text" value={row.reelNo} onChange={(e) => handleUpdateQcRow(idx, 'reelNo', e.target.value)} className="w-full px-2 py-1 rounded-lg border text-xs font-mono font-bold" /></td>
                      <td className="p-1"><input type="number" value={row.deckle} onChange={(e) => handleUpdateQcRow(idx, 'deckle', e.target.value)} className="w-full px-2 py-1 rounded-lg border text-xs" /></td>
                      <td className="p-1"><input type="number" value={row.bf} onChange={(e) => handleUpdateQcRow(idx, 'bf', e.target.value)} className="w-full px-2 py-1 rounded-lg border text-xs" /></td>
                      <td className="p-1"><input type="number" value={row.gsm} onChange={(e) => handleUpdateQcRow(idx, 'gsm', e.target.value)} className="w-full px-2 py-1 rounded-lg border text-xs" /></td>
                      <td className="p-1"><input type="number" value={row.observationGsm} onChange={(e) => handleUpdateQcRow(idx, 'observationGsm', e.target.value)} className="w-full px-2 py-1 rounded-lg border text-xs" /></td>
                      <td className="p-1"><input type="number" value={row.observationBf} onChange={(e) => handleUpdateQcRow(idx, 'observationBf', e.target.value)} className="w-full px-2 py-1 rounded-lg border text-xs" /></td>
                      <td className="p-1"><input type="number" value={row.cobbValue} onChange={(e) => handleUpdateQcRow(idx, 'cobbValue', e.target.value)} className="w-full px-2 py-1 rounded-lg border text-xs" /></td>
                      <td className="p-1"><input type="number" step="0.1" value={row.moisture} onChange={(e) => handleUpdateQcRow(idx, 'moisture', e.target.value)} className="w-full px-2 py-1 rounded-lg border text-xs" /></td>
                      <td className="p-1"><input type="number" value={row.netWeight} onChange={(e) => handleUpdateQcRow(idx, 'netWeight', e.target.value)} className="w-full px-2 py-1 rounded-lg border text-xs font-bold" /></td>
                      <td className="p-1">
                        <select 
                          value={row.result} 
                          onChange={(e) => handleUpdateQcRow(idx, 'result', e.target.value)} 
                          className={`w-full px-1 py-1 rounded-lg border text-[11px] font-bold ${
                            row.result === 'Passed' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' : 'text-rose-400 bg-rose-500/10 border-rose-500/30'
                          }`}
                        >
                          <option value="Passed">Passed</option>
                          <option value="Failed">Failed</option>
                        </select>
                      </td>
                      <td className="p-1">
                        <select
                          value={row.binId || qcForm.defaultBinId || ''}
                          onChange={(e) => handleUpdateQcRow(idx, 'binId', e.target.value)}
                          className={`w-full px-2 py-1 rounded-lg border text-[11px] font-semibold ${
                            row.result === 'Passed'
                              ? darkMode ? 'bg-slate-800 border-emerald-500/50 text-emerald-300' : 'bg-emerald-50 border-emerald-300 text-emerald-800'
                              : darkMode ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-400'
                          }`}
                        >
                          <option value="">-- Storage Bin --</option>
                          {selectedWarehouseBins.map((bin: any) => (
                            <option key={bin.id} value={bin.id}>
                              {bin.code} ({bin.name})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-1"><input type="text" value={row.remarks} onChange={(e) => handleUpdateQcRow(idx, 'remarks', e.target.value)} placeholder="e.g. Within specs" className="w-full px-2 py-1 rounded-lg border text-xs" /></td>
                      <td className="p-1 text-center">
                        <button type="button" onClick={() => handleDeleteQcRow(idx)} className="p-1 text-slate-400 hover:text-rose-400"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800/20">
            <button type="button" onClick={onCancel} className="px-4 py-2 rounded-xl border text-xs font-semibold hover:bg-slate-800/15 transition-all">Cancel</button>
            <button type="submit" className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow hover:bg-emerald-500 transition-all cursor-pointer">Commit QC Inspection & Store in Bins</button>
          </div>
        </form>
    </div>
  );
};

