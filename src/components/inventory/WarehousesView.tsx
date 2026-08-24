import React, { useState } from 'react';
import { 
  Warehouse as WarehouseIcon, Plus, Users, LayoutGrid, X, Save, Edit2, Trash2,
  Box, MapPin, Activity, CheckCircle, AlertTriangle, ListFilter, Search,
  ChevronLeft, ChevronRight, ArrowUpDown, RefreshCw
} from 'lucide-react';
import { Warehouse, BinLocationItem } from '../../types';

interface WarehousesViewProps {
  warehouses: Warehouse[];
  onAddWarehouse: (warehouse: Warehouse) => void;
  onUpdateWarehouse: (warehouse: Warehouse) => void;
  onDeleteWarehouse: (id: string) => void;
  onViewWarehouse: (id: string) => void;
  binLocations: BinLocationItem[];
  onAddBin: (bin: BinLocationItem) => void;
  onUpdateBin: (bin: BinLocationItem) => void;
  onDeleteBin: (id: string) => void;
  darkMode: boolean;
  selectedWarehouseId?: string | null;
  onSelectProduct?: (id: string) => void;
  onSelectMaterial?: (id: string) => void;
}

export const WarehousesView: React.FC<WarehousesViewProps> = ({
  warehouses,
  onAddWarehouse,
  onUpdateWarehouse,
  onDeleteWarehouse,
  onViewWarehouse,
  binLocations,
  onAddBin,
  onUpdateBin,
  onDeleteBin,
  darkMode,
  selectedWarehouseId,
  onSelectProduct,
  onSelectMaterial
}) => {
  const [activeTab, setActiveTab] = useState<'warehouses' | 'bins'>('warehouses');

  // Warehouse Search & Filters
  const [warehouseSearch, setWarehouseSearch] = useState('');
  const [warehouseStatusFilter, setWarehouseStatusFilter] = useState<string>('all');

  // Warehouse Modal State
  const [isWhModalOpen, setIsWhModalOpen] = useState(false);
  const [whModalMode, setWhModalMode] = useState<'add' | 'edit'>('add');
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const [isWhSubmitting, setIsWhSubmitting] = useState(false);
  const [whError, setWhError] = useState<string | null>(null);
  const [whSuccess, setWhSuccess] = useState<string | null>(null);

  const [whFormData, setWhFormData] = useState({
    code: '',
    name: '',
    location: '',
    manager: '',
    capacitySqFt: 50000,
    totalBins: 0,
    status: 'Operational' as 'Operational' | 'Maintenance' | 'Full'
  });

  // Bin Modal State
  const [isBinModalOpen, setIsBinModalOpen] = useState(false);
  const [binModalMode, setBinModalMode] = useState<'add' | 'edit'>('add');
  const [editingBin, setEditingBin] = useState<BinLocationItem | null>(null);
  const [isBinSubmitting, setIsBinSubmitting] = useState(false);
  const [binError, setBinError] = useState<string | null>(null);
  const [binSuccess, setBinSuccess] = useState<string | null>(null);

  // Selected Bin for detail inspection
  const [inspectingBin, setInspectingBin] = useState<BinLocationItem | null>(null);

  // Filters for Bins tab
  const [binSearch, setBinSearch] = useState('');
  const [binWarehouseFilter, setBinWarehouseFilter] = useState<string>('all');
  const [binTypeFilter, setBinTypeFilter] = useState<string>('all');

  const [binFormData, setBinFormData] = useState({
    code: '',
    name: '',
    warehouseId: '',
    type: 'Storage' as 'Storage' | 'Loading' | 'Staging' | 'Quality Check',
    status: 'Active' as 'Active' | 'Inactive'
  });

  React.useEffect(() => {
    if (selectedWarehouseId) {
      setActiveTab('warehouses');
      const wh = warehouses.find(w => w.id === selectedWarehouseId);
      if (wh) {
        openEditWhModal(wh);
      }
    }
  }, [selectedWarehouseId, warehouses]);

  // Handlers for Warehouse
  const openAddWhModal = () => {
    setWhModalMode('add');
    setEditingWarehouse(null);
    setWhError(null);
    setWhSuccess(null);
    setWhFormData({
      code: `WH-${Math.floor(100 + Math.random() * 900)}`,
      name: '',
      location: '',
      manager: '',
      capacitySqFt: 50000,
      totalBins: 0,
      status: 'Operational'
    });
    setIsWhModalOpen(true);
  };

  const openEditWhModal = (wh: Warehouse) => {
    setWhModalMode('edit');
    setEditingWarehouse(wh);
    setWhError(null);
    setWhSuccess(null);
    setWhFormData({
      code: wh.code || '',
      name: wh.name,
      location: wh.location,
      manager: wh.manager || '',
      capacitySqFt: wh.capacitySqFt,
      totalBins: wh.totalBins,
      status: wh.status
    });
    setIsWhModalOpen(true);
  };

  const handleWhSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!whFormData.name || !whFormData.code) return;
    setIsWhSubmitting(true);
    setWhError(null);

    try {
      const payload = {
        code: whFormData.code,
        name: whFormData.name,
        location: whFormData.location || 'N/A',
        manager: whFormData.manager || 'N/A',
        capacitySqFt: Number(whFormData.capacitySqFt) || 0,
        totalBins: Number(whFormData.totalBins) || 0,
        status: whFormData.status
      };

      if (whModalMode === 'add') {
        const res = await fetch('/api/warehouses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || 'Failed to create warehouse');
        onAddWarehouse(data.data);
        setWhSuccess('Warehouse created successfully!');
      } else if (editingWarehouse) {
        const res = await fetch(`/api/warehouses?id=${editingWarehouse.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || 'Failed to update warehouse');
        onUpdateWarehouse(data.data);
        setWhSuccess('Warehouse updated successfully!');
      }
      setTimeout(() => setIsWhModalOpen(false), 1500);
    } catch (err: any) {
      setWhError(err.message);
    } finally {
      setIsWhSubmitting(false);
    }
  };

  const handleWhDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/warehouses?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to delete warehouse');
      onDeleteWarehouse(id);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  // Handlers for Bin Locations
  const openAddBinModal = () => {
    setBinModalMode('add');
    setEditingBin(null);
    setBinError(null);
    setBinSuccess(null);
    setBinFormData({
      code: `BIN-${Math.floor(1000 + Math.random() * 9000)}`,
      name: '',
      warehouseId: warehouses[0]?.id || '',
      type: 'Storage',
      status: 'Active'
    });
    setIsBinModalOpen(true);
  };

  const openEditBinModal = (bin: BinLocationItem) => {
    setBinModalMode('edit');
    setEditingBin(bin);
    setBinError(null);
    setBinSuccess(null);
    setBinFormData({
      code: bin.code,
      name: bin.name,
      warehouseId: bin.warehouseId,
      type: bin.type,
      status: bin.status
    });
    setIsBinModalOpen(true);
  };

  const handleBinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!binFormData.name || !binFormData.code || !binFormData.warehouseId) return;
    setIsBinSubmitting(true);
    setBinError(null);

    try {
      const payload = {
        code: binFormData.code,
        name: binFormData.name,
        warehouseId: binFormData.warehouseId,
        type: binFormData.type,
        status: binFormData.status
      };

      if (binModalMode === 'add') {
        const res = await fetch('/api/bins', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || 'Failed to create bin');
        
        // Construct the item for local state
        const createdBin: BinLocationItem = {
          id: data.data.id,
          code: data.data.code,
          name: data.data.name,
          warehouseId: data.data.warehouseId,
          type: data.data.type as any,
          status: data.data.status as any,
          createdAt: new Date().toISOString()
        };
        onAddBin(createdBin);
        setBinSuccess('Bin location created successfully!');
      } else if (editingBin) {
        const res = await fetch(`/api/bins?id=${editingBin.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || 'Failed to update bin');
        
        onUpdateBin({
          ...editingBin,
          ...payload
        });
        setBinSuccess('Bin location updated successfully!');
      }
      setTimeout(() => setIsBinModalOpen(false), 1500);
    } catch (err: any) {
      setBinError(err.message);
    } finally {
      setIsBinSubmitting(false);
    }
  };

  const handleBinDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete bin "${name}"?`)) return;
    try {
      const res = await fetch(`/api/bins?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to delete bin');
      onDeleteBin(id);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Tabs */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className={`text-2xl font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              Warehouses & Bin Locations
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Manage paper roll bays, finished goods dispatch hubs, and storage capacities.
            </p>
          </div>
          <button
            onClick={activeTab === 'warehouses' ? openAddWhModal : openAddBinModal}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-600/20 flex items-center space-x-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add {activeTab === 'warehouses' ? 'Warehouse' : 'Bin'}</span>
          </button>
        </div>

        <div className="flex space-x-1 p-1 bg-slate-100 dark:bg-slate-800/50 rounded-2xl w-fit">
          <button
            onClick={() => setActiveTab('warehouses')}
            className={`px-6 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
              activeTab === 'warehouses' 
                ? 'bg-white dark:bg-slate-900 text-emerald-500 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <WarehouseIcon className="w-4 h-4" />
            <span>Warehouses</span>
          </button>
          <button
            onClick={() => setActiveTab('bins')}
            className={`px-6 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
              activeTab === 'bins' 
                ? 'bg-white dark:bg-slate-900 text-emerald-500 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Box className="w-4 h-4" />
            <span>Bin Locations</span>
          </button>
        </div>
      </div>

      {activeTab === 'warehouses' ? (
        <div className="space-y-4">
          {/* Warehouse Filters */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <div className="relative flex-1 min-w-[200px] max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by warehouse code, name, location or manager..."
                  value={warehouseSearch}
                  onChange={(e) => setWarehouseSearch(e.target.value)}
                  className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs border outline-none ${
                    darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200'
                  }`}
                />
              </div>

              <select
                value={warehouseStatusFilter}
                onChange={(e) => setWarehouseStatusFilter(e.target.value)}
                className={`px-3 py-2 rounded-xl text-xs border outline-none ${
                  darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200'
                }`}
              >
                <option value="all">All Statuses</option>
                <option value="Operational">Operational</option>
                <option value="Full">Full</option>
                <option value="Maintenance">Maintenance</option>
              </select>

              {(warehouseSearch || warehouseStatusFilter !== 'all') && (
                <button
                  onClick={() => {
                    setWarehouseSearch('');
                    setWarehouseStatusFilter('all');
                  }}
                  className="px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>

            <div className="text-xs font-semibold text-slate-400 flex items-center">
              Total Warehouses: {warehouses.length}
            </div>
          </div>

          {warehouses.length === 0 ? (
            <div className={`p-12 rounded-3xl border text-center ${
              darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <WarehouseIcon className="w-12 h-12 text-slate-500 mx-auto mb-3 opacity-50" />
              <h3 className={`text-base font-bold mb-1 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                No Warehouses Found
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto mb-5">
                No warehouse records found in the database. Add your first warehouse facility to start tracking inventory and bin allocations.
              </p>
              <button
                onClick={openAddWhModal}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-600/20 inline-flex items-center space-x-2 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Add First Warehouse</span>
              </button>
            </div>
          ) : warehouses.filter((wh) => {
            if (warehouseStatusFilter !== 'all' && wh.status !== warehouseStatusFilter) return false;
            if (warehouseSearch) {
              const q = warehouseSearch.toLowerCase();
              const matchName = (wh.name || '').toLowerCase().includes(q);
              const matchCode = (wh.code || '').toLowerCase().includes(q);
              const matchLoc = (wh.location || '').toLowerCase().includes(q);
              const matchMgr = (wh.manager || '').toLowerCase().includes(q);
              if (!matchName && !matchCode && !matchLoc && !matchMgr) return false;
            }
            return true;
          }).length === 0 ? (
            <div className={`p-10 rounded-3xl border text-center ${
              darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <Search className="w-10 h-10 text-slate-500 mx-auto mb-2 opacity-50" />
              <h3 className={`text-sm font-bold mb-1 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                No Matching Warehouses
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                No warehouses match your current search or status filter.
              </p>
              <button
                onClick={() => {
                  setWarehouseSearch('');
                  setWarehouseStatusFilter('all');
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold hover:bg-slate-700 transition-colors"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {warehouses
                .filter((wh) => {
                  if (warehouseStatusFilter !== 'all' && wh.status !== warehouseStatusFilter) return false;
                  if (warehouseSearch) {
                    const q = warehouseSearch.toLowerCase();
                    const matchName = (wh.name || '').toLowerCase().includes(q);
                    const matchCode = (wh.code || '').toLowerCase().includes(q);
                    const matchLoc = (wh.location || '').toLowerCase().includes(q);
                    const matchMgr = (wh.manager || '').toLowerCase().includes(q);
                    if (!matchName && !matchCode && !matchLoc && !matchMgr) return false;
                  }
                  return true;
                })
                .map(wh => (
                <div key={wh.id} className={`p-6 rounded-2xl border transition-all relative group ${
                  darkMode ? 'bg-slate-900/85 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200 shadow-sm hover:shadow-md'
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-indigo-500/10 text-indigo-400">
                      {wh.code || '—'}
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        wh.status === 'Operational' 
                          ? 'bg-emerald-500/10 text-emerald-500' 
                          : wh.status === 'Full' 
                          ? 'bg-amber-500/10 text-amber-500' 
                          : 'bg-rose-500/10 text-rose-500'
                      }`}>
                        {wh.status || 'Operational'}
                      </span>
                      
                      <div className="flex items-center space-x-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => onViewWarehouse(wh.id)}
                          title="View Details"
                          className="p-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors"
                        >
                          <LayoutGrid className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openEditWhModal(wh)}
                          title="Edit Warehouse"
                          className="p-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleWhDelete(wh.id, wh.name)}
                          title="Delete Warehouse"
                          className="p-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{wh.name || 'Unnamed Warehouse'}</h3>
                  <p className="text-xs text-slate-400 mt-1 flex items-center">
                    <MapPin className="w-3.5 h-3.5 mr-1 text-slate-500" />
                    {wh.location || '—'}
                  </p>

                  <div className="mt-6 space-y-3">
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-slate-400">Capacity Utilization</span>
                        <span className="text-emerald-400 font-bold">{wh.currentUtilizationPercent || 0}%</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${wh.currentUtilizationPercent || 0}%` }}></div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-200 dark:border-slate-800 text-xs">
                      <div>
                        <span className="text-slate-400">Total Bins</span>
                        <p className="font-bold mt-0.5">{wh.totalBins || 0} Bins</p>
                      </div>
                      <div>
                        <span className="text-slate-400">Active Items</span>
                        <p className="font-bold mt-0.5 text-emerald-400">{wh.activeItemsCount || 0} SKUs</p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-slate-400 flex items-center">
                        <Users className="w-3.5 h-3.5 mr-1" /> Manager:
                      </span>
                      <span className="font-bold">{wh.manager || '—'}</span>
                    </div>

                    <div className="pt-2 flex gap-2">
                      <button
                        onClick={() => onViewWarehouse(wh.id)}
                        className="w-full py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors flex items-center justify-center space-x-1"
                      >
                        <LayoutGrid className="w-3.5 h-3.5" />
                        <span>View Details & Inventory</span>
                      </button>
                      <button
                        onClick={() => {
                          setBinWarehouseFilter(wh.id);
                          setActiveTab('bins');
                        }}
                        className="py-2 px-3 text-xs font-bold rounded-xl bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors flex items-center justify-center space-x-1"
                        title="View Bins for this Warehouse"
                      >
                        <Box className="w-3.5 h-3.5" />
                        <span>Bins</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Bin Filters */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <div className="relative flex-1 min-w-[200px] max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by bin code, name or stored items..."
                  value={binSearch}
                  onChange={(e) => setBinSearch(e.target.value)}
                  className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs border outline-none ${
                    darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200'
                  }`}
                />
              </div>

              <select
                value={binWarehouseFilter}
                onChange={(e) => setBinWarehouseFilter(e.target.value)}
                className={`px-3 py-2 rounded-xl text-xs border outline-none ${
                  darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200'
                }`}
              >
                <option value="all">All Warehouses</option>
                {warehouses.map(w => (
                  <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
                ))}
              </select>

              <select
                value={binTypeFilter}
                onChange={(e) => setBinTypeFilter(e.target.value)}
                className={`px-3 py-2 rounded-xl text-xs border outline-none ${
                  darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200'
                }`}
              >
                <option value="all">All Bin Types</option>
                <option value="Storage">Storage</option>
                <option value="Loading">Loading</option>
                <option value="Staging">Staging</option>
                <option value="Quality Check">Quality Check</option>
              </select>
            </div>

            <div className="text-xs font-semibold text-slate-400 flex items-center">
              Total Bins: {binLocations.length}
            </div>
          </div>

          <div className={`rounded-3xl border overflow-hidden ${darkMode ? 'bg-slate-900/85 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className={`${darkMode ? 'bg-slate-800/50 text-slate-400' : 'bg-slate-50 text-slate-500'} text-xs uppercase tracking-wider`}>
                  <tr>
                    <th className="p-4 text-left font-bold">Bin Code</th>
                    <th className="p-4 text-left font-bold">Name</th>
                    <th className="p-4 text-left font-bold">Warehouse</th>
                    <th className="p-4 text-left font-bold">Type</th>
                    <th className="p-4 text-left font-bold text-emerald-400">Stored Materials &amp; Reels</th>
                    <th className="p-4 text-left font-bold">Stock Qty</th>
                    <th className="p-4 text-left font-bold">Status</th>
                    <th className="p-4 text-right font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {binLocations
                    .filter(bin => {
                      if (binWarehouseFilter !== 'all' && bin.warehouseId !== binWarehouseFilter) return false;
                      if (binTypeFilter !== 'all' && bin.type !== binTypeFilter) return false;
                      if (binSearch) {
                        const q = binSearch.toLowerCase();
                        const matchesCode = bin.code.toLowerCase().includes(q);
                        const matchesName = bin.name.toLowerCase().includes(q);
                        const matchesItems = (bin.items || []).some(i => i.name.toLowerCase().includes(q) || i.code.toLowerCase().includes(q));
                        if (!matchesCode && !matchesName && !matchesItems) return false;
                      }
                      return true;
                    })
                    .map(bin => {
                      const whName = warehouses.find(w => w.id === bin.warehouseId)?.name || bin.warehouseName || 'Unknown';
                      const itemsCount = bin.storedItemsCount || (bin.items ? bin.items.length : 0);
                      const totalQty = bin.currentStock || (bin.items ? bin.items.reduce((s, i) => s + (i.quantity || 0), 0) : 0);

                      return (
                        <tr key={bin.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                          <td className="p-4 font-mono text-xs font-bold text-indigo-400">
                            {bin.code}
                          </td>
                          <td className="p-4 font-bold">
                            <button
                              onClick={() => setInspectingBin(bin)}
                              className="hover:text-emerald-500 transition-colors text-left"
                            >
                              {bin.name}
                            </button>
                          </td>
                          <td className="p-4">
                            <span className="text-xs px-2 py-1 rounded bg-slate-100 dark:bg-slate-800">
                              {whName}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="text-xs">{bin.type}</span>
                          </td>
                          <td className="p-4">
                            {bin.reels && bin.reels.length > 0 ? (
                              <button
                                onClick={() => setInspectingBin(bin)}
                                className="flex flex-col gap-1 items-start px-2.5 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20 hover:bg-emerald-500/20 transition-all cursor-pointer text-left"
                              >
                                <div className="flex items-center gap-1.5">
                                  <span>{bin.reels.length} {bin.reels.length === 1 ? 'Reel' : 'Reels'} Stored</span>
                                  <span className="text-[10px] text-slate-400 font-normal">
                                    ({bin.reels.map(r => r.reelNumber).slice(0, 2).join(', ')}{bin.reels.length > 2 ? '...' : ''})
                                  </span>
                                </div>
                              </button>
                            ) : itemsCount > 0 ? (
                              <button
                                onClick={() => setInspectingBin(bin)}
                                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20 hover:bg-emerald-500/20 transition-all cursor-pointer"
                              >
                                <span>{itemsCount} {itemsCount === 1 ? 'Item' : 'Items'} Stored</span>
                                <span className="text-[10px] text-slate-400 font-normal">
                                  ({(bin.items?.[0]?.name || 'Stock').slice(0, 18)}...)
                                </span>
                              </button>
                            ) : (
                              <span className="text-xs text-slate-400 italic">Empty Bay</span>
                            )}
                          </td>
                          <td className="p-4 font-bold text-xs">
                            {totalQty > 0 ? (
                              <span className="text-emerald-400 font-mono">{totalQty.toLocaleString()} Kg</span>
                            ) : (
                              <span className="text-slate-400 font-mono">0 Kg</span>
                            )}
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                              bin.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                            }`}>
                              {bin.status}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end space-x-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => setInspectingBin(bin)}
                                title="Inspect Stored Items"
                                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-cyan-500 transition-colors"
                              >
                                <LayoutGrid className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => openEditBinModal(bin)}
                                title="Edit Bin"
                                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-emerald-500 transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => handleBinDelete(bin.id, bin.name)}
                                title="Delete Bin"
                                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-rose-500 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  {binLocations.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-12 text-center text-slate-500">
                        No bin locations found. Add one to get started.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Warehouse Modal */}
      {isWhModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className={`w-full max-w-lg rounded-3xl shadow-2xl border p-6 relative ${
            darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <button onClick={() => setIsWhModalOpen(false)} className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-800/20 text-slate-400">
              <X className="w-5 h-5" />
            </button>
            
            <h2 className="text-xl font-bold mb-4 flex items-center space-x-2">
              <WarehouseIcon className="w-5 h-5 text-emerald-500" />
              <span>{whModalMode === 'edit' ? 'Edit Warehouse' : 'Add New Warehouse'}</span>
            </h2>

            {whError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4" />
                <span>{whError}</span>
              </div>
            )}
            {whSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs flex items-center space-x-2">
                <CheckCircle className="w-4 h-4" />
                <span>{whSuccess}</span>
              </div>
            )}

            <form onSubmit={handleWhSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Code</label>
                  <input
                    type="text" required
                    value={whFormData.code}
                    onChange={(e) => setWhFormData({ ...whFormData, code: e.target.value })}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none ${
                      darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Status</label>
                  <select
                    value={whFormData.status}
                    onChange={(e) => setWhFormData({ ...whFormData, status: e.target.value as any })}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none ${
                      darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <option value="Operational">Operational</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Full">Full</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Warehouse Name</label>
                <input
                  type="text" required
                  placeholder="Central Warehouse"
                  value={whFormData.name}
                  onChange={(e) => setWhFormData({ ...whFormData, name: e.target.value })}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none ${
                    darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Manager</label>
                  <input
                    type="text"
                    value={whFormData.manager}
                    onChange={(e) => setWhFormData({ ...whFormData, manager: e.target.value })}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none ${
                      darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Location</label>
                  <input
                    type="text"
                    value={whFormData.location}
                    onChange={(e) => setWhFormData({ ...whFormData, location: e.target.value })}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none ${
                      darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Capacity (Sq Ft)</label>
                  <input
                    type="number"
                    value={whFormData.capacitySqFt}
                    onChange={(e) => setWhFormData({ ...whFormData, capacitySqFt: Number(e.target.value) })}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none ${
                      darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Bins Count</label>
                  <input
                    type="number"
                    value={whFormData.totalBins}
                    onChange={(e) => setWhFormData({ ...whFormData, totalBins: Number(e.target.value) })}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none ${
                      darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsWhModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border dark:border-slate-700 text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isWhSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg flex items-center space-x-2 transition-colors disabled:opacity-50"
                >
                  {isWhSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{whModalMode === 'edit' ? 'Update' : 'Save'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bin Modal */}
      {isBinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className={`w-full max-w-md rounded-3xl shadow-2xl border p-6 relative ${
            darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <button onClick={() => setIsBinModalOpen(false)} className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-800/20 text-slate-400">
              <X className="w-5 h-5" />
            </button>
            
            <h2 className="text-xl font-bold mb-4 flex items-center space-x-2">
              <Box className="w-5 h-5 text-indigo-500" />
              <span>{binModalMode === 'edit' ? 'Edit Bin Location' : 'Add New Bin'}</span>
            </h2>

            {binError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4" />
                <span>{binError}</span>
              </div>
            )}
            {binSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs flex items-center space-x-2">
                <CheckCircle className="w-4 h-4" />
                <span>{binSuccess}</span>
              </div>
            )}

            <form onSubmit={handleBinSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Warehouse</label>
                <select
                  required
                  value={binFormData.warehouseId}
                  onChange={(e) => setBinFormData({ ...binFormData, warehouseId: e.target.value })}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none ${
                    darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <option value="">Select Warehouse</option>
                  {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Bin Code</label>
                  <input
                    type="text" required
                    value={binFormData.code}
                    onChange={(e) => setBinFormData({ ...binFormData, code: e.target.value })}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none ${
                      darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Status</label>
                  <select
                    value={binFormData.status}
                    onChange={(e) => setBinFormData({ ...binFormData, status: e.target.value as any })}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none ${
                      darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Bin Name / Description</label>
                <input
                  type="text" required
                  placeholder="Rack A, Shelf 1"
                  value={binFormData.name}
                  onChange={(e) => setBinFormData({ ...binFormData, name: e.target.value })}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none ${
                    darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Type</label>
                <select
                  value={binFormData.type}
                  onChange={(e) => setBinFormData({ ...binFormData, type: e.target.value as any })}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none ${
                    darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <option value="Storage">Storage</option>
                  <option value="Loading">Loading</option>
                  <option value="Staging">Staging</option>
                  <option value="Quality Check">Quality Check</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsBinModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border dark:border-slate-700 text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isBinSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg flex items-center space-x-2 transition-colors disabled:opacity-50"
                >
                  {isBinSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{binModalMode === 'edit' ? 'Update' : 'Save'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bin Storage Inspection Modal */}
      {inspectingBin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className={`w-full max-w-2xl rounded-3xl shadow-2xl border p-6 relative ${
            darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <button
              onClick={() => setInspectingBin(null)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-800/20 text-slate-400"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Box className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold">{inspectingBin.name}</h2>
                  <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    {inspectingBin.code}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    inspectingBin.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                  }`}>
                    {inspectingBin.status}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Facility: <strong className="text-slate-300">{warehouses.find(w => w.id === inspectingBin.warehouseId)?.name || inspectingBin.warehouseName || 'Warehouse'}</strong> • Type: <strong className="text-slate-300">{inspectingBin.type}</strong>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className={`p-3.5 rounded-2xl border ${darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total Stock Weight</span>
                <p className="text-lg font-black text-emerald-400 font-mono mt-0.5">
                  {(inspectingBin.currentStock || (inspectingBin.items ? inspectingBin.items.reduce((s, i) => s + (i.quantity || 0), 0) : 0)).toLocaleString()} Kg
                </p>
              </div>
              <div className={`p-3.5 rounded-2xl border ${darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Physical Reels</span>
                <p className="text-lg font-black text-amber-400 font-mono mt-0.5">
                  {inspectingBin.reels ? inspectingBin.reels.length : 0} Reels
                </p>
              </div>
              <div className={`p-3.5 rounded-2xl border ${darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Stored Material SKUs</span>
                <p className="text-lg font-black text-indigo-400 font-mono mt-0.5">
                  {(inspectingBin.storedItemsCount || (inspectingBin.items ? inspectingBin.items.length : 0))} SKUs
                </p>
              </div>
            </div>

            {inspectingBin.reels && inspectingBin.reels.length > 0 && (
              <div className="space-y-3 mb-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span>Physically Stored Paper Reels ({inspectingBin.reels.length})</span>
                  <span className="text-[10px] text-emerald-400 font-semibold">QC Passed &amp; Inwarded</span>
                </h3>

                <div className="border rounded-2xl overflow-hidden max-h-48 overflow-y-auto">
                  <table className="w-full text-xs text-left">
                    <thead className={`border-b text-[10px] font-bold uppercase tracking-wider ${darkMode ? 'bg-slate-950/60 text-slate-400 border-slate-800' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                      <tr>
                        <th className="p-3">Reel Number</th>
                        <th className="p-3">Material</th>
                        <th className="p-3">GSM / BF</th>
                        <th className="p-3 text-right">Net Weight</th>
                        <th className="p-3 text-center">QC Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/10">
                      {inspectingBin.reels.map((reel, rIdx) => (
                        <tr key={rIdx} className="hover:bg-slate-800/5">
                          <td className="p-3 font-mono font-bold text-amber-400">{reel.reelNumber}</td>
                          <td className="p-3 font-semibold">{reel.material}</td>
                          <td className="p-3 text-slate-400">
                            {reel.gsm ? `${reel.gsm} GSM` : '—'} {reel.bf ? `• ${reel.bf} BF` : ''}
                          </td>
                          <td className="p-3 font-mono font-bold text-emerald-400 text-right">
                            {reel.weight.toLocaleString()} {reel.uom || 'Kg'}
                          </td>
                          <td className="p-3 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              {reel.qcStatus || 'Approved'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>Stored Stock Levels &amp; Materials</span>
                <span className="text-[10px] text-emerald-400 font-semibold">Database Inventory</span>
              </h3>

              <div className="border rounded-2xl overflow-hidden max-h-48 overflow-y-auto">
                <table className="w-full text-xs text-left">
                  <thead className={`border-b text-[10px] font-bold uppercase tracking-wider ${darkMode ? 'bg-slate-950/60 text-slate-400 border-slate-800' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                    <tr>
                      <th className="p-3">Item Code</th>
                      <th className="p-3">Item Name</th>
                      <th className="p-3">Category</th>
                      <th className="p-3 text-right">Stored Qty</th>
                      <th className="p-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/10">
                    {inspectingBin.items && inspectingBin.items.length > 0 ? (
                      inspectingBin.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/5">
                          <td className="p-3 font-mono font-bold text-indigo-400">{item.code}</td>
                          <td className="p-3 font-semibold">{item.name}</td>
                          <td className="p-3 text-slate-400">{item.category || item.itemType || 'Raw Material'}</td>
                          <td className="p-3 font-mono font-bold text-emerald-400 text-right">
                            {item.quantity.toLocaleString()} {item.uom}
                          </td>
                          <td className="p-3 text-center">
                            {item.itemId && (
                              <button
                                onClick={() => {
                                  setInspectingBin(null);
                                  if (item.itemType === 'PRODUCT' || item.itemType === 'Finished Product') {
                                    onSelectProduct?.(item.itemId);
                                  } else {
                                    onSelectMaterial?.(item.itemId);
                                  }
                                }}
                                className="text-xs text-indigo-400 hover:underline font-semibold"
                              >
                                View Item
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (!inspectingBin.reels || inspectingBin.reels.length === 0) ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-500">
                          This bay is currently empty.
                        </td>
                      </tr>
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-slate-400 text-xs">
                          Reel inventory active above.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-between items-center pt-5 mt-4 border-t border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-400">
                Created on: {inspectingBin.createdAt ? new Date(inspectingBin.createdAt).toLocaleDateString() : 'N/A'}
              </span>
              <button
                onClick={() => setInspectingBin(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
