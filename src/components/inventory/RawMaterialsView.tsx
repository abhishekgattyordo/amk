import React, { useState } from 'react';
import { UniversalServerSelect } from '../common/UniversalServerSelect';
import { 
  Package, 
  Search, 
  Filter, 
  Plus, 
  Download, 
  Printer, 
  Edit3, 
  Trash2, 
  Eye, 
  AlertTriangle, 
  CheckCircle, 
  FileText, 
  X, 
  Save, 
  Layers, 
  ArrowUpDown,
  RefreshCw,
  Loader2,
  History
} from 'lucide-react';
import { RawMaterial, Supplier, Warehouse, CategoryItem, SubcategoryItem } from '../../types';

interface RawMaterialsViewProps {
  rawMaterials: RawMaterial[];
  suppliers: Supplier[];
  warehouses: Warehouse[];
  categoriesList: CategoryItem[];
  subCategoriesList: SubcategoryItem[];
  onAddRawMaterial: (material: RawMaterial) => void;
  onUpdateRawMaterial: (material: RawMaterial) => void;
  onDeleteRawMaterial: (id: string) => void;
  darkMode: boolean;
  selectedMaterialId?: string | null;
  onSelectMaterial?: (id: string) => void;
  onViewHistory: (entity: string, entityId: string, entityName?: string) => void;
  isLoading?: boolean;
}

export const RawMaterialsView: React.FC<RawMaterialsViewProps> = ({
  rawMaterials,
  suppliers,
  warehouses,
  categoriesList,
  subCategoriesList,
  onAddRawMaterial,
  onUpdateRawMaterial,
  onDeleteRawMaterial,
  darkMode,
  selectedMaterialId,
  onSelectMaterial,
  onViewHistory,
  isLoading = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [subcategoryFilter, setSubcategoryFilter] = useState('All');
  const [warehouseFilter, setWarehouseFilter] = useState('All');
  const [stockStatusFilter, setStockStatusFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedMaterial, setSelectedMaterial] = useState<RawMaterial | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Detail Modal Tab & Movements state
  const [activeDetailTab, setActiveDetailTab] = useState<'records' | 'movements' | 'history'>('records');
  const [movements, setMovements] = useState<any[]>([]);
  const [isMovementsLoading, setIsMovementsLoading] = useState(false);
  const [movementsError, setMovementsError] = useState<string | null>(null);
  const [movementsPage, setMovementsPage] = useState(1);
  const [movementsTotal, setMovementsTotal] = useState(0);
  const [movementsTotalPages, setMovementsTotalPages] = useState(1);

  const fetchStockMovements = React.useCallback(async (materialId: string, page = 1) => {
    setIsMovementsLoading(true);
    setMovementsError(null);
    try {
      const res = await fetch(`/api/stock-movements?materialId=${materialId}&page=${page}&limit=20`);
      if (!res.ok) {
        throw new Error(`Failed to load movements (${res.status})`);
      }
      const json = await res.json();
      if (json.success) {
        setMovements(json.data || []);
        setMovementsTotal(json.meta?.total || (json.data ? json.data.length : 0));
        setMovementsTotalPages(json.meta?.totalPages || 1);
      } else {
        throw new Error(json.error || 'Failed to load stock movements');
      }
    } catch (err: any) {
      setMovementsError(err.message || 'Error fetching stock movements');
      setMovements([]);
    } finally {
      setIsMovementsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (isDetailModalOpen && selectedMaterial && activeDetailTab === 'movements') {
      fetchStockMovements(selectedMaterial.id, movementsPage);
    }
  }, [isDetailModalOpen, selectedMaterial, activeDetailTab, movementsPage, fetchStockMovements]);

  React.useEffect(() => {
    if (selectedMaterialId) {
      const mat = rawMaterials.find(m => m.id === selectedMaterialId);
      if (mat) {
        setSelectedMaterial(mat);
        setActiveDetailTab('records');
        setMovementsPage(1);
        setIsDetailModalOpen(true);
      }
    }
  }, [selectedMaterialId, rawMaterials]);

  // Form State for Add / Edit
  const [formData, setFormData] = useState<Partial<RawMaterial>>({
    code: `RM-${Math.floor(1000 + Math.random() * 9000)}`,
    name: '',
    category: '',
    subCategory: '',
    grade: 'BF-18',
    gsm: 180,
    thickness: 240,
    uom: 'KG',
    hsnCode: '48041100',
    supplierId: suppliers[0]?.id,
    supplier: null,
    warehouseId: warehouses[0]?.id,
    warehouse: null,
    currentStock: 10000,
    minStock: 3000,
    maxStock: 25000,
    reorderLevel: 5000,
    purchasePrice: 60.00,
    status: 'Active',
    description: ''
  });

  const rawMaterialCategories = categoriesList.filter(c => c.type === 'Raw Material');
  const categories = ['All', ...rawMaterialCategories.map(c => c.name)];
  
  const selectedCategoryItem = categoriesList.find(c => c.name === categoryFilter);
  const subCategories = selectedCategoryItem 
    ? ['All', ...subCategoriesList.filter(s => s.parentCategoryId === selectedCategoryItem.id).map(s => s.name)]
    : ['All'];

  const activeCategories = categoriesList.filter(c => c.status === 'Active' && c.type === 'Raw Material');
  const formDataCategoryItem = categoriesList.find(c => c.name === formData.category);
  const activeSubcategories = formDataCategoryItem 
    ? subCategoriesList.filter(s => s.parentCategoryId === formDataCategoryItem.id && s.status === 'Active')
    : [];

  const handleCategoryChange = (catName: string) => {
    const parentCat = categoriesList.find(c => c.name === catName);
    const relatedSubs = parentCat 
      ? subCategoriesList.filter(s => s.parentCategoryId === parentCat.id && s.status === 'Active')
      : [];
    setFormData(prev => ({
      ...prev,
      category: catName,
      subCategory: relatedSubs[0]?.name || ''
    }));
  };

  const filteredMaterials = rawMaterials.filter(rm => {
    const matchesSearch = rm.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          rm.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (rm.supplier?.supplierName?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
                          rm.grade.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSupplier = supplierFilter === 'All' || rm.supplier?.id === supplierFilter;
    const matchesCategory = categoryFilter === 'All' || rm.category === categoryFilter;
    const matchesSubcategory = subcategoryFilter === 'All' || rm.subCategory === subcategoryFilter;
    const matchesWarehouse = warehouseFilter === 'All' || rm.warehouse?.id === warehouseFilter;
    const matchesStatus = statusFilter === 'All' || rm.status === statusFilter;
    
    let matchesStock = true;
    if (stockStatusFilter !== 'All') {
      const isLow = rm.currentStock <= rm.reorderLevel;
      const isCritical = rm.currentStock <= rm.minStock;
      if (stockStatusFilter === 'Healthy') matchesStock = !isLow;
      else if (stockStatusFilter === 'Low Stock') matchesStock = isLow && !isCritical;
      else if (stockStatusFilter === 'Critical') matchesStock = isCritical;
    }

    return matchesSearch && matchesSupplier && matchesCategory && matchesSubcategory && matchesWarehouse && matchesStatus && matchesStock;
  });

  const clearFilters = () => {
    setSearchQuery('');
    setSupplierFilter('All');
    setCategoryFilter('All');
    setSubcategoryFilter('All');
    setWarehouseFilter('All');
    setStockStatusFilter('All');
    setStatusFilter('All');
  };

  const [rmError, setRmError] = useState<string | null>(null);
  const [rmSuccess, setRmSuccess] = useState<string | null>(null);
  const [isRmSubmitting, setIsRmSubmitting] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setRmError(null);
    setRmSuccess(null);
    setIsRmSubmitting(true);

    try {
      if (isEditMode && selectedMaterial) {
        const payload = {
          code: formData.code,
          name: formData.name,
          category: formData.category,
          subCategory: formData.subCategory,
          grade: formData.grade,
          gsm: Number(formData.gsm) || 0,
          thickness: Number(formData.thickness) || 0,
          uom: formData.uom,
          hsnCode: formData.hsnCode,
          supplierId: formData.supplierId || (formData.supplier && typeof formData.supplier === 'object' ? formData.supplier.id : undefined),
          warehouseId: formData.warehouseId || (formData.warehouse && typeof formData.warehouse === 'object' ? formData.warehouse.id : undefined),
          currentStock: Number(formData.currentStock) || 0,
          minStock: Number(formData.minStock) || 0,
          maxStock: Number(formData.maxStock) || 0,
          reorderLevel: Number(formData.reorderLevel) || 0,
          purchasePrice: Number(formData.purchasePrice) || 0,
          status: formData.status,
          description: formData.description
        };
        const res = await fetch(`/api/raw-materials?id=${selectedMaterial.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to update raw material');
        }
        setRmSuccess('Raw material updated successfully!');
        const updated: RawMaterial = {
          ...selectedMaterial,
          ...data.data,
          lastUpdated: new Date().toISOString().replace('T', ' ').substring(0, 16)
        };
        onUpdateRawMaterial(updated);
      } else {
        const payload = {
          code: formData.code || `RM-${Math.floor(1000 + Math.random() * 9000)}`,
          name: formData.name || 'Unnamed Material',
          category: formData.category || (activeCategories[0]?.name || ''),
          subCategory: formData.subCategory || '',
          grade: formData.grade || 'Standard',
          gsm: Number(formData.gsm) || 0,
          thickness: Number(formData.thickness) || 0,
          uom: formData.uom || 'Kg',
          hsnCode: formData.hsnCode || '48041100',
          supplierId: formData.supplierId || suppliers[0]?.id,
          warehouseId: formData.warehouseId || warehouses[0]?.id,
          currentStock: Number(formData.currentStock) || 0,
          minStock: Number(formData.minStock) || 1000,
          maxStock: Number(formData.maxStock) || 20000,
          reorderLevel: Number(formData.reorderLevel) || 2000,
          purchasePrice: Number(formData.purchasePrice) || 50.00,
          status: formData.status || 'Active',
          description: formData.description || ''
        };
        const res = await fetch('/api/raw-materials', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to create raw material');
        }
        setRmSuccess('Raw material created successfully!');
        const created: RawMaterial = {
          id: data.data.id || `RM-${Date.now()}`,
          code: data.data.code || payload.code,
          name: data.data.name || payload.name,
          category: data.data.category || payload.category,
          subCategory: data.data.subCategory || payload.subCategory,
          grade: data.data.grade || payload.grade,
          gsm: data.data.gsm ?? payload.gsm,
          thickness: data.data.thickness ?? payload.thickness,
          uom: data.data.uom || payload.uom,
          hsnCode: data.data.hsnCode || payload.hsnCode,
          supplier: data.data.supplier,
          warehouse: data.data.warehouse,
          currentStock: data.data.currentStock ?? payload.currentStock,
          minStock: data.data.minStock ?? payload.minStock,
          maxStock: data.data.maxStock ?? payload.maxStock,
          reorderLevel: data.data.reorderLevel ?? payload.reorderLevel,
          purchasePrice: data.data.purchasePrice ?? payload.purchasePrice,
          status: data.data.status || payload.status,
          description: data.data.description || payload.description,
          lastUpdated: new Date().toISOString().replace('T', ' ').substring(0, 16),
          documentsCount: 1
        };
        onAddRawMaterial(created);
      }
      setTimeout(() => {
        setIsAddModalOpen(false);
        setIsEditMode(false);
        setSelectedMaterial(null);
        setIsRmSubmitting(false);
        setRmSuccess(null);
      }, 600);
    } catch (err: any) {
      console.error(err);
      setRmError(err.message || 'An error occurred');
      setIsRmSubmitting(false);
    }
  };

  const openAddModal = () => {
    setIsEditMode(false);
    const activeCats = categoriesList.filter(c => c.status === 'Active' && c.type === 'Raw Material');
    const firstCat = activeCats[0]?.name || '';
    const firstCatItem = activeCats[0];
    const relatedSubs = firstCatItem 
      ? subCategoriesList.filter(s => s.parentCategoryId === firstCatItem.id && s.status === 'Active')
      : [];
    const firstSub = relatedSubs[0]?.name || '';

    setFormData({
      code: `RM-${Math.floor(1000 + Math.random() * 9000)}`,
      name: '',
      category: firstCat,
      subCategory: firstSub,
      grade: 'BF-18',
      gsm: 180,
      thickness: 240,
      uom: 'KG',
      hsnCode: '48041100',
      supplierId: suppliers[0]?.id || '',
      warehouseId: warehouses[0]?.id || '',
      currentStock: 10000,
      minStock: 3000,
      maxStock: 25000,
      reorderLevel: 5000,
      purchasePrice: 60.00,
      status: 'Active',
      description: ''
    });
    setIsAddModalOpen(true);
  };

  const openEditModal = (material: RawMaterial) => {
    setSelectedMaterial(material);
    setFormData(material);
    setIsEditMode(true);
    setIsAddModalOpen(true);
  };

  const handleExportCSV = () => {
    const headers = 'Code,Name,Category,Grade,GSM,UOM,Supplier,Warehouse,CurrentStock,Price,Status\n';
    const rows = filteredMaterials.map(m => 
      `"${m.code}","${m.name}","${m.category}","${m.grade}",${m.gsm},"${m.uom}","${m.supplier?.supplierName || ""}","${m.warehouse?.name || ""}",${m.currentStock},${m.purchasePrice},"${m.status}"`
    ).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AMK_Raw_Materials_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Raw Materials Master
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage paper reels, GSM grades, fluting medium, starch adhesives, and mill suppliers.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleExportCSV}
            className={`px-4 py-2 rounded-xl border text-xs font-semibold flex items-center space-x-2 transition-colors ${
              darkMode ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Download className="w-4 h-4 text-emerald-500" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => window.print()}
            className={`px-4 py-2 rounded-xl border text-xs font-semibold flex items-center space-x-2 transition-colors ${
              darkMode ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Printer className="w-4 h-4 text-slate-400" />
            <span>Print Report</span>
          </button>
          <button
            onClick={openAddModal}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-600/20 flex items-center space-x-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Raw Material</span>
          </button>
        </div>
      </div>

      {/* Search & Filters Bar */}
      <div className={`p-4 rounded-2xl border ${
        darkMode ? 'bg-slate-900/85 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by code, material name, mill..."
              className={`w-full pl-10 pr-4 py-2 rounded-xl border text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                darkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'
              }`}
            />
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 rounded-xl border text-xs font-semibold flex items-center space-x-2 transition-colors ${
              darkMode ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Filter className="w-4 h-4 text-emerald-500" />
            <span>Filters</span>
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Supplier</span>
              <select value={supplierFilter} onChange={(e) => setSupplierFilter(e.target.value)} className={`w-full px-2 py-1.5 rounded-lg border text-xs font-medium focus:outline-none ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                <option value="All">All Suppliers</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.supplierName}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Category</span>
              <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setSubcategoryFilter('All'); }} className={`w-full px-2 py-1.5 rounded-lg border text-xs font-medium focus:outline-none ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Subcategory</span>
              <select value={subcategoryFilter} onChange={(e) => setSubcategoryFilter(e.target.value)} className={`w-full px-2 py-1.5 rounded-lg border text-xs font-medium focus:outline-none ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                {subCategories.map(sub => <option key={sub} value={sub}>{sub}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Warehouse</span>
              <select value={warehouseFilter} onChange={(e) => setWarehouseFilter(e.target.value)} className={`w-full px-2 py-1.5 rounded-lg border text-xs font-medium focus:outline-none ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                <option value="All">All Warehouses</option>
                {warehouses.map(w => <option key={w.id} value={w.name}>{w.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Stock Status</span>
              <select value={stockStatusFilter} onChange={(e) => setStockStatusFilter(e.target.value)} className={`w-full px-2 py-1.5 rounded-lg border text-xs font-medium focus:outline-none ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                <option value="All">All</option>
                <option value="Healthy">Healthy</option>
                <option value="Low Stock">Low Stock</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Status</span>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={`w-full px-2 py-1.5 rounded-lg border text-xs font-medium focus:outline-none ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                <option value="All">All</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <div className="col-span-2 sm:col-span-6 flex justify-end">
              <button onClick={clearFilters} className="text-xs text-rose-500 font-semibold hover:underline">Clear All Filters</button>
            </div>
          </div>
        )}
      </div>


      {/* Table Data */}
      <div className={`rounded-2xl border overflow-hidden ${darkMode ? 'bg-slate-900/85 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`border-b text-xs font-bold uppercase tracking-wider ${
                darkMode ? 'bg-slate-800/80 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}>
                <th className={`p-4 border-r last:border-r-0 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>Material Code / Name</th>
                <th className={`p-4 border-r last:border-r-0 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>Category / Grade</th>
                <th className={`p-4 border-r last:border-r-0 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>GSM</th>
                <th className={`p-4 border-r last:border-r-0 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>UOM</th>
                <th className={`p-4 border-r last:border-r-0 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>Supplier (Mill Name)</th>
                <th className={`p-4 border-r last:border-r-0 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>Current Stock</th>
                <th className={`p-4 border-r last:border-r-0 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>Unit Price (₹)</th>
                <th className={`p-4 border-r last:border-r-0 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>Status</th>
                <th className={`p-4 border-r last:border-r-0 ${darkMode ? 'border-slate-800' : 'border-slate-200'} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mx-auto" />
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        Loading raw materials data, please wait...
                      </p>
                    </div>
                  </td>
                </tr>
              ) : filteredMaterials.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No raw materials found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredMaterials.map(rm => {
                  const isLowStock = rm.currentStock <= rm.reorderLevel;
                  return (
                    <tr key={rm.id} className={`transition-colors ${darkMode ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50/80'}`}>
                      <td className={`p-4 border-r last:border-r-0 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                        <div className="font-bold text-xs font-mono text-emerald-500">{rm.code}</div>
                        <div className={`font-semibold text-sm mt-0.5 ${darkMode ? 'text-white' : 'text-slate-900'}`}>{rm.name}</div>
                      </td>
                      <td className={`p-4 border-r last:border-r-0 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                        <span className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-semibold ${
                          darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {rm.category}
                        </span>
                        <div className="text-xs text-slate-400 mt-1">Grade: {rm.grade}</div>
                      </td>
                      <td className={`p-4 border-r last:border-r-0 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                        <div className="font-bold text-sm">{rm.gsm > 0 ? `${rm.gsm} GSM` : 'N/A'}</div>
                      </td>
                      <td className={`p-4 border-r last:border-r-0 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                        <span className={`px-2 py-1 rounded-lg text-xs font-bold ${darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'}`}>
                          {rm.uom || 'Kg'}
                        </span>
                      </td>
                      <td className={`p-4 border-r last:border-r-0 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                        <div className="font-medium text-xs truncate max-w-[200px]" title={rm.supplier?.supplierName || "No Supplier"}>{rm.supplier?.supplierName || "No Supplier"}</div>
                        <div className="text-[10px] text-slate-400">{rm.warehouse?.name || "No Warehouse"}</div>
                      </td>
                      <td className={`p-4 border-r last:border-r-0 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                        <div className="flex items-center space-x-2">
                          <span className={`font-black text-sm ${isLowStock ? 'text-rose-500' : (darkMode ? 'text-white' : 'text-slate-900')}`}>
                            {rm.currentStock.toLocaleString()}
                          </span>
                          {isLowStock && (
                            <span className="px-1.5 py-0.5 bg-rose-500/10 text-rose-500 text-[10px] font-bold rounded flex items-center">
                              <AlertTriangle className="w-3 h-3 mr-0.5" /> Low
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">Reorder: {rm.reorderLevel}</div>
                      </td>
                      <td className={`p-4 border-r last:border-r-0 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                        <div className="font-bold font-mono">₹{rm.purchasePrice.toFixed(2)}</div>
                        <div className="text-[10px] text-slate-400">HSN: {rm.hsnCode}</div>
                      </td>
                      <td className={`p-4 border-r last:border-r-0 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                          rm.status === 'Active' 
                            ? (darkMode ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-900' : 'bg-emerald-50 text-emerald-700 border border-emerald-200')
                            : (darkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600')
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${rm.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                          {rm.status}
                        </span>
                      </td>
                      <td className={`p-4 border-r last:border-r-0 ${darkMode ? 'border-slate-800' : 'border-slate-200'} text-right`}>
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => onViewHistory('RawMaterial', rm.id, `${rm.code} - ${rm.name}`)}
                            className={`p-1.5 rounded-lg border transition-colors ${darkMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300' : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-600'}`}
                            title="View Change History"
                          >
                            <History className="w-4 h-4" />
                          </button>                          <button
                            onClick={() => {
                              if (onSelectMaterial) {
                                onSelectMaterial(rm.id);
                              } else {
                                setSelectedMaterial(rm);
                                setIsDetailModalOpen(true);
                              }
                            }}
                            className={`p-1.5 rounded-lg border transition-colors ${darkMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300' : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-600'}`}
                            title="View Material Profile & Audit Log"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(rm)}
                            className={`p-1.5 rounded-lg border transition-colors ${darkMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-emerald-400' : 'bg-white border-slate-200 hover:bg-slate-100 text-emerald-600'}`}
                            title="Edit Material"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeleteRawMaterial(rm.id)}
                            className={`p-1.5 rounded-lg border transition-colors ${darkMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-rose-400' : 'bg-white border-slate-200 hover:bg-slate-100 text-rose-600'}`}
                            title="Delete Material"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
          <div className={`w-full max-w-3xl rounded-3xl shadow-2xl border p-8 my-8 relative ${
            darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-800/50 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <h2 className="text-xl font-bold">
                {isEditMode ? 'Edit Raw Material Master' : 'Create New Raw Material Master'}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Enter precise GSM, mill supplier, warehouse location, and reorder thresholds.
              </p>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Material Code</label>
                  <input
                    type="text"
                    required
                    value={formData.code || ''}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Material Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Virgin Kraft Liner Paper Roll"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Category</label>
                  <select
                    value={formData.category || ''}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className={`w-full px-3 py-2.5 rounded-xl border text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                  >
                    <option value="" disabled>
                      {activeCategories.length === 0 ? 'No Raw Material Categories Found' : 'Select Category'}
                    </option>
                    {activeCategories.map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Subcategory</label>
                  <select
                    value={formData.subCategory || ''}
                    onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })}
                    className={`w-full px-3 py-2.5 rounded-xl border text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                  >
                    <option value="" disabled>
                      {activeSubcategories.length === 0 ? 'No Subcategories Found' : 'Select Subcategory'}
                    </option>
                    {activeSubcategories.map(sub => (
                      <option key={sub.id} value={sub.name}>{sub.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Grade</label>
                  <input
                    type="text"
                    value={formData.grade || ''}
                    onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                    placeholder="e.g. VK-180"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">GSM</label>
                  <input
                    type="number"
                    value={formData.gsm ?? 0}
                    onChange={(e) => setFormData({ ...formData, gsm: Number(e.target.value) })}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">UOM</label>
                  <select
                    value={formData.uom || 'Kg'}
                    onChange={(e) => setFormData({ ...formData, uom: e.target.value })}
                    className={`w-full px-3 py-2.5 rounded-xl border text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                  >
                    <option value="NOS">NOS (Numbers)</option>
                    <option value="KG">KG</option>
                    <option value="Roll">Roll</option>
                    <option value="Sheet">Sheet</option>
                    <option value="Bundle">Bundle</option>
                    <option value="Liters">Liters</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Supplier (Mill Name)</label>
                  <UniversalServerSelect
                    endpoint="/api/suppliers"
                    value={formData.supplierId || (typeof formData.supplier === 'string' ? formData.supplier : formData.supplier?.id) || ''}
                    onChange={(id, sup) => setFormData({ ...formData, supplierId: id, supplier: id })}
                    placeholder="Search or select supplier..."
                    searchPlaceholder="Search supplier name or code..."
                    darkMode={darkMode}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Warehouse</label>
                  <select
                    value={formData.warehouseId || (typeof formData.warehouse === 'string' ? formData.warehouse : formData.warehouse?.id) || ''}
                    onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value, warehouse: e.target.value })}
                    className={`w-full px-3 py-2.5 rounded-xl border text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                  >
                    {warehouses.map(wh => (
                      <option key={wh.id} value={wh.id}>{wh.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Current Stock</label>
                  <input
                    type="number"
                    value={formData.currentStock ?? 0}
                    onChange={(e) => setFormData({ ...formData, currentStock: Number(e.target.value) })}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Min Stock</label>
                  <input
                    type="number"
                    value={formData.minStock ?? 0}
                    onChange={(e) => setFormData({ ...formData, minStock: Number(e.target.value) })}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Reorder Level</label>
                  <input
                    type="number"
                    value={formData.reorderLevel ?? 0}
                    onChange={(e) => setFormData({ ...formData, reorderLevel: Number(e.target.value) })}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Purchase Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.purchasePrice ?? 0}
                    onChange={(e) => setFormData({ ...formData, purchasePrice: Number(e.target.value) })}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Description & Specs</label>
                <textarea
                  rows={2}
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter burst strength, bursting test specs..."
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                ></textarea>
              </div>

              {rmError && (
                <div className="p-3 mt-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center space-x-2 text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{rmError}</span>
                </div>
              )}
              {rmSuccess && (
                <div className="p-3 mt-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center space-x-2 text-sm">
                  <CheckCircle className="w-4 h-4" />
                  <span>{rmSuccess}</span>
                </div>
              )}

              <div className="pt-4 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className={`px-5 py-2.5 rounded-xl border text-sm font-semibold transition-colors ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'}`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRmSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRmSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>{isRmSubmitting ? 'Saving...' : (isEditMode ? 'Update Raw Material' : 'Save Raw Material')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail / Profile Modal */}
      {isDetailModalOpen && selectedMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
          <div className={`w-full max-w-4xl rounded-3xl shadow-2xl border p-6 sm:p-8 relative ${
            darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <button
              onClick={() => setIsDetailModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-800/50 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-xl font-black">
                  RM
                </div>
                <div>
                  <span className="text-xs font-mono font-bold text-emerald-500">{selectedMaterial.code}</span>
                  <h2 className="text-xl font-bold">{selectedMaterial.name}</h2>
                  <p className="text-xs text-slate-400">{selectedMaterial.category || 'Raw Material'} • Grade: {selectedMaterial.grade || 'Standard'}</p>
                </div>
              </div>

              <div className={`px-4 py-2 rounded-2xl border flex items-center space-x-3 ${
                darkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'
              }`}>
                <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Current Stock</span>
                <span className="text-lg font-black text-emerald-500">{selectedMaterial.currentStock?.toLocaleString()} {selectedMaterial.uom}</span>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 mb-6 font-semibold text-xs sm:text-sm overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveDetailTab('records')}
                className={`pb-3 px-4 transition-colors border-b-2 whitespace-nowrap cursor-pointer ${
                  activeDetailTab === 'records'
                    ? 'border-emerald-500 text-emerald-500 font-bold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Records & Specifications
              </button>
              <button
                type="button"
                onClick={() => setActiveDetailTab('movements')}
                className={`pb-3 px-4 transition-colors border-b-2 flex items-center space-x-1.5 whitespace-nowrap cursor-pointer ${
                  activeDetailTab === 'movements'
                    ? 'border-emerald-500 text-emerald-500 font-bold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Movements ({movementsTotal > 0 ? movementsTotal : 'History'})</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveDetailTab('history');
                  if (selectedMaterial) {
                    onViewHistory('RawMaterial', selectedMaterial.id, selectedMaterial.name);
                  }
                }}
                className={`pb-3 px-4 transition-colors border-b-2 flex items-center space-x-1.5 whitespace-nowrap cursor-pointer ${
                  activeDetailTab === 'history'
                    ? 'border-emerald-500 text-emerald-500 font-bold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <History className="w-4 h-4" />
                <span>Change History</span>
              </button>
            </div>

            {/* TAB 1: RECORDS & SPECIFICATIONS */}
            {activeDetailTab === 'records' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                    <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Current Stock</p>
                    <p className="text-lg font-black mt-1 text-emerald-500">{selectedMaterial.currentStock?.toLocaleString()} {selectedMaterial.uom}</p>
                  </div>
                  <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                    <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Purchase Price</p>
                    <p className="text-lg font-black mt-1">₹{Number(selectedMaterial.purchasePrice || 0).toFixed(2)}</p>
                  </div>
                  <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                    <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">GSM / Thickness</p>
                    <p className="text-lg font-black mt-1">{selectedMaterial.gsm ? `${selectedMaterial.gsm} GSM` : 'N/A'}</p>
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-800">
                    <span className="text-slate-400">Mill Supplier</span>
                    <span className="font-bold">{selectedMaterial.supplier?.supplierName || "No Supplier"}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-800">
                    <span className="text-slate-400">Warehouse Location</span>
                    <span className="font-bold">{selectedMaterial.warehouse?.name || "No Warehouse"}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-800">
                    <span className="text-slate-400">HSN Code</span>
                    <span className="font-mono font-bold">{selectedMaterial.hsnCode || '-'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-800">
                    <span className="text-slate-400">Reorder / Min Level</span>
                    <span className="font-bold">{selectedMaterial.reorderLevel?.toLocaleString()} {selectedMaterial.uom} (Min: {selectedMaterial.minStock?.toLocaleString()})</span>
                  </div>
                </div>

                <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800/30 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Description & Quality Notes</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">{selectedMaterial.description || 'No additional specifications recorded.'}</p>
                </div>
              </div>
            )}

            {/* TAB 2: STOCK MOVEMENTS HISTORY */}
            {activeDetailTab === 'movements' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-300">Stock Movement Ledger for {selectedMaterial.code}</h3>
                  <button
                    type="button"
                    onClick={() => fetchStockMovements(selectedMaterial.id, movementsPage)}
                    disabled={isMovementsLoading}
                    className="px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center space-x-1.5 hover:bg-slate-800 border-slate-700 text-slate-300 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isMovementsLoading ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                </div>

                {isMovementsLoading ? (
                  <div className="p-12 text-center space-y-3">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-500" />
                    <p className="text-xs font-semibold text-slate-400">Loading stock movement history...</p>
                  </div>
                ) : movementsError ? (
                  <div className="p-8 text-center rounded-2xl border border-rose-500/20 bg-rose-500/10 text-rose-400 text-xs space-y-3">
                    <p className="font-bold">{movementsError}</p>
                    <button
                      type="button"
                      onClick={() => fetchStockMovements(selectedMaterial.id, movementsPage)}
                      className="px-4 py-1.5 rounded-lg bg-rose-600 text-white font-bold"
                    >
                      Retry Loading
                    </button>
                  </div>
                ) : movements.length === 0 ? (
                  <div className="p-12 text-center rounded-2xl border border-slate-800 bg-slate-950/40 text-slate-400 space-y-2">
                    <Layers className="w-10 h-10 mx-auto text-slate-600" />
                    <p className="text-sm font-bold text-slate-300">No stock movements found</p>
                    <p className="text-xs text-slate-500">There are no recorded stock receipts, issues, or transfers for this material yet.</p>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-950/50">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-slate-800 bg-slate-900/80 font-bold text-slate-400 uppercase tracking-wider">
                            <th className="p-3">Date & Time</th>
                            <th className="p-3">Type</th>
                            <th className="p-3 text-right">Quantity</th>
                            <th className="p-3">Ref No</th>
                            <th className="p-3">Warehouse / Loc</th>
                            <th className="p-3">User</th>
                            <th className="p-3">Remarks / Reason</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {movements.map((m: any) => {
                            const typeStr = String(m.transactionType || '').toLowerCase();
                            const isIncoming = typeStr.includes('in') || typeStr.includes('qc') || typeStr.includes('receipt') || typeStr.includes('return');
                            const isOutgoing = typeStr.includes('out') || typeStr.includes('issue') || typeStr.includes('sale') || typeStr.includes('dispatch');
                            
                            const qtyVal = Number(m.quantity || 0);
                            const formattedDate = m.createdAt ? new Date(m.createdAt).toLocaleString('en-IN', {
                              dateStyle: 'medium',
                              timeStyle: 'short'
                            }) : `${m.date || ''} ${m.time || ''}`;

                            return (
                              <tr key={m.id} className="hover:bg-slate-800/30 transition-colors">
                                <td className="p-3 text-slate-300 font-mono text-[11px] whitespace-nowrap">
                                  {formattedDate}
                                </td>
                                <td className="p-3">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                                    isIncoming
                                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                      : isOutgoing
                                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                      : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                  }`}>
                                    {m.transactionType}
                                  </span>
                                </td>
                                <td className="p-3 text-right font-mono font-bold whitespace-nowrap">
                                  <span className={isIncoming ? 'text-emerald-400' : isOutgoing ? 'text-rose-400' : 'text-slate-200'}>
                                    {isIncoming ? '+' : isOutgoing ? '-' : ''}{qtyVal.toLocaleString()} {m.uom || selectedMaterial.uom}
                                  </span>
                                </td>
                                <td className="p-3 font-mono text-slate-300 text-[11px]">
                                  {m.referenceNumber || m.transactionNumber || '-'}
                                </td>
                                <td className="p-3 text-slate-300 text-xs">
                                  {m.warehouse?.name || m.warehouseName || 'Main Warehouse'}
                                  {m.destinationWarehouse?.name ? ` → ${m.destinationWarehouse.name}` : ''}
                                </td>
                                <td className="p-3 text-slate-400 text-xs font-medium">
                                  {m.user || 'System'}
                                </td>
                                <td className="p-3 text-slate-400 text-xs max-w-xs truncate">
                                  {m.remarks || m.reason || '-'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    {movementsTotalPages > 1 && (
                      <div className="p-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                        <div>
                          Showing page <span className="font-bold text-white">{movementsPage}</span> of <span className="font-bold text-white">{movementsTotalPages}</span> ({movementsTotal} total movements)
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => setMovementsPage(p => Math.max(1, p - 1))}
                            disabled={movementsPage === 1}
                            className="px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed font-semibold"
                          >
                            Previous
                          </button>
                          <button
                            type="button"
                            onClick={() => setMovementsPage(p => Math.min(movementsTotalPages, p + 1))}
                            disabled={movementsPage >= movementsTotalPages}
                            className="px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed font-semibold"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: CHANGE HISTORY */}
            {activeDetailTab === 'history' && (
              <div className="p-8 text-center space-y-4">
                <History className="w-10 h-10 mx-auto text-emerald-500 animate-pulse" />
                <div>
                  <h3 className="text-base font-bold text-white">System Audit & Change Log</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                    Audit log history for {selectedMaterial.name} ({selectedMaterial.code}) has been fetched.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onViewHistory('RawMaterial', selectedMaterial.id, selectedMaterial.name)}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                >
                  Open Full Audit Inspector
                </button>
              </div>
            )}

            <div className="flex justify-end mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-colors cursor-pointer"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
