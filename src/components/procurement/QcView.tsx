import React, { useState } from 'react';
import { ChevronDown, ChevronRight, MapPin, CheckCircle2, AlertCircle, ChevronLeft } from 'lucide-react';

interface QcViewProps {
  darkMode: boolean;
  qcRecords: any[];
  binLocations?: any[];
  warehouses?: any[];
}

export const QcView: React.FC<QcViewProps> = ({ darkMode, qcRecords, binLocations = [], warehouses = [] }) => {
  const [expandedQcId, setExpandedQcId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;

  const totalRecords = qcRecords.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const paginatedQcRecords = qcRecords.slice(startIndex, startIndex + pageSize);

  const getBinName = (binId?: string, fallbackCode?: string) => {
    if (!binId && !fallbackCode) return null;
    const found = binLocations.find(b => b.id === binId || b.code === fallbackCode);
    if (found) return `${found.code} (${found.name})`;
    return fallbackCode || binId;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className={`text-base font-bold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>Reel Strength & Bin Storage Ledger</h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Quality verification with automated warehouse bin allocation upon approval.</p>
        </div>
      </div>

      <div className={`rounded-2xl border overflow-hidden ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className={`border-b font-bold uppercase tracking-wider ${darkMode ? 'bg-slate-850 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                <th className="p-3 w-8"></th>
                <th className="p-3">Inward / Reel ID</th>
                <th className="p-3 text-right">Declared Wt</th>
                <th className="p-3 text-right">Tested Wt</th>
                <th className="p-3 text-center">Verified GSM</th>
                <th className="p-3 text-center">Verified BF</th>
                <th className="p-3">Allocated Storage Bin</th>
                <th className="p-3">Inspector</th>
                <th className="p-3">Inspection Date</th>
                <th className="p-3">QC Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {qcRecords.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-500 text-xs font-medium">
                    No quality check records found.
                  </td>
                </tr>
              ) : (
                paginatedQcRecords.map(qc => {
                  const statusStr = String(qc.qualityStatus || qc.status || '').toUpperCase();
                  const isPassed = statusStr.includes('PASS') || statusStr.includes('APPROV');
                  const isExpanded = expandedQcId === qc.id;
                  const items = Array.isArray(qc.items) ? qc.items : [];
                  const firstBin = items[0]?.binCode || getBinName(items[0]?.binId) || qc.binCode || (isPassed ? 'Bay A-01 (Auto)' : null);

                return (
                  <React.Fragment key={qc.id}>
                    <tr className={`${isPassed ? 'bg-emerald-500/5' : 'bg-rose-500/5'} hover:bg-slate-800/10 transition-colors`}>
                      <td className="p-2 text-center">
                        {items.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setExpandedQcId(isExpanded ? null : qc.id)}
                            className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
                          >
                            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                          </button>
                        )}
                      </td>
                      <td className="p-3 font-mono font-bold text-slate-900 dark:text-slate-100">{qc.reelNumber}</td>
                      <td className="p-3 text-right text-slate-600 dark:text-slate-400">{qc.expectedWeight?.toLocaleString()} Kg</td>
                      <td className="p-3 text-right font-bold text-slate-900 dark:text-slate-100">{qc.actualWeight?.toLocaleString()} Kg</td>
                      <td className="p-3 text-center font-mono font-semibold">{qc.gsmVerification}</td>
                      <td className="p-3 text-center font-mono font-semibold">{qc.bfVerification}</td>
                      <td className="p-3">
                        {isPassed ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 font-medium text-[11px] border border-emerald-500/20">
                            <MapPin className="w-3 h-3 shrink-0" />
                            {firstBin || 'Assigned Storage'}
                          </span>
                        ) : (
                          <span className="text-[11px] text-rose-500 font-medium">Quarantine</span>
                        )}
                      </td>
                      <td className="p-3 text-slate-700 dark:text-slate-300 font-medium">{qc.inspector}</td>
                      <td className="p-3 text-slate-600 dark:text-slate-400">{qc.inspectionDate}</td>
                      <td className="p-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isPassed ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30' : 'bg-rose-500/15 text-rose-500 border border-rose-500/30'
                        }`}>
                          {isPassed ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                          {qc.qualityStatus}
                        </span>
                      </td>
                    </tr>
                    {isExpanded && items.length > 0 && (
                      <tr className={`${darkMode ? 'bg-slate-950/60' : 'bg-slate-50/80'}`}>
                        <td colSpan={10} className="p-4">
                          <div className="pl-6 space-y-2">
                            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Reel Breakdown & Bin Storage Allocation</h4>
                            <div className="overflow-x-auto border rounded-xl overflow-hidden">
                              <table className="w-full text-left border-collapse text-[11px]">
                                <thead>
                                  <tr className={`border-b font-bold ${darkMode ? 'bg-slate-900 text-slate-400 border-slate-800' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                    <th className="p-2 w-8">SL</th>
                                    <th className="p-2">Reel Number</th>
                                    <th className="p-2 text-right">Deckle</th>
                                    <th className="p-2 text-right">GSM (Obs)</th>
                                    <th className="p-2 text-right">BF (Obs)</th>
                                    <th className="p-2 text-right">Net Wt (Kg)</th>
                                    <th className="p-2">Verdict</th>
                                    <th className="p-2 text-emerald-400 font-bold">Stored in Bin</th>
                                    <th className="p-2">Remarks</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/20">
                                  {items.map((row: any, rIdx: number) => {
                                    const rowPassed = row.result === 'Passed' || row.status === 'PASSED';
                                    const rowBin = row.binCode || getBinName(row.binId) || (rowPassed ? 'Bay Storage' : 'Quarantine');
                                    return (
                                      <tr key={rIdx} className="hover:bg-slate-800/10">
                                        <td className="p-2 text-slate-500">{row.slNo || rIdx + 1}</td>
                                        <td className="p-2 font-mono font-bold text-slate-200">{row.reelNo}</td>
                                        <td className="p-2 text-right">{row.deckle} cm</td>
                                        <td className="p-2 text-right font-mono">{row.observationGsm || row.gsm}</td>
                                        <td className="p-2 text-right font-mono">{row.observationBf || row.bf}</td>
                                        <td className="p-2 text-right font-bold">{row.netWeight} Kg</td>
                                        <td className="p-2">
                                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${rowPassed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                                            {row.result || (rowPassed ? 'Passed' : 'Failed')}
                                          </span>
                                        </td>
                                        <td className="p-2">
                                          {rowPassed ? (
                                            <span className="inline-flex items-center gap-1 font-medium text-emerald-400">
                                              <MapPin className="w-3 h-3" />
                                              {rowBin}
                                            </span>
                                          ) : (
                                            <span className="text-rose-400">Quarantine Area</span>
                                          )}
                                        </td>
                                        <td className="p-2 text-slate-400">{row.remarks || '-'}</td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              }))}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalRecords > 0 && (
          <div className={`p-3 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-xs ${
            darkMode ? 'bg-slate-850/60 border-slate-800 text-slate-400' : 'bg-slate-50/80 border-slate-200 text-slate-600'
          }`}>
            <div>
              Showing <span className="font-bold text-slate-900 dark:text-slate-100">{totalRecords > 0 ? startIndex + 1 : 0}</span> to <span className="font-bold text-slate-900 dark:text-slate-100">{Math.min(startIndex + pageSize, totalRecords)}</span> of <span className="font-bold text-slate-900 dark:text-slate-100">{totalRecords}</span> inspection records
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className={`px-2.5 py-1 rounded-lg border flex items-center space-x-1 font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                  darkMode ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>
              <span className="px-2 font-mono font-bold">
                Page {safePage} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
                className={`px-2.5 py-1 rounded-lg border flex items-center space-x-1 font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                  darkMode ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

