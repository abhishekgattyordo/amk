import React, { useState, useEffect } from 'react';
import { 
  Trash2, 
  RefreshCw, 
  Loader2, 
  AlertCircle, 
  ArrowLeft, 
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';

interface RecycleBinPageProps {
  darkMode: boolean;
  onBack?: () => void;
}

export const RecycleBinPage: React.FC<RecycleBinPageProps> = ({ darkMode, onBack }) => {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterModule, setFilterModule] = useState<string>('');
  const [filterPage, setFilterPage] = useState<string>('');
  const [filterDeletedBy, setFilterDeletedBy] = useState<string>('');
  const [filterDate, setFilterDate] = useState<string>('');
  const [search, setSearch] = useState<string>('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/recycle-bin');
      const result = await response.json();
      if (result.success) {
        setData(result.data || []);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to fetch recycle bin');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Reset to page 1 on filter or page size changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterModule, filterPage, filterDeletedBy, filterDate, pageSize]);

  const handleRestore = async (type: string, id: string) => {
    // Add confirmation
    if (!confirm('Are you sure you want to restore this record?')) return;

    try {
      const response = await fetch('/api/recycle-bin/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, id }),
      });
      if (response.ok) {
        fetchData(); // Refresh list after restoring
      } else {
        const errorData = await response.json();
        alert(`Failed to restore: ${errorData.error}`);
      }
    } catch (err) {
      console.error('Failed to restore');
      alert('Network error while restoring.');
    }
  };

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handlePermanentDelete = async (type: string, id: string) => {
    // Add confirmation modal
    if (!confirm('Are you sure you want to permanently delete this record? This action cannot be undone.')) return;

    setDeletingId(id);
    try {
      const response = await fetch('/api/recycle-bin/permanent-delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
           type, id, 
           // Mocking user info for now, should be replaced with real user context
           userId: 'admin-id', 
           userName: 'Admin User', 
           userRole: 'Administrator' 
        }),
      });
      if (response.ok) {
        fetchData(); // Refresh list after deleting
      } else {
        const errorData = await response.json();
        alert(`Failed to delete: ${errorData.error}`);
      }
    } catch (err) {
      console.error('Failed to delete');
      alert('Network error while deleting.');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredItems = data.filter(item => {
    if (filterModule && item.module !== filterModule) return false;
    if (filterPage && item.page !== filterPage) return false;
    if (filterDeletedBy && item.deletedBy !== filterDeletedBy) return false;
    if (filterDate && item.deletedAt) {
      const itemDateStr = new Date(item.deletedAt).toISOString().split('T')[0];
      if (itemDateStr !== filterDate) return false;
    }
    if (search && !item.recordName?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalItems = filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedItems = filteredItems.slice(startIndex, endIndex);

  // Generate pagination numbers to show (e.g. max 5 buttons)
  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxButtons = 5;
    let start = Math.max(1, safePage - Math.floor(maxButtons / 2));
    let end = Math.min(totalPages, start + maxButtons - 1);

    if (end - start + 1 < maxButtons) {
      start = Math.max(1, end - maxButtons + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  const uniqueModules = Array.from(new Set(data.map(item => item.module))).filter(Boolean);
  const uniquePages = Array.from(new Set(data.map(item => item.page))).filter(Boolean);
  const uniqueDeletedBy = Array.from(new Set(data.map(item => item.deletedBy))).filter(Boolean);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          {onBack && (
            <button onClick={onBack} className={`p-2 rounded-full ${darkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}>
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className={`text-2xl font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              Recycle Bin
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Review and restore deleted records.
            </p>
          </div>
        </div>
      </div>

      <div className={`p-4 rounded-xl border flex flex-col lg:flex-row items-center gap-4 ${darkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className={`flex items-center px-3 py-2 rounded-lg border flex-1 w-full ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
          <Search className="w-4 h-4 text-slate-400 mr-2" />
          <input
            type="text"
            placeholder="Search records..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-full bg-transparent border-none focus:outline-none text-sm ${darkMode ? 'text-white placeholder-slate-500' : 'text-slate-900 placeholder-slate-400'}`}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <select
            value={filterModule}
            onChange={(e) => setFilterModule(e.target.value)}
            className={`px-3 py-2 rounded-lg border text-sm focus:outline-none ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-700'}`}
          >
            <option value="">All Modules</option>
            {uniqueModules.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <select
            value={filterPage}
            onChange={(e) => setFilterPage(e.target.value)}
            className={`px-3 py-2 rounded-lg border text-sm focus:outline-none ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-700'}`}
          >
            <option value="">All Pages</option>
            {uniquePages.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <select
            value={filterDeletedBy}
            onChange={(e) => setFilterDeletedBy(e.target.value)}
            className={`px-3 py-2 rounded-lg border text-sm focus:outline-none ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-700'}`}
          >
            <option value="">All Users</option>
            {uniqueDeletedBy.map(u => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className={`px-3 py-2 rounded-lg border text-sm focus:outline-none ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-700'}`}
          />
        </div>
      </div>

      <div className={`rounded-2xl border overflow-hidden ${darkMode ? 'bg-slate-900/85 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
        {isLoading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-500 mb-4" />
            <p className="text-sm text-slate-400">Loading deleted records...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center text-rose-500">
            <AlertCircle className="w-8 h-8 mx-auto mb-4" />
            <p className="text-sm font-bold">{error}</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
              <Trash2 className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold">Recycle Bin is empty</p>
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className={darkMode ? 'bg-slate-800/50' : 'bg-slate-50'}>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase text-slate-400">Module / Page</th>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase text-slate-400">Record Name & ID</th>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase text-slate-400">Deleted By</th>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase text-slate-400">Deleted Date & Time</th>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase text-slate-400 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {paginatedItems.map((item: any) => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="text-xs font-bold text-slate-900 dark:text-white">{item.module}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{item.page}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs font-bold text-slate-900 dark:text-white">{item.recordName}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5 font-mono">{item.id}</div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">{item.deletedBy}</td>
                      <td className="px-4 py-3">
                        <div className="text-xs text-slate-900 dark:text-white">{item.deletedAt ? new Date(item.deletedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{item.deletedAt ? new Date(item.deletedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'N/A'}</div>
                      </td>
                      <td className="px-4 py-3 text-right flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleRestore(item.type, item.id)}
                          className="inline-flex items-center space-x-1 px-3 py-1.5 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors text-xs font-bold cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Restore</span>
                        </button>
                        <button
                          onClick={() => handlePermanentDelete(item.type, item.id)}
                          disabled={deletingId === item.id}
                          className="inline-flex items-center space-x-1 px-3 py-1.5 bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors text-xs font-bold disabled:opacity-50 cursor-pointer"
                        >
                          {deletingId === item.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                          <span>{deletingId === item.id ? 'Deleting...' : 'Permanent Delete'}</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className={`px-4 py-3.5 border-t flex flex-col sm:flex-row items-center justify-between gap-4 ${
              darkMode ? 'bg-slate-950/60 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}>
              {/* Record Range Information */}
              <div className="text-xs font-medium">
                Showing <span className="font-bold text-emerald-500">{totalItems > 0 ? startIndex + 1 : 0}</span> to{' '}
                <span className="font-bold text-emerald-500">{endIndex}</span> of{' '}
                <span className="font-bold text-emerald-500">{totalItems}</span> records
              </div>

              {/* Navigation Controls */}
              <div className="flex items-center space-x-1.5">
                <button
                  type="button"
                  title="First Page"
                  disabled={safePage <= 1}
                  onClick={() => setCurrentPage(1)}
                  className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                    darkMode ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  title="Previous Page"
                  disabled={safePage <= 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                    darkMode ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {/* Page Number Buttons */}
                <div className="flex items-center space-x-1">
                  {getPageNumbers().map(pageNum => {
                    const isCurrent = pageNum === safePage;
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          isCurrent
                            ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500/20'
                            : (darkMode ? 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100')
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  title="Next Page"
                  disabled={safePage >= totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                    darkMode ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  title="Last Page"
                  disabled={safePage >= totalPages}
                  onClick={() => setCurrentPage(totalPages)}
                  className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                    darkMode ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </div>

              {/* Rows Per Page Selector */}
              <div className="flex items-center space-x-2 text-xs font-medium">
                <span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>Rows per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold focus:outline-none cursor-pointer ${
                    darkMode 
                      ? 'bg-slate-900 border-slate-800 text-slate-200 focus:border-emerald-500' 
                      : 'bg-white border-slate-200 text-slate-700 focus:border-emerald-500'
                  }`}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

