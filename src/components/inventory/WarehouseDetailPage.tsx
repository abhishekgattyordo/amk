import React, { useState } from 'react';
import { Warehouse, RawMaterial, Product, BinLocationItem } from '../../types';
import { 
  ArrowLeft, Search, Filter, Package, Boxes, TrendingUp, DollarSign, 
  MapPin, User as UserIcon, Calendar, CheckCircle2, Clock, 
  Layers, Warehouse as WarehouseIcon, Building2, Tag, Copy, Check, Box
} from 'lucide-react';

interface WarehouseDetailPageProps {
  warehouse?: Warehouse | null;
  warehouseId?: string;
  rawMaterials: RawMaterial[];
  products: Product[];
  binLocations?: BinLocationItem[];
  darkMode: boolean;
  onBack: () => void;
  onSelectProduct?: (id: string) => void;
  onSelectMaterial?: (id: string) => void;
}

export const WarehouseDetailPage: React.FC<WarehouseDetailPageProps> = ({
  warehouse: initialWarehouse,
  warehouseId,
  rawMaterials,
  products,
  binLocations = [],
  darkMode,
  onBack,
  onSelectProduct,
  onSelectMaterial,
}) => {
  const [warehouse, setWarehouse] = useState<Warehouse | null>(initialWarehouse || null);
  const [isLoading, setIsLoading] = useState(!initialWarehouse && !!warehouseId);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<'all' | 'raw' | 'product'>('all');
  const [copiedId, setCopiedId] = useState(false);

  React.useEffect(() => {
    if (initialWarehouse) {
      setWarehouse(initialWarehouse);
    } else if (warehouseId) {
      setIsLoading(true);
      fetch(`/api/warehouses?id=${warehouseId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data) {
            setWarehouse(data.data);
          }
        })
        .catch(err => console.error('Failed to load warehouse detail:', err))
        .finally(() => setIsLoading(false));
    }
  }, [initialWarehouse, warehouseId]);

  if (isLoading) {
    return (
      <div className={`p-8 text-center rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto mb-3" />
        <p className="text-sm text-slate-400">Loading warehouse details...</p>
      </div>
    );
  }

  if (!warehouse) {
    return (
      <div className={`p-8 text-center rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <p className="text-sm font-semibold text-slate-300 mb-4">Warehouse record not found</p>
        <button
          onClick={onBack}
          className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
        >
          Return to Warehouses
        </button>
      </div>
    );
  }

  // Filter bins belonging to this warehouse (prefer enriched bins from API)
  const warehouseBins: BinLocationItem[] = (warehouse as any)?.bins && (warehouse as any).bins.length > 0 
    ? (warehouse as any).bins 
    : (binLocations || []).filter(b => b.warehouseId === warehouse.id);

  // Filter items in this warehouse using actual stock levels
  let allItems: any[] = [];
  const rawItems: any[] = [];
  const productItems: any[] = [];

  if (warehouse.stockLevels && warehouse.stockLevels.length > 0) {
    warehouse.stockLevels.forEach((sl: any) => {
      const isRaw = sl.itemType === 'RAW_MATERIAL';
      const item = isRaw ? sl.rawMaterial : sl.product;
      if (!item) return;

      const mappedItem = {
        id: item.id,
        code: item.code,
        name: item.name,
        category: item.category || '',
        stock: sl.currentStock || 0,
        unit: isRaw ? (item.uom || 'KG') : (item.uom || item.unit || 'PCS'),
        value: (sl.currentStock || 0) * (isRaw ? (item.purchasePrice || 0) : (item.costPrice || 0)),
        status: item.status || 'Active',
        type: isRaw ? ('Raw Material' as const) : ('Finished Product' as const),
        binName: sl.bin?.name || undefined,
        binCode: sl.bin?.code || undefined,
      };

      allItems.push(mappedItem);
      if (isRaw) {
        rawItems.push(mappedItem);
      } else {
        productItems.push(mappedItem);
      }
    });
  } else {
    const rawItemsFiltered = (rawMaterials || []).filter(rm => 
      typeof rm.warehouse === 'object' && rm.warehouse !== null 
        ? (rm.warehouse.name === warehouse.name || (rm.warehouse as any).id === warehouse.id) 
        : rm.warehouse === warehouse.name || rm.warehouse === warehouse.id || rm.warehouse === warehouse.code
    ).map(rm => ({
      id: rm.id,
      code: rm.code,
      name: rm.name,
      category: rm.category || '',
      stock: rm.currentStock || 0,
      unit: rm.uom || 'KG',
      value: (rm.currentStock || 0) * (rm.purchasePrice || 0),
      status: rm.status || 'Active',
      type: 'Raw Material' as const
    }));

    const productItemsFiltered = (products || []).filter(p => 
      typeof p.warehouse === 'object' && p.warehouse !== null 
        ? ((p.warehouse as any).name === warehouse.name || (p.warehouse as any).id === warehouse.id) 
        : p.warehouse === warehouse.name || p.warehouse === warehouse.id || p.warehouse === warehouse.code
    ).map(p => ({
      id: p.id,
      code: p.code,
      name: p.name,
      category: p.category || '',
      stock: p.availableStock || 0,
      unit: p.uom || p.unit || 'PCS',
      value: (p.availableStock || 0) * (p.costPrice || 0),
      status: p.status || 'Active',
      type: 'Finished Product' as const
    }));

    rawItems.push(...rawItemsFiltered);
    productItems.push(...productItemsFiltered);
    allItems = [...rawItemsFiltered, ...productItemsFiltered];
  }

  const filteredItems = allItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.category.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;
    if (selectedTypeFilter === 'raw') return item.type === 'Raw Material';
    if (selectedTypeFilter === 'product') return item.type === 'Finished Product';
    return true;
  });

  const calculatedStock = allItems.reduce((acc, item) => acc + item.stock, 0);
  const totalStockQty = typeof (warehouse as any)?.currentStockTotal === 'number' && (warehouse as any).currentStockTotal > 0
    ? (warehouse as any).currentStockTotal
    : calculatedStock;

  const summary = {
    materials: (warehouse as any)?.activeItemsCount || rawItems.length,
    products: productItems.length,
    totalStock: totalStockQty,
    totalValue: allItems.reduce((acc, item) => acc + item.value, 0)
  };

  const handleCopyId = () => {
    if (warehouse.id) {
      navigator.clipboard?.writeText(warehouse.id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className={`space-y-6 pb-12 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
      {/* Header */}
      <div className={`p-6 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
        darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex items-center space-x-4">
          <button 
            onClick={onBack} 
            className={`p-2.5 rounded-xl border transition-all flex items-center justify-center ${
              darkMode 
                ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white' 
                : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
            }`}
            title="Back to Warehouses"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className={`text-2xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-slate-950'}`}>
                {warehouse.name}
              </h1>
              
              <span className="font-mono text-xs font-black px-3 py-1 rounded-lg bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
                {warehouse.code}
              </span>
              
              <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                warehouse.status === 'Operational' 
                  ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30' 
                  : warehouse.status === 'Full' 
                  ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30' 
                  : 'bg-rose-500/15 text-rose-800 dark:text-rose-300 border-rose-500/30'
              }`}>
                {warehouse.status || 'Operational'}
              </span>
            </div>
            
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium">
              <span className="text-slate-600 dark:text-slate-300 flex items-center">
                <Building2 className="w-3.5 h-3.5 mr-1 text-slate-500 dark:text-slate-400" />
                Warehouse Details &amp; Inventory Hub
              </span>
              <span className="text-slate-400">•</span>
              <div className="flex items-center space-x-1.5">
                <span className="text-slate-600 dark:text-slate-300 font-semibold">ID:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{warehouse.id}</span>
                <button 
                  onClick={handleCopyId}
                  title="Copy ID"
                  className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                >
                  {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
              darkMode 
                ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' 
                : 'bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200'
            }`}
          >
            Back to List
          </button>
        </div>
      </div>

      {/* Primary KPI & Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { 
            label: 'Total Materials', 
            value: summary.materials, 
            subValue: 'Raw material SKUs',
            icon: Package, 
            color: 'text-emerald-600 dark:text-emerald-400',
            bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
            border: 'border-emerald-500/20'
          },
          { 
            label: 'Total Products', 
            value: summary.products, 
            subValue: 'Finished carton SKUs',
            icon: Boxes, 
            color: 'text-blue-600 dark:text-blue-400',
            bg: 'bg-blue-500/10 dark:bg-blue-500/20',
            border: 'border-blue-500/20'
          },
          { 
            label: 'Total Stock Quantity', 
            value: summary.totalStock.toLocaleString(), 
            subValue: 'Total physical units',
            icon: TrendingUp, 
            color: 'text-purple-600 dark:text-purple-400',
            bg: 'bg-purple-500/10 dark:bg-purple-500/20',
            border: 'border-purple-500/20'
          },
          { 
            label: 'Total Inventory Value', 
            value: `₹${summary.totalValue.toLocaleString()}`, 
            subValue: 'Current valuation',
            icon: DollarSign, 
            color: 'text-amber-600 dark:text-amber-400',
            bg: 'bg-amber-500/10 dark:bg-amber-500/20',
            border: 'border-amber-500/20'
          },
        ].map((card, i) => (
          <div 
            key={i} 
            className={`p-4 rounded-2xl border flex flex-col justify-between ${
              darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                {card.label}
              </span>
              <div className={`p-2 rounded-xl ${card.bg} ${card.color} ${card.border} border`}>
                <card.icon className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-slate-950'}`}>
                {card.value}
              </div>
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                {card.subValue}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detailed Warehouse Specifications Grid */}
      <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-2">
            <WarehouseIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className={`text-base font-bold uppercase tracking-wider ${darkMode ? 'text-white' : 'text-slate-950'}`}>
              Warehouse Specifications &amp; Operational Attributes
            </h2>
          </div>
          <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
            All fields verified with high-contrast display
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {/* Warehouse ID */}
          <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <div className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              Warehouse ID
            </div>
            <div className="font-mono font-extrabold text-sm mt-1.5 text-slate-950 dark:text-white break-all select-all">
              {warehouse.id || 'N/A'}
            </div>
          </div>

          {/* Warehouse Code */}
          <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <div className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              Warehouse Code
            </div>
            <div className="font-mono font-extrabold text-base mt-1.5 text-indigo-700 dark:text-indigo-400">
              {warehouse.code || 'N/A'}
            </div>
          </div>

          {/* Warehouse Name */}
          <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <div className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              Warehouse Name
            </div>
            <div className="font-bold text-base mt-1.5 text-slate-950 dark:text-white">
              {warehouse.name || 'N/A'}
            </div>
          </div>

          {/* Status */}
          <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <div className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              Operational Status
            </div>
            <div className="mt-1.5">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold ${
                warehouse.status === 'Operational'
                  ? 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30'
                  : warehouse.status === 'Full'
                  ? 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30'
                  : 'bg-rose-500/20 text-rose-800 dark:text-rose-300 border border-rose-500/30'
              }`}>
                {warehouse.status || 'Operational'}
              </span>
            </div>
          </div>

          {/* Location */}
          <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <div className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center">
              <MapPin className="w-3.5 h-3.5 mr-1 text-slate-500 dark:text-slate-400" />
              Location / Facility
            </div>
            <div className="font-bold text-sm mt-1.5 text-slate-950 dark:text-white">
              {warehouse.location || '—'}
            </div>
          </div>

          {/* Manager */}
          <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <div className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center">
              <UserIcon className="w-3.5 h-3.5 mr-1 text-slate-500 dark:text-slate-400" />
              Warehouse Manager
            </div>
            <div className="font-bold text-sm mt-1.5 text-slate-950 dark:text-white">
              {warehouse.manager || '—'}
            </div>
          </div>

          {/* Capacity */}
          <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <div className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              Total Storage Capacity
            </div>
            <div className="font-black text-base mt-1.5 text-teal-700 dark:text-teal-400 font-mono">
              {warehouse.capacitySqFt ? `${warehouse.capacitySqFt.toLocaleString()} Sq Ft` : (warehouse.capacity ? `${warehouse.capacity.toLocaleString()} Sq Ft` : '0 Sq Ft')}
            </div>
          </div>

          {/* Total Bins */}
          <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <div className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center">
              <Layers className="w-3.5 h-3.5 mr-1 text-slate-500 dark:text-slate-400" />
              Total Bins Allocated
            </div>
            <div className="font-black text-base mt-1.5 text-indigo-700 dark:text-indigo-400 font-mono">
              {warehouse.totalBins !== undefined && warehouse.totalBins !== null ? warehouse.totalBins : warehouseBins.length} Bins
            </div>
          </div>

          {/* Capacity Utilization */}
          <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <div className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              Capacity Utilization
            </div>
            <div className="mt-1.5 flex items-center justify-between">
              <span className="font-black text-base text-emerald-700 dark:text-emerald-400 font-mono">
                {warehouse.currentUtilizationPercent || 0}%
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full mt-2 overflow-hidden">
              <div 
                className="bg-emerald-600 dark:bg-emerald-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${warehouse.currentUtilizationPercent || 0}%` }} 
              />
            </div>
          </div>

          {/* Created At */}
          <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <div className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center">
              <Calendar className="w-3.5 h-3.5 mr-1 text-slate-500 dark:text-slate-400" />
              Created At
            </div>
            <div className="font-bold text-xs mt-1.5 text-slate-900 dark:text-slate-200">
              {formatDate(warehouse.createdAt || (warehouse as any).created_at)}
            </div>
          </div>

          {/* Updated At */}
          <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <div className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center">
              <Clock className="w-3.5 h-3.5 mr-1 text-slate-500 dark:text-slate-400" />
              Updated At
            </div>
            <div className="font-bold text-xs mt-1.5 text-slate-900 dark:text-slate-200">
              {formatDate(warehouse.updatedAt || (warehouse as any).updated_at || warehouse.createdAt)}
            </div>
          </div>
        </div>
      </div>

      {/* Storage Bins & Bay Allocations */}
      <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-2">
            <Box className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className={`text-base font-bold uppercase tracking-wider ${darkMode ? 'text-white' : 'text-slate-950'}`}>
              Storage Bins &amp; Bay Allocations ({warehouseBins.length})
            </h2>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            Physical bays configured in this facility
          </span>
        </div>

        {warehouseBins.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {warehouseBins.map((bin) => {
              const binStock = bin.currentStock || (bin.items ? bin.items.reduce((s, i) => s + (i.quantity || 0), 0) : 0);
              const itemsCount = bin.storedItemsCount || (bin.items ? bin.items.length : 0);

              return (
                <div
                  key={bin.id}
                  className={`p-4 rounded-xl border transition-all ${
                    darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      {bin.code}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      bin.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                    }`}>
                      {bin.status}
                    </span>
                  </div>

                  <div className="mt-2 font-bold text-sm text-slate-900 dark:text-white">
                    {bin.name}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Type: <strong className="text-slate-400">{bin.type}</strong>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Stock Qty</span>
                      <span className="font-mono font-bold text-emerald-400">
                        {binStock > 0 ? `${binStock.toLocaleString()} Kg` : '0 Kg'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">SKUs Stored</span>
                      <span className="font-mono font-bold text-indigo-400">
                        {itemsCount} {itemsCount === 1 ? 'Item' : 'Items'}
                      </span>
                    </div>
                  </div>

                  {bin.items && bin.items.length > 0 && (
                    <div className="mt-2 text-[11px] text-slate-400 truncate">
                      • {bin.items[0].name} ({bin.items[0].quantity} {bin.items[0].uom})
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-slate-500">
            No storage bins found for this warehouse.
          </div>
        )}
      </div>

      {/* Current Stored Inventory Table */}
      <div className={`rounded-2xl border overflow-hidden ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className={`text-base font-bold ${darkMode ? 'text-white' : 'text-slate-950'}`}>
              Stored Inventory in {warehouse.name}
            </h3>
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-0.5">
              Showing {filteredItems.length} of {allItems.length} active inventory items
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Type Filters */}
            <div className="flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setSelectedTypeFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedTypeFilter === 'all'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                All ({allItems.length})
              </button>
              <button
                onClick={() => setSelectedTypeFilter('raw')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedTypeFilter === 'raw'
                    ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Raw Materials ({rawItems.length})
              </button>
              <button
                onClick={() => setSelectedTypeFilter('product')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedTypeFilter === 'product'
                    ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Finished Goods ({productItems.length})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative min-w-[220px]">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500 dark:text-slate-400" />
              <input 
                type="text" 
                placeholder="Search code, name, category..." 
                className={`w-full pl-9 pr-3 py-2 rounded-xl border text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500/20 ${
                  darkMode 
                    ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-400 focus:border-emerald-500' 
                    : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-500 focus:border-emerald-600'
                }`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className={`text-xs uppercase tracking-wider font-bold ${
              darkMode ? 'bg-slate-800/80 text-slate-300 border-b border-slate-700' : 'bg-slate-100 text-slate-700 border-b border-slate-200'
            }`}>
              <tr>
                <th className="p-3.5 text-left">Item Code</th>
                <th className="p-3.5 text-left">Item Name</th>
                <th className="p-3.5 text-left">Type</th>
                <th className="p-3.5 text-left">Category</th>
                <th className="p-3.5 text-right">Available Stock</th>
                <th className="p-3.5 text-right">Valuation (₹)</th>
                <th className="p-3.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredItems.length > 0 ? (
                filteredItems.map(item => (
                  <tr 
                    key={item.id} 
                    className={`transition-colors ${
                      darkMode ? 'hover:bg-slate-800/60' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="p-3.5 font-mono text-xs font-bold text-indigo-700 dark:text-indigo-400">
                      {item.code}
                    </td>
                    <td 
                      className={`p-3.5 font-bold ${
                        ((item.type === 'Raw Material' && onSelectMaterial) || (item.type === 'Finished Product' && onSelectProduct)) 
                          ? 'cursor-pointer hover:underline text-blue-700 dark:text-blue-400' 
                          : darkMode ? 'text-white' : 'text-slate-900'
                      }`}
                      onClick={() => {
                        if (item.type === 'Raw Material' && onSelectMaterial) onSelectMaterial(item.id);
                        else if (item.type === 'Finished Product' && onSelectProduct) onSelectProduct(item.id);
                      }}
                    >
                      <div>
                        <div>{item.name}</div>
                        {item.binName && (
                          <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 font-bold mt-0.5">
                            Bin Location: <span className="bg-indigo-500/10 text-indigo-400 px-1 py-0.5 rounded border border-indigo-500/10">{item.binCode || item.binName}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                        item.type === 'Raw Material'
                          ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300'
                          : 'bg-blue-500/15 text-blue-800 dark:text-blue-300'
                      }`}>
                        {item.type}
                      </span>
                    </td>
                    <td className="p-3.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {item.category}
                    </td>
                    <td className="p-3.5 text-right font-mono font-extrabold text-slate-950 dark:text-white">
                      {item.stock.toLocaleString()} 
                      <span className="ml-1 text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase">
                        {item.unit}
                      </span>
                    </td>
                    <td className="p-3.5 text-right font-mono font-extrabold text-emerald-700 dark:text-emerald-400">
                      ₹{item.value.toLocaleString()}
                    </td>
                    <td className="p-3.5 text-center">
                      <span className="text-[11px] px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-200">
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-600 dark:text-slate-400 font-medium">
                    No items found matching the current search or filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

