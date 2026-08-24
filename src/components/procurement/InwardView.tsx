import React, { useState, useEffect, useMemo } from 'react';
import { 
  Truck, 
  Layers, 
  Plus, 
  Search, 
  Filter, 
  RefreshCw, 
  Eye, 
  Edit3, 
  Trash2, 
  History, 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  ChevronRight, 
  X, 
  Sparkles, 
  Loader2, 
  Calendar, 
  Printer, 
  Download, 
  Copy, 
  ShieldCheck, 
  ArrowUpDown,
  Tag,
  Hash,
  Scale
} from 'lucide-react';
import { UniversalServerSelect } from '../common/UniversalServerSelect';
import { InvoiceScanner, ExtractedInvoiceData } from '../common/InvoiceScanner';
import { procurementService } from './procurementService';

export interface ReelInwardItemRecord {
  id?: string;
  reelNumber: string;
  material?: string;
  description?: string;
  hsnCode?: string;
  bf?: number;
  gsm?: number;
  length?: number;
  breadth?: number;
  size?: string;
  weight: number;
  uom?: string;
  lotNumber?: string;
  qcStatus?: string;
  status?: string;
  remarks?: string;
}

export interface ReelInwardRecord {
  id: string;
  inwardNumber?: string;
  reelNumber?: string;
  challanNumber?: string;
  invoiceNumber?: string;
  supplierId?: string;
  supplierName?: string;
  millName?: string;
  poId?: string;
  poNumber?: string;
  receivedDate?: string;
  vehicleNumber?: string;
  description?: string;
  remarks?: string;
  weight?: number;
  gsm?: number;
  bf?: number;
  width?: number;
  length?: number;
  lotNumber?: string;
  qcStatus?: string;
  status: string;
  arrivalDate?: string;
  createdAt?: string;
  items?: ReelInwardItemRecord[];
  supplier?: any;
  purchaseOrder?: any;
  qualityChecks?: any[];
}

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

interface InwardViewProps {
  darkMode: boolean;
  gateEntries: any[];
  reelsInward: ReelInwardRecord[];
  suppliers?: any[];
  rawMaterials?: any[];
  purchaseOrders?: any[];
  currentUser?: any;
  getSupplierDisplayName: (supplierId?: string, supplierName?: string, millName?: string, supplierObj?: any) => string;
  setIsGeModalOpen: (open: boolean) => void;
  setIsRiModalOpen?: (open: boolean) => void;
  setIsQcModalOpen?: (open: boolean) => void;
  initializeQcFormForReel?: (ri: any) => void;
  setIsScanning?: (scanning: boolean) => void;
  setScanStatus?: (status: string | null) => void;
  setScanError?: (err: string | null) => void;
  handleAiInvoiceDataExtracted?: (data: ExtractedInvoiceData) => void;
  onRefreshData?: () => Promise<void>;
  onAddNotification?: (notif: any) => void;
}

export const InwardView: React.FC<InwardViewProps> = ({
  darkMode,
  gateEntries,
  reelsInward: initialReelsInward,
  suppliers = [],
  rawMaterials = [],
  purchaseOrders = [],
  currentUser,
  getSupplierDisplayName,
  setIsGeModalOpen,
  setIsQcModalOpen,
  initializeQcFormForReel,
  onRefreshData,
  onAddNotification,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'reels' | 'standard'>('reels');
  const [reelsList, setReelsList] = useState<ReelInwardRecord[]>(initialReelsInward || []);
  const [isLoading, setIsLoading] = useState(false);
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
  const [scanErrorMsg, setScanErrorMsg] = useState<string | null>(null);

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
      { id: 'Drum Paper', code: 'DP-01', name: 'Drum Paper' },
      { id: 'Paper Bundle', code: 'PB-01', name: 'Paper Bundle' },
      { id: 'Heavy Reel', code: 'HR-01', name: 'Heavy Reel' }
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

  // Reel Form Data
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

  // Keep list in sync with props
  useEffect(() => {
    if (initialReelsInward) {
      setReelsList(initialReelsInward);
    }
  }, [initialReelsInward]);

  // Fetch / Refresh Reel Inwards
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

  // Filtered List
  const filteredReels = useMemo(() => {
    return (reelsList || []).filter(ri => {
      // Status filter
      if (statusFilter !== 'ALL') {
        const itemStatus = (ri.status || ri.qcStatus || '').toUpperCase().replace(/\s+/g, '_');
        if (statusFilter === 'PENDING_QC' && !itemStatus.includes('PENDING')) return false;
        if (statusFilter === 'QC_PASSED' && !itemStatus.includes('QC_PASSED') && !itemStatus.includes('APPROV') && !itemStatus.includes('PASSED')) return false;
        if (statusFilter === 'PARTIALLY_PASSED' && !itemStatus.includes('PARTIAL')) return false;
        if (statusFilter === 'QC_FAILED' && !itemStatus.includes('QC_FAILED') && !itemStatus.includes('REJECT') && !itemStatus.includes('FAIL')) return false;
      }

      // Search term
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

  // Aggregate Calculations for Form
  const formCalculations = useMemo(() => {
    const totalReels = reelRows.length;
    const totalWeight = reelRows.reduce((sum, r) => sum + (Number(r.weight) || 0), 0);
    const validGsm = reelRows.filter(r => Number(r.gsm) > 0);
    const avgGsm = validGsm.length > 0 ? (validGsm.reduce((sum, r) => sum + Number(r.gsm), 0) / validGsm.length).toFixed(1) : '-';
    const validBf = reelRows.filter(r => Number(r.bf) > 0);
    const avgBf = validBf.length > 0 ? (validBf.reduce((sum, r) => sum + Number(r.bf), 0) / validBf.length).toFixed(1) : '-';
    
    // Check for duplicate reel numbers
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

  // Open Create Modal
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

  // Open Edit Modal
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
      // Backward compatibility for legacy single-item row
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

  // Open Detail View Modal
  const handleOpenDetailModal = (record: ReelInwardRecord) => {
    setSelectedRecord(record);
    setIsDetailModalOpen(true);
  };

  // Open Audit Modal
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

  // Add Reel Row
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

  // Quick Add 5 Rows
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

  // Remove Reel Row
  const handleRemoveRow = (index: number) => {
    if (reelRows.length <= 1) {
      setFormError('At least one reel must be entered in Reel Inward.');
      return;
    }
    setReelRows(prev => prev.filter((_, idx) => idx !== index));
    setFormError(null);
  };

  // Update Specific Row Field
  const handleUpdateRow = (index: number, field: keyof ReelInwardItemRecord, value: any) => {
    setReelRows(prev => {
      const updated = [...prev];
      const target = { ...updated[index], [field]: value };
      
      // Auto-compute size if length/breadth change
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

  // AI Extracted Data Handler
  const handleAiDataExtracted = (data: ExtractedInvoiceData) => {
    setScanMessage('Data extracted successfully! Review and edit values below.');
    setIsScanActive(false);

    const rawData = data as any;
    // Populate header
    setFormData(prev => ({
      ...prev,
      invoiceNumber: data.invoiceNumber || prev.invoiceNumber,
      challanNumber: rawData.challanNumber || rawData.lrNumber || prev.challanNumber,
      vehicleNumber: data.vehicleNumber || prev.vehicleNumber,
      supplierName: data.supplierName || prev.supplierName,
      receivedDate: data.invoiceDate || prev.receivedDate,
      remarks: data.transporterName ? `Transporter: ${data.transporterName}` : prev.remarks,
    }));

    // If reel items were extracted
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

  // Submit Reel Inward Form
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validate duplicate reel numbers
    if (formCalculations.hasDuplicates) {
      setFormError(`Duplicate Reel Numbers detected: ${formCalculations.duplicates.join(', ')}. Each reel must have a unique identifier.`);
      return;
    }

    // Validate reel rows
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

  // Delete Reel Inward Record (Soft-delete)
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
      {/* Top Header & Tab Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className={`text-xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Goods Receipt & Inward Ledger
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Record raw material entry & mill paper reel inwarding. Reels remain quarantined until Quality Check approval.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className={`flex items-center p-1 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
          <button
            onClick={() => setActiveSubTab('reels')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === 'reels'
                ? (darkMode ? 'bg-emerald-600 text-white shadow-md' : 'bg-white text-emerald-700 shadow-sm')
                : (darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900')
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Paper Reels Inward ({reelsList.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('standard')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === 'standard'
                ? (darkMode ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-indigo-700 shadow-sm')
                : (darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900')
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Standard Gate Entries ({gateEntries.length})</span>
          </button>
        </div>
      </div>

      {/* 1. REEL INWARD TAB */}
      {activeSubTab === 'reels' && (
        <div className="space-y-4">
          {/* Action Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Search & Filter */}
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

              {/* Status Filter */}
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

            {/* Action Buttons */}
            <div className="flex items-center space-x-2 self-end sm:self-auto">
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
                <span>Inward Paper Reels</span>
              </button>
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
                          {!searchTerm && (
                            <button
                              onClick={handleOpenCreateModal}
                              className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 transition-all shadow"
                            >
                              + Create Reel Inward
                            </button>
                          )}
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
                      const isFailed = !isPendingQc && !isPartiallyPassed && (stUpper.includes('FAIL') || stUpper.includes('REJECT'));
                      const isEligibleForQc = isPendingQc || isPartiallyPassed || (ri.items && ri.items.some(it => (it.qcStatus || it.status || '').toUpperCase().includes('PENDING')));

                      return (
                        <tr 
                          key={ri.id} 
                          className={`transition-colors hover:bg-slate-500/5 ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}
                        >
                          {/* Inward Number & PO */}
                          <td className="p-3">
                            <div className="flex items-center space-x-2">
                              <span className="font-mono font-bold text-emerald-400 text-xs">
                                {ri.inwardNumber || ri.reelNumber || 'RIN-REC'}
                              </span>
                            </div>
                            {ri.poNumber && (
                              <span className="text-[10px] text-slate-400 block font-mono">
                                PO: {ri.poNumber}
                              </span>
                            )}
                          </td>

                          {/* Supplier & Mill */}
                          <td className="p-3">
                            <div className="font-semibold text-slate-800 dark:text-slate-200">
                              {displaySupplier}
                            </div>
                            {ri.millName && ri.millName !== ri.supplierName && (
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                                Mill: {ri.millName}
                              </span>
                            )}
                          </td>

                          {/* Invoice & Challan */}
                          <td className="p-3">
                            <div className="text-slate-700 dark:text-slate-300 font-medium">
                              {ri.invoiceNumber ? `Inv: ${ri.invoiceNumber}` : '-'}
                            </div>
                            {ri.challanNumber && (
                              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                                Ch: {ri.challanNumber}
                              </div>
                            )}
                          </td>

                          {/* Received Date & Vehicle */}
                          <td className="p-3">
                            <div className="text-slate-800 dark:text-slate-300">
                              {ri.receivedDate || (ri.createdAt ? new Date(ri.createdAt).toISOString().split('T')[0] : 'N/A')}
                            </div>
                            {ri.vehicleNumber && (
                              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                                {ri.vehicleNumber}
                              </div>
                            )}
                          </td>

                          {/* Number of Reels & Weight */}
                          <td className="p-3 text-center">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-slate-500/10 text-slate-700 dark:text-slate-300 font-bold text-xs border border-slate-500/20">
                              <Layers className="w-3 h-3 mr-1 text-emerald-500" />
                              {itemCount} {itemCount === 1 ? 'Reel' : 'Reels'} • {totalWeight.toLocaleString()} Kg
                            </span>
                          </td>

                          {/* Status */}
                          <td className="p-3 text-center">
                            {isPendingQc ? (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wide bg-amber-500/15 text-amber-400 border border-amber-500/30">
                                <Clock className="w-3 h-3 mr-1" />
                                PENDING QC
                              </span>
                            ) : isPartiallyPassed ? (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wide bg-blue-500/15 text-blue-400 border border-blue-500/30">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                PARTIALLY PASSED
                              </span>
                            ) : isPassed ? (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wide bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                QC PASSED
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wide bg-rose-500/15 text-rose-400 border border-rose-500/30">
                                <X className="w-3 h-3 mr-1" />
                                QC FAILED
                              </span>
                            )}
                          </td>

                          {/* Action Buttons */}
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end space-x-1.5">
                              {/* Add Inspection Report Action Button for eligible records */}
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

                              {/* View */}
                              <button
                                onClick={() => handleOpenDetailModal(ri)}
                                title="View Reel Details"
                                className="p-1.5 rounded-lg hover:bg-slate-500/20 text-slate-400 hover:text-emerald-400 transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              {/* Edit */}
                              <button
                                onClick={() => handleOpenEditModal(ri)}
                                title="Edit Inward Record"
                                className="p-1.5 rounded-lg hover:bg-slate-500/20 text-slate-400 hover:text-blue-400 transition-colors"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              {/* Audit Log */}
                              <button
                                onClick={() => handleOpenAuditModal(ri)}
                                title="View Audit Trail"
                                className="p-1.5 rounded-lg hover:bg-slate-500/20 text-slate-400 hover:text-amber-400 transition-colors"
                              >
                                <History className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete */}
                              <button
                                onClick={() => handleDeleteRecord(ri)}
                                disabled={isDeleting === ri.id}
                                title="Delete Inward Record"
                                className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                              >
                                {isDeleting === ri.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-400" />
                                ) : (
                                  <Trash2 className="w-3.5 h-3.5" />
                                )}
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
        </div>
      )}

      {/* 2. STANDARD GATE ENTRIES TAB */}
      {activeSubTab === 'standard' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className={`text-sm font-bold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>Standard Gate Entry Receipts</h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Direct warehouse stock receipts for non-reel raw materials</p>
            </div>
            <button
              onClick={() => setIsGeModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow transition-all cursor-pointer flex items-center space-x-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Gate Entry</span>
            </button>
          </div>

          <div className={`rounded-2xl border overflow-hidden ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr className={`border-b font-bold uppercase tracking-wider ${darkMode ? 'bg-slate-800 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                    <th className="p-2.5">Gate Entry No / PO</th>
                    <th className="p-2.5">Vehicle Detail</th>
                    <th className="p-2.5">Transporter</th>
                    <th className="p-2.5">Material</th>
                    <th className="p-2.5">Inward Weight</th>
                    <th className="p-2.5">Receipt Warehouse</th>
                    <th className="p-2.5">Date Received</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {gateEntries.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400 text-xs">
                        No standard gate entries recorded.
                      </td>
                    </tr>
                  ) : (
                    gateEntries.map(ge => (
                      <tr key={ge.id}>
                        <td className="p-2.5 font-mono font-bold text-amber-500">{ge.gateEntryNumber} <span className="text-[10px] text-slate-400 block font-normal">{ge.poNumber}</span></td>
                        <td className="p-2.5">{ge.vehicleNumber} <span className="text-slate-400 block text-[9px]">{ge.driverName}</span></td>
                        <td className="p-2.5 text-slate-400">{ge.transportCompany}</td>
                        <td className="p-2.5 font-semibold text-slate-300">{ge.itemsReceived[0]?.materialName}</td>
                        <td className="p-2.5 font-extrabold text-emerald-500">{ge.itemsReceived[0]?.quantityReceived?.toLocaleString()} Kg</td>
                        <td className="p-2.5 text-slate-400">{ge.warehouse?.name || 'Main Warehouse'}</td>
                        <td className="p-2.5 text-slate-500">{ge.arrivalDate}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODALS ================= */}

      {/* CREATE / EDIT REEL INWARD MODAL */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto">
          <div className={`w-full max-w-5xl my-6 rounded-3xl shadow-2xl border p-6 relative max-h-[92vh] flex flex-col ${
            darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-bold">
                  {editingRecordId ? 'Edit Reel Inward Record' : 'Record Reel Inward (Pending QC)'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Log incoming paper reels. Material status will be set to <span className="text-amber-400 font-bold">PENDING_QC</span> and will not be added to active inventory.
                </p>
              </div>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-500/20 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Banner */}
            {formError && (
              <div className="mt-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-start space-x-2 text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <div className="flex-1">
                  <p className="font-bold">Validation Error</p>
                  <p className="text-[11px] opacity-90">{formError}</p>
                </div>
                <button onClick={() => setFormError(null)} className="p-1 hover:bg-white/10 rounded">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* AI Document Scan Toggle Section */}
            <div className="mt-4 p-3.5 rounded-2xl border bg-emerald-500/5 border-emerald-500/20 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-emerald-400">Scan Inward Challan / Mill Invoice</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsScanActive(!isScanActive)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600 hover:text-white transition-all cursor-pointer"
                >
                  {isScanActive ? 'Hide Scanner' : 'Open Scanner'}
                </button>
              </div>

              {isScanActive && (
                <div className="mt-2">
                  <InvoiceScanner
                    darkMode={darkMode}
                    onScanStart={() => {
                      setScanMessage('Scanning document & extracting reel data...');
                      setScanErrorMsg(null);
                    }}
                    onScanError={(err) => {
                      setScanErrorMsg(err);
                      setScanMessage(null);
                    }}
                    onDataExtracted={handleAiDataExtracted}
                  />
                  {scanMessage && (
                    <p className="text-[11px] text-emerald-400 mt-2 font-medium">{scanMessage}</p>
                  )}
                  {scanErrorMsg && (
                    <p className="text-[11px] text-rose-400 mt-2 font-medium">{scanErrorMsg}</p>
                  )}
                </div>
              )}
            </div>

            {/* Scrollable Form Content */}
            <form onSubmit={handleSubmitForm} className="mt-4 space-y-5 overflow-y-auto pr-1 flex-1">
              {/* Header Details Card */}
              <div className={`p-4 rounded-2xl border space-y-3 ${darkMode ? 'bg-slate-800/40 border-slate-700/60' : 'bg-slate-50 border-slate-300'}`}>
                <h4 className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-slate-300' : 'text-slate-800'}`}>
                  Header & Inward Details
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
                  {/* Inward Ref Number */}
                  <div>
                    <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                      Inward Ref # <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.inwardNumber}
                      onChange={(e) => setFormData({ ...formData, inwardNumber: e.target.value })}
                      placeholder="e.g. RIN-2026-0041"
                      className={`w-full px-3 py-2 rounded-xl border font-mono font-medium ${
                        darkMode ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                      }`}
                    />
                  </div>

                  {/* Supplier Master Selection */}
                  <div>
                    <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                      Supplier / Mill <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <SearchableSelect
                      options={supplierOptions}
                      value={formData.supplierId}
                      required={true}
                      placeholder="-- Choose Supplier Master --"
                      searchPlaceholder="Search supplier by name or code..."
                      darkMode={darkMode}
                      onChange={(supId, option) => {
                        const supObj = option?.raw || suppliers.find(s => s.id === supId);
                        setFormData({
                          ...formData,
                          supplierId: supId,
                          supplierName: supObj?.supplierName || supObj?.name || formData.supplierName,
                          millName: supObj?.millName || supObj?.supplierName || supObj?.name || formData.millName,
                        });
                      }}
                    />
                  </div>

                  {/* Purchase Order (Optional) */}
                  <div>
                    <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                      Purchase Order # (Optional)
                    </label>
                    <UniversalServerSelect
                      endpoint="/api/purchase-orders"
                      value={formData.poId}
                      onChange={(id, poObj) => {
                        setFormData({
                          ...formData,
                          poNumber: poObj?.poNumber || '',
                          poId: id,
                          supplierId: poObj?.supplierId || formData.supplierId,
                          supplierName: poObj?.supplierName || poObj?.supplier?.supplierName || formData.supplierName,
                        });
                      }}
                      placeholder="Search or select PO..."
                      searchPlaceholder="Search PO number or supplier..."
                      darkMode={darkMode}
                    />
                  </div>

                  {/* Received Date */}
                  <div>
                    <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                      Received Date <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.receivedDate}
                      onChange={(e) => setFormData({ ...formData, receivedDate: e.target.value })}
                      className={`w-full px-3 py-2 rounded-xl border font-medium ${
                        darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>

                  {/* Invoice Number */}
                  <div>
                    <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                      Invoice Number
                    </label>
                    <input
                      type="text"
                      value={formData.invoiceNumber}
                      onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                      placeholder="e.g. INV-9021"
                      className={`w-full px-3 py-2 rounded-xl border font-medium ${
                        darkMode ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                      }`}
                    />
                  </div>

                  {/* Challan Number */}
                  <div>
                    <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                      Challan Number
                    </label>
                    <input
                      type="text"
                      value={formData.challanNumber}
                      onChange={(e) => setFormData({ ...formData, challanNumber: e.target.value })}
                      placeholder="e.g. CH-4421"
                      className={`w-full px-3 py-2 rounded-xl border font-medium ${
                        darkMode ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                      }`}
                    />
                  </div>

                  {/* Vehicle Number */}
                  <div>
                    <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                      Vehicle Number
                    </label>
                    <input
                      type="text"
                      value={formData.vehicleNumber}
                      onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                      placeholder="e.g. MH-12-AB-1234"
                      className={`w-full px-3 py-2 rounded-xl border font-medium ${
                        darkMode ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                      }`}
                    />
                  </div>

                  {/* Remarks / Description */}
                  <div>
                    <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                      Remarks / Transporter
                    </label>
                    <input
                      type="text"
                      value={formData.remarks}
                      onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                      placeholder="e.g. Unloaded at Bay 2"
                      className={`w-full px-3 py-2 rounded-xl border font-medium ${
                        darkMode ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Multi-Reel Grid Section */}
              <div className={`p-4 rounded-2xl border space-y-3 ${darkMode ? 'bg-slate-800/40 border-slate-700/60' : 'bg-slate-50 border-slate-300'}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-slate-300' : 'text-slate-800'}`}>
                      Reel Details ({reelRows.length} Reels)
                    </h4>
                    <p className={`text-[11px] font-medium ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      Enter distinct Reel Numbers, GSM, BF, dimensions and weights.
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={handleAddRow}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white text-xs font-bold transition-all cursor-pointer flex items-center space-x-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Reel Row</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleQuickAddFive}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${darkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
                    >
                      + Quick 5
                    </button>
                  </div>
                </div>

                {/* Duplicate Warning */}
                {formCalculations.hasDuplicates && (
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center space-x-2 font-medium">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                    <span>Duplicate Reel Number detected: <b>{formCalculations.duplicates.join(', ')}</b>. All reel numbers must be unique.</span>
                  </div>
                )}

                {/* Table of Rows */}
                <div className={`rounded-xl border overflow-hidden ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className={`border-b text-[10px] font-bold uppercase tracking-wider ${darkMode ? 'bg-slate-800/80 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                          <th className="p-2.5 w-10 text-center">#</th>
                          <th className="p-2.5 min-w-[120px]">Reel Number <span className="text-rose-500">*</span></th>
                          <th className="p-2.5 min-w-[140px]">Material Type</th>
                          <th className="p-2.5 w-20">GSM</th>
                          <th className="p-2.5 w-20">BF</th>
                          <th className="p-2.5 w-24">Length (mm)</th>
                          <th className="p-2.5 w-24">Breadth (mm)</th>
                          <th className="p-2.5 w-28 text-right">Weight (Kg) <span className="text-rose-500">*</span></th>
                          <th className="p-2.5 min-w-[100px]">Lot / Batch #</th>
                          <th className="p-2.5 w-12 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${darkMode ? 'divide-slate-800' : 'divide-slate-200'}`}>
                        {reelRows.map((row, idx) => {
                          const isDup = formCalculations.duplicates.includes((row.reelNumber || '').trim().toUpperCase());

                          return (
                            <tr key={idx} className={isDup ? 'bg-amber-500/10' : ''}>
                              <td className={`p-2 text-center font-mono text-[11px] font-bold ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{idx + 1}</td>
                              
                              {/* Reel Number */}
                              <td className="p-2">
                                <input
                                  type="text"
                                  required
                                  value={row.reelNumber}
                                  onChange={(e) => handleUpdateRow(idx, 'reelNumber', e.target.value)}
                                  placeholder="e.g. R001"
                                  className={`w-full px-2 py-1 rounded-lg border font-mono text-xs font-bold ${
                                    isDup 
                                      ? 'border-amber-500 text-amber-300 bg-amber-500/10' 
                                      : darkMode ? 'bg-slate-800 border-slate-700 text-emerald-400 placeholder-slate-500' : 'bg-slate-50 border-slate-300 text-emerald-800 placeholder-slate-400'
                                  }`}
                                />
                              </td>

{/* Material */}
                               <td className="p-2">
                                 <SearchableSelect
                                   options={materialOptions}
                                   value={row.material || 'Paper Reel'}
                                   required={true}
                                   placeholder="Select Material"
                                   searchPlaceholder="Search material by name or code..."
                                   darkMode={darkMode}
                                   onChange={(val, option) => {
                                     const matName = option?.raw?.name || val;
                                     handleUpdateRow(idx, 'material', matName);
                                     if (option?.raw?.hsnCode) {
                                       handleUpdateRow(idx, 'hsnCode', option.raw.hsnCode);
                                     }
                                   }}
                                 />
                                </td>

                              {/* GSM */}
                              <td className="p-2">
                                <input
                                  type="number"
                                  value={row.gsm || ''}
                                  onChange={(e) => handleUpdateRow(idx, 'gsm', e.target.value)}
                                  placeholder="120"
                                  className={`w-full px-2 py-1 rounded-lg border text-xs font-semibold ${
                                    darkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                                  }`}
                                />
                              </td>

                              {/* BF */}
                              <td className="p-2">
                                <input
                                  type="number"
                                  value={row.bf || ''}
                                  onChange={(e) => handleUpdateRow(idx, 'bf', e.target.value)}
                                  placeholder="18"
                                  className={`w-full px-2 py-1 rounded-lg border text-xs font-semibold ${
                                    darkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                                  }`}
                                />
                              </td>

                              {/* Length */}
                              <td className="p-2">
                                <input
                                  type="number"
                                  value={row.length || ''}
                                  onChange={(e) => handleUpdateRow(idx, 'length', e.target.value)}
                                  placeholder="1200"
                                  className={`w-full px-2 py-1 rounded-lg border text-xs font-semibold ${
                                    darkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                                  }`}
                                />
                              </td>

                              {/* Breadth */}
                              <td className="p-2">
                                <input
                                  type="number"
                                  value={row.breadth || ''}
                                  onChange={(e) => handleUpdateRow(idx, 'breadth', e.target.value)}
                                  placeholder="800"
                                  className={`w-full px-2 py-1 rounded-lg border text-xs font-semibold ${
                                    darkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                                  }`}
                                />
                              </td>

                              {/* Weight */}
                              <td className="p-2 text-right">
                                <input
                                  type="number"
                                  step="0.1"
                                  required
                                  value={row.weight || ''}
                                  onChange={(e) => handleUpdateRow(idx, 'weight', e.target.value)}
                                  placeholder="450"
                                  className={`w-full px-2 py-1 rounded-lg border text-right font-bold text-xs ${
                                    darkMode ? 'bg-slate-800 border-slate-700 text-emerald-400 placeholder-slate-500' : 'bg-slate-50 border-slate-300 text-emerald-800 placeholder-slate-400'
                                  }`}
                                />
                              </td>

                              {/* Lot Number */}
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={row.lotNumber || ''}
                                  onChange={(e) => handleUpdateRow(idx, 'lotNumber', e.target.value)}
                                  placeholder="LOT-99"
                                  className={`w-full px-2 py-1 rounded-lg border text-xs font-semibold ${
                                    darkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                                  }`}
                                />
                              </td>

                              {/* Delete Row */}
                              <td className="p-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveRow(idx)}
                                  title="Remove Reel Row"
                                  className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Summary Strip */}
                <div className={`p-3 rounded-xl border flex flex-wrap items-center justify-between gap-3 text-xs ${
                  darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                }`}>
                  <div className="flex items-center space-x-4">
                    <span>Total Reels: <b className="text-emerald-500 font-bold">{formCalculations.totalReels}</b></span>
                    <span>Total Gross Weight: <b className="text-emerald-500 font-bold">{formCalculations.totalWeight.toLocaleString()} Kg</b></span>
                    <span>Avg GSM: <b className={darkMode ? 'text-slate-200 font-bold' : 'text-slate-800 font-bold'}>{formCalculations.avgGsm}</b></span>
                    <span>Avg BF: <b className={darkMode ? 'text-slate-200 font-bold' : 'text-slate-800 font-bold'}>{formCalculations.avgBf}</b></span>
                  </div>

                  <div className="text-[11px] text-amber-500 font-semibold">
                    Status will be recorded as: <b className="underline">PENDING_QC</b> (No active inventory stock created)
                  </div>
                </div>
              </div>

              {/* Modal Footer Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 rounded-xl border text-xs font-semibold hover:bg-slate-500/10 transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting || formCalculations.hasDuplicates}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold shadow transition-all flex items-center space-x-2 ${
                    isSubmitting || formCalculations.hasDuplicates
                      ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-emerald-900/30'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Reel Inward...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>{editingRecordId ? 'Update Reel Inward' : 'Save Reel Inward (Pending QC)'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REEL INWARD DETAIL MODAL */}
      {isDetailModalOpen && selectedRecord && (() => {
        const recTotalReels = selectedRecord.items?.length || 1;
        const recPassedReels = selectedRecord.items 
          ? selectedRecord.items.filter(it => (it.qcStatus || it.status || '').toUpperCase() === 'APPROVED' || (it.qcStatus || it.status || '').toUpperCase() === 'PASSED').length 
          : ((selectedRecord.status || '').toUpperCase().includes('PASS') || (selectedRecord.status || '').toUpperCase().includes('APPROV') ? 1 : 0);
        const recFailedReels = selectedRecord.items 
          ? selectedRecord.items.filter(it => (it.qcStatus || it.status || '').toUpperCase() === 'REJECTED' || (it.qcStatus || it.status || '').toUpperCase() === 'FAILED').length 
          : ((selectedRecord.status || '').toUpperCase().includes('FAIL') || (selectedRecord.status || '').toUpperCase().includes('REJECT') ? 1 : 0);
        const recInspectedReels = recPassedReels + recFailedReels;
        const recPendingReels = Math.max(0, recTotalReels - recInspectedReels);

        const stUpper = (selectedRecord.status || selectedRecord.qcStatus || '').toUpperCase();
        const isRecPendingQc = stUpper.includes('PENDING');
        const isRecPartiallyPassed = stUpper.includes('PARTIAL');
        const isRecPassed = !isRecPendingQc && !isRecPartiallyPassed && (stUpper.includes('PASS') || stUpper.includes('APPROV'));
        const isRecFailed = !isRecPendingQc && !isRecPartiallyPassed && (stUpper.includes('FAIL') || stUpper.includes('REJECT'));
        const isRecEligibleForQc = isRecPendingQc || isRecPartiallyPassed || (selectedRecord.items && selectedRecord.items.some(it => (it.qcStatus || it.status || '').toUpperCase().includes('PENDING')));

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto">
            <div className={`w-full max-w-4xl my-6 rounded-3xl shadow-2xl border p-6 relative max-h-[92vh] flex flex-col ${
              darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}>
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-base font-bold font-mono text-emerald-400">
                        {selectedRecord.inwardNumber || selectedRecord.reelNumber}
                      </h3>
                      {isRecPendingQc ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                          PENDING_QC
                        </span>
                      ) : isRecPartiallyPassed ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                          PARTIALLY PASSED
                        </span>
                      ) : isRecPassed ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          QC PASSED
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                          QC FAILED
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Paper Reel Inward Entry • {isRecPendingQc ? 'Quarantined (Waiting for QC Inspection)' : 'Quality Inspection Processed'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {isRecEligibleForQc && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsDetailModalOpen(false);
                        if (initializeQcFormForReel && setIsQcModalOpen) {
                          initializeQcFormForReel(selectedRecord);
                          setIsQcModalOpen(true);
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow flex items-center space-x-1.5 transition-all cursor-pointer"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Add Inspection Report</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setIsDetailModalOpen(false);
                      handleOpenEditModal(selectedRecord);
                    }}
                    className="px-3 py-1.5 rounded-xl border text-xs font-semibold hover:bg-slate-500/10 flex items-center space-x-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-blue-400" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => setIsDetailModalOpen(false)}
                    className="p-1.5 rounded-full hover:bg-slate-500/20 text-slate-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Status Notice Banner */}
              {isRecPendingQc ? (
                <div className="mt-4 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center space-x-2.5">
                  <ShieldCheck className="w-5 h-5 shrink-0 text-amber-400" />
                  <div>
                    <p className="font-bold">Quarantined Stock (Pending Quality Inspection)</p>
                    <p className="text-[11px] opacity-90">
                      These paper reels have NOT been added to available warehouse stock. They must pass Quality Control inspection before inventory stock is increased.
                    </p>
                  </div>
                </div>
              ) : isRecPartiallyPassed ? (
                <div className="mt-4 p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs flex items-center space-x-2.5">
                  <AlertTriangle className="w-5 h-5 shrink-0 text-blue-400" />
                  <div>
                    <p className="font-bold">Partially Passed Quality Inspection</p>
                    <p className="text-[11px] opacity-90">
                      Passed reels have been credited to warehouse raw material inventory. Rejected reels remain quarantined and were excluded from active stock.
                    </p>
                  </div>
                </div>
              ) : isRecPassed ? (
                <div className="mt-4 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center space-x-2.5">
                  <CheckCircle className="w-5 h-5 shrink-0 text-emerald-400" />
                  <div>
                    <p className="font-bold">Quality Check Passed & Stock In Completed</p>
                    <p className="text-[11px] opacity-90">
                      All inspected reels in this batch met quality specifications and are now active in warehouse inventory.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mt-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center space-x-2.5">
                  <X className="w-5 h-5 shrink-0 text-rose-400" />
                  <div>
                    <p className="font-bold">Quality Check Failed (Batch Rejected)</p>
                    <p className="text-[11px] opacity-90">
                      All reels failed the inspection parameters. No inventory stock was credited.
                    </p>
                  </div>
                </div>
              )}

              {/* Details Content */}
              <div className="mt-4 space-y-5 overflow-y-auto pr-1 flex-1">
                {/* Header Info Grid */}
                <div className={`p-4 rounded-2xl border grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs ${
                  darkMode ? 'bg-slate-800/40 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}>
                  <div>
                    <span className={`text-[10px] uppercase font-bold block ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Supplier</span>
                    <span className={`font-semibold ${darkMode ? 'text-slate-200' : 'text-slate-900'}`}>
                      {getSupplierDisplayName(selectedRecord.supplierId, selectedRecord.supplierName, selectedRecord.millName, selectedRecord.supplier)}
                    </span>
                  </div>

                  <div>
                    <span className={`text-[10px] uppercase font-bold block ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Received Date</span>
                    <span className={darkMode ? 'text-slate-200' : 'text-slate-900'}>
                      {selectedRecord.receivedDate || (selectedRecord.createdAt ? new Date(selectedRecord.createdAt).toISOString().split('T')[0] : 'N/A')}
                    </span>
                  </div>

                  <div>
                    <span className={`text-[10px] uppercase font-bold block ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Invoice Number</span>
                    <span className={`font-mono font-medium ${darkMode ? 'text-slate-200' : 'text-slate-900'}`}>
                      {selectedRecord.invoiceNumber || 'N/A'}
                    </span>
                  </div>

                  <div>
                    <span className={`text-[10px] uppercase font-bold block ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Challan Number</span>
                    <span className={`font-mono font-medium ${darkMode ? 'text-slate-200' : 'text-slate-900'}`}>
                      {selectedRecord.challanNumber || 'N/A'}
                    </span>
                  </div>

                  <div>
                    <span className={`text-[10px] uppercase font-bold block ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Purchase Order</span>
                    <span className={`font-mono font-medium ${darkMode ? 'text-slate-200' : 'text-slate-900'}`}>
                      {selectedRecord.poNumber || 'N/A'}
                    </span>
                  </div>

                  <div>
                    <span className={`text-[10px] uppercase font-bold block ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Vehicle Number</span>
                    <span className={`font-mono font-medium ${darkMode ? 'text-slate-200' : 'text-slate-900'}`}>
                      {selectedRecord.vehicleNumber || 'N/A'}
                    </span>
                  </div>

                  <div>
                    <span className={`text-[10px] uppercase font-bold block ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Total Reels</span>
                    <span className={`font-bold ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>
                      {selectedRecord.items?.length || 1} Reels
                    </span>
                  </div>

                  <div>
                    <span className={`text-[10px] uppercase font-bold block ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Gross Weight</span>
                    <span className={`font-bold ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>
                      {(selectedRecord.items && selectedRecord.items.length > 0 
                        ? selectedRecord.items.reduce((s, it) => s + (Number(it.weight) || 0), 0)
                        : Number(selectedRecord.weight || 0)).toLocaleString()} Kg
                    </span>
                  </div>
                </div>

                {/* QC Summary Card (Requirement 7) */}
                <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-800/30 border-slate-700' : 'bg-slate-50 border-slate-300'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-800'}`}>
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      <span>Quality Control Summary & Tally</span>
                    </h4>
                    <span className={`text-[11px] font-mono ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      Overall Status: <b className={isRecPassed ? 'text-emerald-500' : isRecPartiallyPassed ? 'text-blue-500' : isRecFailed ? 'text-rose-500' : 'text-amber-500'}>{selectedRecord.status || 'PENDING_QC'}</b>
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
                    <div className={`p-2.5 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`}>
                      <span className={`text-[10px] font-bold uppercase block ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Total Reels</span>
                      <span className={`text-base font-extrabold ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>{recTotalReels}</span>
                    </div>

                    <div className={`p-2.5 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`}>
                      <span className={`text-[10px] font-bold uppercase block ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Inspected</span>
                      <span className={`text-base font-extrabold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>{recInspectedReels}</span>
                    </div>

                    <div className={`p-2.5 rounded-xl border ${darkMode ? 'bg-emerald-950/20 border-emerald-800/40' : 'bg-emerald-50 border-emerald-200'}`}>
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase block">Passed</span>
                      <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">{recPassedReels}</span>
                    </div>

                    <div className={`p-2.5 rounded-xl border ${darkMode ? 'bg-rose-950/20 border-rose-800/40' : 'bg-rose-50 border-rose-200'}`}>
                      <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase block">Failed</span>
                      <span className="text-base font-extrabold text-rose-600 dark:text-rose-400">{recFailedReels}</span>
                    </div>

                    <div className={`p-2.5 rounded-xl border ${darkMode ? 'bg-amber-950/20 border-amber-800/40' : 'bg-amber-50 border-amber-200'}`}>
                      <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase block">Pending QC</span>
                      <span className="text-base font-extrabold text-amber-600 dark:text-amber-400">{recPendingReels}</span>
                    </div>
                  </div>
                </div>

                {/* Reel Items Table (Requirement 4) */}
                <div className="space-y-2">
                  <h4 className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-slate-300' : 'text-slate-800'}`}>
                    Individual Reel Manifest & QC Verdicts
                  </h4>

                  <div className={`rounded-2xl border overflow-hidden ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`}>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className={`border-b text-[10px] font-bold uppercase tracking-wider ${
                            darkMode ? 'bg-slate-800/80 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                          }`}>
                            <th className="p-3">#</th>
                            <th className="p-3">Reel Number</th>
                            <th className="p-3">Material</th>
                            <th className="p-3">HSN Code</th>
                            <th className="p-3">GSM</th>
                            <th className="p-3">BF</th>
                            <th className="p-3">Dimensions</th>
                            <th className="p-3 text-right">Weight (Kg)</th>
                            <th className="p-3">Lot #</th>
                            <th className="p-3 text-center">QC Verdict</th>
                          </tr>
                        </thead>
                        <tbody className={`divide-y ${darkMode ? 'divide-slate-800' : 'divide-slate-200'}`}>
                          {selectedRecord.items && selectedRecord.items.length > 0 ? (
                            selectedRecord.items.map((item, idx) => {
                              const itemQcStatus = (item.qcStatus || item.status || '').toUpperCase();
                              const isItemPassed = itemQcStatus === 'APPROVED' || itemQcStatus === 'PASSED';
                              const isItemFailed = itemQcStatus === 'REJECTED' || itemQcStatus === 'FAILED';

                              return (
                                <tr key={item.id || idx}>
                                  <td className={`p-3 font-mono text-[11px] font-bold ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{idx + 1}</td>
                                  <td className={`p-3 font-mono font-bold ${darkMode ? 'text-emerald-400' : 'text-emerald-800'}`}>{item.reelNumber}</td>
                                  <td className={`p-3 font-semibold ${darkMode ? 'text-slate-200' : 'text-slate-900'}`}>{item.material || 'Paper Reel'}</td>
                                  <td className={`p-3 font-mono ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{item.hsnCode || '48191010'}</td>
                                  <td className={`p-3 font-medium ${darkMode ? 'text-slate-300' : 'text-slate-800'}`}>{item.gsm ? `${item.gsm} GSM` : '-'}</td>
                                  <td className={`p-3 font-medium ${darkMode ? 'text-slate-300' : 'text-slate-800'}`}>{item.bf ? `${item.bf} BF` : '-'}</td>
                                  <td className={`p-3 font-mono ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                    {item.length && item.breadth ? `${item.length} x ${item.breadth} mm` : item.size || '-'}
                                  </td>
                                  <td className={`p-3 text-right font-bold ${darkMode ? 'text-emerald-400' : 'text-emerald-800'}`}>
                                    {Number(item.weight || 0).toLocaleString()} {item.uom || 'Kg'}
                                  </td>
                                  <td className={`p-3 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{item.lotNumber || '-'}</td>
                                  <td className="p-3 text-center">
                                    {isItemPassed ? (
                                      <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                                        PASSED
                                      </span>
                                    ) : isItemFailed ? (
                                      <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-rose-500/15 text-rose-500 border border-rose-500/30">
                                        FAILED
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-500/15 text-amber-500 border border-amber-500/30">
                                        Pending QC
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })
                          ) : (
                            // Fallback for single row
                            <tr>
                              <td className={`p-3 font-mono text-[11px] font-bold ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>1</td>
                              <td className={`p-3 font-mono font-bold ${darkMode ? 'text-emerald-400' : 'text-emerald-800'}`}>{selectedRecord.reelNumber}</td>
                              <td className={`p-3 font-semibold ${darkMode ? 'text-slate-200' : 'text-slate-900'}`}>Paper Reel</td>
                              <td className={`p-3 font-mono ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>48191010</td>
                              <td className={`p-3 font-medium ${darkMode ? 'text-slate-300' : 'text-slate-800'}`}>{selectedRecord.gsm ? `${selectedRecord.gsm} GSM` : '-'}</td>
                              <td className={`p-3 font-medium ${darkMode ? 'text-slate-300' : 'text-slate-800'}`}>{selectedRecord.bf ? `${selectedRecord.bf} BF` : '-'}</td>
                              <td className={`p-3 font-mono ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{selectedRecord.width ? `Width: ${selectedRecord.width}mm` : '-'}</td>
                              <td className={`p-3 text-right font-bold ${darkMode ? 'text-emerald-400' : 'text-emerald-800'}`}>{Number(selectedRecord.weight || 0).toLocaleString()} Kg</td>
                              <td className={`p-3 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{selectedRecord.lotNumber || '-'}</td>
                              <td className="p-3 text-center">
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/15 text-amber-500">
                                  Pending QC
                                </span>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* QC Inspection History (Requirement 9) */}
                {selectedRecord.qualityChecks && selectedRecord.qualityChecks.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                      <FileText className="w-4 h-4 text-emerald-400" />
                      <span>QC Inspection Reports & Test Logs</span>
                    </h4>

                    <div className={`rounded-2xl border overflow-hidden ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className={`border-b text-[10px] font-bold uppercase tracking-wider ${
                              darkMode ? 'bg-slate-800/80 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'
                            }`}>
                              <th className="p-3">QC Report #</th>
                              <th className="p-3">Reel Number</th>
                              <th className="p-3 text-center">Moisture %</th>
                              <th className="p-3 text-center">Observed GSM</th>
                              <th className="p-3 text-center">Observed BF</th>
                              <th className="p-3 text-right">Actual Weight</th>
                              <th className="p-3">Inspector</th>
                              <th className="p-3">Date</th>
                              <th className="p-3 text-center">QC Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/40">
                            {selectedRecord.qualityChecks.map((qc: any, qIdx: number) => (
                              <tr key={qc.id || qIdx}>
                                <td className="p-3 font-mono font-bold text-slate-400">{qc.qcNumber || `QC-${qIdx + 1}`}</td>
                                <td className="p-3 font-mono font-bold text-emerald-400">{qc.reelNumber || '-'}</td>
                                <td className={`p-3 text-center font-bold ${Number(qc.moisture) > 8 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                  {qc.moisture != null ? `${qc.moisture}%` : '-'}
                                </td>
                                <td className="p-3 text-center font-mono">{qc.gsmVerification || '-'}</td>
                                <td className="p-3 text-center font-mono">{qc.bfVerification || '-'}</td>
                                <td className="p-3 text-right font-bold">{qc.actualWeight != null ? `${qc.actualWeight} Kg` : '-'}</td>
                                <td className="p-3 text-slate-300">{qc.inspector || 'QC Inspector'}</td>
                                <td className="p-3 text-slate-400">{qc.inspectionDate || (qc.createdAt ? new Date(qc.createdAt).toISOString().split('T')[0] : '-')}</td>
                                <td className="p-3 text-center">
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                    (qc.qualityStatus || '').toLowerCase() === 'approved' || (qc.qualityStatus || '').toLowerCase() === 'passed'
                                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                      : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                                  }`}>
                                    {qc.qualityStatus || 'Approved'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800 mt-4">
                <div>
                  {isRecEligibleForQc && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsDetailModalOpen(false);
                        if (initializeQcFormForReel && setIsQcModalOpen) {
                          initializeQcFormForReel(selectedRecord);
                          setIsQcModalOpen(true);
                        }
                      }}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow flex items-center space-x-1.5 transition-all cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Add Inspection Report</span>
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setIsDetailModalOpen(false)}
                  className="px-5 py-2 rounded-xl bg-slate-800 text-white text-xs font-semibold hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* AUDIT LOG MODAL */}
      {isAuditModalOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto">
          <div className={`w-full max-w-2xl my-6 rounded-3xl shadow-2xl border p-6 relative max-h-[85vh] flex flex-col ${
            darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-2.5">
                <History className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold">
                  Audit History: {selectedRecord.inwardNumber || selectedRecord.reelNumber}
                </h3>
              </div>
              <button
                onClick={() => setIsAuditModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-500/20 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 overflow-y-auto pr-1 flex-1">
              {isLoadingAudit ? (
                <div className="p-8 text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-amber-400 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">Loading audit history...</p>
                </div>
              ) : auditLogs.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No recorded audit log events for this entry yet.
                </div>
              ) : (
                auditLogs.map((log, idx) => (
                  <div 
                    key={log.id || idx}
                    className={`p-3.5 rounded-2xl border text-xs space-y-1.5 ${
                      darkMode ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-400 font-mono text-[11px]">
                        {log.action}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A'}
                      </span>
                    </div>

                    <p className="text-slate-300">{log.details || log.fieldName || 'Record updated'}</p>

                    <div className="text-[10px] text-slate-500">
                      Performed by: <b className="text-slate-400">{log.user || 'Administrator'}</b>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-200 dark:border-slate-800 mt-3">
              <button
                onClick={() => setIsAuditModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-semibold hover:bg-slate-700"
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
