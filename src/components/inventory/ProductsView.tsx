import React, { useState } from 'react';
import { BoxesIcon, Search, Plus, Printer, Download, Edit3, Trash2, Eye, X, Save, Filter, AlertTriangle, CheckCircle, History, Loader2 } from 'lucide-react';
import { CategoryItem, SubcategoryItem, Product, Warehouse } from '../../types';

interface ProductsViewProps {
  products: Product[];
  warehouses: Warehouse[];
  categoriesList: CategoryItem[];
  subCategoriesList: SubcategoryItem[];
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  darkMode: boolean;
  selectedProductId?: string | null;
  onSelectProduct?: (id: string) => void;
  onViewHistory: (entity: string, entityId: string, entityName?: string) => void;
  isLoading?: boolean;
}

export const ProductsView: React.FC<ProductsViewProps> = ({
  products,
  warehouses,
  categoriesList,
  subCategoriesList,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  darkMode,
  selectedProductId,
  onSelectProduct,
  onViewHistory,
  isLoading = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [subcategoryFilter, setSubcategoryFilter] = useState('All');
  const [warehouseFilter, setWarehouseFilter] = useState('All');
  const [stockStatusFilter, setStockStatusFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [prodError, setProdError] = useState<string | null>(null);
  const [prodSuccess, setProdSuccess] = useState<string | null>(null);
  const [isProdSubmitting, setIsProdSubmitting] = useState(false);

  React.useEffect(() => {
    if (selectedProductId) {
      const prod = products.find(p => p.id === selectedProductId);
      if (prod) {
        setSelectedProduct(prod);
        setFormData({ ...prod });
        setIsEditMode(true);
        setIsAddModalOpen(true);
      }
    }
  }, [selectedProductId, products]);

  const [formData, setFormData] = useState<Partial<Product>>({
    code: '',
    name: '',
    category: '',
    subCategory: '',
    boxType: 'RSC (Regular Slotted Carton)',
    dimensions: '400 x 300 x 250 mm',
    gsm: 250,
    unit: 'Pcs',
    uom: 'NOS',
    hsnCode: '48191010',
    costPrice: 35.00,
    sellingPrice: 48.00,
    warehouse: warehouses[4]?.name || '',
    availableStock: 5000,
    status: 'Active',
    specifications: '3-ply C-flute corrugated carton.'
  });

  const activeCategories = categoriesList.filter(c => c.status === 'Active' && c.type === 'Finished Product');
  const categories = ['All', ...activeCategories.map(c => c.name)];
  
  const selectedCategoryItem = categoriesList.find(c => c.name === categoryFilter);
  const subCategories = selectedCategoryItem 
    ? ['All', ...subCategoriesList.filter(s => s.parentCategoryId === selectedCategoryItem.id).map(s => s.name)]
    : ['All'];

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

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.boxType.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
    const matchesSubcategory = subcategoryFilter === 'All' || p.subCategory === subcategoryFilter;
    const matchesWarehouse = warehouseFilter === 'All' || 
      (typeof p.warehouse === 'object' && p.warehouse !== null ? (p.warehouse as any).name === warehouseFilter : p.warehouse === warehouseFilter);
    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
    
    let matchesStock = true;
    if (stockStatusFilter !== 'All') {
      const isLow = p.availableStock < 1000;
      if (stockStatusFilter === 'Healthy') matchesStock = !isLow;
      else if (stockStatusFilter === 'Low Stock') matchesStock = isLow;
    }

    return matchesSearch && matchesCategory && matchesSubcategory && matchesWarehouse && matchesStatus && matchesStock;
  });

  const clearFilters = () => {
    setSearchQuery('');
    setCategoryFilter('All');
    setSubcategoryFilter('All');
    setWarehouseFilter('All');
    setStockStatusFilter('All');
    setStatusFilter('All');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProdError(null);
    setProdSuccess(null);
    setIsProdSubmitting(true);

    try {
      if (isEditMode && selectedProduct) {
        const payload = {
          code: formData.code,
          name: formData.name,
          category: formData.category,
          subCategory: formData.subCategory,
          boxType: formData.boxType,
          dimensions: formData.dimensions,
          gsm: Number(formData.gsm) || 0,
          unit: formData.unit || 'Pcs',
          uom: formData.uom || 'NOS',
          hsnCode: formData.hsnCode,
          costPrice: Number(formData.costPrice) || 0,
          sellingPrice: Number(formData.sellingPrice) || 0,
          warehouse: formData.warehouse || '',
          availableStock: Number(formData.availableStock) || 0,
          status: formData.status || 'Active',
          specifications: formData.specifications || ''
        };
        const res = await fetch(`/api/products?id=${selectedProduct.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to update product');
        }
        setProdSuccess('Product updated successfully!');
        const updated: Product = {
          ...selectedProduct,
          ...data.data,
          warehouse: selectedProduct.warehouse
        };
        onUpdateProduct(updated);
      } else {
        const payload = {
          code: formData.code || `BOX-${Math.floor(1000 + Math.random() * 9000)}`,
          name: formData.name || 'Finished Carton',
          category: formData.category || (activeCategories[0]?.name || ''),
          subCategory: formData.subCategory || '',
          boxType: formData.boxType || 'RSC (Regular Slotted Carton)',
          dimensions: formData.dimensions || '400 x 300 x 250 mm',
          gsm: Number(formData.gsm) || 200,
          unit: formData.unit || 'Pcs',
          uom: formData.uom || 'NOS',
          hsnCode: formData.hsnCode || '48191010',
          costPrice: Number(formData.costPrice) || 30.00,
          sellingPrice: Number(formData.sellingPrice) || 45.00,
          warehouse: formData.warehouse || (warehouses[4]?.name || ''),
          availableStock: Number(formData.availableStock) || 1000,
          status: formData.status || 'Active',
          specifications: formData.specifications || ''
        };
        const res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to create product');
        }
        setProdSuccess('Product created successfully!');
        const created: Product = {
          id: data.data.id || `PRD-${Date.now()}`,
          code: data.data.code || payload.code,
          name: data.data.name || payload.name,
          category: data.data.category || payload.category,
          subCategory: data.data.subCategory || payload.subCategory,
          boxType: data.data.boxType || payload.boxType,
          dimensions: data.data.dimensions || payload.dimensions,
          gsm: data.data.gsm ?? payload.gsm,
          unit: data.data.unit || payload.unit,
          uom: data.data.uom || payload.uom,
          hsnCode: data.data.hsnCode || payload.hsnCode,
          costPrice: data.data.costPrice ?? payload.costPrice,
          sellingPrice: data.data.sellingPrice ?? payload.sellingPrice,
          warehouse: warehouses[4]?.name || 'Finished Goods Bay A',
          availableStock: data.data.availableStock ?? payload.availableStock,
          status: data.data.status || payload.status,
          specifications: data.data.specifications || payload.specifications
        };
        onAddProduct(created);
      }
      setTimeout(() => {
        setIsAddModalOpen(false);
        setIsEditMode(false);
        setSelectedProduct(null);
        setProdSuccess(null);
        setIsProdSubmitting(false);
      }, 1000);
    } catch (err: any) {
      console.error(err);
      setProdError(err.message || 'An error occurred');
      setIsProdSubmitting(false);
    }
  };

  const openAddModal = () => {
    setIsEditMode(false);
    const activeCats = categoriesList.filter(c => c.status === 'Active' && c.type === 'Finished Product');
    const firstCat = activeCats[0]?.name || '';
    const firstCatItem = activeCats[0];
    const relatedSubs = firstCatItem 
      ? subCategoriesList.filter(s => s.parentCategoryId === firstCatItem.id && s.status === 'Active')
      : [];
    const firstSub = relatedSubs[0]?.name || '';

    setFormData({
      code: `BOX-${Math.floor(1000 + Math.random() * 9000)}`,
      name: '',
      category: firstCat,
      subCategory: firstSub,
      boxType: 'RSC (Regular Slotted Carton)',
      dimensions: '400 x 300 x 250 mm',
      gsm: 250,
      unit: 'Pcs',
      uom: 'NOS',
      hsnCode: '48191010',
      costPrice: 35.00,
      sellingPrice: 48.00,
      warehouse: warehouses[4]?.name || '',
      availableStock: 1000,
      status: 'Active',
      specifications: '3-ply C-flute corrugated carton.'
    });
    setIsAddModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Products Master (Finished Goods)
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Maintain manufactured corrugated boxes, die-cut pizza boxes, folding cartons, and plain sheets.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-600/20 flex items-center space-x-2 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Finished Product</span>
        </button>
      </div>

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
              placeholder="Search finished goods by code, name, box type..."
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

      <div className={`rounded-2xl border overflow-hidden ${darkMode ? 'bg-slate-900/85 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`border-b text-xs font-bold uppercase tracking-wider ${
                darkMode ? 'bg-slate-800/80 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}>
                <th className={`p-4 border-r last:border-r-0 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>Product Code / Name</th>
                <th className={`p-4 border-r last:border-r-0 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>Box Type / Dimensions</th>
                <th className={`p-4 border-r last:border-r-0 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>GSM</th>
                <th className={`p-4 border-r last:border-r-0 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>UOM</th>
                <th className={`p-4 border-r last:border-r-0 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>Warehouse</th>
                <th className={`p-4 border-r last:border-r-0 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>Available Stock</th>
                <th className={`p-4 border-r last:border-r-0 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>Cost vs Selling (₹)</th>
                <th className={`p-4 border-r last:border-r-0 ${darkMode ? 'border-slate-800' : 'border-slate-200'} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <Loader2 className="w-8 h-8 animate-spin text-teal-500 mx-auto" />
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        Loading products data, please wait...
                      </p>
                    </div>
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No finished products found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredProducts.map(p => (
                <tr key={p.id} className={`transition-colors ${darkMode ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50/80'}`}>
                  <td className={`p-4 border-r last:border-r-0 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                    <div className="font-bold text-xs font-mono text-teal-400">{p.code}</div>
                    <div className={`font-semibold text-sm mt-0.5 ${darkMode ? 'text-white' : 'text-slate-900'}`}>{p.name}</div>
                  </td>
                  <td className={`p-4 border-r last:border-r-0 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                    <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-teal-500/10 text-teal-400">
                      {p.boxType}
                    </span>
                    <div className="text-xs text-slate-400 mt-1">{p.dimensions}</div>
                  </td>
                  <td className={`p-4 border-r last:border-r-0 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                    <div className="font-bold text-sm">{p.gsm} GSM</div>
                  </td>
                  <td className={`p-4 border-r last:border-r-0 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                    <span className={`px-2 py-1 rounded-lg text-xs font-bold ${darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'}`}>
                      {p.uom || 'NOS'}
                    </span>
                  </td>
                  <td className={`p-4 border-r last:border-r-0 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                    <div className="text-xs font-medium">
                      {typeof p.warehouse === 'object' && p.warehouse !== null ? (p.warehouse as any).name : (p.warehouse || 'N/A')}
                    </div>
                  </td>
                  <td className={`p-4 border-r last:border-r-0 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                    <div className="font-black text-emerald-500 text-sm">{p.availableStock.toLocaleString()}</div>
                  </td>
                  <td className={`p-4 border-r last:border-r-0 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                    <div className="font-mono text-xs font-bold">Cost: ₹{p.costPrice.toFixed(2)}</div>
                    <div className="font-mono text-xs text-emerald-400 font-bold">Sell: ₹{p.sellingPrice.toFixed(2)}</div>
                  </td>
                  <td className={`p-4 border-r last:border-r-0 ${darkMode ? 'border-slate-800' : 'border-slate-200'} text-right`}>
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => onViewHistory('Product', p.id, `${p.code} - ${p.name}`)}
                        className={`p-1.5 rounded-lg border transition-colors ${darkMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300' : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-600'}`}
                        title="View Change History"
                      >
                        <History className="w-4 h-4" />
                      </button>
                      {onSelectProduct && (
                        <button
                          onClick={() => onSelectProduct(p.id)}
                          className={`p-1.5 rounded-lg border transition-colors ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                          title="View Product Detail Page"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setSelectedProduct(p);
                          setFormData(p);
                          setIsEditMode(true);
                          setIsAddModalOpen(true);
                        }}
                        className={`p-1.5 rounded-lg border transition-colors ${darkMode ? 'bg-slate-800 border-slate-700 text-emerald-400 hover:bg-slate-700' : 'bg-white border-slate-200 text-emerald-600 hover:bg-slate-100'}`}
                        title="Edit Product"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteProduct(p.id)}
                        className={`p-1.5 rounded-lg border transition-colors ${darkMode ? 'bg-slate-800 border-slate-700 text-rose-400 hover:bg-slate-700' : 'bg-white border-slate-200 text-rose-600 hover:bg-slate-100'}`}
                        title="Delete Product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
          <div className={`w-full max-w-2xl rounded-3xl shadow-2xl border p-8 relative ${
            darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-800/50 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold mb-6">{isEditMode ? 'Edit Finished Product' : 'New Finished Product'}</h2>

            {prodError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{prodError}</span>
              </div>
            )}
            {prodSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{prodSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Product Code</label>
                  <input
                    type="text"
                    required
                    value={formData.code || ''}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Product Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Box Type</label>
                  <select
                    value={formData.boxType || 'RSC (Regular Slotted Carton)'}
                    onChange={(e) => setFormData({ ...formData, boxType: e.target.value as any })}
                    className={`w-full px-3 py-2.5 rounded-xl border text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                  >
                    <option value="RSC (Regular Slotted Carton)">RSC (Regular Slotted Carton)</option>
                    <option value="HSC">HSC</option>
                    <option value="Die-Cut">Die-Cut</option>
                    <option value="Partition">Partition</option>
                    <option value="Sheet Board">Sheet Board</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Unit of Measure (UOM)</label>
                  <select
                    value={formData.uom || 'NOS'}
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
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Dimensions</label>
                  <input
                    type="text"
                    value={formData.dimensions || ''}
                    onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
                    placeholder="e.g. 400 x 300 x 250 mm"
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
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Warehouse</label>
                  <select
                    value={formData.warehouse || ''}
                    onChange={(e) => setFormData({ ...formData, warehouse: e.target.value })}
                    className={`w-full px-3 py-2.5 rounded-xl border text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                  >
                    <option value="" disabled>Select Warehouse</option>
                    {warehouses.map(wh => (
                      <option key={wh.id} value={wh.name}>{wh.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Cost Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.costPrice ?? 0}
                    onChange={(e) => setFormData({ ...formData, costPrice: Number(e.target.value) })}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Selling Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.sellingPrice ?? 0}
                    onChange={(e) => setFormData({ ...formData, sellingPrice: Number(e.target.value) })}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Available Stock</label>
                  <input
                    type="number"
                    value={formData.availableStock ?? 0}
                    onChange={(e) => setFormData({ ...formData, availableStock: Number(e.target.value) })}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Specifications</label>
                <textarea
                  rows={2}
                  value={formData.specifications || ''}
                  onChange={(e) => setFormData({ ...formData, specifications: e.target.value })}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                ></textarea>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProdSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 flex items-center space-x-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isProdSubmitting ? 'Saving...' : 'Save Product'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
