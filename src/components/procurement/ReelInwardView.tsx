import React, { useState, useEffect, useMemo } from 'react';
import { 
  Layers, 
  Plus, 
  Search, 
  RefreshCw, 
  Eye, 
  Edit3, 
  Trash2, 
  History, 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  X, 
  Sparkles, 
  Loader2, 
  ShieldCheck, 
  Scale,
  Hash,
  ArrowUpDown
} from 'lucide-react';
import { InvoiceScanner, ExtractedInvoiceData } from '../common/InvoiceScanner';
import { procurementService } from './procurementService';
import { ReelInwardRecord, ReelInwardItemRecord } from './InwardView';

interface SearchableSelectOption {
  id: string;
  label: string;
  subLabel?: string;
  code?: string;
  raw?: any;
}

interface SearchableSelectProps {
  options: SearchableSelectOption[];
  value: string;
  onChange: (value: string, option?: SearchableSelectOption) => void;
  placeholder: string;
  searchPlaceholder: string;
  darkMode: boolean;
  isLoading?: boolean;
  required?: boolean;
  className?: string;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder,
  searchPlaceholder,
  darkMode,
  isLoading = false,
  required = false,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(o => o.id === value || o.label === value || o.raw?.name === value);

  const filteredOptions = useMemo(() => {
    if (!query.trim()) return options;
    const q = query.toLowerCase();
    return options.filter(o => 
      o.label.toLowerCase().includes(q) || 
      (o.subLabel && o.subLabel.toLowerCase().includes(q)) ||
      (o.code && o.code.toLowerCase().includes(q))
    );
  }, [options, query]);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {required && (
        <input 
          type="text" 
          value={value} 
          required 
          onChange={() => {}} 
          tabIndex={-1} 
          aria-hidden="true"
          className="absolute opacity-0 pointer-events-none w-px h-px" 
        />
      )}

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3 py-2 rounded-xl border text-left text-xs flex items-center justify-between transition-colors cursor-pointer ${
          darkMode 
            ? 'bg-slate-900 border-slate-700 text-white hover:border-slate-600' 
            : 'bg-white border-slate-300 text-slate-900 hover:border-slate-400'
        }`}
      >
        <span className={`truncate font-medium ${!selectedOption ? (darkMode ? 'text-slate-400 font-normal' : 'text-slate-500 font-normal') : (darkMode ? 'text-white font-semibold' : 'text-slate-900 font-semibold')}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span className={`flex items-center space-x-1 shrink-0 ml-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>

      {isOpen && (
        <div className={`absolute z-50 left-0 right-0 mt-1 rounded-xl shadow-2xl border overflow-hidden ${
          darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
        }`}>
          <div className={`p-2 border-b flex items-center space-x-2 ${darkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-slate-50'}`}>
            <Search className={`w-3.5 h-3.5 shrink-0 ml-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`} />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className={`w-full px-2 py-1.5 rounded-lg text-xs bg-transparent border-none outline-none ${
                darkMode ? 'text-white placeholder-slate-400' : 'text-slate-900 placeholder-slate-500'
              }`}
            />
            {query && (
              <button 
                type="button" 
                onClick={() => setQuery('')}
                className={`p-1 rounded transition-colors ${darkMode ? 'hover:bg-slate-800 text-slate-400 hover:text-slate-200' : 'hover:bg-slate-200 text-slate-500 hover:text-slate-800'}`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="max-h-60 overflow-y-auto p-1 divide-y divide-slate-100 dark:divide-slate-800/50">
            {isLoading ? (
              <div className={`p-4 text-center text-xs flex items-center justify-center space-x-2 ${darkMode ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>
                <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                <span>Loading...</span>
              </div>
            ) : filteredOptions.length === 0 ? (
              <div className={`p-4 text-center text-xs font-medium ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                No results found
              </div>
            ) : (
              filteredOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    onChange(opt.id, opt);
                    setIsOpen(false);
                    setQuery('');
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs flex flex-col transition-colors cursor-pointer ${
                    value === opt.id || value === opt.label || value === opt.raw?.name
                      ? (darkMode ? 'bg-emerald-600/20 text-emerald-300 font-bold border border-emerald-500/30' : 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-200')
                      : (darkMode ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-slate-100 text-slate-800 font-medium')
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {opt.subLabel && (
                    <span className={`text-[10px] truncate mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      {opt.subLabel}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

interface ReelInwardViewProps {
  darkMode: boolean;
  reelsInward: ReelInwardRecord[];
  suppliers?: any[];
  rawMaterials?: any[];
  purchaseOrders?: any[];
  currentUser?: any;
  getSupplierDisplayName: (supplierId?: string, supplierName?: string, millName?: string, supplierObj?: any) => string;
  setIsQcModalOpen?: (open: boolean) => void;
  initializeQcFormForReel?: (ri: any) => void;
  onRefreshData?: () => Promise<void>;
  onAddNotification?: (notif: any) => void;
}

export const ReelInwardView: React.FC<ReelInwardViewProps> = ({
  darkMode,
  reelsInward: initialReelsInward,
  suppliers = [],
  rawMaterials = [],
  purchaseOrders = [],
  currentUser,
  getSupplierDisplayName,
  setIsQcModalOpen,
  initializeQcFormForReel,
  onRefreshData,
  onAddNotification,
}) => {
  const [reelsList, setReelsList] = useState<ReelInwardRecord[]>(initialReelsInward || []);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING_QC' | 'QC_PASSED' | 'PARTIALLY_PASSED' | 'QC_FAILED'>('ALL');

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ReelInwardRecord | null>(null);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Scanner States
  const [isScanActive, setIsScanActive] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  // Supplier Options for SearchableSelect
  const supplierOptions = useMemo(() => {
    return (suppliers || []).map((s: any) => ({
      id: s.id,
      label: s.supplierName || s.name || 'Unknown Supplier',
      subLabel: s.millName ? `Mill: ${s.millName}` : (s.code ? `Code: ${s.code}` : ''),
      code: s.code || '',
      raw: s
    }));
  }, [suppliers]);

  // Material Options for SearchableSelect
  const materialOptions = useMemo(() => {
    const list = (rawMaterials && rawMaterials.length > 0) ? rawMaterials : [
      { id: 'Paper Reel', code: 'PR-01', name: 'Paper Reel' },
      { id: 'Kraft Paper', code: 'KP-01', name: 'Kraft Paper' },
      { id: 'Paper Roll', code: 'PR-02', name: 'Paper Roll' },
    ];
    return list.map((rm: any) => {
      const codeStr = rm.code ? `${rm.code} — ` : '';
      const nameStr = rm.name || rm.id || 'Paper Reel';
      return {
        id: rm.name || rm.id || nameStr,
        label: `${codeStr}${nameStr}`,
        subLabel: rm.hsnCode ? `HSN: ${rm.hsnCode}` : (rm.category ? `Category: ${rm.category}` : ''),
        code: rm.code || '',
        raw: rm
      };
    });
  }, [rawMaterials]);

  const defaultHeader = {
    inwardNumber: `RIN-${Date.now().toString().slice(-6)}`,
    challanNumber: '',
    invoiceNumber: '',
    supplierId: '',
    supplierName: '',
    millName: '',
    poNumber: '',
    poId: '',
    receivedDate: new Date().toISOString().split('T')[0],
    vehicleNumber: '',
    description: '',
    remarks: '',
  };

  const [formData, setFormData] = useState(defaultHeader);
  const [reelRows, setReelRows] = useState<ReelInwardItemRecord[]>([
    {
      reelNumber: 'R001',
      material: 'Paper Reel',
      description: 'Standard Kraft Paper Reel',
      hsnCode: '48191010',
      gsm: 120,
      bf: 18,
      length: 1200,
      breadth: 800,
      size: '1200x800',
      weight: 450,
      uom: 'Kg',
      lotNumber: '',
      remarks: '',
      status: 'Pending QC',
    }
  ]);

  useEffect(() => {
    if (initialReelsInward && initialReelsInward.length > 0) {
      setReelsList(initialReelsInward);
    } else {
      fetchReels();
    }
  }, [initialReelsInward]);

  const fetchReels = async () => {
    setIsRefreshing(true);
    try {
      const res = await procurementService.getReelInwards();
      if (res.success && res.data) {
        setReelsList(res.data);
      }
      if (onRefreshData) {
        await onRefreshData();
      }
    } catch (err) {
      console.error('Error fetching reels:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const filteredReels = useMemo(() => {
    return (reelsList || []).filter(ri => {
      if (statusFilter !== 'ALL') {
        const itemStatus = (ri.status || ri.qcStatus || '').toUpperCase().replace(/\s+/g, '_');
        if (statusFilter === 'PENDING_QC' && !itemStatus.includes('PENDING')) return false;
        if (statusFilter === 'QC_PASSED' && !itemStatus.includes('QC_PASSED') && !itemStatus.includes('APPROV') && !itemStatus.includes('PASSED')) return false;
        if (statusFilter === 'PARTIALLY_PASSED' && !itemStatus.includes('PARTIAL')) return false;
        if (statusFilter === 'QC_FAILED' && !itemStatus.includes('QC_FAILED') && !itemStatus.includes('REJECT') && !itemStatus.includes('FAIL')) return false;
      }

      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      const inNumber = (ri.inwardNumber || ri.reelNumber || '').toLowerCase();
      const sup = (ri.supplierName || ri.millName || '').toLowerCase();
      const inv = (ri.invoiceNumber || '').toLowerCase();
      const ch = (ri.challanNumber || '').toLowerCase();
      const po = (ri.poNumber || '').toLowerCase();
      const veh = (ri.vehicleNumber || '').toLowerCase();
      
      const inItems = (ri.items || []).some(it => 
        (it.reelNumber || '').toLowerCase().includes(term) ||
        (it.material || '').toLowerCase().includes(term) ||
        (it.lotNumber || '').toLowerCase().includes(term)
      );

      return inNumber.includes(term) || sup.includes(term) || inv.includes(term) || ch.includes(term) || po.includes(term) || veh.includes(term) || inItems;
    });
  }, [reelsList, searchTerm, statusFilter]);

  const formCalculations = useMemo(() => {
    const totalReels = reelRows.length;
    const totalWeight = reelRows.reduce((sum, r) => sum + (Number(r.weight) || 0), 0);
    const validGsm = reelRows.filter(r => Number(r.gsm) > 0);
    const avgGsm = validGsm.length > 0 ? (validGsm.reduce((sum, r) => sum + Number(r.gsm), 0) / validGsm.length).toFixed(1) : '-';
    const validBf = reelRows.filter(r => Number(r.bf) > 0);
    const avgBf = validBf.length > 0 ? (validBf.reduce((sum, r) => sum + Number(r.bf), 0) / validBf.length).toFixed(1) : '-';
    
    const duplicates: string[] = [];
    const counts: Record<string, number> = {};
    reelRows.forEach(r => {
      const num = (r.reelNumber || '').trim().toUpperCase();
      if (num) {
        counts[num] = (counts[num] || 0) + 1;
        if (counts[num] === 2) duplicates.push(num);
      }
    });

    return { totalReels, totalWeight, avgGsm, avgBf, hasDuplicates: duplicates.length > 0, duplicates };
  }, [reelRows]);

  const handleOpenCreateModal = () => {
    setEditingRecordId(null);
    setFormData({
      ...defaultHeader,
      inwardNumber: `RIN-${Date.now().toString().slice(-6)}`,
      receivedDate: new Date().toISOString().split('T')[0],
    });
    setReelRows([
      {
        reelNumber: 'R001',
        material: 'Paper Reel',
        description: 'Standard Kraft Paper Reel',
        hsnCode: '48191010',
        gsm: 120,
        bf: 18,
        length: 1200,
        breadth: 800,
        size: '1200x800',
        weight: 450,
        uom: 'Kg',
        lotNumber: '',
        remarks: '',
        status: 'Pending QC',
      }
    ]);
    setFormError(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (record: ReelInwardRecord) => {
    setEditingRecordId(record.id);
    setFormData({
      inwardNumber: record.inwardNumber || record.reelNumber || `RIN-${Date.now().toString().slice(-6)}`,
      challanNumber: record.challanNumber || '',
      invoiceNumber: record.invoiceNumber || '',
      supplierId: record.supplierId || '',
      supplierName: record.supplierName || record.millName || '',
      millName: record.millName || '',
      poNumber: record.poNumber || '',
      poId: record.poId || '',
      receivedDate: record.receivedDate || (record.createdAt ? new Date(record.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
      vehicleNumber: record.vehicleNumber || '',
      description: record.description || '',
      remarks: record.remarks || '',
    });

    if (record.items && record.items.length > 0) {
      setReelRows(record.items.map(it => ({
        id: it.id,
        reelNumber: it.reelNumber,
        material: it.material || 'Paper Reel',
        description: it.description || '',
        hsnCode: it.hsnCode || '48191010',
        gsm: it.gsm ? Number(it.gsm) : undefined,
        bf: it.bf ? Number(it.bf) : undefined,
        length: it.length ? Number(it.length) : undefined,
        breadth: it.breadth ? Number(it.breadth) : undefined,
        size: it.size || '',
        weight: Number(it.weight || 0),
        uom: it.uom || 'Kg',
        lotNumber: it.lotNumber || '',
        remarks: it.remarks || '',
        status: it.status || 'Pending QC',
      })));
    } else {
      setReelRows([
        {
          reelNumber: record.reelNumber || 'R001',
          material: 'Paper Reel',
          description: record.description || '',
          hsnCode: '48191010',
          gsm: record.gsm ? Number(record.gsm) : undefined,
          bf: record.bf ? Number(record.bf) : undefined,
          length: record.length ? Number(record.length) : undefined,
          breadth: record.width ? Number(record.width) : undefined,
          size: record.width && record.length ? `${record.length}x${record.width}` : '',
          weight: Number(record.weight || 0),
          uom: 'Kg',
          lotNumber: record.lotNumber || '',
          remarks: record.remarks || '',
          status: record.status || 'Pending QC',
        }
      ]);
    }

    setFormError(null);
    setIsFormModalOpen(true);
  };

  const handleOpenDetailModal = (record: ReelInwardRecord) => {
    setSelectedRecord(record);
    setIsDetailModalOpen(true);
  };

  const handleOpenAuditModal = async (record: ReelInwardRecord) => {
    setSelectedRecord(record);
    setIsAuditModalOpen(true);
    setIsLoadingAudit(true);
    try {
      const res = await fetch(`/api/audit-logs?entity=ReelInward&entityId=${record.id}`);
      const data = await res.json();
      if (data.success && data.data) {
        setAuditLogs(data.data);
      } else {
        setAuditLogs([]);
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      setAuditLogs([]);
    } finally {
      setIsLoadingAudit(false);
    }
  };

  const handleAddRow = () => {
    const nextIndex = reelRows.length + 1;
    const nextReelNo = `R${String(nextIndex).padStart(3, '0')}`;
    const previous = reelRows[reelRows.length - 1];

    setReelRows(prev => [
      ...prev,
      {
        reelNumber: nextReelNo,
        material: previous?.material || 'Paper Reel',
        description: previous?.description || 'Standard Kraft Paper Reel',
        hsnCode: previous?.hsnCode || '48191010',
        gsm: previous?.gsm || 120,
        bf: previous?.bf || 18,
        length: previous?.length || 1200,
        breadth: previous?.breadth || 800,
        size: previous?.size || '1200x800',
        weight: previous?.weight || 450,
        uom: 'Kg',
        lotNumber: previous?.lotNumber || '',
        remarks: '',
        status: 'Pending QC',
      }
    ]);
  };

  const handleQuickAddFive = () => {
    const startIdx = reelRows.length + 1;
    const lastRow = reelRows[reelRows.length - 1];
    const newRows: ReelInwardItemRecord[] = [];

    for (let i = 0; i < 5; i++) {
      newRows.push({
        reelNumber: `R${String(startIdx + i).padStart(3, '0')}`,
        material: lastRow?.material || 'Paper Reel',
        description: lastRow?.description || 'Standard Kraft Paper Reel',
        hsnCode: lastRow?.hsnCode || '48191010',
        gsm: lastRow?.gsm || 120,
        bf: lastRow?.bf || 18,
        length: lastRow?.length || 1200,
        breadth: lastRow?.breadth || 800,
        size: lastRow?.size || '1200x800',
        weight: lastRow?.weight || 450,
        uom: 'Kg',
        lotNumber: lastRow?.lotNumber || '',
        remarks: '',
        status: 'Pending QC',
      });
    }

    setReelRows(prev => [...prev, ...newRows]);
  };

  const handleRemoveRow = (index: number) => {
    if (reelRows.length <= 1) {
      setFormError('At least one reel must be entered in Reel Inward.');
      return;
    }
    setReelRows(prev => prev.filter((_, idx) => idx !== index));
    setFormError(null);
  };

  const handleUpdateRow = (index: number, field: keyof ReelInwardItemRecord, value: any) => {
    setReelRows(prev => {
      const updated = [...prev];
      const target = { ...updated[index], [field]: value };
      
      if (field === 'length' || field === 'breadth') {
        const l = field === 'length' ? value : target.length;
        const b = field === 'breadth' ? value : target.breadth;
        if (l && b) {
          target.size = `${l}x${b}`;
        }
      }
      
      updated[index] = target;
      return updated;
    });
  };

  const handleAiDataExtracted = (data: ExtractedInvoiceData) => {
    setScanMessage('Data extracted successfully! Review and edit values below.');
    setIsScanActive(false);

    const rawData = data as any;
    setFormData(prev => ({
      ...prev,
      invoiceNumber: data.invoiceNumber || prev.invoiceNumber,
      challanNumber: rawData.challanNumber || rawData.lrNumber || prev.challanNumber,
      vehicleNumber: data.vehicleNumber || prev.vehicleNumber,
      supplierName: data.supplierName || prev.supplierName,
      receivedDate: data.invoiceDate || prev.receivedDate,
      remarks: data.transporterName ? `Transporter: ${data.transporterName}` : prev.remarks,
    }));

    if (rawData.reels && rawData.reels.length > 0) {
      setReelRows(rawData.reels.map((r: any, idx: number) => ({
        reelNumber: r.reelNumber || `R${String(idx + 1).padStart(3, '0')}`,
        material: 'Paper Reel',
        description: `Grade ${r.gsm || 120} GSM / ${r.bf || 18} BF`,
        hsnCode: '48191010',
        gsm: r.gsm || 120,
        bf: r.bf || 18,
        length: 1200,
        breadth: r.width || 800,
        size: r.width ? `1200x${r.width}` : '1200x800',
        weight: r.weight || 450,
        uom: 'Kg',
        lotNumber: r.lotNumber || '',
        remarks: 'Scanned from document',
        status: 'Pending QC',
      })));
    }
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (formCalculations.hasDuplicates) {
      setFormError(`Duplicate Reel Numbers detected: ${formCalculations.duplicates.join(', ')}. Each reel must have a unique identifier.`);
      return;
    }

    for (let i = 0; i < reelRows.length; i++) {
      const r = reelRows[i];
      if (!r.reelNumber?.trim()) {
        setFormError(`Row #${i + 1} is missing a Reel Number.`);
        return;
      }
      if (!r.weight || Number(r.weight) <= 0) {
        setFormError(`Row #${i + 1} (${r.reelNumber}) must have a valid weight greater than 0.`);
        return;
      }
    }

    setIsSubmitting(true);

    const payload = {
      ...formData,
      status: 'PENDING_QC',
      qcStatus: 'Pending',
      items: reelRows.map(r => ({
        ...r,
        weight: Number(r.weight) || 0,
        gsm: r.gsm ? Number(r.gsm) : null,
        bf: r.bf ? Number(r.bf) : null,
        length: r.length ? Number(r.length) : null,
        breadth: r.breadth ? Number(r.breadth) : null,
      })),
    };

    try {
      let res;
      if (editingRecordId) {
        res = await procurementService.updateReelInward(editingRecordId, payload);
      } else {
        res = await procurementService.createReelInward(payload);
      }

      if (res.success) {
        setIsFormModalOpen(false);
        await fetchReels();

        if (onAddNotification) {
          onAddNotification({
            title: editingRecordId ? 'Reel Inward Updated' : 'Reel Inward Recorded (Pending QC)',
            message: `Recorded ${reelRows.length} reels (${formCalculations.totalWeight.toLocaleString()} Kg) under Inward #${formData.inwardNumber}. Status: PENDING_QC.`,
            type: 'success',
            time: 'Just Now',
            module: 'Procurement'
          });
        }
      } else {
        setFormError(res.message || 'Failed to save Reel Inward.');
      }
    } catch (err: any) {
      console.error('Error saving Reel Inward:', err);
      setFormError(err.message || 'An error occurred while saving.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRecord = async (record: ReelInwardRecord) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete Reel Inward "${record.inwardNumber || record.reelNumber}"? This will archive the record.`);
    if (!confirmDelete) return;

    setIsDeleting(record.id);
    try {
      const res = await procurementService.deleteReelInward(record.id);
      if (res.success) {
        await fetchReels();
        if (onAddNotification) {
          onAddNotification({
            title: 'Reel Inward Deleted',
            message: `Reel Inward #${record.inwardNumber || record.reelNumber} has been archived.`,
            type: 'info',
            time: 'Just Now',
            module: 'Procurement'
          });
        }
      } else {
        alert(`Failed to delete: ${res.message || 'Unknown error'}`);
      }
    } catch (err: any) {
      console.error('Error deleting record:', err);
      alert(`Error deleting record: ${err.message}`);
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className={`text-xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Paper Reel Inward Management
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Record mill paper reel inwarding, GSM, BF, dimensions, and weights. Reels remain quarantined until QC approval.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={fetchReels}
            disabled={isRefreshing}
            title="Refresh Records"
            className={`p-2 rounded-xl border transition-all ${
              darkMode ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white' : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-500' : ''}`} />
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-900/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Inward Paper Reels</span>
          </button>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1 max-w-2xl">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search Inward #, Supplier, Invoice, Challan, Reel #..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs border transition-all ${
                darkMode ? 'bg-slate-900 border-slate-800 text-white placeholder-slate-500 focus:border-emerald-500' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-emerald-600'
              }`}
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center space-x-1 overflow-x-auto pb-1 sm:pb-0">
            {(['ALL', 'PENDING_QC', 'QC_PASSED', 'PARTIALLY_PASSED', 'QC_FAILED'] as const).map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap ${
                  statusFilter === st
                    ? (darkMode ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/50' : 'bg-emerald-100 text-emerald-800 border border-emerald-300')
                    : (darkMode ? 'bg-slate-800/60 text-slate-400 hover:bg-slate-800' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')
                }`}
              >
                {st === 'ALL' ? 'All Records' : st.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Reel Inward Table */}
      <div className={`rounded-2xl border overflow-hidden shadow-sm ${darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className={`border-b font-bold uppercase tracking-wider text-[10px] ${darkMode ? 'bg-slate-800/80 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                <th className="p-3">Inward Ref #</th>
                <th className="p-3">Supplier & Mill</th>
                <th className="p-3">Invoice & Challan</th>
                <th className="p-3">Received Date</th>
                <th className="p-3 text-center">Reels & Gross Wt.</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {isRefreshing ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center">
                    <Loader2 className="w-7 h-7 animate-spin mx-auto text-emerald-500 mb-2" />
                    <p className="text-xs text-slate-400">Loading Reel Inward records...</p>
                  </td>
                </tr>
              ) : filteredReels.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center">
                    <div className="max-w-xs mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400">
                        <Layers className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                          {searchTerm ? 'No matching Reel Inwards' : 'No Reel Inwards recorded yet'}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {searchTerm ? 'Try adjusting your search criteria or filter.' : 'Click "Inward Paper Reels" to record your first received batch of paper reels.'}
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredReels.map((ri) => {
                  const itemCount = ri.items?.length || 1;
                  const totalWeight = ri.items && ri.items.length > 0 
                    ? ri.items.reduce((s, it) => s + (Number(it.weight) || 0), 0)
                    : Number(ri.weight || 0);

                  const displaySupplier = getSupplierDisplayName(ri.supplierId, ri.supplierName, ri.millName, ri.supplier);
                  const stUpper = (ri.status || ri.qcStatus || '').toUpperCase();
                  const isPendingQc = stUpper.includes('PENDING');
                  const isPartiallyPassed = stUpper.includes('PARTIAL');
                  const isPassed = !isPendingQc && !isPartiallyPassed && (stUpper.includes('PASS') || stUpper.includes('APPROV'));
                  const isEligibleForQc = isPendingQc || isPartiallyPassed || (ri.items && ri.items.some(it => (it.qcStatus || it.status || '').toUpperCase().includes('PENDING')));

                  return (
                    <tr key={ri.id} className={`transition-colors hover:bg-slate-500/5 ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                      <td className="p-3">
                        <span className="font-mono font-bold text-emerald-400 text-xs">
                          {ri.inwardNumber || ri.reelNumber || 'RIN-REC'}
                        </span>
                        {ri.poNumber && (
                          <span className="text-[10px] text-slate-400 block font-mono">PO: {ri.poNumber}</span>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{displaySupplier}</div>
                        {ri.millName && ri.millName !== ri.supplierName && (
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Mill: {ri.millName}</span>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="text-slate-700 dark:text-slate-300 font-medium">
                          {ri.invoiceNumber ? `Inv: ${ri.invoiceNumber}` : '-'}
                        </div>
                        {ri.challanNumber && (
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">Ch: {ri.challanNumber}</div>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="text-slate-800 dark:text-slate-300">
                          {ri.receivedDate || (ri.createdAt ? new Date(ri.createdAt).toISOString().split('T')[0] : 'N/A')}
                        </div>
                        {ri.vehicleNumber && (
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{ri.vehicleNumber}</div>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-slate-500/10 text-slate-700 dark:text-slate-300 font-bold text-xs border border-slate-500/20">
                          <Layers className="w-3 h-3 mr-1 text-emerald-500" />
                          {itemCount} {itemCount === 1 ? 'Reel' : 'Reels'} • {totalWeight.toLocaleString()} Kg
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        {isPendingQc ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wide bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            <Clock className="w-3 h-3 mr-1" /> PENDING QC
                          </span>
                        ) : isPartiallyPassed ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wide bg-blue-500/15 text-blue-400 border border-blue-500/30">
                            <AlertTriangle className="w-3 h-3 mr-1" /> PARTIALLY PASSED
                          </span>
                        ) : isPassed ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wide bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle className="w-3 h-3 mr-1" /> QC PASSED
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wide bg-rose-500/15 text-rose-400 border border-rose-500/30">
                            <X className="w-3 h-3 mr-1" /> QC FAILED
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {isEligibleForQc && (
                            <button
                              type="button"
                              onClick={() => {
                                if (initializeQcFormForReel && setIsQcModalOpen) {
                                  initializeQcFormForReel(ri);
                                  setIsQcModalOpen(true);
                                }
                              }}
                              title="Add Inspection Report (Quality Control)"
                              className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold transition-all cursor-pointer shadow-sm hover:scale-105"
                            >
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="whitespace-nowrap">Add Inspection Report</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenDetailModal(ri)}
                            title="View Reel Details"
                            className="p-1.5 rounded-lg hover:bg-slate-500/20 text-slate-400 hover:text-emerald-400 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(ri)}
                            title="Edit Inward Record"
                            className="p-1.5 rounded-lg hover:bg-slate-500/20 text-slate-400 hover:text-blue-400 transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenAuditModal(ri)}
                            title="View Audit Trail"
                            className="p-1.5 rounded-lg hover:bg-slate-500/20 text-slate-400 hover:text-amber-400 transition-colors"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteRecord(ri)}
                            disabled={isDeleting === ri.id}
                            title="Delete Inward Record"
                            className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                          >
                            {isDeleting === ri.id ? <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-400" /> : <Trash2 className="w-3.5 h-3.5" />}
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

      {/* CREATE / EDIT REEL INWARD FORM MODAL */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className={`w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-3xl shadow-2xl border p-6 relative ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            <button onClick={() => setIsFormModalOpen(false)} className={`absolute top-5 right-5 p-1.5 rounded-full transition-colors cursor-pointer ${darkMode ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'}`}>
              <X className="w-5 h-5" />
            </button>

            <h3 className={`text-base font-bold mb-1 flex items-center space-x-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              <Layers className="w-5 h-5 text-emerald-500" />
              <span>{editingRecordId ? 'Edit Paper Reel Inward' : 'New Paper Reel Inward Batch'}</span>
            </h3>
            <p className={`text-xs mb-4 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Record individual paper reel identifiers, GSM, BF, dimensions, and lot numbers.</p>

            {/* AI Invoice Scanner for Paper Reels */}
            <div className="mb-6">
              <InvoiceScanner
                darkMode={darkMode}
                onScanStart={() => setIsScanActive(true)}
                onScanError={(err) => { setIsScanActive(false); alert(`Scan failed: ${err}`); }}
                onDataExtracted={handleAiDataExtracted}
              />
              {scanMessage && (
                <div className={`mt-2 p-3 rounded-xl border text-xs font-semibold ${darkMode ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-800'}`}>
                  {scanMessage}
                </div>
              )}
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-6">
              {/* Header Info */}
              <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 p-4 rounded-2xl border ${darkMode ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div>
                  <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Inward Ref # *</label>
                  <input
                    type="text"
                    required
                    value={formData.inwardNumber}
                    onChange={(e) => setFormData({ ...formData, inwardNumber: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-mono font-bold ${darkMode ? 'bg-slate-900 border-slate-700 text-emerald-400' : 'bg-white border-slate-300 text-emerald-700'}`}
                  />
                </div>
                <div>
                  <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Supplier / Mill *</label>
                  <SearchableSelect
                    options={supplierOptions}
                    value={formData.supplierId || formData.supplierName}
                    onChange={(val, opt) => {
                      setFormData({
                        ...formData,
                        supplierId: opt?.id || val,
                        supplierName: opt?.label || val,
                        millName: opt?.raw?.millName || opt?.label || val
                      });
                    }}
                    placeholder="Search supplier or mill..."
                    searchPlaceholder="Type supplier name or code..."
                    darkMode={darkMode}
                    required={true}
                  />
                </div>
                <div>
                  <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Purchase Order (PO)</label>
                  <select
                    value={formData.poNumber}
                    onChange={(e) => {
                      const po = purchaseOrders.find(p => p.poNumber === e.target.value);
                      setFormData({
                        ...formData,
                        poNumber: e.target.value,
                        poId: po?.id || ''
                      });
                    }}
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'}`}
                  >
                    <option value="">-- Link PO (Optional) --</option>
                    {purchaseOrders.map(p => (
                      <option key={p.id} value={p.poNumber}>{p.poNumber} ({p.supplierName})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Received Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.receivedDate}
                    onChange={(e) => setFormData({ ...formData, receivedDate: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'}`}
                  />
                </div>
              </div>

              {/* Additional Header Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Invoice Number</label>
                  <input
                    type="text"
                    placeholder="e.g. INV-2026-991"
                    value={formData.invoiceNumber}
                    onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-medium ${darkMode ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'}`}
                  />
                </div>
                <div>
                  <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Challan / LR Number</label>
                  <input
                    type="text"
                    placeholder="e.g. CHAL-8823"
                    value={formData.challanNumber}
                    onChange={(e) => setFormData({ ...formData, challanNumber: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-medium ${darkMode ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'}`}
                  />
                </div>
                <div>
                  <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Vehicle Number</label>
                  <input
                    type="text"
                    placeholder="e.g. KA-01-AB-1234"
                    value={formData.vehicleNumber}
                    onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-medium ${darkMode ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'}`}
                  />
                </div>
              </div>

              {/* Reel Rows Section */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className={`font-bold text-xs uppercase tracking-wider ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>Reel Items Breakdown ({reelRows.length})</h4>
                    <p className={`text-[11px] ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Specify unique reel numbers, GSM, BF, dimensions (Width x Diameter/Length), and weight.</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={handleQuickAddFive}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${darkMode ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' : 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
                    >
                      + Add 5 Reels
                    </button>
                    <button
                      type="button"
                      onClick={handleAddRow}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow cursor-pointer"
                    >
                      + Add Reel Row
                    </button>
                  </div>
                </div>

                {/* Summary Banner */}
                <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl text-xs border ${
                  darkMode ? 'bg-emerald-500/10 border-emerald-500/25' : 'bg-emerald-50/80 border-emerald-200'
                }`}>
                  <div><span className={`font-medium ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Total Reels:</span> <span className={`font-bold text-sm ml-1 ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>{formCalculations.totalReels}</span></div>
                  <div><span className={`font-medium ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Total Weight:</span> <span className={`font-bold text-sm ml-1 ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>{formCalculations.totalWeight.toLocaleString()} Kg</span></div>
                  <div><span className={`font-medium ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Average GSM:</span> <span className={`font-bold text-sm ml-1 ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>{formCalculations.avgGsm}</span></div>
                  <div><span className={`font-medium ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Average BF:</span> <span className={`font-bold text-sm ml-1 ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>{formCalculations.avgBf}</span></div>
                </div>

                {formError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold">
                    {formError}
                  </div>
                )}

                {/* Rows Table */}
                <div className={`rounded-2xl border overflow-hidden ${darkMode ? 'border-slate-800 bg-slate-900/50' : 'border-slate-300 bg-white shadow-sm'}`}>
                  <div className="overflow-x-auto max-h-96">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className={`sticky top-0 z-10 font-bold uppercase tracking-wider text-[10px] ${darkMode ? 'bg-slate-800 text-slate-200 border-b border-slate-700' : 'bg-slate-100 text-slate-800 border-b border-slate-200'}`}>
                        <tr>
                          <th className="p-2.5">#</th>
                          <th className="p-2.5">Reel / Roll ID *</th>
                          <th className="p-2.5">Material / Grade</th>
                          <th className="p-2.5">GSM</th>
                          <th className="p-2.5">BF</th>
                          <th className="p-2.5">Size (Width)</th>
                          <th className="p-2.5">Weight (Kg) *</th>
                          <th className="p-2.5">Lot / Batch</th>
                          <th className="p-2.5 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${darkMode ? 'divide-slate-800/60' : 'divide-slate-200'}`}>
                        {reelRows.map((row, idx) => (
                          <tr key={idx} className={darkMode ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'}>
                            <td className={`p-2.5 font-mono font-bold ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{idx + 1}</td>
                            <td className="p-2.5">
                              <input
                                type="text"
                                required
                                placeholder="e.g. R001"
                                value={row.reelNumber}
                                onChange={(e) => handleUpdateRow(idx, 'reelNumber', e.target.value)}
                                className={`w-28 px-2.5 py-1.5 rounded-lg border font-mono font-bold text-xs ${darkMode ? 'bg-slate-900 border-slate-700 text-emerald-400 placeholder-slate-500' : 'bg-white border-slate-300 text-emerald-700 placeholder-slate-400'}`}
                              />
                            </td>
                            <td className="p-2.5">
                              <select
                                value={row.material || 'Paper Reel'}
                                onChange={(e) => handleUpdateRow(idx, 'material', e.target.value)}
                                className={`w-36 px-2.5 py-1.5 rounded-lg border text-xs font-semibold ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'}`}
                              >
                                <option value="Paper Reel">Paper Reel</option>
                                <option value="Kraft Paper">Kraft Paper</option>
                                <option value="Fluting Paper">Fluting Paper</option>
                                <option value="Testliner">Testliner</option>
                                <option value="Duplex Board">Duplex Board</option>
                              </select>
                            </td>
                            <td className="p-2.5">
                              <input
                                type="number"
                                placeholder="120"
                                value={row.gsm || ''}
                                onChange={(e) => handleUpdateRow(idx, 'gsm', Number(e.target.value))}
                                className={`w-20 px-2.5 py-1.5 rounded-lg border text-xs font-semibold ${darkMode ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'}`}
                              />
                            </td>
                            <td className="p-2.5">
                              <input
                                type="number"
                                placeholder="18"
                                value={row.bf || ''}
                                onChange={(e) => handleUpdateRow(idx, 'bf', Number(e.target.value))}
                                className={`w-20 px-2.5 py-1.5 rounded-lg border text-xs font-semibold ${darkMode ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'}`}
                              />
                            </td>
                            <td className="p-2.5">
                              <input
                                type="text"
                                placeholder="e.g. 1200mm"
                                value={row.size || ''}
                                onChange={(e) => handleUpdateRow(idx, 'size', e.target.value)}
                                className={`w-28 px-2.5 py-1.5 rounded-lg border text-xs font-medium ${darkMode ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'}`}
                              />
                            </td>
                            <td className="p-2.5">
                              <input
                                type="number"
                                required
                                placeholder="450"
                                value={row.weight || ''}
                                onChange={(e) => handleUpdateRow(idx, 'weight', Number(e.target.value))}
                                className={`w-24 px-2.5 py-1.5 rounded-lg border font-bold text-xs ${darkMode ? 'bg-slate-900 border-slate-700 text-emerald-400 placeholder-slate-500' : 'bg-white border-slate-300 text-emerald-700 placeholder-slate-400'}`}
                              />
                            </td>
                            <td className="p-2.5">
                              <input
                                type="text"
                                placeholder="Lot #..."
                                value={row.lotNumber || ''}
                                onChange={(e) => handleUpdateRow(idx, 'lotNumber', e.target.value)}
                                className={`w-28 px-2.5 py-1.5 rounded-lg border text-xs font-medium ${darkMode ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'}`}
                              />
                            </td>
                            <td className="p-2.5 text-right">
                              <button
                                type="button"
                                onClick={() => handleRemoveRow(idx)}
                                title="Remove Row"
                                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${darkMode ? 'hover:bg-rose-500/20 text-slate-400 hover:text-rose-400' : 'hover:bg-rose-100 text-slate-500 hover:text-rose-600'}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Modal Footer Buttons */}
              <div className={`flex items-center justify-end space-x-3 pt-4 border-t ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className={`px-4 py-2 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${darkMode ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-300 text-slate-700 hover:bg-slate-100'}`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-900/30 flex items-center space-x-2 transition-all cursor-pointer"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{editingRecordId ? 'Update Reel Inward' : 'Save & Quarantine for QC'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {isDetailModalOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl border p-6 relative ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            <button onClick={() => setIsDetailModalOpen(false)} className={`absolute top-5 right-5 p-1.5 rounded-full transition-colors cursor-pointer ${darkMode ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'}`}>
              <X className="w-5 h-5" />
            </button>

            <h3 className={`text-base font-bold mb-1 flex items-center space-x-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              <Layers className="w-5 h-5 text-emerald-500" />
              <span>Paper Reel Inward Details: {selectedRecord.inwardNumber || selectedRecord.reelNumber}</span>
            </h3>
            <p className={`text-xs mb-4 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Complete batch receipt and quality inspection breakdown.</p>

            <div className="space-y-4 text-xs">
              <div className={`grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-2xl border ${darkMode ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div><span className={`font-medium block text-[11px] ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Supplier:</span> <span className={`font-bold block ${darkMode ? 'text-slate-200' : 'text-slate-900'}`}>{getSupplierDisplayName(selectedRecord.supplierId, selectedRecord.supplierName, selectedRecord.millName, selectedRecord.supplier)}</span></div>
                <div><span className={`font-medium block text-[11px] ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>PO Number:</span> <span className="font-bold block text-indigo-500">{selectedRecord.poNumber || 'N/A'}</span></div>
                <div><span className={`font-medium block text-[11px] ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Invoice:</span> <span className={`font-bold block ${darkMode ? 'text-slate-200' : 'text-slate-900'}`}>{selectedRecord.invoiceNumber || 'N/A'}</span></div>
                <div><span className={`font-medium block text-[11px] ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Challan:</span> <span className={`font-bold block ${darkMode ? 'text-slate-200' : 'text-slate-900'}`}>{selectedRecord.challanNumber || 'N/A'}</span></div>
                <div><span className={`font-medium block text-[11px] ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Vehicle:</span> <span className="font-bold block text-amber-500">{selectedRecord.vehicleNumber || 'N/A'}</span></div>
                <div><span className={`font-medium block text-[11px] ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Received Date:</span> <span className={`font-bold block ${darkMode ? 'text-slate-200' : 'text-slate-900'}`}>{selectedRecord.receivedDate || 'N/A'}</span></div>
              </div>

              <div>
                <h4 className={`font-bold uppercase tracking-wider text-[10px] mb-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Reel Items ({selectedRecord.items?.length || 1})</h4>
                <div className="space-y-2">
                  {(selectedRecord.items || []).map((it, idx) => (
                    <div key={idx} className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${darkMode ? 'border-slate-800 bg-slate-800/30' : 'border-slate-200 bg-slate-50'}`}>
                      <div className="flex items-center space-x-3">
                        <span className={`font-mono font-bold text-sm ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>{it.reelNumber}</span>
                        <div>
                          <div className={`font-semibold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{it.material || 'Paper Reel'} {it.gsm ? `• ${it.gsm} GSM` : ''} {it.bf ? `• ${it.bf} BF` : ''}</div>
                          <div className={`text-[10px] font-mono ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Size: {it.size || 'Standard'} {it.lotNumber ? `• Lot: ${it.lotNumber}` : ''}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`font-extrabold text-sm ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>{(Number(it.weight) || 0).toLocaleString()} Kg</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          (it.qcStatus || it.status || '').toUpperCase().includes('PASS') ? 'bg-emerald-500/15 text-emerald-500' : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                        }`}>
                          {it.qcStatus || it.status || 'Pending QC'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AUDIT LOG MODAL */}
      {isAuditModalOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className={`w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl border p-6 relative ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            <button onClick={() => setIsAuditModalOpen(false)} className={`absolute top-5 right-5 p-1.5 rounded-full transition-colors cursor-pointer ${darkMode ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'}`}>
              <X className="w-5 h-5" />
            </button>

            <h3 className={`text-base font-bold mb-1 flex items-center space-x-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              <History className="w-5 h-5 text-amber-400" />
              <span>Audit Trail: {selectedRecord.inwardNumber || selectedRecord.reelNumber}</span>
            </h3>
            <p className={`text-xs mb-4 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Chronological history of changes and QC inspections.</p>

            {isLoadingAudit ? (
              <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-500" /></div>
            ) : auditLogs.length === 0 ? (
              <p className={`text-xs text-center py-6 ${darkMode ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>No audit logs recorded for this record yet.</p>
            ) : (
              <div className="space-y-3">
                {auditLogs.map((log: any, idx: number) => (
                  <div key={idx} className={`p-3 rounded-xl border text-xs ${darkMode ? 'border-slate-800 bg-slate-800/30' : 'border-slate-200 bg-slate-50'}`}>
                    <div className={`flex justify-between font-bold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-800'}`}>
                      <span>{log.action || 'Updated'}</span>
                      <span className={`text-[10px] font-mono ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{log.timestamp ? new Date(log.timestamp).toLocaleString() : 'Recently'}</span>
                    </div>
                    <p className={`text-[11px] ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{log.details || log.description || 'Record modified.'}</p>
                    {log.userName && <span className="text-[10px] text-emerald-500 mt-1 block font-medium">By: {log.userName}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
