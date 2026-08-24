import React, { useState, useEffect } from 'react';
import { 
  Layers, Plus, CheckCircle, X, Save, Search, Trash2, Edit2, Eye, 
  ArrowUpDown, ChevronLeft, ChevronRight, ListFilter, AlertTriangle, RefreshCw, Loader2
} from 'lucide-react';
import { CategoryItem, SubcategoryItem } from '../../types';

interface CategoriesViewProps {
  categories: CategoryItem[];
  onAddCategory: (category: CategoryItem) => void;
  onUpdateCategory: (category: CategoryItem) => void;
  onDeleteCategory: (id: string) => void;
  subCategories: SubcategoryItem[];
  onAddSubcategory: (sub: SubcategoryItem) => void;
  onUpdateSubcategory: (sub: SubcategoryItem) => void;
  onDeleteSubcategory: (id: string) => void;
  darkMode: boolean;
  selectedCategoryId?: string | null;
  selectedSubcategoryId?: string | null;
  isLoading: boolean;
}

export const CategoriesView: React.FC<CategoriesViewProps> = ({
  categories,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  subCategories,
  onAddSubcategory,
  onUpdateSubcategory,
  onDeleteSubcategory,
  darkMode,
  selectedCategoryId,
  selectedSubcategoryId,
  isLoading
}) => {
  const [activeTab, setActiveTab] = useState<'categories' | 'subcategories'>('categories');

  React.useEffect(() => {
    if (selectedCategoryId) {
      setActiveTab('categories');
      const cat = categories.find(c => c.id === selectedCategoryId);
      if (cat) {
        setSelectedCat(cat);
        setCatModalMode('edit');
        setCatFormData({ code: cat.code, name: cat.name, type: cat.type, description: cat.description, status: cat.status });
        setIsCatModalOpen(true);
      }
    }
  }, [selectedCategoryId, categories]);

  React.useEffect(() => {
    if (selectedSubcategoryId) {
      setActiveTab('subcategories');
      const sub = subCategories.find(s => s.id === selectedSubcategoryId);
      if (sub) {
        setSelectedSub(sub);
        setSubModalMode('edit');
        setSubFormData({ parentCategoryId: sub.parentCategoryId, code: sub.code, name: sub.name, description: sub.description, status: sub.status });
        setIsSubModalOpen(true);
      }
    }
  }, [selectedSubcategoryId, subCategories]);

  // --- Category Page State ---
  const [catSearchQuery, setCatSearchQuery] = useState('');
  const [catStatusFilter, setCatStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [catSortField, setCatSortField] = useState<keyof CategoryItem>('code');
  const [catSortOrder, setCatSortOrder] = useState<'asc' | 'desc'>('asc');
  const [catCurrentPage, setCatCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Category Modal State
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [catModalMode, setCatModalMode] = useState<'add' | 'edit' | 'view'>('add');
  const [selectedCat, setSelectedCat] = useState<CategoryItem | null>(null);
  const [catError, setCatError] = useState<string | null>(null);
  const [catSuccess, setCatSuccess] = useState<string | null>(null);
  const [isCatSubmitting, setIsCatSubmitting] = useState(false);
  const [catFormData, setCatFormData] = useState({
    code: '',
    name: '',
    type: 'Raw Material' as 'Raw Material' | 'Finished Product' | 'Material Group',
    description: '',
    status: 'Active' as 'Active' | 'Inactive'
  });

  // --- Subcategory Page State ---
  const [subSearchQuery, setSubSearchQuery] = useState('');
  const [subStatusFilter, setSubStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [subParentFilter, setSubParentFilter] = useState<string>('All');
  const [subSortField, setSubSortField] = useState<keyof SubcategoryItem>('code');
  const [subSortOrder, setSubSortOrder] = useState<'asc' | 'desc'>('asc');
  const [subCurrentPage, setSubCurrentPage] = useState(1);

  // Subcategory Modal State
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [subModalMode, setSubModalMode] = useState<'add' | 'edit' | 'view'>('add');
  const [selectedSub, setSelectedSub] = useState<SubcategoryItem | null>(null);
  const [subFormData, setSubFormData] = useState({
    parentCategoryId: '',
    code: '',
    name: '',
    description: '',
    status: 'Active' as 'Active' | 'Inactive'
  });

  const [subError, setSubError] = useState<string | null>(null);
  const [subSuccess, setSubSuccess] = useState<string | null>(null);
  const [isSubSubmitting, setIsSubSubmitting] = useState(false);

  // Delete Confirm Modal State
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    type: 'category' | 'subcategory';
    id: string;
    name: string;
  }>({
    isOpen: false,
    type: 'category',
    id: '',
    name: ''
  });

  // --- Auto Generate Code Helpers ---
  const generateCatCode = () => {
    return `CAT-${Math.floor(100 + Math.random() * 900)}`;
  };

  const generateSubCode = (parentCatId: string) => {
    const parent = categories.find(c => c.id === parentCatId);
    const prefix = parent ? (parent.code || 'SUB').replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase() : 'SUB';
    return `SUB-${prefix}-${Math.floor(100 + Math.random() * 900)}`;
  };

  // Trigger subcategory code update on parent ID change in Add mode
  useEffect(() => {
    if (subModalMode === 'add' && subFormData.parentCategoryId) {
      setSubFormData(prev => ({
        ...prev,
        code: generateSubCode(prev.parentCategoryId)
      }));
    }
  }, [subFormData.parentCategoryId, subModalMode]);

  // --- Handlers for Category Operations ---
  const openCatModal = (mode: 'add' | 'edit' | 'view', category?: CategoryItem) => {
    setCatModalMode(mode);
    setCatError(null);
    setCatSuccess(null);
    if (mode === 'add') {
      setSelectedCat(null);
      setCatFormData({
        code: generateCatCode(),
        name: '',
        type: 'Raw Material',
        description: '',
        status: 'Active'
      });
    } else if (category) {
      setSelectedCat(category);
      setCatFormData({
        code: category.code,
        name: category.name,
        type: category.type,
        description: category.description,
        status: category.status
      });
    }
    setIsCatModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catFormData.name || !catFormData.code) return;
    setCatError(null);
    setCatSuccess(null);
    setIsCatSubmitting(true);

    try {
      if (catModalMode === 'add') {
        const payload = {
          code: catFormData.code,
          name: catFormData.name,
          type: catFormData.type,
          description: catFormData.description || '',
          status: catFormData.status
        };
        const res = await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to create category');
        }
        setCatSuccess('Category created successfully!');
        const createdCat: CategoryItem = {
          id: data.data.id || `CAT-${Date.now()}`,
          code: data.data.code || catFormData.code,
          name: data.data.name || catFormData.name,
          type: data.data.type || catFormData.type,
          description: data.data.description || catFormData.description,
          itemsCount: data.data.itemsCount || 0,
          status: data.data.status || catFormData.status,
          createdAt: data.data.createdAt ? data.data.createdAt.replace('T', ' ').substring(0, 16) : new Date().toISOString().replace('T', ' ').substring(0, 16)
        };
        onAddCategory(createdCat);
      } else if (catModalMode === 'edit' && selectedCat) {
        const payload = {
          code: catFormData.code,
          name: catFormData.name,
          type: catFormData.type,
          description: catFormData.description,
          status: catFormData.status
        };
        const res = await fetch(`/api/categories?id=${selectedCat.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to update category');
        }
        setCatSuccess('Category updated successfully!');
        const updatedCat: CategoryItem = {
          ...selectedCat,
          code: data.data.code || catFormData.code,
          name: data.data.name || catFormData.name,
          type: data.data.type || catFormData.type,
          description: data.data.description || catFormData.description,
          status: data.data.status || catFormData.status
        };
        onUpdateCategory(updatedCat);
      }
      setTimeout(() => {
        setIsCatModalOpen(false);
        setIsCatSubmitting(false);
      }, 500);
    } catch (err: any) {
      console.error(err);
      setCatError(err.message || 'An error occurred');
      setIsCatSubmitting(false);
    }
  };

  // --- Handlers for Subcategory Operations ---
  const openSubModal = (mode: 'add' | 'edit' | 'view', sub?: SubcategoryItem) => {
    setSubModalMode(mode);
    setSubError(null);
    setSubSuccess(null);
    if (mode === 'add') {
      setSelectedSub(null);
      const firstActiveCat = categories.find(c => c.status === 'Active') || categories[0];
      const initialParentId = firstActiveCat ? firstActiveCat.id : '';
      setSubFormData({
        parentCategoryId: initialParentId,
        code: initialParentId ? generateSubCode(initialParentId) : '',
        name: '',
        description: '',
        status: 'Active'
      });
    } else if (sub) {
      setSelectedSub(sub);
      setSubFormData({
        parentCategoryId: sub.parentCategoryId,
        code: sub.code,
        name: sub.name,
        description: sub.description,
        status: sub.status
      });
    }
    setIsSubModalOpen(true);
  };

  const handleSaveSubcategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subFormData.name || !subFormData.code || !subFormData.parentCategoryId) return;

    setSubError(null);
    setSubSuccess(null);
    setIsSubSubmitting(true);

    try {
      if (subModalMode === 'add') {
        const payload = {
          code: subFormData.code,
          name: subFormData.name,
          categoryId: subFormData.parentCategoryId,
          description: subFormData.description || '',
          status: subFormData.status
        };

        const res = await fetch('/api/subcategories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to create subcategory');
        }

        setSubSuccess('Subcategory created successfully!');
        
        const newSub: SubcategoryItem = {
          id: data.data.id,
          code: data.data.code,
          name: data.data.name,
          parentCategoryId: data.data.categoryId,
          description: data.data.description || '',
          status: data.data.status || 'Active',
          createdAt: data.data.createdAt ? data.data.createdAt.replace('T', ' ').substring(0, 16) : new Date().toISOString().replace('T', ' ').substring(0, 16)
        };
        onAddSubcategory(newSub);
        
        // Brief delay before closing modal on success
        setTimeout(() => setIsSubModalOpen(false), 1500);
      } else if (subModalMode === 'edit' && selectedSub) {
        const payload = {
          code: subFormData.code,
          name: subFormData.name,
          categoryId: subFormData.parentCategoryId,
          description: subFormData.description,
          status: subFormData.status
        };

        const res = await fetch(`/api/subcategories?id=${selectedSub.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to update subcategory');
        }

        setSubSuccess('Subcategory updated successfully!');

        const updatedSub: SubcategoryItem = {
          ...selectedSub,
          code: data.data.code,
          name: data.data.name,
          parentCategoryId: data.data.categoryId,
          description: data.data.description,
          status: data.data.status
        };
        onUpdateSubcategory(updatedSub);
        
        setTimeout(() => setIsSubModalOpen(false), 1500);
      }
    } catch (err: any) {
      console.error('Error saving subcategory:', err);
      setSubError(err.message || 'An error occurred while saving.');
    } finally {
      setIsSubSubmitting(false);
    }
  };

  // --- Sorting & Filtering Logic ---

  // 1. Categories
  const handleCatSort = (field: keyof CategoryItem) => {
    if (catSortField === field) {
      setCatSortOrder(catSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setCatSortField(field);
      setCatSortOrder('asc');
    }
  };

  const getSubcategoryCount = (catId: string) => {
    return subCategories.filter(s => s.parentCategoryId === catId).length;
  };

  const filteredCategories = categories
    .filter(cat => {
      const matchesSearch = 
        cat.name.toLowerCase().includes(catSearchQuery.toLowerCase()) ||
        cat.code.toLowerCase().includes(catSearchQuery.toLowerCase()) ||
        cat.description.toLowerCase().includes(catSearchQuery.toLowerCase());
      
      const matchesStatus = catStatusFilter === 'All' || cat.status === catStatusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (catSortField === 'itemsCount') {
        comparison = a.itemsCount - b.itemsCount;
      } else if (catSortField === 'createdAt') {
        const dateA = a.createdAt || '';
        const dateB = b.createdAt || '';
        comparison = dateA.localeCompare(dateB);
      } else {
        const valA = String(a[catSortField] || '').toLowerCase();
        const valB = String(b[catSortField] || '').toLowerCase();
        comparison = valA.localeCompare(valB);
      }
      return catSortOrder === 'asc' ? comparison : -comparison;
    });

  // Categories Pagination
  const catTotalPages = Math.ceil(filteredCategories.length / itemsPerPage);
  const catPaginated = filteredCategories.slice(
    (catCurrentPage - 1) * itemsPerPage,
    catCurrentPage * itemsPerPage
  );

  // 2. Subcategories
  const handleSubSort = (field: keyof SubcategoryItem) => {
    if (subSortField === field) {
      setSubSortOrder(subSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSubSortField(field);
      setSubSortOrder('asc');
    }
  };

  const filteredSubcategories = subCategories
    .filter(sub => {
      const matchesSearch = 
        sub.name.toLowerCase().includes(subSearchQuery.toLowerCase()) ||
        sub.code.toLowerCase().includes(subSearchQuery.toLowerCase()) ||
        sub.description.toLowerCase().includes(subSearchQuery.toLowerCase());
      
      const matchesStatus = subStatusFilter === 'All' || sub.status === subStatusFilter;
      const matchesParent = subParentFilter === 'All' || sub.parentCategoryId === subParentFilter;
      return matchesSearch && matchesStatus && matchesParent;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (subSortField === 'parentCategoryId') {
        const nameA = categories.find(c => c.id === a.parentCategoryId)?.name || '';
        const nameB = categories.find(c => c.id === b.parentCategoryId)?.name || '';
        comparison = nameA.localeCompare(nameB);
      } else if (subSortField === 'createdAt') {
        comparison = a.createdAt.localeCompare(b.createdAt);
      } else {
        const valA = String(a[subSortField] || '').toLowerCase();
        const valB = String(b[subSortField] || '').toLowerCase();
        comparison = valA.localeCompare(valB);
      }
      return subSortOrder === 'asc' ? comparison : -comparison;
    });

  // Subcategories Pagination
  const subTotalPages = Math.ceil(filteredSubcategories.length / itemsPerPage);
  const subPaginated = filteredSubcategories.slice(
    (subCurrentPage - 1) * itemsPerPage,
    subCurrentPage * itemsPerPage
  );

  // Delete Action Trigger
  const triggerDelete = (type: 'category' | 'subcategory', id: string, name: string) => {
    setDeleteConfirm({
      isOpen: true,
      type,
      id,
      name
    });
  };

  const executeDelete = async () => {
    try {
      if (deleteConfirm.type === 'category') {
        const res = await fetch(`/api/categories?id=${deleteConfirm.id}`, { method: 'DELETE' });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || 'Failed to delete category');
        onDeleteCategory(deleteConfirm.id);
      } else {
        const res = await fetch(`/api/subcategories?id=${deleteConfirm.id}`, { method: 'DELETE' });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || 'Failed to delete subcategory');
        onDeleteSubcategory(deleteConfirm.id);
      }
    } catch (err: any) {
      console.error('Delete error:', err);
      alert(err.message);
    } finally {
      setDeleteConfirm({ isOpen: false, type: 'category', id: '', name: '' });
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Title block */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Product Categories & Subcategories
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Create hierarchy groupings and classification rules for raw materials and finished goods.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {activeTab === 'categories' ? (
            <button
              onClick={() => openCatModal('add')}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 flex items-center space-x-2 transition-all"
              id="add-category-btn"
            >
              <Plus className="w-4 h-4" />
              <span>Add Category</span>
            </button>
          ) : (
            <button
              onClick={() => openSubModal('add')}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 flex items-center space-x-2 transition-all"
              id="add-subcategory-btn"
            >
              <Plus className="w-4 h-4" />
              <span>Add Subcategory</span>
            </button>
          )}
        </div>
      </div>

      {/* Corporate Tab Selection */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-6">
        <button
          onClick={() => setActiveTab('categories')}
          className={`pb-4 text-sm font-semibold relative transition-all ${
            activeTab === 'categories'
              ? 'text-emerald-500 font-extrabold'
              : 'text-slate-400 hover:text-slate-300'
          }`}
          id="tab-categories"
        >
          <span className="flex items-center space-x-2">
            <Layers className="w-4 h-4" />
            <span>Categories ({categories.length})</span>
          </span>
          {activeTab === 'categories' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('subcategories')}
          className={`pb-4 text-sm font-semibold relative transition-all ${
            activeTab === 'subcategories'
              ? 'text-emerald-500 font-extrabold'
              : 'text-slate-400 hover:text-slate-300'
          }`}
          id="tab-subcategories"
        >
          <span className="flex items-center space-x-2">
            <Layers className="w-4 h-4" />
            <span>Subcategories ({subCategories.length})</span>
          </span>
          {activeTab === 'subcategories' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-full" />
          )}
        </button>
      </div>

      {/* TAB 1: CATEGORIES LISTING */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          {/* Filter row */}
          <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
            darkMode ? 'bg-slate-900/85 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="relative w-full sm:w-96">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={catSearchQuery}
                onChange={(e) => {
                  setCatSearchQuery(e.target.value);
                  setCatCurrentPage(1);
                }}
                placeholder="Search categories by code, name, description..."
                className={`w-full pl-10 pr-4 py-2 rounded-xl border text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                  darkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'
                }`}
                id="cat-search-input"
              />
            </div>
            <div className="flex items-center space-x-3 self-end sm:self-auto">
              <span className="text-xs font-semibold text-slate-400 flex items-center space-x-1.5">
                <ListFilter className="w-3.5 h-3.5" />
                <span>Status:</span>
              </span>
              <select
                value={catStatusFilter}
                onChange={(e) => {
                  setCatStatusFilter(e.target.value as any);
                  setCatCurrentPage(1);
                }}
                className={`px-3.5 py-1.5 rounded-lg border text-xs focus:outline-none ${
                  darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
                id="cat-status-filter"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active Only</option>
                <option value="Inactive">Inactive Only</option>
              </select>
            </div>
          </div>

          {/* Table container */}
          <div className={`rounded-2xl border overflow-hidden ${darkMode ? 'bg-slate-900/85 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse" id="categories-table">
                <thead>
                  <tr className={`border-b text-xs font-bold uppercase tracking-wider ${
                    darkMode ? 'bg-slate-800/80 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}>
                    <th 
                      onClick={() => handleCatSort('code')}
                      className={`p-4 border-r last:border-r-0 cursor-pointer hover:bg-slate-800/35 transition-colors ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Category Code</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th 
                      onClick={() => handleCatSort('name')}
                      className={`p-4 border-r last:border-r-0 cursor-pointer hover:bg-slate-800/35 transition-colors ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Category Name</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className={`p-4 border-r last:border-r-0 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>Description</th>
                    <th className={`p-4 border-r last:border-r-0 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>Subcategories</th>
                    <th 
                      onClick={() => handleCatSort('status')}
                      className={`p-4 border-r last:border-r-0 cursor-pointer hover:bg-slate-800/35 transition-colors ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Status</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th 
                      onClick={() => handleCatSort('createdAt')}
                      className={`p-4 border-r last:border-r-0 cursor-pointer hover:bg-slate-800/35 transition-colors ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Created Date</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className={`p-4 border-r last:border-r-0 text-right ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="p-16 text-center">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-500" />
                        <p className="text-xs font-semibold text-slate-500 mt-3">Loading categories data, please wait...</p>
                      </td>
                    </tr>
                  ) : catPaginated.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        No categories found matching your filter criteria.
                      </td>
                    </tr>
                  ) : (
                    catPaginated.map(cat => (
                      <tr key={cat.id} className={`transition-colors ${darkMode ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50/80'}`}>
                        <td className={`p-4 border-r last:border-r-0 font-mono font-bold text-xs text-teal-400 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                          {cat.code}
                        </td>
                        <td className={`p-4 border-r last:border-r-0 font-semibold ${darkMode ? 'border-slate-800 text-white' : 'border-slate-200 text-slate-900'}`}>
                          {cat.name}
                        </td>
                        <td className={`p-4 border-r last:border-r-0 text-xs text-slate-400 max-w-xs truncate ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                          {cat.description}
                        </td>
                        <td className={`p-4 border-r last:border-r-0 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                            getSubcategoryCount(cat.id) > 0 
                              ? 'bg-emerald-500/10 text-emerald-400' 
                              : 'bg-slate-500/10 text-slate-400'
                          }`}>
                            {getSubcategoryCount(cat.id)} Sub-categories
                          </span>
                        </td>
                        <td className={`p-4 border-r last:border-r-0 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                            cat.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${cat.status === 'Active' ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                            {cat.status}
                          </span>
                        </td>
                        <td className={`p-4 border-r last:border-r-0 text-xs text-slate-400 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                          {cat.createdAt || '2026-08-01 10:00'}
                        </td>
                        <td className={`p-4 border-r last:border-r-0 text-right space-x-1.5 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                          <button
                            onClick={() => openCatModal('view', cat)}
                            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openCatModal('edit', cat)}
                            className="p-1.5 rounded-lg hover:bg-slate-800 text-amber-500 hover:text-amber-400 transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => triggerDelete('category', cat.id, cat.name)}
                            className="p-1.5 rounded-lg hover:bg-slate-800 text-rose-500 hover:text-rose-400 transition-colors"
                            title="Delete"
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

            {/* Pagination block */}
            {catTotalPages > 1 && (
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <div>
                  Showing <span className="font-bold text-white">{(catCurrentPage - 1) * itemsPerPage + 1}</span> to{' '}
                  <span className="font-bold text-white">
                    {Math.min(catCurrentPage * itemsPerPage, filteredCategories.length)}
                  </span>{' '}
                  of <span className="font-bold text-white">{filteredCategories.length}</span> categories
                </div>
                <div className="flex space-x-1">
                  <button
                    disabled={catCurrentPage === 1}
                    onClick={() => setCatCurrentPage(p => Math.max(1, p - 1))}
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-400 disabled:opacity-30 hover:text-white"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-3 py-1.5 font-semibold bg-slate-800/50 rounded-lg border border-slate-700/60 text-emerald-400">
                    {catCurrentPage} / {catTotalPages}
                  </span>
                  <button
                    disabled={catCurrentPage === catTotalPages}
                    onClick={() => setCatCurrentPage(p => Math.min(catTotalPages, p + 1))}
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-400 disabled:opacity-30 hover:text-white"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: SUBCATEGORIES LISTING */}
      {activeTab === 'subcategories' && (
        <div className="space-y-4">
          {/* Filters row */}
          <div className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
            darkMode ? 'bg-slate-900/85 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="relative w-full md:w-96">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={subSearchQuery}
                onChange={(e) => {
                  setSubSearchQuery(e.target.value);
                  setSubCurrentPage(1);
                }}
                placeholder="Search subcategories by code, name, description..."
                className={`w-full pl-10 pr-4 py-2 rounded-xl border text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                  darkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'
                }`}
                id="sub-search-input"
              />
            </div>
            <div className="flex flex-wrap items-center gap-4">
              {/* Parent Category Filter */}
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold text-slate-400 flex items-center space-x-1.5">
                  <ListFilter className="w-3.5 h-3.5 text-cyan-500" />
                  <span>Category:</span>
                </span>
                <select
                  value={subParentFilter}
                  onChange={(e) => {
                    setSubParentFilter(e.target.value);
                    setSubCurrentPage(1);
                  }}
                  className={`px-3.5 py-1.5 rounded-lg border text-xs focus:outline-none ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                  id="sub-category-filter"
                >
                  <option value="All">All Categories</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold text-slate-400 flex items-center space-x-1.5">
                  <ListFilter className="w-3.5 h-3.5 text-amber-500" />
                  <span>Status:</span>
                </span>
                <select
                  value={subStatusFilter}
                  onChange={(e) => {
                    setSubStatusFilter(e.target.value as any);
                    setSubCurrentPage(1);
                  }}
                  className={`px-3.5 py-1.5 rounded-lg border text-xs focus:outline-none ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                  id="sub-status-filter"
                >
                  <option value="All">All Statuses</option>
                  <option value="Active">Active Only</option>
                  <option value="Inactive">Inactive Only</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table container */}
          <div className={`rounded-2xl border overflow-hidden ${darkMode ? 'bg-slate-900/85 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse" id="subcategories-table">
                <thead>
                  <tr className={`border-b text-xs font-bold uppercase tracking-wider ${
                    darkMode ? 'bg-slate-800/80 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}>
                    <th 
                      onClick={() => handleSubSort('code')}
                      className={`p-4 border-r last:border-r-0 cursor-pointer hover:bg-slate-800/35 transition-colors ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Subcategory Code</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSubSort('name')}
                      className={`p-4 border-r last:border-r-0 cursor-pointer hover:bg-slate-800/35 transition-colors ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Subcategory Name</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSubSort('parentCategoryId')}
                      className={`p-4 border-r last:border-r-0 cursor-pointer hover:bg-slate-800/35 transition-colors ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Parent Category</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className={`p-4 border-r last:border-r-0 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>Description</th>
                    <th 
                      onClick={() => handleSubSort('status')}
                      className={`p-4 border-r last:border-r-0 cursor-pointer hover:bg-slate-800/35 transition-colors ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Status</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSubSort('createdAt')}
                      className={`p-4 border-r last:border-r-0 cursor-pointer hover:bg-slate-800/35 transition-colors ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Created Date</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className={`p-4 border-r last:border-r-0 text-right ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="p-16 text-center">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-cyan-500" />
                        <p className="text-xs font-semibold text-slate-500 mt-3">Loading subcategories data, please wait...</p>
                      </td>
                    </tr>
                  ) : subPaginated.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        No subcategories found matching your filter criteria.
                      </td>
                    </tr>
                  ) : (
                    subPaginated.map(sub => {
                      const parent = categories.find(c => c.id === sub.parentCategoryId);
                      return (
                        <tr key={sub.id} className={`transition-colors ${darkMode ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50/80'}`}>
                          <td className={`p-4 border-r last:border-r-0 font-mono font-bold text-xs text-cyan-400 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                            {sub.code}
                          </td>
                          <td className={`p-4 border-r last:border-r-0 font-semibold ${darkMode ? 'border-slate-800 text-white' : 'border-slate-200 text-slate-900'}`}>
                            {sub.name}
                          </td>
                          <td className={`p-4 border-r last:border-r-0 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                            <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-400">
                              {parent ? parent.name : 'Unknown parent'}
                            </span>
                          </td>
                          <td className={`p-4 border-r last:border-r-0 text-xs text-slate-400 max-w-xs truncate ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                            {sub.description}
                          </td>
                          <td className={`p-4 border-r last:border-r-0 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                              sub.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${sub.status === 'Active' ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                              {sub.status}
                            </span>
                          </td>
                          <td className={`p-4 border-r last:border-r-0 text-xs text-slate-400 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                            {sub.createdAt}
                          </td>
                          <td className={`p-4 border-r last:border-r-0 text-right space-x-1.5 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                            <button
                              onClick={() => openSubModal('view', sub)}
                              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => openSubModal('edit', sub)}
                              className="p-1.5 rounded-lg hover:bg-slate-800 text-amber-500 hover:text-amber-400 transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => triggerDelete('subcategory', sub.id, sub.name)}
                              className="p-1.5 rounded-lg hover:bg-slate-800 text-rose-500 hover:text-rose-400 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination block */}
            {subTotalPages > 1 && (
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <div>
                  Showing <span className="font-bold text-white">{(subCurrentPage - 1) * itemsPerPage + 1}</span> to{' '}
                  <span className="font-bold text-white">
                    {Math.min(subCurrentPage * itemsPerPage, filteredSubcategories.length)}
                  </span>{' '}
                  of <span className="font-bold text-white">{filteredSubcategories.length}</span> subcategories
                </div>
                <div className="flex space-x-1">
                  <button
                    disabled={subCurrentPage === 1}
                    onClick={() => setSubCurrentPage(p => Math.max(1, p - 1))}
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-400 disabled:opacity-30 hover:text-white"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-3 py-1.5 font-semibold bg-slate-800/50 rounded-lg border border-slate-700/60 text-emerald-400">
                    {subCurrentPage} / {subTotalPages}
                  </span>
                  <button
                    disabled={subCurrentPage === subTotalPages}
                    onClick={() => setSubCurrentPage(p => Math.min(subTotalPages, p + 1))}
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-400 disabled:opacity-30 hover:text-white"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- CATEGORY MODAL --- */}
      {isCatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className={`w-full max-w-lg rounded-3xl shadow-2xl border p-6 relative ${
            darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`} id="category-modal">
            <button
              onClick={() => setIsCatModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-800 text-slate-400"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-extrabold mb-4 flex items-center space-x-2">
              <Layers className="w-5 h-5 text-emerald-500" />
              <span>
                {catModalMode === 'add' && 'Add New Category'}
                {catModalMode === 'edit' && 'Edit Category'}
                {catModalMode === 'view' && 'Category Details'}
              </span>
            </h2>

            {catError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{catError}</span>
              </div>
            )}
            {catSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{catSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Category Code</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      disabled={catModalMode === 'view'}
                      value={catFormData.code}
                      onChange={(e) => setCatFormData({ ...catFormData, code: e.target.value.toUpperCase() })}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${
                        darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                      } ${catModalMode === 'view' ? 'opacity-60 cursor-not-allowed' : ''}`}
                      id="input-cat-code"
                    />
                    {catModalMode !== 'view' && (
                      <button
                        type="button"
                        onClick={() => setCatFormData({ ...catFormData, code: generateCatCode() })}
                        className="absolute right-3 top-3 text-slate-400 hover:text-emerald-400"
                        title="Generate Code"
                      >
                        <RefreshCw className="w-4 h-4 animate-spin-hover" />
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Type</label>
                  <select
                    disabled={catModalMode === 'view'}
                    value={catFormData.type}
                    onChange={(e) => setCatFormData({ ...catFormData, type: e.target.value as any })}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                    } ${catModalMode === 'view' ? 'opacity-60 cursor-not-allowed' : ''}`}
                    id="input-cat-type"
                  >
                    <option value="Raw Material">Raw Material</option>
                    <option value="Finished Product">Finished Product</option>
                    <option value="Material Group">Material Group</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  disabled={catModalMode === 'view'}
                  placeholder="e.g. Specialty Kraft Papers"
                  value={catFormData.name}
                  onChange={(e) => setCatFormData({ ...catFormData, name: e.target.value })}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-600' : 'bg-slate-50 border-slate-200'
                  } ${catModalMode === 'view' ? 'opacity-60 cursor-not-allowed' : ''}`}
                  id="input-cat-name"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Description</label>
                <textarea
                  rows={3}
                  disabled={catModalMode === 'view'}
                  placeholder="Enter classification details..."
                  value={catFormData.description}
                  onChange={(e) => setCatFormData({ ...catFormData, description: e.target.value })}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-600' : 'bg-slate-50 border-slate-200'
                  } ${catModalMode === 'view' ? 'opacity-60 cursor-not-allowed' : ''}`}
                  id="input-cat-description"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Status</label>
                <select
                  disabled={catModalMode === 'view'}
                  value={catFormData.status}
                  onChange={(e) => setCatFormData({ ...catFormData, status: e.target.value as any })}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                  } ${catModalMode === 'view' ? 'opacity-60 cursor-not-allowed' : ''}`}
                  id="input-cat-status"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              {catModalMode === 'view' && selectedCat && (
                <div className={`p-4 rounded-xl space-y-2 text-xs border ${darkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Created Date:</span>
                    <span className="font-semibold">{selectedCat.createdAt || '2026-08-01 10:00'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Direct Subcategories Count:</span>
                    <span className="font-bold text-emerald-400">{getSubcategoryCount(selectedCat.id)}</span>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCatModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-700 text-sm font-semibold hover:bg-slate-800 transition-colors"
                >
                  {catModalMode === 'view' ? 'Close' : 'Cancel'}
                </button>
                {catModalMode !== 'view' && (
                  <button
                    type="submit"
                    disabled={isCatSubmitting}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 flex items-center space-x-2 disabled:opacity-50"
                    id="save-category-btn"
                  >
                    {isCatSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>{catModalMode === 'add' ? 'Save Category' : 'Update Category'}</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- SUBCATEGORY MODAL --- */}
      {isSubModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className={`w-full max-w-lg rounded-3xl shadow-2xl border p-6 relative ${
            darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`} id="subcategory-modal">
            <button
              onClick={() => setIsSubModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-800 text-slate-400"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-extrabold mb-4 flex items-center space-x-2">
              <Layers className="w-5 h-5 text-emerald-500" />
              <span>
                {subModalMode === 'add' && 'Add New Subcategory'}
                {subModalMode === 'edit' && 'Edit Subcategory'}
                {subModalMode === 'view' && 'Subcategory Details'}
              </span>
            </h2>

            <form onSubmit={handleSaveSubcategory} className="space-y-4">
              {subError && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <p className="font-medium">{subError}</p>
                </div>
              )}
              {subSuccess && (
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <p className="font-medium">{subSuccess}</p>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Parent Category <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  disabled={subModalMode === 'view'}
                  value={subFormData.parentCategoryId}
                  onChange={(e) => setSubFormData({ ...subFormData, parentCategoryId: e.target.value })}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                  } ${subModalMode === 'view' ? 'opacity-60 cursor-not-allowed' : ''}`}
                  id="input-sub-parent"
                >
                  <option value="" disabled>Select parent category</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Subcategory Code</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      disabled={subModalMode === 'view'}
                      value={subFormData.code}
                      onChange={(e) => setSubFormData({ ...subFormData, code: e.target.value.toUpperCase() })}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${
                        darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                      } ${subModalMode === 'view' ? 'opacity-60 cursor-not-allowed' : ''}`}
                      id="input-sub-code"
                    />
                    {subModalMode !== 'view' && subFormData.parentCategoryId && (
                      <button
                        type="button"
                        onClick={() => setSubFormData({ ...subFormData, code: generateSubCode(subFormData.parentCategoryId) })}
                        className="absolute right-3 top-3 text-slate-400 hover:text-emerald-400"
                        title="Generate Code"
                      >
                        <RefreshCw className="w-4 h-4 animate-spin-hover" />
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Status</label>
                  <select
                    disabled={subModalMode === 'view'}
                    value={subFormData.status}
                    onChange={(e) => setSubFormData({ ...subFormData, status: e.target.value as any })}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                    } ${subModalMode === 'view' ? 'opacity-60 cursor-not-allowed' : ''}`}
                    id="input-sub-status"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Subcategory Name</label>
                <input
                  type="text"
                  required
                  disabled={subModalMode === 'view'}
                  placeholder="e.g. Recycled Testliner Reels"
                  value={subFormData.name}
                  onChange={(e) => setSubFormData({ ...subFormData, name: e.target.value })}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-600' : 'bg-slate-50 border-slate-200'
                  } ${subModalMode === 'view' ? 'opacity-60 cursor-not-allowed' : ''}`}
                  id="input-sub-name"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Description</label>
                <textarea
                  rows={3}
                  disabled={subModalMode === 'view'}
                  placeholder="Enter details..."
                  value={subFormData.description}
                  onChange={(e) => setSubFormData({ ...subFormData, description: e.target.value })}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-600' : 'bg-slate-50 border-slate-200'
                  } ${subModalMode === 'view' ? 'opacity-60 cursor-not-allowed' : ''}`}
                  id="input-sub-description"
                />
              </div>

              {subModalMode === 'view' && selectedSub && (
                <div className={`p-4 rounded-xl space-y-2 text-xs border ${darkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Created Date:</span>
                    <span className="font-semibold">{selectedSub.createdAt}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Parent Category Name:</span>
                    <span className="font-semibold text-emerald-400">
                      {categories.find(c => c.id === selectedSub.parentCategoryId)?.name || 'Unknown'}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsSubModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-700 text-sm font-semibold hover:bg-slate-800 transition-colors"
                >
                  {subModalMode === 'view' ? 'Close' : 'Cancel'}
                </button>
                {subModalMode !== 'view' && (
                  <button
                    type="submit"
                    disabled={isSubSubmitting}
                    className={`px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 flex items-center space-x-2 transition-all ${
                      isSubSubmitting ? 'opacity-70 cursor-wait' : ''
                    }`}
                    id="save-subcategory-btn"
                  >
                    {isSubSubmitting ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>
                      {isSubSubmitting 
                        ? (subModalMode === 'add' ? 'Creating...' : 'Updating...') 
                        : (subModalMode === 'add' ? 'Save Subcategory' : 'Update Subcategory')
                      }
                    </span>
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- CONFIRM DELETE MODAL --- */}
      {deleteConfirm.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-md rounded-3xl p-6 border shadow-2xl ${
            darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`} id="delete-confirm-modal">
            <div className="flex items-center space-x-3 text-rose-500 mb-4">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-lg font-extrabold">Confirm Deletion</h3>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Are you sure you want to delete the {deleteConfirm.type === 'category' ? 'category' : 'subcategory'}{' '}
              <span className="font-bold text-rose-400">"{deleteConfirm.name}"</span>? 
              {deleteConfirm.type === 'category' && (
                <span className="block mt-2 text-xs text-amber-500 font-semibold">
                  Warning: Deleting this category will leave its associated subcategories without a valid parent.
                </span>
              )}
            </p>
            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDeleteConfirm({ isOpen: false, type: 'category', id: '', name: '' })}
                className="px-4 py-2 rounded-xl border border-slate-700 text-xs font-semibold text-slate-400 hover:bg-slate-800 transition-colors"
              >
                No, Keep it
              </button>
              <button
                type="button"
                onClick={executeDelete}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 transition-all"
                id="confirm-delete-btn"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
