import React, { useState } from 'react';
import { ArrowLeftRight, Search, Plus, X, Save, ArrowRight, Trash2, Loader2 } from 'lucide-react';
import { InventoryTransaction, Warehouse, RawMaterial, Product, TransactionType } from '../../types';
import { UserAvatar } from '../common/UserAvatar';
import { SearchableDropdown } from '../common/SearchableDropdown';

interface TransactionsViewProps {
  transactions: InventoryTransaction[];
  warehouses: Warehouse[];
  rawMaterials: RawMaterial[];
  products: Product[];
  onAddTransaction: (txn: InventoryTransaction) => void;
  onDeleteTransaction?: (id: string) => void;
  onSelectProduct?: (id: string) => void;
  onSelectMaterial?: (id: string) => void;
  darkMode: boolean;
  isLoading?: boolean;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  transactions,
  warehouses,
  rawMaterials,
  products,
  onAddTransaction,
  onDeleteTransaction,
  onSelectProduct,
  onSelectMaterial,
  darkMode,
  isLoading = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [itemTypeFilter, setItemTypeFilter] = useState('All');
  const [warehouseFilter, setWarehouseFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [itemType, setItemType] = useState<'Raw Material' | 'Finished Product'>('Raw Material');
  const [formData, setFormData] = useState<Partial<InventoryTransaction>>({
    transactionNumber: '',
    itemCode: '',
    itemName: '',
    itemType: 'Raw Material',
    warehouse: '',
    destinationWarehouse: '',
    quantity: 1,
    previousStock: 0,
    currentStock: 0,
    transactionType: 'Stock In',
    referenceType: 'Manual Adjustment',
    referenceNumber: '',
    user: 'System User',
    date: new Date().toISOString().slice(0, 10),
    time: new Date().toTimeString().slice(0, 5),
    reason: '',
    remarks: ''
  });

  const getWhNameDisplay = (wh: any): string => {
    if (!wh) return '';
    if (typeof wh === 'string') return wh;
    if (typeof wh === 'object' && wh.name) return wh.name;
    return String(wh);
  };

  const filteredTransactions = transactions.filter(tx => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = tx.itemName.toLowerCase().includes(searchLower) ||
                          tx.transactionNumber.toLowerCase().includes(searchLower) ||
                          tx.itemCode.toLowerCase().includes(searchLower) ||
                          (tx.referenceNumber && tx.referenceNumber.toLowerCase().includes(searchLower));
    
    const matchesType = typeFilter === 'All' || tx.transactionType === typeFilter;
    const matchesItemType = itemTypeFilter === 'All' || tx.itemType === itemTypeFilter;
    
    const whName = getWhNameDisplay(tx.warehouse);
    const destWhName = getWhNameDisplay(tx.destinationWarehouse);
    
    const matchesWarehouse = warehouseFilter === 'All' || 
                             whName === warehouseFilter || 
                             destWhName === warehouseFilter;

    return matchesSearch && matchesType && matchesItemType && matchesWarehouse;
  });

  const handleItemTypeChange = (type: 'Raw Material' | 'Finished Product') => {
    setItemType(type);
    setFormData(prev => ({
      ...prev,
      itemType: type,
      itemCode: '',
      itemName: '',
      warehouse: ''
    }));
  };

  const handleItemSelect = (id: string) => {
    const selectedItem = itemType === 'Raw Material'
      ? rawMaterials.find(rm => rm.id === id || rm.code === id)
      : products.find(p => p.id === id || p.code === id);

    if (selectedItem) {
      const currentStockVal = itemType === 'Raw Material'
        ? (selectedItem as RawMaterial).currentStock
        : (selectedItem as Product).availableStock;

      let warehouseName = '';
      if (selectedItem.warehouse) {
        if (typeof selectedItem.warehouse === 'object' && selectedItem.warehouse.name) {
          warehouseName = selectedItem.warehouse.name;
        } else {
          warehouseName = String(selectedItem.warehouse);
        }
      }

      setFormData(prev => ({
        ...prev,
        itemCode: selectedItem.id, // Store ID for reliability
        itemName: selectedItem.name,
        warehouse: warehouseName,
        previousStock: currentStockVal,
        currentStock: currentStockVal
      }));
    }
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.itemCode) {
      alert('Please select an item to proceed.');
      return;
    }

    const selectedItem = itemType === 'Raw Material'
      ? rawMaterials.find(rm => rm.id === formData.itemCode)
      : products.find(p => p.id === formData.itemCode);

    if (!selectedItem) {
      alert('Selected item not found.');
      return;
    }

    const isRaw = itemType === 'Raw Material';
    const itemId = selectedItem.id;

    // Resolve warehouse ID
    let warehouseName = '';
    if (selectedItem.warehouse) {
      if (typeof selectedItem.warehouse === 'object' && selectedItem.warehouse.name) {
        warehouseName = selectedItem.warehouse.name;
      } else {
        warehouseName = String(selectedItem.warehouse);
      }
    }
    
    const selectedItemAny = selectedItem as any;
    const sourceWhObj = warehouses.find(wh => 
      wh.name === warehouseName || 
      (warehouseName && wh.name.toLowerCase().includes(warehouseName.toLowerCase())) || 
      (warehouseName && warehouseName.toLowerCase().includes(wh.name.toLowerCase())) ||
      wh.id === selectedItemAny.warehouseId
    );
    const sourceWarehouseId = selectedItemAny.warehouseId || (typeof selectedItemAny.warehouse === 'object' ? selectedItemAny.warehouse?.id : null) || sourceWhObj?.id || warehouses[0]?.id;

    if (!sourceWarehouseId) {
      alert('Could not resolve primary warehouse location.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const targetType = formData.transactionType || 'Stock In';
    let action = 'in';
    let payload: any = {};

    if (targetType === 'Warehouse Transfer') {
      action = 'transfer';
      const destWhObj = warehouses.find(wh => wh.name === formData.destinationWarehouse);
      payload = {
        materialId: isRaw ? itemId : undefined,
        productId: !isRaw ? itemId : undefined,
        sourceWarehouseId: sourceWarehouseId,
        destinationWarehouseId: destWhObj?.id || '',
        quantity: Math.abs(Number(formData.quantity) || 0),
        remarks: formData.remarks || 'Warehouse Transfer',
        user: formData.user || 'System User'
      };
    } else if (targetType === 'Stock Adjustment') {
      action = 'adjustment';
      payload = {
        itemType: isRaw ? 'RAW_MATERIAL' : 'PRODUCT',
        itemId: itemId,
        warehouseId: sourceWarehouseId,
        quantity: Number(formData.quantity) || 0,
        reason: formData.reason || 'Manual Stock Adjustment',
        user: formData.user || 'System User'
      };
    } else if ([
      'Stock Out',
      'Production Issue',
      'Sales Return',
      'Stock Out'
    ].includes(targetType)) {
      action = 'out';
      payload = {
        materialId: isRaw ? itemId : undefined,
        productId: !isRaw ? itemId : undefined,
        warehouseId: sourceWarehouseId,
        quantity: Math.abs(Number(formData.quantity) || 0),
        reason: formData.reason || 'Manual Stock Out',
        remarks: formData.remarks || '',
        referenceNumber: formData.referenceNumber || undefined,
        user: formData.user || 'System User'
      };
    } else {
      action = 'in';
      payload = {
        materialId: isRaw ? itemId : undefined,
        productId: !isRaw ? itemId : undefined,
        warehouseId: sourceWarehouseId,
        quantity: Math.abs(Number(formData.quantity) || 0),
        reason: formData.reason || 'Manual Stock In',
        remarks: formData.remarks || '',
        referenceNumber: formData.referenceNumber || undefined,
        user: formData.user || 'System User'
      };
    }

    try {
      const response = await fetch(`/api/stock-movements?action=${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || result.message || 'Failed to post stock movement');
      }

      const t = result.data;
      const mappedTxn: InventoryTransaction = {
        id: t.id,
        transactionNumber: t.transactionNumber || `TRX-${t.id}`,
        itemCode: t.itemCode || selectedItem.code,
        itemName: t.itemName || selectedItem.name,
        itemType: itemType,
        warehouse: getWhNameDisplay(t.warehouse) || getWhNameDisplay(selectedItem.warehouse),
        destinationWarehouse: getWhNameDisplay(t.destinationWarehouse) || formData.destinationWarehouse || undefined,
        quantity: t.quantity,
        previousStock: t.previousStock,
        currentStock: t.currentStock,
        transactionType: t.transactionType || targetType,
        user: t.user || formData.user || 'System User',
        date: t.date || (t.createdAt && typeof t.createdAt === 'string' ? t.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]),
        time: t.time || (t.createdAt && typeof t.createdAt === 'string' ? t.createdAt.split('T')[1]?.substring(0, 5) : new Date().toTimeString().split(' ')[0].substring(0, 5)),
        reason: t.reason || formData.reason || '',
        remarks: t.remarks || formData.remarks || '',
        referenceNumber: t.referenceNumber || undefined,
        referenceType: t.referenceType || undefined
      };

      onAddTransaction(mappedTxn);
      setIsModalOpen(false);

      setFormData({
        transactionNumber: '',
        itemCode: '',
        itemName: '',
        itemType: 'Raw Material',
        warehouse: '',
        destinationWarehouse: '',
        quantity: 1,
        previousStock: 0,
        currentStock: 0,
        transactionType: 'Stock In',
        referenceType: 'Manual Adjustment',
        referenceNumber: '',
        user: 'System User',
        date: new Date().toISOString().slice(0, 10),
        time: new Date().toTimeString().slice(0, 5),
        reason: '',
        remarks: ''
      });
    } catch (err: any) {
      console.error('Error posting stock movement:', err);
      setSubmitError(err.message || 'An error occurred while posting stock movement.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Stock Movements & Transactions Ledger
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Complete real-time audit trail of purchases, sales dispatch, production consumption, warehouse transfers, and adjustments.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-600/20 flex items-center space-x-2 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Post Manual Stock Adjustment</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className={`p-5 rounded-2xl border flex flex-col lg:flex-row items-center gap-4 ${
        darkMode ? 'bg-slate-900/85 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="relative w-full lg:flex-1">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by transaction #, reference #, or item name..."
            className={`w-full pl-10 pr-4 py-2 rounded-xl border text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
              darkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'
            }`}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full lg:w-auto">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400 font-medium shrink-0">Item:</span>
            <select
              value={itemTypeFilter}
              onChange={(e) => setItemTypeFilter(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl border text-xs font-medium focus:outline-none ${
                darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <option value="All">All Types</option>
              <option value="Raw Material">Raw Material</option>
              <option value="Finished Product">Finished Product</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400 font-medium shrink-0">Warehouse:</span>
            <select
              value={warehouseFilter}
              onChange={(e) => setWarehouseFilter(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl border text-xs font-medium focus:outline-none ${
                darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <option value="All">All Warehouses</option>
              {warehouses.map(wh => (
                <option key={wh.id} value={wh.name}>{wh.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400 font-medium shrink-0">Movement:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl border text-xs font-medium focus:outline-none ${
                darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <option value="All">All Movements</option>
              <option value="Purchase">Purchase Movement</option>
              <option value="Stock In">Record Stock In</option>
              <option value="Stock Out">Record Stock Out</option>
              <option value="Warehouse Transfer">Warehouse Transfer</option>
              <option value="Production Consumption">Production Consumption</option>
              <option value="Production Receipt">Production Receipt</option>
              <option value="Sales Dispatch">Sales Dispatch Movement</option>
              <option value="Stock Adjustment">Stock Adjustment</option>
              <option value="Damage">Damage / Scrap</option>
              <option value="Return">Material Return</option>
            </select>
          </div>
        </div>
      </div>

      {/* Movements Table */}
      <div className={`rounded-2xl border overflow-hidden ${darkMode ? 'bg-slate-900/85 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`border-b text-xs font-bold uppercase tracking-wider ${
                darkMode ? 'bg-slate-800/80 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}>
                <th className="p-4 border-r last:border-r-0 dark:border-slate-800">Txn # / Date</th>
                <th className="p-4 border-r last:border-r-0 dark:border-slate-800">Item Details</th>
                <th className="p-4 border-r last:border-r-0 dark:border-slate-800">Movement Type</th>
                <th className="p-4 border-r last:border-r-0 dark:border-slate-800">Warehouse Location</th>
                <th className="p-4 border-r last:border-r-0 dark:border-slate-800">Qty Moved</th>
                <th className="p-4 border-r last:border-r-0 dark:border-slate-800">Stock Flow</th>
                <th className="p-4 border-r last:border-r-0 dark:border-slate-800">Reference & Remarks</th>
                {onDeleteTransaction && (
                  <th className="p-4 border-r last:border-r-0 dark:border-slate-800 text-center">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={onDeleteTransaction ? 8 : 7} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mx-auto" />
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        Loading transaction data, please wait...
                      </p>
                    </div>
                  </td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={onDeleteTransaction ? 8 : 7} className="p-8 text-center text-slate-400 font-medium">
                    No stock movements matched your filters.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map(tx => {
                  const isPositive = tx.quantity >= 0;
                  const isTransfer = tx.transactionType === 'Warehouse Transfer';
                  return (
                    <tr key={tx.id} className={`transition-colors ${darkMode ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50/80'}`}>
                      <td className="p-4 border-r last:border-r-0 dark:border-slate-800">
                        <div className="font-bold text-xs font-mono text-blue-400">{tx.transactionNumber}</div>
                        <div className="text-[11px] text-slate-400 mt-1">{tx.date} {tx.time}</div>
                      </td>
                      <td className="p-4 border-r last:border-r-0 dark:border-slate-800">
                        <div className="flex items-center space-x-1.5">
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            tx.itemType === 'Raw Material'
                              ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                              : 'bg-teal-500/10 text-teal-400 border border-teal-500/20'
                          }`}>
                            {tx.itemType === 'Raw Material' ? 'RM' : 'FG'}
                          </span>
                          <span className="font-mono font-bold text-xs text-slate-500">{tx.itemCode}</span>
                        </div>
                        <div className={`font-semibold text-xs mt-1 max-w-[200px] truncate ${darkMode ? 'text-white' : 'text-slate-900'} ${((tx.itemType === 'Raw Material' && onSelectMaterial) || (tx.itemType === 'Finished Product' && onSelectProduct)) ? 'cursor-pointer hover:underline' : ''}`}
                          onClick={() => {
                            if (tx.itemType === 'Raw Material' && onSelectMaterial) {
                              const m = rawMaterials.find(rm => rm.code === tx.itemCode || rm.id === tx.itemCode);
                              if (m) onSelectMaterial(m.id);
                            } else if (tx.itemType === 'Finished Product' && onSelectProduct) {
                              const p = products.find(prod => prod.code === tx.itemCode || prod.id === tx.itemCode);
                              if (p) onSelectProduct(p.id);
                            }
                          }}
                        >
                          {tx.itemName}
                        </div>
                      </td>
                      <td className="p-4 border-r last:border-r-0 dark:border-slate-800">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          tx.transactionType === 'Stock In' || tx.transactionType === 'Production Issue'
                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                            : tx.transactionType === 'Warehouse Transfer' || tx.transactionType === 'Stock Out'
                            ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                            : tx.transactionType === 'Stock Adjustment'
                            ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                            : tx.transactionType === 'QC Release'
                            ? 'bg-purple-500/10 text-purple-500 border border-purple-500/20'
                            : 'bg-slate-500/10 text-slate-500 border border-slate-500/20'
                        }`}>
                          {tx.transactionType}
                        </span>
                      </td>
                      <td className="p-4 border-r last:border-r-0 dark:border-slate-800 text-xs font-medium">
                        {isTransfer ? (
                          <div className="flex items-center space-x-1.5">
                            <span className="text-slate-400 truncate max-w-[100px] block" title={getWhNameDisplay(tx.warehouse)}>{getWhNameDisplay(tx.warehouse).replace(/\s*\(.*\)/, '')}</span>
                            <ArrowRight className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                            <span className="text-blue-400 font-bold truncate max-w-[100px] block" title={getWhNameDisplay(tx.destinationWarehouse)}>{getWhNameDisplay(tx.destinationWarehouse).replace(/\s*\(.*\)/, '')}</span>
                          </div>
                        ) : (
                          <span className="truncate max-w-[150px] block" title={getWhNameDisplay(tx.warehouse)}>{getWhNameDisplay(tx.warehouse)}</span>
                        )}
                      </td>
                      <td className="p-4 border-r last:border-r-0 dark:border-slate-800">
                        <span className={`font-black text-xs ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {isPositive ? `+${tx.quantity.toLocaleString()}` : tx.quantity.toLocaleString()}
                        </span>
                      </td>
                      <td className="p-4 border-r last:border-r-0 dark:border-slate-800">
                        <div className="text-[11px] text-slate-400">Prev: {tx.previousStock.toLocaleString()}</div>
                        <div className="text-[11px] font-bold mt-0.5">Curr: {tx.currentStock.toLocaleString()}</div>
                      </td>
                      <td className="p-4 border-r last:border-r-0 dark:border-slate-800 text-xs">
                        <div className="flex items-center space-x-1.5">
                          {tx.referenceType && (
                            <span className="px-1.5 py-0.5 rounded bg-slate-500/10 text-slate-400 text-[9px] font-bold uppercase tracking-wider">
                              {tx.referenceType}
                            </span>
                          )}
                          <span className="font-mono font-bold text-slate-300">{tx.referenceNumber}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1 max-w-[200px] truncate" title={`${tx.reason} ${tx.remarks}`}>
                          {tx.reason} {tx.remarks && `| ${tx.remarks}`}
                        </div>
                        {tx.user && (
                          <div className="flex items-center space-x-1.5 mt-1.5 pt-1 border-t border-slate-800/20">
                            <UserAvatar name={tx.user} size="xs" />
                            <span className="text-[10px] text-slate-400 font-semibold">{tx.user}</span>
                          </div>
                        )}
                      </td>
                      {onDeleteTransaction && (
                        <td className="p-4 text-center border-r last:border-r-0 dark:border-slate-800">
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this stock movement? This action cannot be undone.')) {
                                onDeleteTransaction(tx.id);
                              }
                            }}
                            className="p-1.5 rounded-xl hover:bg-rose-500/10 text-rose-500 transition-colors cursor-pointer"
                            title="Delete Stock Movement"
                          >
                            <Trash2 className="w-4.5 h-4.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Post Stock Movement Modal */}
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
            <h2 className="text-xl font-bold mb-1">Post Stock Movement</h2>
            <p className="text-xs text-slate-400 mb-6">Record a manual inventory inflow, outflow, transfer, or stock reconciliation adjustment.</p>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Item Type Switcher */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Item Classification</label>
                <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-800/40 border border-slate-800">
                  <button
                    type="button"
                    onClick={() => handleItemTypeChange('Raw Material')}
                    className={`py-2 text-xs font-bold rounded-lg transition-colors ${
                      itemType === 'Raw Material'
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-400 hover:bg-slate-800/40 hover:text-white'
                    }`}
                  >
                    Raw Materials (In-Store Reels / Glue)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleItemTypeChange('Finished Product')}
                    className={`py-2 text-xs font-bold rounded-lg transition-colors ${
                      itemType === 'Finished Product'
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-400 hover:bg-slate-800/40 hover:text-white'
                    }`}
                  >
                    Finished Goods (Boxes / Sheets)
                  </button>
                </div>
              </div>

              {/* Dynamic Item Select */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Select Product / Raw Material</label>
                <SearchableDropdown
                  items={itemType === 'Raw Material' 
                    ? rawMaterials.map(rm => ({ id: rm.id, code: rm.code || '', name: rm.name, stock: rm.currentStock, unit: rm.uom }))
                    : products.map(p => ({ id: p.id, code: p.code || '', name: p.name, stock: p.availableStock, unit: p.unit }))
                  }
                  value={formData.itemCode || ''}
                  onChange={(id) => handleItemSelect(id)}
                  placeholder="-- Click to choose item --"
                  darkMode={darkMode}
                />
              </div>

              {/* Transaction Type & Quantities */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Movement / Transaction Type</label>
                  <select
                    value={formData.transactionType || 'Stock In'}
                    onChange={(e) => setFormData({ ...formData, transactionType: e.target.value as any })}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                  >
                    <option value="Stock In">Stock In (+)</option>
                    <option value="Stock Out">Stock Out (-)</option>
                    <option value="Warehouse Transfer">Warehouse Transfer (⇆)</option>
                    <option value="Stock Adjustment">Manual Stock Adjustment (+/-)</option>
                    <option value="Purchase">Purchase Movement (+)</option>
                    <option value="Sales Dispatch">Sales Dispatch (-)</option>
                    <option value="Production Consumption">Production Consumption (-)</option>
                    <option value="Production Receipt">Production Receipt (+)</option>
                    <option value="Damage">Damage / Scrap (-)</option>
                    <option value="Return">Material Return (+)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    {formData.transactionType === 'Warehouse Transfer' ? 'Transfer Quantity' : 'Quantity (+ / -)'}
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formData.quantity || 0}
                    onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Movement Date</label>
                  <input
                    type="date"
                    required
                    value={formData.date || ''}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                  />
                </div>
              </div>

              {/* Warehouse Locations */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    {formData.transactionType === 'Warehouse Transfer' ? 'Source Warehouse' : 'Primary Warehouse'}
                  </label>
                  <input
                    type="text"
                    disabled
                    value={formData.warehouse || 'Selected item warehouse'}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm opacity-70 ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-500'}`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Destination Warehouse {formData.transactionType !== 'Warehouse Transfer' && '(Optional / Disabled)'}
                  </label>
                  <select
                    disabled={formData.transactionType !== 'Warehouse Transfer'}
                    required={formData.transactionType === 'Warehouse Transfer'}
                    value={formData.destinationWarehouse || ''}
                    onChange={(e) => setFormData({ ...formData, destinationWarehouse: e.target.value })}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                      formData.transactionType !== 'Warehouse Transfer' 
                        ? 'opacity-50 cursor-not-allowed bg-slate-800/10' 
                        : (darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800')
                    }`}
                  >
                    <option value="">-- Choose Destination --</option>
                    {warehouses.map(wh => (
                      <option key={wh.id} value={wh.name} disabled={wh.name === formData.warehouse}>
                        {wh.name} {wh.name === formData.warehouse ? '(Same as Source)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* References */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Reference Type</label>
                  <select
                    value={formData.referenceType}
                    onChange={(e) => setFormData({ ...formData, referenceType: e.target.value as any })}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                  >
                    <option value="Manual Adjustment">Manual Adjustment</option>
                    <option value="Purchase Order">Purchase Order (PO)</option>
                    <option value="Sales Order">Sales Order (SO)</option>
                    <option value="Production Order">Production Order</option>
                    <option value="Goods Receipt Note">Goods Receipt Note (GRN)</option>
                    <option value="Delivery Challan">Delivery Challan</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Reference Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. PO-9921, SO-5849, or manual count code"
                    value={formData.referenceNumber || ''}
                    onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  />
                </div>
              </div>

              {/* Remarks and Reason */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Short Reason / Title</label>
                  <input
                    type="text"
                    required
                    value={formData.reason || ''}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    placeholder="e.g. Annual physical inventory reconciliation"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Description / Remarks (Optional)</label>
                  <input
                    type="text"
                    value={formData.remarks || ''}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    placeholder="e.g. Verified by auditor, physical count matched 100%"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  />
                </div>
              </div>

              {/* Error Banner */}
              {submitError && (
                <div className="p-4 rounded-xl text-xs font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/20">
                  {submitError}
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border text-sm font-semibold transition-all cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 flex items-center space-x-2 transition-all cursor-pointer hover:bg-emerald-500 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSubmitting ? 'Posting...' : 'Post Stock Movement'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
