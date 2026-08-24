import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Truck, Search, Plus, Phone, Mail, Building, Star, X, Save, Edit3, Trash2, Eye, Upload, RefreshCw, AlertTriangle, CheckCircle, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Supplier } from '../../types';

const getRowVal = (row: any, keys: string[]): any => {
  if (!row || typeof row !== 'object') return undefined;
  const rowKeys = Object.keys(row);
  for (const k of keys) {
    const kClean = k.toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const rk of rowKeys) {
      const rkClean = rk.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (rkClean === kClean || rk.toLowerCase() === k.toLowerCase()) {
        return row[rk];
      }
    }
  }
  return undefined;
};

interface SuppliersViewProps {
  suppliers: Supplier[];
  categoriesList?: any[];
  onAddSupplier: (supplier: Supplier) => void;
  onUpdateSupplier: (supplier: Supplier) => void;
  onDeleteSupplier: (id: string) => void;
  onRefreshSuppliers?: () => Promise<void>;
  darkMode: boolean;
  selectedSupplierId?: string | null;
}

export const SuppliersView: React.FC<SuppliersViewProps> = ({
  suppliers,
  categoriesList,
  onAddSupplier,
  onUpdateSupplier,
  onDeleteSupplier,
  onRefreshSuppliers,
  darkMode,
  selectedSupplierId,
}) => {
  const [searchSupplier, setSearchSupplier] = useState('');
  const [searchMill, setSearchMill] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [categories, setCategories] = useState<any[]>(categoriesList || []);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [supError, setSupError] = useState<string | null>(null);
  const [supSuccess, setSupSuccess] = useState<string | null>(null);
  const [isSupSubmitting, setIsSupSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [currentSuppliers, setCurrentSuppliers] = useState<Supplier[]>(suppliers || []);
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (categoriesList && categoriesList.length > 0) {
      setCategories(categoriesList);
    }
  }, [categoriesList]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchSupplier, searchMill, selectedCategory]);

  React.useEffect(() => {
    setCurrentSuppliers(suppliers || []);
    setIsLoading(false);
  }, [suppliers]);

  const processFile = (file: File) => {
    console.log("Uploaded file:", file);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(ws);
        console.log("Worksheet rows:", json);
        setPreviewData(json);
      } catch (err) {
        console.error("Error reading Excel file:", err);
        alert("Failed to parse Excel file. Please make sure it is a valid .xlsx or .xls file.");
      }
    };
    reader.onerror = (err) => {
      console.error("FileReader error:", err);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const downloadTemplate = () => {
    const templateData = [
      {
        'SL NO': 1,
        'SUPPLIER': 'Century Paper Mills Ltd',
        'MILL NAME': 'Century Mill Unit 1',
        'CATEGORY': 'Kraft Paper & Reels'
      }
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, 'supplier_import_template.xlsx');
  };

  React.useEffect(() => {
    if (selectedSupplierId) {
      const sup = currentSuppliers.find(s => s.id === selectedSupplierId);
      if (sup) {
        setSelectedSupplier(sup);
        setFormData({ ...sup });
        setIsEditMode(true);
        setIsModalOpen(true);
      }
    }
  }, [selectedSupplierId, currentSuppliers]);

  const [formData, setFormData] = useState<Partial<Supplier>>({
    supplierName: '',
    millName: '', // Mandatory Mill Name field
    category: ''
  });

  const filteredSuppliers = currentSuppliers.filter(s => {
    const matchesSupplier = s.supplierName.toLowerCase().includes(searchSupplier.toLowerCase());
    const matchesMill = s.millName.toLowerCase().includes(searchMill.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || (
      s.category && (
        s.category.toLowerCase() === selectedCategory.toLowerCase() ||
        categories.find(c => c.id === selectedCategory)?.name.toLowerCase() === s.category.toLowerCase()
      )
    );
    return matchesSupplier && matchesMill && matchesCategory;
  });

  const totalItems = filteredSuppliers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const activePage = Math.min(currentPage, totalPages || 1);
  const startIndex = (activePage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedSuppliers = filteredSuppliers.slice(startIndex, endIndex);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSupError(null);
    setSupSuccess(null);
    setIsSupSubmitting(true);

    try {
      if (isEditMode && selectedSupplier) {
        const payload = {
          supplierName: formData.supplierName,
          millName: formData.millName,
          category: formData.category,
        };
        const res = await fetch(`/api/suppliers?id=${selectedSupplier.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to update supplier');
        }
        setSupSuccess('Supplier updated successfully!');
        const updatedSup: Supplier = {
          ...selectedSupplier,
          ...data.data,
        };
        onUpdateSupplier(updatedSup);
      } else {
        const payload = {
          supplierName: formData.supplierName || 'New Supplier',
          millName: formData.millName || 'Default Mill',
          category: formData.category || 'General',
        };
        const res = await fetch('/api/suppliers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to create supplier');
        }
        setSupSuccess('Supplier created successfully!');
        const createdSup: Supplier = {
          id: data.data.id || `SUP-${Date.now()}`,
          supplierName: data.data.supplierName || payload.supplierName,
          millName: data.data.millName || payload.millName,
          category: data.data.category || payload.category,
        };
        onAddSupplier(createdSup);
      }
      setTimeout(() => {
        setIsModalOpen(false);
        setIsEditMode(false);
        setSelectedSupplier(null);
        setIsSupSubmitting(false);
      }, 500);
    } catch (err: any) {
      console.error(err);
      setSupError(err.message || 'An error occurred while saving supplier');
      setIsSupSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Suppliers & Mill Directory
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage paper mills, suppliers, credit terms, and outstanding balances.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center space-x-2 transition-all"
          >
            <Upload className="w-4 h-4" />
            <span>Bulk Import</span>
          </button>
          <button
            onClick={() => {
              setIsEditMode(false);
              setFormData({
                supplierName: '',
                millName: '',
                category: ''
              });
              setIsModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-600/20 flex items-center space-x-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Supplier</span>
          </button>
        </div>
      </div>

      {/* Filters bar */}
      <div className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center gap-4 ${
        darkMode ? 'bg-slate-900/85 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        {/* Search Supplier */}
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={searchSupplier}
            onChange={(e) => setSearchSupplier(e.target.value)}
            placeholder="Search Supplier..."
            className={`w-full pl-10 pr-4 py-2 rounded-xl border text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
              darkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'
            }`}
          />
        </div>

        {/* Search Mill Name */}
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Building className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={searchMill}
            onChange={(e) => setSearchMill(e.target.value)}
            placeholder="Search Mill Name..."
            className={`w-full pl-10 pr-4 py-2 rounded-xl border text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
              darkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'
            }`}
          />
        </div>

        {/* Category dropdown */}
        <div className="flex items-center space-x-2">
          <span className={`text-xs font-semibold uppercase tracking-wider text-slate-400`}>Category:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className={`px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
              darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
            }`}
          >
            <option value="All">All</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Clear Filters */}
        <button
          onClick={() => {
            setSearchSupplier('');
            setSearchMill('');
            setSelectedCategory('All');
          }}
          className={`px-4 py-2 rounded-xl border text-sm font-semibold transition-colors ${
            darkMode 
              ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' 
              : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Clear Filters
        </button>
      </div>

      {/* Table Data */}
      <div className={`rounded-2xl border overflow-hidden ${darkMode ? 'bg-slate-900/85 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`border-b text-xs font-bold uppercase tracking-wider ${
                darkMode ? 'bg-slate-800/80 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}>
                <th className={`p-4 border-r last:border-r-0 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>Supplier</th>
                <th className={`p-4 border-r last:border-r-0 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>Mill Name</th>
                <th className={`p-4 border-r last:border-r-0 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>Category</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={3} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mx-auto" />
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        Loading suppliers data, please wait...
                      </p>
                    </div>
                  </td>
                </tr>
              ) : paginatedSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-12 text-center text-slate-500">
                    No supplier records found matching your criteria.
                  </td>
                </tr>
              ) : (
                paginatedSuppliers.map(sup => {
                  const getSupplierCategories = (s: Supplier) => {
                    if (!s.rawMaterials || s.rawMaterials.length === 0) return 'N/A';
                    const categoryNames = s.rawMaterials
                      .map((rm: any) => rm.category?.name)
                      .filter(Boolean);
                    const uniqueNames = Array.from(new Set(categoryNames));
                    return uniqueNames.length > 0 ? uniqueNames.join(', ') : 'N/A';
                  };

                  return (
                    <tr 
                      key={sup.id} 
                      onClick={() => {
                        setSelectedSupplier(sup);
                        setFormData(sup);
                        setIsEditMode(true);
                        setIsModalOpen(true);
                      }}
                      className={`transition-colors cursor-pointer ${darkMode ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50/80'}`}
                    >
                      <td className={`p-4 border-r last:border-r-0 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                        <div className="font-semibold text-sm text-slate-900 dark:text-white">{sup.supplierName}</div>
                      </td>
                      <td className={`p-4 border-r last:border-r-0 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{sup.millName || 'N/A'}</span>
                      </td>
                      <td className={`p-4 border-r last:border-r-0 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                          {sup.category || 'N/A'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls footer */}
        <div className={`p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4 text-xs ${
          darkMode ? 'border-slate-800 bg-slate-900/40' : 'border-slate-200 bg-slate-50/50'
        }`}>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <span className="text-slate-400 text-center sm:text-left">
              Showing <span className="font-semibold text-slate-800 dark:text-slate-200">{totalItems === 0 ? 0 : startIndex + 1}</span> to{' '}
              <span className="font-semibold text-slate-800 dark:text-slate-200">{endIndex}</span> of{' '}
              <span className="font-semibold text-slate-800 dark:text-slate-200">{totalItems}</span> entries
            </span>
            <div className="flex items-center space-x-1.5">
              <span className="text-slate-400">Rows per page:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className={`px-2 py-1 rounded-md border text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                  darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
                }`}
              >
                {[5, 10, 20, 50].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center space-x-1 flex-wrap justify-center">
              <button
                disabled={activePage === 1}
                onClick={(e) => { e.stopPropagation(); setCurrentPage((p) => Math.max(1, p - 1)); }}
                className={`p-1.5 rounded-lg border text-xs font-semibold transition-colors flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed ${
                  darkMode 
                    ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' 
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                if (totalPages > 5 && Math.abs(pageNum - activePage) > 1 && pageNum !== 1 && pageNum !== totalPages) {
                  if (pageNum === 2 || pageNum === totalPages - 1) {
                    return <span key={pageNum} className="px-1 text-slate-500">...</span>;
                  }
                  return null;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={(e) => { e.stopPropagation(); setCurrentPage(pageNum); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      activePage === pageNum
                        ? 'bg-emerald-600 text-white border border-emerald-600'
                        : darkMode
                        ? 'bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                disabled={activePage === totalPages}
                onClick={(e) => { e.stopPropagation(); setCurrentPage((p) => Math.min(totalPages, p + 1)); }}
                className={`p-1.5 rounded-lg border text-xs font-semibold transition-colors flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed ${
                  darkMode 
                    ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' 
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
          <div className={`w-full max-w-2xl rounded-3xl shadow-2xl border p-8 relative ${
            darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-800/50 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold mb-6">{isEditMode ? 'Edit Supplier Profile' : 'New Supplier & Mill Registration'}</h2>

            {supError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{supError}</span>
              </div>
            )}
            {supSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{supSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Supplier Name</label>
                  <input
                    type="text"
                    required
                    value={formData.supplierName || ''}
                    onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-1">Mill Name (Mandatory)</label>
                  <input
                    type="text"
                    required
                    value={formData.millName || ''}
                    onChange={(e) => setFormData({ ...formData, millName: e.target.value })}
                    placeholder="e.g. Ballarpur Paper Mills"
                    className={`w-full px-3.5 py-2.5 rounded-xl border border-emerald-500/50 text-sm ${darkMode ? 'bg-slate-800 text-white' : 'bg-slate-50'}`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Category</label>
                <input
                  type="text"
                  required
                  value={formData.category || ''}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g. Kraft Paper & Reels"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSupSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 flex items-center space-x-2 disabled:opacity-50"
                >
                  {isSupSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>{isEditMode ? 'Update Supplier' : 'Save Supplier'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
          <div className={`w-full max-w-4xl rounded-3xl shadow-2xl border p-8 relative ${
            darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <button
              onClick={() => setIsImportModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-800/50 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold mb-6">Bulk Import Suppliers</h2>
            {previewData.length === 0 ? (
                <>
                    <div className="flex justify-between items-center mb-6">
                      <button onClick={downloadTemplate} className="text-sm text-emerald-600 font-semibold hover:underline">Download Excel Template</button>
                    </div>
                    <div 
                        className={`text-center p-12 border-2 border-dashed rounded-2xl cursor-pointer transition-colors ${
                          isDragging 
                            ? 'border-emerald-500 bg-emerald-500/10' 
                            : 'border-slate-700 hover:bg-slate-800'
                        }`}
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        <Upload className={`w-10 h-10 mx-auto mb-4 transition-colors ${isDragging ? 'text-emerald-500' : 'text-slate-500'}`} />
                        <p className="text-sm">Drag and drop your Excel file here, or click to browse</p>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileUpload} 
                            accept=".xlsx, .xls" 
                            className="hidden" 
                        />
                    </div>
                </>
            ) : (
                <div className="max-h-96 overflow-y-auto">
                    <table className="w-full text-xs text-left">
                        <thead className="text-slate-400">
                            <tr>
                                {Object.keys(previewData[0]).map(key => <th key={key} className="p-2">{key}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {previewData.map((row, i) => (
                                <tr key={i} className="border-t border-slate-700">
                                    {Object.values(row).map((val: any, j) => <td key={j} className="p-2">{val}</td>)}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="flex justify-end gap-2 mt-6">
                        <button onClick={() => setPreviewData([])} className="px-4 py-2 rounded-lg bg-slate-700 text-white">Cancel</button>
                        <button onClick={async () => {
                            // Filter out completely empty or invalid rows from previewData
                            const validRows = previewData.filter(row => {
                              const sName = getRowVal(row, ['Supplier', 'Supplier Name', 'supplierName', 'supplier_name', 'name']);
                              return !!sName;
                            });
                            
                            const newSuppliers = validRows.map(row => {
                              const sName = String(getRowVal(row, ['Supplier', 'Supplier Name', 'supplierName', 'supplier_name', 'name']) || '').trim();
                              const mill = String(getRowVal(row, ['Mill Name', 'millName', 'mill_name', 'mill']) || '').trim();
                              const cat = String(getRowVal(row, ['Category', 'category']) || 'General').trim();

                              return {
                                supplierName: sName || 'Unnamed Supplier',
                                millName: mill || 'Default Mill',
                                category: cat
                              };
                            });
                            
                            console.log("Mapped suppliers:", newSuppliers);
                            console.log("Bulk import payload:", {
                              suppliers: newSuppliers
                            });

                            if (!newSuppliers || newSuppliers.length === 0) {
                              alert("No supplier records found. Please upload a valid Excel file.");
                              return;
                            }

                            try {
                                const res = await fetch('/api/suppliers/bulk-import', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ suppliers: newSuppliers })
                                });
                                
                                const result = await res.json();
                                if (result.success && result.data) {
                                    alert(`Import Summary:\nImported: ${result.data.imported}\nDuplicates: ${result.data.duplicates}\nFailed: ${result.data.failed}`);
                                } else {
                                    alert(`Import Failed: ${result.error || 'Unknown error'}`);
                                }
                                
                                if (onRefreshSuppliers) {
                                    await onRefreshSuppliers();
                                }
                                setIsImportModalOpen(false);
                                setPreviewData([]);
                            } catch (err: any) {
                                console.error('Error in bulk import post:', err);
                                alert(`Error during import: ${err.message || err}`);
                            }
                        }} className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-bold">Import</button>
                    </div>
                </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
