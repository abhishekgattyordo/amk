import React, { useState, useMemo, useEffect } from 'react';
import { Truck, Plus, Search, Eye, Trash2, Calendar, FileText, AlertTriangle, Sparkles, Loader2, X } from 'lucide-react';
import { InvoiceScanner, ExtractedInvoiceData } from '../common/InvoiceScanner';
import { UniversalServerSelect } from '../common/UniversalServerSelect';

interface GateEntryViewProps {
  darkMode: boolean;
  gateEntries: any[];
  suppliers: any[];
  purchaseOrders: any[];
  warehouses: any[];
  rawMaterials: any[];
  currentUser?: any;
  getSupplierDisplayName: (supplierId?: string, supplierName?: string, millName?: string, supplierObj?: any) => string;
  onRefreshData?: () => Promise<void>;
  onAddNotification?: (notif: any) => void;
  onGateEntryCreated?: (newEntry: any) => void;
  onGateEntryDeleted?: (id: string) => void;
}

export const GateEntryView: React.FC<GateEntryViewProps> = ({
  darkMode,
  gateEntries = [],
  suppliers = [],
  purchaseOrders = [],
  warehouses = [],
  rawMaterials = [],
  currentUser,
  getSupplierDisplayName,
  onRefreshData,
  onAddNotification,
  onGateEntryCreated,
  onGateEntryDeleted
}) => {
  const effectiveWarehouses = warehouses || [];
  const [searchTerm, setSearchTerm] = useState('');
  const [isGeModalOpen, setIsGeModalOpen] = useState(false);
  const [selectedGe, setSelectedGe] = useState<any | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (gateEntries.length === 0 && onRefreshData) {
      onRefreshData();
    }
  }, []);

  // New Gate Entry Form State
  const [newGe, setNewGe] = useState({
    supplierId: '',
    poNumber: '',
    warehouseId: warehouses[0]?.id || '',
    vehicleNumber: '',
    driverName: '',
    driverPhone: '',
    transportCompany: '',
    remarks: '',
    quantityReceived: 1000,
    materialCode: '',
    isCustomSupplier: false,
    customSupplierName: '',
    isCustomPo: false,
    scannedSupplierName: '',
    scannedPoNumber: '',
    items: [] as any[]
  });

  const [isScanning, setIsScanning] = useState(false);
  const [isMatching, setIsMatching] = useState(false);
  const [scanStatus, setScanStatus] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  const getTransporterName = (ge: any) => {
    if (!ge) return 'N/A';
    if (ge.transportCompany && ge.transportCompany !== 'N/A') return ge.transportCompany;
    if (ge.remarks) {
      const match = ge.remarks.match(/\[Transporter:\s*([^\]]+)\]/i);
      if (match && match[1]) return match[1].trim();
    }
    return 'N/A';
  };

  const getDriverPhoneNum = (ge: any) => {
    if (!ge) return 'N/A';
    if (ge.driverPhone && ge.driverPhone !== 'N/A') return ge.driverPhone;
    if (ge.remarks) {
      const match = ge.remarks.match(/\[Driver Phone:\s*([^\]]+)\]/i);
      if (match && match[1]) return match[1].trim();
    }
    return 'N/A';
  };

  const getSupplierForGe = (ge: any) => {
    if (!ge) return 'N/A';
    if (ge.purchaseOrder?.supplier) {
      return getSupplierDisplayName(
        ge.purchaseOrder.supplier.id,
        ge.purchaseOrder.supplier.supplierName,
        ge.purchaseOrder.supplier.millName,
        ge.purchaseOrder.supplier
      );
    }
    if (ge.purchaseOrder?.supplierName) {
      return ge.purchaseOrder.supplierName;
    }
    const matchedPo = purchaseOrders.find(p => p.poNumber === ge.poNumber || p.id === ge.poId);
    if (matchedPo) {
      if (matchedPo.supplier) {
        return getSupplierDisplayName(
          matchedPo.supplier.id,
          matchedPo.supplier.supplierName,
          matchedPo.supplier.millName,
          matchedPo.supplier
        );
      }
      if (matchedPo.supplierName) return matchedPo.supplierName;
      if (matchedPo.supplierId) {
        const foundSup = suppliers.find(s => s.id === matchedPo.supplierId);
        if (foundSup) return getSupplierDisplayName(foundSup.id, foundSup.supplierName, foundSup.millName, foundSup);
      }
    }
    if (ge.supplierId) {
      const foundSup = suppliers.find(s => s.id === ge.supplierId);
      if (foundSup) return getSupplierDisplayName(foundSup.id, foundSup.supplierName, foundSup.millName, foundSup);
    }
    if (ge.supplierName) return ge.supplierName;
    return 'N/A';
  };

  const filteredGateEntries = useMemo(() => {
    if (!searchTerm.trim()) return gateEntries;
    const q = searchTerm.toLowerCase();
    return gateEntries.filter(ge => {
      const transporter = getTransporterName(ge);
      const supplier = getSupplierForGe(ge);
      return (
        (ge.gateEntryNumber && ge.gateEntryNumber.toLowerCase().includes(q)) ||
        (ge.poNumber && ge.poNumber.toLowerCase().includes(q)) ||
        (ge.vehicleNumber && ge.vehicleNumber.toLowerCase().includes(q)) ||
        (transporter && transporter.toLowerCase().includes(q)) ||
        (supplier && supplier.toLowerCase().includes(q)) ||
        (ge.driverName && ge.driverName.toLowerCase().includes(q)) ||
        (ge.itemsReceived && ge.itemsReceived.some((it: any) => it.materialName?.toLowerCase().includes(q)))
      );
    });
  }, [gateEntries, searchTerm, purchaseOrders, suppliers]);

  const handleAiInvoiceDataExtracted = async (extracted: ExtractedInvoiceData) => {
    setIsScanning(false);
    setIsMatching(true);
    setScanStatus('Matching extracted invoice with Purchase Orders & Suppliers...');

    try {
      const matchRes = await fetch('/api/procurement/match-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(extracted)
      });
      const matchData = await matchRes.json();
      
      let matchedSuppId = '';
      let matchedPoNum = '';
      let resolvedSupplierName = extracted.supplierName || '';

      if (matchData.success && matchData.data) {
        if (matchData.data.supplierId) {
          matchedSuppId = matchData.data.supplierId;
        }
        if (matchData.data.poNumber) {
          matchedPoNum = matchData.data.poNumber;
        }
      }

      if (!matchedSuppId && resolvedSupplierName) {
        const foundSup = suppliers.find(s => 
          (s.supplierName && s.supplierName.toLowerCase().includes(resolvedSupplierName.toLowerCase())) ||
          (s.millName && s.millName.toLowerCase().includes(resolvedSupplierName.toLowerCase()))
        );
        if (foundSup) {
          matchedSuppId = foundSup.id;
        }
      }

      if (!matchedPoNum && extracted.invoiceNumber) {
        const foundPo = purchaseOrders.find(p => p.poNumber === extracted.invoiceNumber || p.id === extracted.invoiceNumber);
        if (foundPo) {
          matchedPoNum = foundPo.poNumber;
          if (!matchedSuppId) matchedSuppId = foundPo.supplierId;
        }
      }

      const scannedItems = (extracted.items && extracted.items.length > 0) ? extracted.items.map(it => {
        const matchedMat = rawMaterials.find(rm => 
          rm.code?.toLowerCase() === it.materialCode?.toLowerCase() || 
          rm.name?.toLowerCase().includes(it.description?.toLowerCase() || '')
        );
        return {
          materialId: matchedMat?.id || '',
          materialCode: it.materialCode || matchedMat?.code || 'RM-RAW',
          materialName: it.description || matchedMat?.name || 'Raw Material',
          quantityReceived: it.quantity || 1000,
          unit: it.unit || 'Kg',
          unitPrice: it.unitPrice || 0,
          totalAmount: it.totalAmount || ((it.quantity || 1000) * (it.unitPrice || 0)),
          scannedMaterialName: it.description
        };
      }) : [];

      setNewGe(prev => ({
        ...prev,
        supplierId: matchedSuppId,
        poNumber: matchedPoNum,
        vehicleNumber: extracted.vehicleNumber || prev.vehicleNumber,
        driverName: extracted.driverName || prev.driverName,
        transportCompany: extracted.transportCompany || prev.transportCompany,
        invoiceNumber: extracted.invoiceNumber || '',
        scannedSupplierName: resolvedSupplierName,
        scannedPoNumber: matchedPoNum || extracted.invoiceNumber || '',
        items: scannedItems.length > 0 ? scannedItems : prev.items
      }));

      setScanStatus('Successfully extracted and matched invoice details!');
      setTimeout(() => setScanStatus(null), 3000);
    } catch (err) {
      console.error('Error matching scanned invoice:', err);
      setScanError('Failed to match invoice with database records.');
    } finally {
      setIsMatching(false);
    }
  };

  const handleCreateGateEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGe.supplierId && !newGe.isCustomSupplier) {
      alert('Please select a supplier.');
      return;
    }
    if (!newGe.poNumber) {
      alert('Please select a valid Purchase Order.');
      return;
    }
    if (!newGe.vehicleNumber || !newGe.vehicleNumber.trim()) {
      alert('Please enter a vehicle number.');
      return;
    }
    if (!newGe.warehouseId) {
      alert('Please select a warehouse.');
      return;
    }

    const po = purchaseOrders.find(p => p.poNumber === newGe.poNumber);
    const finalItems = newGe.items && newGe.items.length > 0
      ? newGe.items
      : [{
          materialId: po?.items[0] ? rawMaterials.find(rm => rm.code === po.items[0].materialCode || rm.name === po.items[0].materialName)?.id : undefined,
          materialCode: newGe.materialCode || po?.items[0]?.materialCode || 'RM-RAW',
          materialName: po?.items[0]?.materialName || 'Raw Material',
          quantityReceived: newGe.quantityReceived || 1000,
          unit: 'Kg',
          unitPrice: po?.items[0]?.unitPrice || 0
        }];

    const payload = {
      poId: po ? po.id : null,
      poNumber: newGe.poNumber,
      warehouseId: newGe.warehouseId,
      vehicleNumber: newGe.vehicleNumber.trim(),
      driverName: newGe.driverName.trim(),
      driverPhone: newGe.driverPhone.trim(),
      transportCompany: newGe.transportCompany.trim(),
      remarks: newGe.remarks,
      items: finalItems.map((it: any) => ({
        materialId: it.materialId || null,
        materialCode: it.materialCode || 'RM-CUSTOM',
        materialName: it.materialName,
        quantityReceived: it.quantityReceived,
        unitPrice: it.unitPrice || 0,
        unit: it.unit || 'Kg'
      }))
    };

    try {
      const res = await fetch('/api/gate-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed to create gate entry');

      const entry = {
        ...data.data,
        arrivalDate: data.data.createdAt ? new Date(data.data.createdAt).toISOString().replace('T', ' ').slice(0, 16) : 'N/A',
        itemsReceived: data.data.items || []
      };

      if (onGateEntryCreated) onGateEntryCreated(entry);
      if (onAddNotification) {
        onAddNotification({
          title: 'Gate Entry Logged',
          message: `Gate Entry #${entry.gateEntryNumber} recorded for Vehicle ${entry.vehicleNumber}.`,
          type: 'success',
          time: 'Just Now',
          module: 'Procurement'
        });
      }
      setIsGeModalOpen(false);
      setNewGe({
        supplierId: '',
        poNumber: '',
        warehouseId: warehouses[0]?.id || '',
        vehicleNumber: '',
        driverName: '',
        driverPhone: '',
        transportCompany: '',
        remarks: '',
        quantityReceived: 1000,
        materialCode: '',
        isCustomSupplier: false,
        customSupplierName: '',
        isCustomPo: false,
        scannedSupplierName: '',
        scannedPoNumber: '',
        items: []
      });
    } catch (err: any) {
      console.error('Error creating gate entry:', err);
      alert(`Error: ${err.message}`);
    }
  };

  const handleDeleteGateEntry = async (id: string, geNumber: string) => {
    if (!window.confirm(`Are you sure you want to delete Gate Entry #${geNumber}?`)) return;
    setIsDeleting(id);
    try {
      const res = await fetch(`/api/gate-entries?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed to delete');
      if (onGateEntryDeleted) onGateEntryDeleted(id);
      if (onAddNotification) {
        onAddNotification({
          title: 'Gate Entry Deleted',
          message: `Gate Entry #${geNumber} has been deleted.`,
          type: 'alert',
          time: 'Just Now',
          module: 'Procurement'
        });
      }
    } catch (err: any) {
      console.error('Error deleting gate entry:', err);
      alert(`Failed to delete: ${err.message}`);
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Gate Entry Management</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Log incoming transport vehicles, scan challans, and record standard material gate receipts.</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search gate entries, PO, vehicle..."
              className={`pl-9 pr-4 py-2 rounded-xl border text-xs w-64 ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300'}`}
            />
          </div>
          <button
            onClick={() => setIsGeModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 flex items-center space-x-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ New Gate Entry</span>
          </button>
        </div>
      </div>

      {/* Gate Entry Table */}
      <div className={`rounded-2xl border overflow-hidden ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className={`border-b font-bold uppercase tracking-wider ${darkMode ? 'bg-slate-800/80 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                <th className="p-3">Gate Entry No. / PO</th>
                <th className="p-3">Supplier</th>
                <th className="p-3">Vehicle Detail</th>
                <th className="p-3">Transporter</th>
                <th className="p-3">Material & Qty</th>
                <th className="p-3">Warehouse</th>
                <th className="p-3">Date</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/40">
              {filteredGateEntries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-400">
                    <Truck className="w-8 h-8 mx-auto mb-2 opacity-40 text-indigo-500" />
                    <p className="font-medium">No gate entry records found.</p>
                  </td>
                </tr>
              ) : (
                filteredGateEntries.map(ge => {
                  const transporter = getTransporterName(ge);
                  const driverPhone = getDriverPhoneNum(ge);
                  const supplierName = getSupplierForGe(ge);

                  return (
                    <tr key={ge.id} className={`transition-colors ${darkMode ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}`}>
                      <td className="p-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {ge.gateEntryNumber}
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-normal">{ge.poNumber}</span>
                      </td>
                      <td className="p-3 font-bold text-slate-900 dark:text-slate-100">
                        {supplierName}
                      </td>
                      <td className="p-3">
                        <span className="font-bold text-amber-600 dark:text-amber-400">{ge.vehicleNumber}</span>
                        <span className="text-slate-600 dark:text-slate-400 block text-[10px]">{ge.driverName || 'N/A'} ({driverPhone})</span>
                      </td>
                      <td className="p-3 text-slate-900 dark:text-slate-100 font-semibold">
                        {transporter !== 'N/A' ? (
                          <span className="inline-block px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs border border-indigo-200 dark:border-indigo-800/50">
                            {transporter}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-normal">N/A</span>
                        )}
                      </td>
                      <td className="p-3">
                        <span className="font-semibold text-slate-900 dark:text-slate-100">{ge.itemsReceived?.[0]?.materialName || 'Raw Material'}</span>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-bold">{(ge.itemsReceived?.[0]?.quantityReceived || 0).toLocaleString()} Kg</span>
                      </td>
                      <td className="p-3 text-slate-800 dark:text-slate-200 font-medium">
                        {ge.warehouse?.name && ge.warehouse.name !== 'new' 
                          ? ge.warehouse.name 
                          : (warehouses.find(w => w.id === ge.warehouseId)?.name || 'N/A')}
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-300">{ge.arrivalDate}</td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => {
                              setSelectedGe(ge);
                              setIsDetailModalOpen(true);
                            }}
                            title="View Details"
                            className="p-1.5 rounded-lg hover:bg-slate-500/20 text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteGateEntry(ge.id, ge.gateEntryNumber)}
                            disabled={isDeleting === ge.id}
                            title="Delete Gate Entry"
                            className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                          >
                            {isDeleting === ge.id ? <Loader2 className="w-4 h-4 animate-spin text-rose-500" /> : <Trash2 className="w-4 h-4" />}
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

      {/* NEW GATE ENTRY MODAL */}
      {isGeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto">
          <div className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl border p-6 relative ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            <button onClick={() => setIsGeModalOpen(false)} className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-slate-800/50 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold mb-1">Create Material Gate Entry</h3>
            <p className="text-xs text-slate-400 mb-4">Log incoming vehicle arrival details and assign to a valid Purchase Order.</p>

            <div className="mb-4">
              <InvoiceScanner
                darkMode={darkMode}
                onScanStart={() => {
                  setIsScanning(true);
                  setScanStatus('Scanning document...');
                  setScanError(null);
                }}
                onScanError={(err) => {
                  setIsScanning(false);
                  setScanError(err);
                }}
                onDataExtracted={handleAiInvoiceDataExtracted}
              />
              {(isScanning || isMatching) && (
                <div className="mt-2 p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 flex items-center space-x-3">
                  <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
                  <p className="text-xs font-bold text-emerald-400">{scanStatus || 'Processing...'}</p>
                </div>
              )}
            </div>

             <form onSubmit={handleCreateGateEntry} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Supplier *</label>
                  <UniversalServerSelect
                    endpoint="/api/suppliers"
                    value={newGe.supplierId}
                    onChange={(id, sup) => setNewGe({ ...newGe, supplierId: id, poNumber: '' })}
                    placeholder="Search or select supplier..."
                    searchPlaceholder="Search supplier name or code..."
                    darkMode={darkMode}
                    required={true}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Purchase Order *</label>
                  <UniversalServerSelect
                    endpoint={`/api/purchase-orders${newGe.supplierId ? `?supplierId=${newGe.supplierId}` : ''}`}
                    value={newGe.poNumber}
                    onChange={(id, po) => {
                      setNewGe({
                        ...newGe,
                        poNumber: po?.poNumber || id,
                        supplierId: po?.supplierId || newGe.supplierId
                      });
                    }}
                    placeholder="Search or select PO..."
                    searchPlaceholder="Search PO number or supplier..."
                    darkMode={darkMode}
                    required={true}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Warehouse *</label>
                  <select
                    id="gate-entry-warehouse-select"
                    required
                    value={newGe.warehouseId}
                    onChange={(e) => setNewGe({ ...newGe, warehouseId: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'}`}
                  >
                    <option value="" className="text-slate-500">-- Select Warehouse --</option>
                    {effectiveWarehouses.map(wh => (
                      <option key={wh.id} value={wh.id} className="text-slate-900 dark:text-white bg-white dark:bg-slate-800">
                        {wh.name} {wh.code ? `(${wh.code})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Vehicle Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. KA-01-EF-1234"
                    value={newGe.vehicleNumber}
                    onChange={(e) => setNewGe({ ...newGe, vehicleNumber: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Driver Name</label>
                  <input
                    type="text"
                    placeholder="Driver name"
                    value={newGe.driverName}
                    onChange={(e) => setNewGe({ ...newGe, driverName: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Driver Phone</label>
                  <input
                    type="text"
                    placeholder="Phone number"
                    value={newGe.driverPhone}
                    onChange={(e) => setNewGe({ ...newGe, driverPhone: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Transporter</label>
                  <input
                    type="text"
                    placeholder="Transport company"
                    value={newGe.transportCompany}
                    onChange={(e) => setNewGe({ ...newGe, transportCompany: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Remarks / Notes</label>
                <textarea
                  rows={2}
                  placeholder="Optional delivery remarks..."
                  value={newGe.remarks}
                  onChange={(e) => setNewGe({ ...newGe, remarks: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl border text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800/40">
                <button
                  type="button"
                  onClick={() => setIsGeModalOpen(false)}
                  className="px-4 py-2 rounded-xl border text-xs font-semibold text-slate-400 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/20"
                >
                  Record Gate Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {isDetailModalOpen && selectedGe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm">
          <div className={`w-full max-w-lg rounded-3xl shadow-2xl border p-6 relative ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            <button onClick={() => setIsDetailModalOpen(false)} className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-slate-800 text-slate-400">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold mb-3 flex items-center space-x-2">
              <Truck className="w-5 h-5 text-indigo-400" />
              <span>Gate Entry Details: {selectedGe.gateEntryNumber}</span>
            </h3>
            <div className="space-y-3 text-xs">
              <div className={`grid grid-cols-2 gap-2 p-3 rounded-xl ${darkMode ? 'bg-slate-800/40' : 'bg-slate-100'}`}>
                <div><span className="text-slate-500 dark:text-slate-400">PO Number:</span> <span className="font-bold text-indigo-600 dark:text-indigo-400">{selectedGe.poNumber}</span></div>
                <div><span className="text-slate-500 dark:text-slate-400">Supplier:</span> <span className="font-bold text-slate-900 dark:text-slate-100">{getSupplierForGe(selectedGe)}</span></div>
                <div><span className="text-slate-500 dark:text-slate-400">Arrival Date:</span> <span className="font-medium text-slate-800 dark:text-slate-200">{selectedGe.arrivalDate}</span></div>
                <div><span className="text-slate-500 dark:text-slate-400">Vehicle:</span> <span className="font-bold text-amber-600 dark:text-amber-400">{selectedGe.vehicleNumber}</span></div>
                <div><span className="text-slate-500 dark:text-slate-400">Transporter:</span> <span className="font-bold text-indigo-600 dark:text-indigo-300">{getTransporterName(selectedGe)}</span></div>
                <div><span className="text-slate-500 dark:text-slate-400">Driver:</span> <span className="font-medium text-slate-800 dark:text-slate-200">{selectedGe.driverName || 'N/A'} ({getDriverPhoneNum(selectedGe)})</span></div>
                <div><span className="text-slate-500 dark:text-slate-400">Warehouse:</span> <span className="font-medium text-slate-800 dark:text-slate-200">{selectedGe.warehouse?.name || 'Main Warehouse'}</span></div>
              </div>

              <div>
                <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-1">Items Received</h4>
                <div className="space-y-1">
                  {selectedGe.itemsReceived?.map((it: any, idx: number) => (
                    <div key={idx} className={`p-2.5 rounded-xl border flex justify-between items-center ${darkMode ? 'border-slate-800 bg-slate-800/30' : 'border-slate-200 bg-slate-50'}`}>
                      <span className="font-semibold text-slate-900 dark:text-slate-200">{it.materialName} ({it.materialCode})</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">{it.quantityReceived?.toLocaleString()} {it.unit || 'Kg'}</span>
                    </div>
                  ))}
                </div>
              </div>

              {selectedGe.remarks && (
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Remarks:</span>
                  <p className={`mt-1 p-2.5 rounded-xl text-slate-800 dark:text-slate-300 ${darkMode ? 'bg-slate-800/30' : 'bg-slate-100'}`}>{selectedGe.remarks}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
