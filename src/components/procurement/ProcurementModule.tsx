import React, { useState, useRef, useEffect } from 'react';
import { 
  ShoppingCart, FileText, CheckCircle, Truck, ArrowRight, Plus, X, Save, 
  Search, Eye, Printer, Download, Mail, Share2, Award, ClipboardCheck, Sparkles, Send, Trash2,
  Copy, ArrowUp, ArrowDown, Bell, Check, XCircle, Upload, AlertTriangle, Loader2
} from 'lucide-react';
import { InvoiceScanner, ExtractedInvoiceData } from '../common/InvoiceScanner';
import { RawMaterial, Supplier, Warehouse, InventoryTransaction, NotificationItem, RFQItem, ProcurementPO, NotificationSettingRule, User } from '../../types';
import { ProcurementDashboardView } from './ProcurementDashboardView';
import { RFQView } from './RFQView';
import { SupplierQuotesView } from './SupplierQuotesView';
import { PurchaseOrdersView } from './PurchaseOrdersView';
import { GateEntryView } from './GateEntryView';
import { ReelInwardView } from './ReelInwardView';
import { QcView } from './QcView';
import { DatePicker } from '../common/DatePicker';
import { RFQForm } from './RFQForm';
import { PurchaseOrderForm } from './PurchaseOrderForm';
import { SupplierQuotationForm } from './SupplierQuotationForm';
import { procurementService } from './procurementService';
import { ServerSearchableDropdown } from '../common/ServerSearchableDropdown';

interface ProcurementModuleProps {
  darkMode: boolean;
  rawMaterials: RawMaterial[];
  suppliers: Supplier[];
  warehouses: Warehouse[];
  onAddTransaction: (txn: InventoryTransaction) => void;
  onAddNotification: (n: Omit<NotificationItem, 'id' | 'read'>) => void;
  onUpdateRawMaterials: React.Dispatch<React.SetStateAction<RawMaterial[]>>;
  onUpdateSuppliers: React.Dispatch<React.SetStateAction<Supplier[]>>;
  onUpdateWarehouses?: React.Dispatch<React.SetStateAction<Warehouse[]>>;
  onUpdateBins?: React.Dispatch<React.SetStateAction<any[]>>;
  activeSubTab?: 'dashboard' | 'rfq' | 'quotes' | 'po' | 'inward' | 'gate_entry' | 'reel_inward' | 'qc';
  onSelectSubTab?: (tab: 'dashboard' | 'rfq' | 'quotes' | 'po' | 'inward' | 'gate_entry' | 'reel_inward' | 'qc') => void;
  purchaseOrders?: ProcurementPO[];
  rfqs?: RFQItem[];
  onUpdatePurchaseOrders?: React.Dispatch<React.SetStateAction<ProcurementPO[]>>;
  onUpdateRfqs?: React.Dispatch<React.SetStateAction<RFQItem[]>>;
  selectedPoId?: string | null;
  selectedRfqId?: string | null;
  currentUser?: User;
  onTriggerEventNotification?: (
    eventKey: 'rfq_created' | 'rfq_sent' | 'quote_received' | 'po_created' | 'po_approved' | 'po_rejected' | 'goods_received' | 'po_completed',
    details: { title: string; message: string; poNumber?: string; rfqNumber?: string; supplierName?: string; recipientEmail?: string }
  ) => void;
  onOpenNotificationSettings?: () => void;
  notificationRules?: NotificationSettingRule[];
  onSelectMaterial?: (id: string) => void;
  binLocations?: any[];
}

interface SupplierQuoteItem {
  materialCode: string;
  materialName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  taxPercent: number;
  taxAmount: number;
  totalAmount: number;
  remarks?: string;
}

interface SupplierQuote {
  id: string;
  quotationNumber?: string;
  quotationDate?: string;
  rfqId: string;
  rfqNumber: string;
  supplierId: string;
  supplierName: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  deliveryDays: number;
  paymentTerms: string;
  validUntil: string;
  currency?: string;
  remarks: string;
  status: 'Pending' | 'Awarded' | 'Rejected';
  items?: SupplierQuoteItem[];
}

interface GateEntryRecord {
  id: string;
  gateEntryNumber: string;
  poId?: string;
  poNumber: string;
  vehicleNumber: string;
  driverName: string;
  driverPhone: string;
  transportCompany: string;
  arrivalDate: string;
  warehouseId?: string;
  warehouse?: { name: string };
  remarks: string;
  itemsReceived: {
    materialCode: string;
    materialName: string;
    quantityReceived: number;
    unit?: string;
    hsnCode?: string;
    unitPrice?: number;
    totalAmount?: number;
  }[];
}

interface ReelInwardRecord {
  id: string;
  reelNumber: string;
  supplierName: string;
  millName?: string;
  poNumber: string;
  invoiceNumber: string;
  hsn: string;
  bf: number;
  gsm: number;
  width: number;
  length: number;
  weight: number;
  lotNumber: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  arrivalDate: string;
}

interface QCRecord {
  id: string;
  reelNumber: string;
  expectedWeight: number;
  actualWeight: number;
  moisture: number;
  gsmVerification: number;
  bfVerification: number;
  qualityStatus: 'Pending' | 'Approved' | 'Rejected';
  inspector: string;
  inspectionDate: string;
  remarks: string;
}

export const ProcurementModule: React.FC<ProcurementModuleProps> = ({
  darkMode,
  rawMaterials,
  suppliers,
  warehouses,
  onAddTransaction,
  onAddNotification,
  onUpdateRawMaterials,
  onUpdateSuppliers,
  onUpdateWarehouses,
  onUpdateBins,
  activeSubTab,
  onSelectSubTab,
  purchaseOrders: propsPurchaseOrders,
  rfqs: propsRfqs,
  onUpdatePurchaseOrders: propsOnUpdatePurchaseOrders,
  onUpdateRfqs: propsOnUpdateRfqs,
  selectedPoId,
  selectedRfqId,
  currentUser,
  onTriggerEventNotification,
  onOpenNotificationSettings,
  notificationRules,
  onSelectMaterial,
  binLocations = []
}) => {
  const effectiveWarehouses = warehouses || [];
  const [localActiveTab, setLocalActiveTab] = useState<'dashboard' | 'rfq' | 'quotes' | 'po' | 'inward' | 'qc'>('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  
  const activeTab = activeSubTab || localActiveTab;
  const setActiveTab = onSelectSubTab || setLocalActiveTab;

  const triggerNotification = (
    eventKey: 'rfq_created' | 'rfq_sent' | 'quote_received' | 'po_created' | 'po_approved' | 'po_rejected' | 'goods_received' | 'po_completed',
    details: { title: string; message: string; poNumber?: string; rfqNumber?: string; supplierName?: string; recipientEmail?: string }
  ) => {
    if (onTriggerEventNotification) {
      onTriggerEventNotification(eventKey, details);
    } else {
      onAddNotification({
        title: details.title,
        message: details.message,
        type: eventKey.includes('rejected') ? 'alert' : eventKey.includes('approved') ? 'success' : 'info',
        time: 'Just Now',
        module: 'Procurement'
      });
    }
  };

  React.useEffect(() => {
    if (selectedPoId) {
      setActiveTab('po');
    }
    if (selectedRfqId) {
      setActiveTab('rfq');
    }

    // Fetch Gate Entries, Reel Inwards and Quality Checks for relevant tabs
    const fetchData = async () => {
      const isRelevantTab = activeTab === 'inward' || activeTab === 'qc' || activeTab === 'gate_entry' || activeTab === 'reel_inward';
      if (!isRelevantTab) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const [geRes, riRes, qcRes] = await Promise.all([
          procurementService.getGateEntries(),
          procurementService.getReelInwards(),
          procurementService.getQualityChecks()
        ]);
        if (geRes.success) {
          setGateEntries(geRes.data.map((ge: any) => ({
            ...ge,
            arrivalDate: ge.createdAt ? new Date(ge.createdAt).toISOString().replace('T', ' ').slice(0, 16) : 'N/A',
            itemsReceived: ge.items || []
          })));
        }
        if (riRes.success) setReelsInward(riRes.data);
        if (qcRes && qcRes.success) {
          const rawData = Array.isArray(qcRes.data) ? qcRes.data : (qcRes.data?.items || qcRes.data?.checks || []);
          const mappedQcs = rawData.map((qc: any) => {
            let parsedParams = [];
            try {
              parsedParams = typeof qc.parameters === 'string' ? JSON.parse(qc.parameters) : (qc.parameters || []);
            } catch (e) {
              parsedParams = [];
            }
            const firstRow = parsedParams[0] || {};
            return {
              id: qc.id,
              reelNumber: qc.reelInward?.inwardNumber || qc.reelInward?.reelNumber || firstRow.reelNo || qc.qcNumber || 'N/A',
              expectedWeight: qc.reelInward?.weight || Number(firstRow.netWeight || firstRow.weight || 0),
              actualWeight: Number(firstRow.netWeight || firstRow.weight || qc.reelInward?.weight || 0),
              moisture: Number(firstRow.moisture || 0),
              gsmVerification: Number(firstRow.observationGsm || firstRow.gsm || qc.reelInward?.gsm || 0),
              bfVerification: Number(firstRow.observationBf || firstRow.bf || qc.reelInward?.bf || 0),
              qualityStatus: qc.status || 'Passed',
              inspector: qc.inspector || 'Sunita Menon',
              inspectionDate: qc.testedAt ? new Date(qc.testedAt).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
              remarks: qc.remarks || '',
              items: parsedParams,
              reelInward: qc.reelInward,
            };
          });
          setQcRecords(mappedQcs);
        }
      } catch (err) {
        console.error('Error fetching procurement data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [selectedPoId, selectedRfqId, activeTab]);
  
  // State variables with empty initial data
  const [internalRfqs, setInternalRfqs] = useState<RFQItem[]>([]);

  const rfqs = propsRfqs || internalRfqs;
  const setRfqs = propsOnUpdateRfqs || setInternalRfqs;

  const [quotes, setQuotes] = useState<SupplierQuote[]>([]);

  const [internalPurchaseOrders, setInternalPurchaseOrders] = useState<ProcurementPO[]>([]);

  const purchaseOrders = propsPurchaseOrders || internalPurchaseOrders;
  const setPurchaseOrders = propsOnUpdatePurchaseOrders || setInternalPurchaseOrders;

  const [gateEntries, setGateEntries] = useState<GateEntryRecord[]>([]);

  const [reelsInward, setReelsInward] = useState<ReelInwardRecord[]>([]);

  const [qcRecords, setQcRecords] = useState<QCRecord[]>([]);

  // Form states
  const [searchQuery, setSearchQuery] = useState('');
  const [isRfqModalOpen, setIsRfqModalOpen] = useState(false);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [editingQuoteId, setEditingQuoteId] = useState<string | null>(null);
  const [quoteSupplierSearch, setQuoteSupplierSearch] = useState('');
  const [isPoModalOpen, setIsPoModalOpen] = useState(false);
  const [isGeModalOpen, setIsGeModalOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isMatching, setIsMatching] = useState(false);
  const [scanStatus, setScanStatus] = useState('');
  const [scanError, setScanError] = useState<string | null>(null);
  const [isRiModalOpen, setIsRiModalOpen] = useState(false);
  const [isQcModalOpen, setIsQcModalOpen] = useState(false);
  const [isSubmittingQc, setIsSubmittingQc] = useState(false);
  const [selectedRfqForQuotes, setSelectedRfqForQuotes] = useState<RFQItem | null>(null);

  // Supplier Quote Form State (Strict Single Supplier Selection)
  const [quoteForm, setQuoteForm] = useState({
    rfqId: '',
    rfqNumber: '',
    quotationNumber: '',
    quotationDate: new Date().toISOString().slice(0, 10),
    validUntil: new Date(Date.now() + 20*24*60*60*1000).toISOString().slice(0, 10),
    supplierId: '', // Single Supplier ID
    paymentTerms: 'Net 30 Days',
    deliveryDays: 7,
    currency: 'INR (₹)',
    status: 'Pending' as 'Pending' | 'Awarded' | 'Rejected',
    remarks: ''
  });

  const [quoteLineItems, setQuoteLineItems] = useState<SupplierQuoteItem[]>([]);
  const [isSubmittingQuote, setIsSubmittingQuote] = useState(false);
  const [quoteSubmitError, setQuoteSubmitError] = useState<string | null>(null);

  const getSupplierDisplayName = (
    supplierId?: string,
    fallbackSupplierName?: string,
    fallbackMillName?: string,
    supplierRelation?: { supplierName?: string; millName?: string | null } | null
  ): string => {
    if (supplierRelation?.supplierName) {
      if (supplierRelation.millName && supplierRelation.millName.trim() && !supplierRelation.supplierName.toLowerCase().includes(supplierRelation.millName.toLowerCase())) {
        return `${supplierRelation.supplierName} - ${supplierRelation.millName}`;
      }
      return supplierRelation.supplierName;
    }

    const sup = suppliers.find(s => 
      (supplierId && s.id === supplierId) || 
      (s.supplierName && fallbackSupplierName && (
        s.supplierName.toLowerCase() === fallbackSupplierName.toLowerCase() ||
        fallbackSupplierName.toLowerCase().startsWith(s.supplierName.toLowerCase())
      ))
    );

    if (sup) {
      if (sup.millName && sup.millName.trim() && !sup.supplierName.toLowerCase().includes(sup.millName.toLowerCase())) {
        return `${sup.supplierName} - ${sup.millName}`;
      }
      return sup.supplierName;
    }

    if (fallbackSupplierName) {
      if (fallbackMillName && fallbackMillName.trim() && !fallbackSupplierName.toLowerCase().includes(fallbackMillName.toLowerCase())) {
        return `${fallbackSupplierName} - ${fallbackMillName}`;
      }
      return fallbackSupplierName;
    }

    return '-';
  };

  const handleOpenNewQuoteModal = () => {
    const qtnNum = `QTN-2026-000${quotes.length + 1}`;
    const initialRfq = selectedRfqForQuotes || rfqs[0];
    const initialRfqId = initialRfq ? initialRfq.id : '';
    const initialRfqNum = initialRfq ? initialRfq.rfqNumber : '';

    setEditingQuoteId(null);
    setQuoteSupplierSearch('');
    setQuoteForm({
      rfqId: initialRfqId,
      rfqNumber: initialRfqNum,
      quotationNumber: qtnNum,
      quotationDate: new Date().toISOString().slice(0, 10),
      validUntil: new Date(Date.now() + 20*24*60*60*1000).toISOString().slice(0, 10),
      supplierId: '',
      paymentTerms: 'Net 30 Days',
      deliveryDays: 7,
      currency: 'INR (₹)',
      status: 'Pending',
      remarks: ''
    });

    if (initialRfq && initialRfq.materials) {
      setQuoteLineItems(initialRfq.materials.map(m => {
        const p = m.expectedPrice || 50;
        const taxP = 18;
        const taxA = (m.quantity * p) * 0.18;
        return {
          materialCode: m.materialCode,
          materialName: m.name,
          quantity: m.quantity,
          unit: m.unit,
          unitPrice: p,
          taxPercent: taxP,
          taxAmount: Number(taxA.toFixed(2)),
          totalAmount: Number(((m.quantity * p) + taxA).toFixed(2)),
          remarks: m.remarks || ''
        };
      }));
    } else {
      setQuoteLineItems([]);
    }

    setIsQuoteModalOpen(true);
  };

  const handleOpenEditQuoteModal = (quote: SupplierQuote) => {
    setEditingQuoteId(quote.id);
    setQuoteSupplierSearch('');
    setQuoteForm({
      rfqId: quote.rfqId,
      rfqNumber: quote.rfqNumber,
      quotationNumber: quote.quotationNumber || `QTN-${quote.id}`,
      quotationDate: quote.quotationDate || new Date().toISOString().slice(0, 10),
      validUntil: quote.validUntil || new Date(Date.now() + 20*24*60*60*1000).toISOString().slice(0, 10),
      supplierId: quote.supplierId,
      paymentTerms: quote.paymentTerms || 'Net 30 Days',
      deliveryDays: quote.deliveryDays || 7,
      currency: quote.currency || 'INR (₹)',
      status: quote.status,
      remarks: quote.remarks || ''
    });

    if (quote.items && quote.items.length > 0) {
      setQuoteLineItems(quote.items);
    } else {
      setQuoteLineItems([{
        materialCode: 'RM-KRAFT-180',
        materialName: 'Virgin Kraft Liner Paper Roll',
        quantity: quote.quantity,
        unit: 'Kg',
        unitPrice: quote.unitPrice,
        taxPercent: 18,
        taxAmount: Number((quote.totalPrice * 0.18).toFixed(2)),
        totalAmount: quote.totalPrice,
        remarks: quote.remarks
      }]);
    }

    setIsQuoteModalOpen(true);
  };

  const handleSelectRfqInQuoteForm = (rfqId: string) => {
    const sel = rfqs.find(r => r.id === rfqId);
    setQuoteForm(prev => ({
      ...prev,
      rfqId,
      rfqNumber: sel ? sel.rfqNumber : ''
    }));

    if (sel && sel.materials && sel.materials.length > 0) {
      setQuoteLineItems(sel.materials.map(m => {
        const p = m.expectedPrice || 50;
        const taxP = 18;
        const taxA = (m.quantity * p) * 0.18;
        return {
          materialCode: m.materialCode,
          materialName: m.name,
          quantity: m.quantity,
          unit: m.unit,
          unitPrice: p,
          taxPercent: taxP,
          taxAmount: Number(taxA.toFixed(2)),
          totalAmount: Number(((m.quantity * p) + taxA).toFixed(2)),
          remarks: m.remarks || ''
        };
      }));
    }
  };

  const handleAddQuoteLineItem = () => {
    setQuoteLineItems(prev => [
      ...prev,
      {
        materialCode: '',
        materialName: '',
        quantity: 100,
        unit: 'Kg',
        unitPrice: 50,
        taxPercent: 18,
        taxAmount: 900,
        totalAmount: 5900,
        remarks: ''
      }
    ]);
  };

  const handleRemoveQuoteLineItem = (idx: number) => {
    setQuoteLineItems(prev => prev.filter((_, i) => i !== idx));
  };

  const handleUpdateQuoteLineItem = (idx: number, field: string, value: any) => {
    setQuoteLineItems(prev => {
      const copy = [...prev];
      const item = { ...copy[idx] };

      if (field === 'materialCode') {
        const mat = rawMaterials.find(rm => rm.code === value);
        item.materialCode = value;
        item.materialName = mat ? mat.name : '';
        item.unit = mat ? mat.uom : 'Kg';
        item.unitPrice = mat ? mat.purchasePrice : 50;
      } else {
        (item as any)[field] = value;
      }

      const q = Number(item.quantity) || 0;
      const p = Number(item.unitPrice) || 0;
      const tP = Number(item.taxPercent) || 0;
      const subtotal = q * p;
      const taxA = subtotal * (tP / 100);
      item.taxAmount = Number(taxA.toFixed(2));
      item.totalAmount = Number((subtotal + taxA).toFixed(2));

      copy[idx] = item;
      return copy;
    });
  };

  const handleSaveQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    setQuoteSubmitError(null);

    if (!quoteForm.supplierId) {
      setQuoteSubmitError("Please select a single supplier for this quotation.");
      return;
    }

    if (quoteLineItems.length === 0) {
      setQuoteSubmitError("Please add at least one line item to this quotation.");
      return;
    }

    const sup = suppliers.find(s => s.id === quoteForm.supplierId);
    if (!sup) {
      setQuoteSubmitError("Invalid supplier selected.");
      return;
    }

    setIsSubmittingQuote(true);

    try {
      const totalAmount = quoteLineItems.reduce((sum, item) => sum + (Number(item.totalAmount) || 0), 0);
      const payload = {
        quoteNumber: quoteForm.quotationNumber || `QTN-${Date.now()}`,
        rfqId: quoteForm.rfqId || undefined,
        supplierId: sup.id,
        quoteDate: quoteForm.quotationDate,
        validityDate: quoteForm.validUntil,
        status: quoteForm.status === 'Pending' ? 'Submitted' : (quoteForm.status === 'Awarded' ? 'Accepted' : quoteForm.status),
        totalAmount,
        remarks: quoteForm.remarks,
        items: quoteLineItems.map(item => ({
          materialCode: item.materialCode,
          materialName: item.materialName,
          quantity: Number(item.quantity) || 0,
          unitPrice: Number(item.unitPrice) || 0,
          discount: 0,
          tax: Number(item.taxAmount) || 0,
          totalPrice: Number(item.totalAmount) || 0
        }))
      };

      const endpoint = editingQuoteId ? `/api/supplier-quotes?id=${editingQuoteId}` : '/api/supplier-quotes';
      const method = editingQuoteId ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (!res.ok || !data.success) {
        throw new Error(data.error || data.message || 'Failed to save supplier quotation');
      }

      // Format for local state
      const totalQty = quoteLineItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
      const avgPrice = totalQty > 0 ? payload.totalAmount / totalQty : 0;
      
      const savedQuote: SupplierQuote = {
        id: data.data?.id || editingQuoteId || `Q-${Date.now()}`,
        quotationNumber: data.data?.quoteNumber || payload.quoteNumber,
        quotationDate: payload.quoteDate,
        rfqId: quoteForm.rfqId,
        rfqNumber: quoteForm.rfqNumber,
        supplierId: sup.id,
        supplierName: getSupplierDisplayName(sup.id, sup.supplierName, sup.millName),
        unitPrice: Number(avgPrice.toFixed(2)),
        quantity: totalQty,
        totalPrice: payload.totalAmount,
        deliveryDays: quoteForm.deliveryDays,
        paymentTerms: quoteForm.paymentTerms,
        validUntil: payload.validityDate,
        currency: quoteForm.currency,
        remarks: payload.remarks,
        status: quoteForm.status,
        items: quoteLineItems
      };

      if (editingQuoteId) {
        setQuotes(prev => prev.map(q => q.id === editingQuoteId ? savedQuote : q));
        onAddNotification({
          title: 'Supplier Quotation Updated',
          message: `Quotation ${savedQuote.quotationNumber} from ${savedQuote.supplierName} updated successfully.`,
          type: 'info',
          time: 'Just Now'
        });
      } else {
        setQuotes(prev => [savedQuote, ...prev]);
        triggerNotification('quote_received', {
          title: 'Supplier Quote Received',
          message: `Quotation ${savedQuote.quotationNumber} received from ${savedQuote.supplierName} for ${savedQuote.rfqNumber || 'RFQ'} (Value: ₹${savedQuote.totalPrice.toLocaleString()}).`,
          rfqNumber: savedQuote.rfqNumber,
          supplierName: savedQuote.supplierName,
          recipientEmail: 'sunita.menon@amkerp.com'
        });
      }

      setIsQuoteModalOpen(false);
    } catch (err: any) {
      console.error(err);
      setQuoteSubmitError(err.message || 'An error occurred while saving the quotation.');
    } finally {
      setIsSubmittingQuote(false);
    }
  };

  // Form Field states
  const [newRfq, setNewRfq] = useState({
    department: 'Production',
    priority: 'Medium' as 'Low' | 'Medium' | 'High',
    deliveryDate: '',
    description: '',
    remarks: '',
    materialCode: '',
    quantity: 1000,
    expectedPrice: 50,
    selectedSuppliers: [] as string[]
  });

  const [rfqItems, setRfqItems] = useState<Array<{
    materialCode: string;
    materialId?: string;
    name: string;
    description: string;
    unit: string;
    quantity: number;
    expectedPrice?: number;
    requiredDate: string;
    remarks: string;
  }>>([]);
  const [activeSearchIdx, setActiveSearchIdx] = useState<number | null>(null);
  const [searchTerms, setSearchTerms] = useState<{[key: number]: string}>({});
  const [allowDuplicateMaterials, setAllowDuplicateMaterials] = useState<boolean>(false);

  const handleAddRfqItem = () => {
    const defaultDate = newRfq.deliveryDate || new Date(Date.now() + 10*24*60*60*1000).toISOString().slice(0, 10);
    setRfqItems(prev => [
      ...prev,
      {
        materialCode: '',
        name: '',
        description: '',
        unit: 'Kg',
        quantity: 100,
        expectedPrice: undefined,
        requiredDate: defaultDate,
        remarks: ''
      }
    ]);
  };

  const handleRemoveRfqItem = (index: number) => {
    setRfqItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleDuplicateRfqItem = (index: number) => {
    const itemToDup = rfqItems[index];
    if (!itemToDup) return;
    setRfqItems(prev => {
      const copy = [...prev];
      copy.splice(index + 1, 0, { ...itemToDup });
      return copy;
    });
  };

  const handleMoveRfqItem = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === rfqItems.length - 1) return;
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    setRfqItems(prev => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIdx];
      copy[targetIdx] = temp;
      return copy;
    });
  };

  const handleUpdateRfqItem = (index: number, field: string, value: any) => {
    setRfqItems(prev => {
      const copy = [...prev];
      const item = { ...copy[index] };
      if (field === 'materialCode' || field === 'materialId') {
        const mat = rawMaterials.find(rm => rm.id === value || (rm.code && rm.code === value));
        if (mat) {
          item.materialCode = mat.code || mat.id;
          item.materialId = mat.id;
          item.name = mat.name;
          item.description = mat.description || item.description || '';
          item.unit = mat.uom || 'Kg';
          item.expectedPrice = mat.purchasePrice ?? item.expectedPrice;
        } else {
          item.materialCode = value;
          item.materialId = value;
        }
      } else {
        (item as any)[field] = value;
      }
      copy[index] = item;
      return copy;
    });
  };

  const [supplierSearch, setSupplierSearch] = useState('');
  const [isSupplierDropdownOpen, setIsSupplierDropdownOpen] = useState(false);

  const [rfqSupplierSearch, setRfqSupplierSearch] = useState('');
  const [isRfqSupplierDropdownOpen, setIsRfqSupplierDropdownOpen] = useState(false);
  const rfqDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (rfqDropdownRef.current && !rfqDropdownRef.current.contains(event.target as Node)) {
        setIsRfqSupplierDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [rfqDropdownRef]);
  const [newPo, setNewPo] = useState<{
    supplierId: string;
    deliveryDate: string;
    items: {
      materialId: string;
      materialCode: string;
      materialName: string;
      quantity: number;
      unitPrice: number;
      uom?: string;
      gst?: number;
    }[];
    remarks: string;
  }>({
    supplierId: '',
    deliveryDate: new Date(Date.now() + 7*24*60*60*1000).toISOString().slice(0, 10),
    items: [{ materialId: '', materialCode: '', materialName: '', quantity: 1000, unitPrice: 50, uom: 'Kg', gst: 18 }],
    remarks: ''
  });

  interface GateEntryItemForm {
    materialId?: string;
    materialCode: string;
    materialName: string;
    quantityReceived: number;
    unit: string;
    hsnCode: string;
    unitPrice: number;
    totalAmount: number;
    scannedMaterialName?: string;
    scannedHsn?: string;
    isCustomMaterial?: boolean;
  }

  const [newGe, setNewGe] = useState<{
    poNumber: string;
    supplierId?: string;
    vehicleNumber: string;
    driverName: string;
    driverPhone: string;
    transportCompany: string;
    warehouseId: string;
    remarks: string;
    materialCode: string;
    quantityReceived: number;
    items: GateEntryItemForm[];
    scannedSupplierName?: string;
    scannedPoNumber?: string;
    isCustomSupplier?: boolean;
    customSupplierName?: string;
    isCustomPo?: boolean;
  }>({
    poNumber: '',
    supplierId: '',
    vehicleNumber: '',
    driverName: '',
    driverPhone: '',
    transportCompany: '',
    warehouseId: effectiveWarehouses[0]?.id || '',
    remarks: '',
    materialCode: '',
    quantityReceived: 1000,
    items: [],
    isCustomSupplier: false,
    customSupplierName: '',
    isCustomPo: false
  });

  // Handler for AI Invoice Scan result to pre-fill Reel Inward form
  const handleRiAiInvoiceDataExtracted = async (data: ExtractedInvoiceData) => {
    setIsScanning(false);
    setIsMatching(true);
    setScanStatus('Matching PO for reels...');
    setScanError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 800));

      console.log("SCANNED DATA", data);

      const scannedPoNumber = data.document?.buyerOrderNumber || data.poNumber || '';
      let matchedPo = undefined;
      if (scannedPoNumber) {
        matchedPo = purchaseOrders.find(p =>
          p.poNumber.toLowerCase() === scannedPoPoNumberClean(scannedPoNumber) ||
          p.poNumber.toLowerCase().includes(scannedPoNumber.toLowerCase())
        );
      }

      console.log("MATCHED PO", matchedPo);

      if (scannedPoNumber && !matchedPo) {
        throw new Error(`Purchase Order not found: ${scannedPoNumber}`);
      }

      // Map items to reels
      const reelsList = (data.items || []).map((it, idx) => ({
        reelNumber: `REEL-${data.document?.invoiceNumber || 'NEW'}-${idx + 1}`,
        bf: 18, // Default, not always in doc
        gsm: 180, // Default, not always in doc
        width: 1200, // Default, not always in doc
        length: 1500, // Default, not always in doc
        weight: it.quantity || 1200,
        lotNumber: data.document?.deliveryNoteNumber || 'LOT-AI-SCAN'
      }));

      setNewRi({
        poNumber: matchedPo ? matchedPo.poNumber : '',
        invoiceNumber: data.document?.invoiceNumber || data.invoiceNumber || '',
        hsn: data.items?.[0]?.hsnSacCode || '48191010',
        items: reelsList,
        remarks: `[AI Scan] ${data.document?.invoiceNumber || ''}`
      });
    } catch (err: any) {
      console.error("Reel Inward matching error:", err);
      setScanError(err.message || "Failed to match invoice data with database records.");
    } finally {
      setIsScanning(false);
      setIsMatching(false);
      setScanStatus('');
    }
  };

  // Helper helper to sanitize PO codes
  const scannedPoPoNumberClean = (num: string) => {
    return num.trim().toLowerCase();
  };

  // Handler for AI Invoice Scan result to pre-fill QC form
  const handleQcAiInvoiceDataExtracted = (data: ExtractedInvoiceData) => {
    const doc = data.document as any;
    setQcForm(prev => {
      const updatedRows = prev.rows.map(row => ({
        ...row,
        netWeight: String(data.items?.[0]?.quantity || row.netWeight),
        moisture: String(doc?.moisture || row.moisture),
        observationGsm: String(doc?.gsm || row.observationGsm),
        observationBf: String(doc?.bf || row.observationBf),
        remarks: `[AI QC Scan] ${doc?.invoiceNumber || ''}`
      }));
      return {
        ...prev,
        invoiceNo: doc?.invoiceNumber || prev.invoiceNo,
        invoiceDate: doc?.date || prev.invoiceDate,
        quantityAsWritten: String(data.items?.[0]?.quantity || prev.quantityAsWritten),
        remarks: `[AI Scan matched]`,
        rows: updatedRows
      };
    });
  };

  // Handler for AI Invoice Scan result to pre-fill Gate Entry form
  const handlePoAiInvoiceDataExtracted = async (data: ExtractedInvoiceData) => {
    setIsScanning(false);
    setIsMatching(true);
    setScanStatus('Matching supplier and materials...');
    setScanError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 800));

      console.log("SCANNED DATA", data);

      // 1. Match Supplier
      const scannedSupplierName = data.supplierName || data.supplier?.name;
      let matchedSupplier = undefined;
      if (scannedSupplierName) {
        matchedSupplier = suppliers.find(s =>
          s.supplierName?.toLowerCase().includes(scannedSupplierName.toLowerCase()) ||
          s.millName?.toLowerCase().includes(scannedSupplierName.toLowerCase())
        );
      }

      console.log("MATCHED SUPPLIER", matchedSupplier);

      if (scannedSupplierName && !matchedSupplier) {
        throw new Error(`Supplier not found: ${scannedSupplierName}`);
      }

      // 2. Map items
      const itemsList = (data.items || []).map(it => {
        const rm = rawMaterials.find(r => 
          (it.name && r.name.toLowerCase().includes(it.name.toLowerCase())) || 
          (it.description && r.name.toLowerCase().includes(it.description.toLowerCase()))
        );

        if (it.name && !rm) {
          throw new Error(`Material not found: ${it.name}`);
        }

        return {
          materialId: rm?.id || '',
          materialCode: String(rm?.code || 'RM-RAW'),
          materialName: rm?.name || it.name || it.description || 'Raw Material',
          quantity: it.quantity || 1000,
          unitPrice: it.rate || it.ratePerUnit || 50
        };
      });

      console.log("MATCHED MATERIALS", itemsList);

      // 3. Update newPo
      setNewPo({
        supplierId: matchedSupplier?.id || '',
        deliveryDate: new Date(Date.now() + 7*24*60*60*1000).toISOString().slice(0, 10),
        items: itemsList.length > 0 ? itemsList : [{ materialId: '', materialCode: '', materialName: '', quantity: 1000, unitPrice: 50 }],
        remarks: `[AI Scan] ${data.invoiceNumber || data.document?.invoiceNumber || ''} | ${scannedSupplierName || ''}`
      });
    } catch (err: any) {
      console.error("Direct PO matching error:", err);
      setScanError(err.message || "Failed to match invoice data with database records.");
    } finally {
      setIsScanning(false);
      setIsMatching(false);
      setScanStatus('');
    }
  };


  const handleAiInvoiceDataExtracted = async (data: ExtractedInvoiceData) => {
    setIsScanning(false); // Extraction done, now matching
    setIsMatching(true);
    setScanStatus('Matching supplier, PO and materials...');
    setScanError(null);

    // Scanner "null" value helper (treat null, undefined, "", "null", "NULL" as empty)
    const isEmptyScannedValue = (val: any): boolean => {
      if (val === undefined || val === null) return true;
      const s = String(val).trim();
      return s === '' || s.toLowerCase() === 'null' || s.toLowerCase() === 'undefined';
    };

    const getCleanScannedValue = (val: any): string => {
      if (isEmptyScannedValue(val)) return '';
      return String(val).trim();
    };

    try {
      // Artificial delay to show the "Matching" state to the user as requested
      await new Promise(resolve => setTimeout(resolve, 800));

      const scannedSupplierName = getCleanScannedValue(data.supplierName || data.supplier?.name);
      const scannedVehicleNumber = getCleanScannedValue(data.vehicleNumber || data.document?.motorVehicleNumber);
      const scannedMaterials = data.materials || [];

      // Extract PO Number from candidates in strict priority order (ignoring "null" or empty strings)
      const getUsablePoValue = (val: any): string => {
        if (isEmptyScannedValue(val)) return '';
        return String(val).trim();
      };

      let resolvedPoNumber = '';
      if (data.document?.buyerOrderNumber) resolvedPoNumber = getUsablePoValue(data.document.buyerOrderNumber);
      if (!resolvedPoNumber && data.document?.referenceNumber) resolvedPoNumber = getUsablePoValue(data.document.referenceNumber);
      if (!resolvedPoNumber && (data.document as any)?.poNumber) resolvedPoNumber = getUsablePoValue((data.document as any).poNumber);
      if (!resolvedPoNumber && data.poNumber) resolvedPoNumber = getUsablePoValue(data.poNumber);

      const scannedPoNumber = resolvedPoNumber;

      // Backward compatibility & requirement matching
      const scannedData = {
        ...data,
        supplierName: scannedSupplierName,
        poNumber: scannedPoNumber,
        materials: scannedMaterials,
        vehicleNumber: scannedVehicleNumber
      };

      // String normalization helpers
      const normalizeExact = (str: string) => {
        if (!str) return '';
        return str.toLowerCase().replace(/\s+/g, ' ').trim();
      };

      const normalizeSupplierName = (name: string): string => {
        if (!name) return '';
        let s = name.toLowerCase();
        // Strip common company suffix/noise words
        s = s.replace(/\b(company|co|ltd|limited|corp|corporation|pvt|private|inc|incorporated)\b/g, ' ');
        // Strip non-alphanumeric characters, collapse spaces and trim
        s = s.replace(/[^a-z0-9]/g, ' ');
        s = s.replace(/\s+/g, ' ');
        return s.trim();
      };

      const normalizeMatCode = (code: string) => {
        if (!code) return '';
        return code.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
      };

      const normalizeMatName = (name: string) => {
        if (!name) return '';
        return name.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
      };

      const normalizePoNumber = (poStr: string) => {
        if (!poStr) return '';
        return poStr.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
      };

      // 1. Match Supplier with PostgreSQL database
      let matchedSupplier = undefined;
      if (scannedSupplierName) {
        const normScannedExact = normalizeExact(scannedSupplierName);
        const normScannedClean = normalizeSupplierName(scannedSupplierName);

        // a) Case-insensitive exact name match
        matchedSupplier = suppliers.find(s => 
          normalizeExact(s.supplierName) === normScannedExact || 
          normalizeExact(s.millName) === normScannedExact
        );

        // b) Normalized name match (removes suffixes like Company vs Co)
        if (!matchedSupplier && normScannedClean) {
          matchedSupplier = suppliers.find(s => 
            normalizeSupplierName(s.supplierName) === normScannedClean || 
            normalizeSupplierName(s.millName) === normScannedClean
          );
        }

        // c) Partial match (inclusion)
        if (!matchedSupplier && normScannedClean.length > 2) {
          matchedSupplier = suppliers.find(s => {
            const dbNormName = normalizeSupplierName(s.supplierName);
            const dbNormMill = normalizeSupplierName(s.millName);
            return (dbNormName && (dbNormName.includes(normScannedClean) || normScannedClean.includes(dbNormName))) ||
                   (dbNormMill && (dbNormMill.includes(normScannedClean) || normScannedClean.includes(dbNormMill)));
          });
        }
      }

      // 2. Match Purchase Order from PostgreSQL database
      let matchedPo = undefined;
      if (resolvedPoNumber) {
        const normScannedPo = normalizePoNumber(resolvedPoNumber);

        // a) Match PO by supplier AND PO number (exact, normalized, then partial)
        if (matchedSupplier) {
          matchedPo = purchaseOrders.find(p => 
            p.supplierId === matchedSupplier.id && 
            p.poNumber.toLowerCase().trim() === resolvedPoNumber.toLowerCase().trim()
          );

          if (!matchedPo) {
            matchedPo = purchaseOrders.find(p => 
              p.supplierId === matchedSupplier.id && 
              normalizePoNumber(p.poNumber) === normScannedPo
            );
          }

          if (!matchedPo && normScannedPo.length > 2) {
            matchedPo = purchaseOrders.find(p => {
              if (p.supplierId !== matchedSupplier.id) return false;
              const dbNorm = normalizePoNumber(p.poNumber);
              return dbNorm.includes(normScannedPo) || normScannedPo.includes(dbNorm);
            });
          }
        }

        // b) Match PO globally if not matched under supplier filter
        if (!matchedPo) {
          matchedPo = purchaseOrders.find(p => 
            p.poNumber.toLowerCase().trim() === resolvedPoNumber.toLowerCase().trim()
          );
        }

        if (!matchedPo) {
          matchedPo = purchaseOrders.find(p => 
            normalizePoNumber(p.poNumber) === normScannedPo
          );
        }

        if (!matchedPo && normScannedPo.length > 2) {
          matchedPo = purchaseOrders.find(p => {
            const dbNorm = normalizePoNumber(p.poNumber);
            return dbNorm.includes(normScannedPo) || normScannedPo.includes(dbNorm);
          });
        }
      }

      const matchedPO = matchedPo;

      // 3. Match Materials with PostgreSQL database (using HSN, Code, Name)
      let itemsList: GateEntryItemForm[] = [];

      if (scannedMaterials && scannedMaterials.length > 0) {
        itemsList = scannedMaterials.map(mat => {
          let dbMaterial = undefined;

          // a) Match by ID if present
          if ((mat as any).id) {
            dbMaterial = rawMaterials.find(rm => rm.id === (mat as any).id);
          }

          // b) Match by exact HSN code
          if (!dbMaterial && mat.hsnCode) {
            const cleanHsn = String(mat.hsnCode).trim();
            dbMaterial = rawMaterials.find(rm => rm.hsnCode === cleanHsn);
          }

          // c) Match by material code
          if (!dbMaterial && mat.code) {
            const normScannedCode = normalizeMatCode(mat.code);
            dbMaterial = rawMaterials.find(rm => normalizeMatCode(rm.code) === normScannedCode);
          }

          // d) Match by normalized name
          if (!dbMaterial && mat.name) {
            const normScannedName = normalizeMatName(mat.name);
            dbMaterial = rawMaterials.find(rm => normalizeMatName(rm.name) === normScannedName);
          }

          // e) Match by partial name (inclusion)
          if (!dbMaterial && mat.name) {
            const normScannedName = normalizeMatName(mat.name);
            dbMaterial = rawMaterials.find(rm => {
              const dbNameNorm = normalizeMatName(rm.name);
              return dbNameNorm.includes(normScannedName) || normScannedName.includes(dbNameNorm);
            });
          }

          // Look up corresponding PO item if matching PO exists
          const poItem = matchedPo?.items?.find(i =>
            (i.materialCode && mat.code && normalizeMatCode(i.materialCode) === normalizeMatCode(mat.code)) ||
            (i.materialName && mat.name && normalizeMatName(i.materialName).includes(normalizeMatName(mat.name)))
          );

          return {
            materialId: dbMaterial?.id || '',
            materialCode: dbMaterial?.code || '',
            materialName: dbMaterial?.name || mat.name || '',
            quantityReceived: mat.quantity !== undefined && mat.quantity !== null ? mat.quantity : 1,
            unit: mat.unit || dbMaterial?.uom || 'Nos',
            hsnCode: mat.hsnCode || dbMaterial?.hsnCode || '',
            unitPrice: mat.unitPrice !== undefined && mat.unitPrice !== null ? mat.unitPrice : (poItem?.unitPrice || dbMaterial?.purchasePrice || 0),
            totalAmount: mat.totalAmount !== undefined && mat.totalAmount !== null ? mat.totalAmount : ((mat.quantity || 1) * (mat.unitPrice || 0)),
            scannedMaterialName: mat.name || '',
            scannedHsn: mat.hsnCode || ''
          };
        });
      }

      const matchedMaterials = itemsList;

      // 4. Resolve Warehouse
      // Requirement: "DO NOT use scanner warehouse data. Show: Receipt Warehouse: [ Select Warehouse ▼ ], user must select it."
      let matchedWarehouse = undefined;

      const firstItem = itemsList[0] || { materialCode: '', quantityReceived: 0 };

      const remarkParts = [];
      if (data.invoiceNumber || data.document?.invoiceNumber) remarkParts.push(`Inv #${data.invoiceNumber || data.document?.invoiceNumber}`);
      if (scannedSupplierName || matchedSupplier?.supplierName) remarkParts.push(`Supplier: ${scannedSupplierName || matchedSupplier?.supplierName}`);
      if (data.invoiceDate || data.document?.invoiceDate) remarkParts.push(`Date: ${data.invoiceDate || data.document?.invoiceDate}`);
      if (data.totalAmount || data.totals?.totalInvoiceValue) remarkParts.push(`Total Value: ₹${data.totalAmount || data.totals?.totalInvoiceValue}`);

      const cleanDriverName = getCleanScannedValue((data as any).driverName);
      const cleanDriverPhone = getCleanScannedValue((data as any).driverPhone || (data as any).phone);
      const cleanTransportCompany = getCleanScannedValue((data as any).transporterName || data.document?.dispatchedThrough);
      const cleanVehicleNumber = getCleanScannedValue(scannedVehicleNumber);

      const payload = {
        poNumber: matchedPo ? matchedPo.poNumber : '',
        purchaseOrderId: matchedPo ? matchedPo.id : '',
        poId: matchedPo ? matchedPo.id : '',
        supplierId: matchedSupplier ? matchedSupplier.id : '',
        vehicleNumber: cleanVehicleNumber,
        driverName: cleanDriverName,
        driverPhone: cleanDriverPhone,
        transportCompany: cleanTransportCompany,
        warehouseId: '', // Force empty so user has to select warehouse manually
        remarks: remarkParts.length > 0 ? `[AI Invoice Scan] ${remarkParts.join(' | ')}` : '',
        materialCode: firstItem.materialCode || '',
        quantityReceived: firstItem.quantityReceived || 1,
        items: itemsList,
        scannedSupplierName: scannedSupplierName,
        scannedPoNumber: scannedPoNumber,
        isCustomSupplier: false,
        customSupplierName: '',
        isCustomPo: false
      };

      // Print strict required logs
      console.log("SCANNED DATA", scannedData);
      console.log("RESOLVED PO NUMBER", resolvedPoNumber);
      console.log("MATCHED SUPPLIER", matchedSupplier);
      console.log("MATCHED PO", matchedPO);
      console.log("MATCHED MATERIALS", matchedMaterials);
      console.log("MATCHED WAREHOUSE", matchedWarehouse);
      console.log("FINAL GATE ENTRY PAYLOAD", payload);

      setNewGe(payload);
    } catch (err: any) {
      console.error("Invoice matching error:", err);
      setScanError(err.message || "Failed to match invoice data with database records.");
    } finally {
      setIsScanning(false);
      setIsMatching(false);
      setScanStatus('');
    }
  };

  const [newRi, setNewRi] = useState<{
    poNumber: string;
    invoiceNumber: string;
    hsn: string;
    items: {
      reelNumber: string;
      bf: number;
      gsm: number;
      width: number;
      length: number;
      weight: number;
      lotNumber: string;
    }[];
    remarks: string;
  }>({
    poNumber: '',
    invoiceNumber: '',
    hsn: '48191010',
    items: [],
    remarks: ''
  });

  const [qcForm, setQcForm] = useState<{
    reelInwardId: string;
    supplierName: string;
    itemCommodity: string;
    invoiceNo: string;
    invoiceDate: string;
    quantityReceived: number;
    quantityAsWritten: string;
    testedOn: string;
    status: string;
    preparedBy: string;
    checkedBy: string;
    warehouseId?: string;
    defaultBinId?: string;
    rows: {
      slNo: number;
      reelNo: string;
      deckle: string;
      bf: string;
      gsm: string;
      observationGsm: string;
      observationBf: string;
      cobbValue: string;
      moisture: string;
      netWeight: string;
      result: string;
      remarks: string;
      binId?: string;
    }[];
  }>({
    reelInwardId: '',
    supplierName: '',
    itemCommodity: 'Kraft Paper',
    invoiceNo: '',
    invoiceDate: '',
    quantityReceived: 0,
    quantityAsWritten: '',
    testedOn: new Date().toISOString().slice(0, 10),
    status: 'Passed',
    preparedBy: 'Sunita Menon',
    checkedBy: 'Rajesh Nair',
    warehouseId: '',
    defaultBinId: '',
    rows: [
      {
        slNo: 1,
        reelNo: '',
        deckle: '120',
        bf: '18',
        gsm: '180',
        observationGsm: '180',
        observationBf: '18',
        cobbValue: '45',
        moisture: '7.0',
        netWeight: '0',
        result: 'Passed',
        remarks: 'Within limit',
        binId: ''
      }
    ]
  });

  const initializeQcFormForReel = (ri: any) => {
    let invoiceNo = ri.invoiceNumber || '';
    if (!invoiceNo && ri.remarks) {
      const invoiceMatch = ri.remarks.match(/Invoice:\s*([^\s,]+)/i);
      if (invoiceMatch) invoiceNo = invoiceMatch[1];
    }
    if (!invoiceNo) {
      invoiceNo = ri.challanNumber || `INV-${ri.inwardNumber || '001'}`;
    }

    const inwardItems = ri.items && ri.items.length > 0 ? ri.items : [];
    const rows = inwardItems.length > 0
      ? inwardItems.map((item: any, idx: number) => ({
          slNo: idx + 1,
          reelNo: item.reelNumber,
          deckle: item.breadth ? String(item.breadth) : (item.size ? String(item.size).replace(/mm|cms/gi, '') : '120'),
          bf: item.bf ? String(item.bf) : '18',
          gsm: item.gsm ? String(item.gsm) : '180',
          observationGsm: item.gsm ? String(item.gsm) : '180',
          observationBf: item.bf ? String(item.bf) : '18',
          cobbValue: '45',
          moisture: '7.0',
          netWeight: String(item.weight || 0),
          result: item.qcStatus === 'Approved' || item.status === 'PASSED' ? 'Passed' : (item.qcStatus === 'Rejected' || item.status === 'FAILED' ? 'Failed' : 'Passed'),
          remarks: item.remarks || 'Within limits',
          binId: item.binId || ''
        }))
      : [
          {
            slNo: 1,
            reelNo: ri.reelNumber || 'R001',
            deckle: ri.width ? String(ri.width) : '120',
            bf: ri.bf ? String(ri.bf) : '18',
            gsm: ri.gsm ? String(ri.gsm) : '180',
            observationGsm: ri.gsm ? String(ri.gsm) : '180',
            observationBf: ri.bf ? String(ri.bf) : '18',
            cobbValue: '45',
            moisture: '7.0',
            netWeight: String(ri.weight || 0),
            result: 'Passed',
            remarks: 'Within limits',
            binId: ''
          }
        ];

    const defaultWarehouseId = (warehouses && warehouses[0]?.id) || '';
    const defaultBin = binLocations?.find((b: any) => !defaultWarehouseId || b.warehouseId === defaultWarehouseId)?.id || (binLocations && binLocations[0]?.id) || '';

    const resolvedRows = rows.map((r: any) => ({
      ...r,
      binId: r.binId || defaultBin
    }));

    const totalWeight = inwardItems.length > 0
      ? inwardItems.reduce((acc: number, curr: any) => acc + (Number(curr.weight) || 0), 0)
      : Number(ri.weight || 0);

    setQcForm({
      reelInwardId: ri.id,
      supplierName: getSupplierDisplayName((ri as any).supplierId, ri.supplierName, ri.millName, (ri as any).supplier),
      itemCommodity: inwardItems[0]?.material || `Kraft Paper ${ri.gsm || 180} GSM`,
      invoiceNo: invoiceNo || 'INV-9464',
      invoiceDate: ri.receivedDate || (ri.createdAt ? new Date(ri.createdAt).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)),
      quantityReceived: totalWeight,
      quantityAsWritten: String(totalWeight),
      testedOn: new Date().toISOString().slice(0, 10),
      status: 'Passed',
      preparedBy: 'Sunita Menon',
      checkedBy: 'Rajesh Nair',
      warehouseId: defaultWarehouseId,
      defaultBinId: defaultBin,
      rows: resolvedRows
    });
  };

  // Derived low stock items for dashboard suggestions
  const lowStockItems = rawMaterials.filter(rm => rm.currentStock <= rm.reorderLevel);

  // Helper to handle Quick RFQ fill
  const handleInitiateRfq = (rm: RawMaterial) => {
    const defaultDate = new Date(Date.now() + 10*24*60*60*1000).toISOString().slice(0, 10);
    setNewRfq(prev => ({
      ...prev,
      materialCode: rm.code,
      quantity: rm.reorderLevel * 2,
      expectedPrice: rm.purchasePrice,
      description: `Replenishment of low stock: ${rm.name}`,
      deliveryDate: defaultDate
    }));
    setRfqItems([
      {
        materialCode: rm.code,
        name: rm.name,
        description: rm.description || '',
        unit: rm.uom,
        quantity: rm.reorderLevel * 2,
        expectedPrice: rm.purchasePrice,
        requiredDate: defaultDate,
        remarks: 'Replenishment of low stock'
      }
    ]);
    setActiveTab('rfq');
    setIsRfqModalOpen(true);
  };

  // Create RFQ submit handler
  const handleCreateRfq = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Validation: At least one material line item
    if (!rfqItems || rfqItems.length === 0) {
      alert("Please add at least one raw material line item.");
      return;
    }

    // 2. Validate and enrich each material item
    const rfqMaterials = [];
    for (let i = 0; i < rfqItems.length; i++) {
      const item = rfqItems[i];
      // Find the material in rawMaterials by ID or Code
      const mat = rawMaterials.find(rm =>
        (item.materialId && rm.id === item.materialId) ||
        (item.materialCode && (rm.id === item.materialCode || rm.code === item.materialCode))
      );

      const matCode = mat ? (mat.code || mat.id) : (item.materialCode || item.materialId || '');
      const matName = mat ? mat.name : (item.name || '').trim();

      if (!matCode || matCode === '') {
        alert(`Line ${i + 1}: Please select a Raw Material.`);
        return;
      }

      if (!matName || matName === '') {
        alert(`Line ${i + 1}: Material name is required. Please select a valid material.`);
        return;
      }

      const qty = Number(item.quantity);
      if (isNaN(qty) || qty <= 0) {
        alert(`Line ${i + 1} (${matName}): Quantity must be greater than zero.`);
        return;
      }

      rfqMaterials.push({
        materialCode: matCode,
        name: matName,
        unit: item.unit || (mat ? mat.uom : 'Kg') || 'Kg',
        quantity: qty,
        expectedPrice: item.expectedPrice ? Number(item.expectedPrice) : undefined,
        requiredDate: item.requiredDate || newRfq.deliveryDate || new Date(Date.now() + 10*24*60*60*1000).toISOString().slice(0, 10),
        description: item.description || (mat ? mat.description : '') || '',
        remarks: item.remarks || ''
      });
    }

    // 3. Validation: Duplicate raw materials check
    if (!allowDuplicateMaterials) {
      const codes = rfqMaterials.map(it => it.materialCode);
      const duplicateCodes = codes.filter((c, idx) => codes.indexOf(c) !== idx);
      if (duplicateCodes.length > 0) {
        const dupNames = rawMaterials.find(r => r.code === duplicateCodes[0] || r.id === duplicateCodes[0])?.name || duplicateCodes[0];
        alert(`Duplicate material detected: "${dupNames}" is added multiple times. Please remove duplicates or check "Allow duplicate raw materials".`);
        return;
      }
    }

    const matchedSups = suppliers.filter(s => newRfq.selectedSuppliers.includes(s.id));
    const rfqNum = `RFQ-2026-000${rfqs.length + 1}`;

    const payload = {
      rfqNumber: rfqNum,
      rfqDate: new Date().toISOString().slice(0, 10),
      deliveryDate: newRfq.deliveryDate || rfqMaterials[0]?.requiredDate || new Date(Date.now() + 10*24*60*60*1000).toISOString().slice(0, 10),
      department: newRfq.department || 'Procurement',
      priority: newRfq.priority || 'Medium',
      status: 'Pending',
      description: newRfq.description || `Procurement of ${rfqMaterials.length} raw materials`,
      remarks: newRfq.remarks || '',
      materials: rfqMaterials,
      suppliers: matchedSups.map(s => ({
        supplierId: s.id,
        supplierName: s.supplierName,
        contactPerson: 'N/A',
        email: 'contact@supplier.com',
        phone: 'N/A'
      }))
    };

    try {
      const res = await fetch('/api/rfqs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.error || result.message || 'Failed to create RFQ in database');
      }

      const createdRfq = result.data;

      // Update state
      setRfqs([createdRfq, ...rfqs]);

      // Pre-populate dummy quotes for the suppliers selected
      const generatedQuotes = matchedSups.map((s, idx) => {
        const variation = idx === 0 ? -1.2 : 1.5;
        
        let computedTotalPrice = 0;
        let totalQty = 0;
        rfqMaterials.forEach(mat => {
          const itemExpected = mat.expectedPrice || 50;
          const itemPrice = Math.max(10, itemExpected + variation);
          computedTotalPrice += itemPrice * mat.quantity;
          totalQty += mat.quantity;
        });

        const averageUnitPrice = totalQty > 0 ? computedTotalPrice / totalQty : 0;

        return {
          id: `Q-${Date.now()}-${idx}`,
          rfqId: createdRfq.id || `RFQ-${Date.now()}`,
          rfqNumber: createdRfq.rfqNumber || rfqNum,
          supplierId: s.id,
          supplierName: s.supplierName,
          unitPrice: Number(averageUnitPrice.toFixed(2)),
          quantity: totalQty,
          totalPrice: Number(computedTotalPrice.toFixed(2)),
          deliveryDays: 4 + idx * 2,
          paymentTerms: idx === 0 ? 'Net 30 Days' : 'Net 15 Days',
          validUntil: new Date(Date.now() + 20*24*60*60*1000).toISOString().slice(0, 10),
          remarks: `Mill price proposal from ${s.millName} for ${rfqMaterials.length} materials.`,
          status: 'Pending' as const
        };
      });

      setQuotes(prev => [...generatedQuotes, ...prev]);

      // Trigger Notification Events
      triggerNotification('rfq_created', {
        title: 'RFQ Created',
        message: `Request for Quotation ${createdRfq.rfqNumber || rfqNum} (${newRfq.department}) created with ${rfqMaterials.length} raw material line items.`,
        rfqNumber: createdRfq.rfqNumber || rfqNum,
        recipientEmail: 'sunita.menon@amkerp.com'
      });

      if (matchedSups.length > 0) {
        triggerNotification('rfq_sent', {
          title: 'RFQ Sent to Suppliers',
          message: `RFQ ${createdRfq.rfqNumber || rfqNum} successfully sent to ${matchedSups.length} suppliers (${matchedSups.map(s => s.supplierName).join(', ')}).`,
          rfqNumber: createdRfq.rfqNumber || rfqNum,
          recipientEmail: 'contact@supplier.com'
        });
      }

      // Reset form on success
      setNewRfq({
        department: 'Production',
        priority: 'Medium',
        deliveryDate: '',
        description: '',
        remarks: '',
        materialCode: '',
        quantity: 1000,
        expectedPrice: 50,
        selectedSuppliers: []
      });
      setRfqItems([]);

      setIsRfqModalOpen(false);
    } catch (err: any) {
      console.error('Error creating RFQ:', err);
      alert(`Error creating RFQ: ${err.message || 'Server error'}`);
    }
  };

  // Quote awarding logic
  const handleAwardQuote = (selectedQuote: SupplierQuote) => {
    // 1. Mark this quote as Awarded
    setQuotes(prev => prev.map(q => {
      if (q.rfqId === selectedQuote.rfqId) {
        return q.id === selectedQuote.id ? { ...q, status: 'Awarded' } : { ...q, status: 'Rejected' };
      }
      return q;
    }));

    // 2. Mark RFQ as Awarded
    setRfqs(prev => prev.map(r => r.id === selectedQuote.rfqId ? { ...r, status: 'Awarded' } : r));

    onAddNotification({
      title: 'RFQ Awarded',
      message: `Quotation from ${selectedQuote.supplierName} awarded. Ready to convert to PO.`,
      type: 'success',
      time: 'Just Now'
    });
  };

  // Convert Quote to PO
  const handleConvertQuoteToPo = (q: SupplierQuote) => {
    const parentRfq = rfqs.find(r => r.id === q.rfqId);
    
    // Support multiple materials mapping
    let poItems: any[] = [];
    if (parentRfq && parentRfq.materials && parentRfq.materials.length > 0) {
      // Scale individual prices relative to the supplier's average quote price
      const avgExpected = parentRfq.materials.reduce((sum, m) => sum + (m.expectedPrice || 50), 0) / parentRfq.materials.length;
      const ratio = avgExpected > 0 ? q.unitPrice / avgExpected : 1;

      poItems = parentRfq.materials.map(mat => {
        const itemExpected = mat.expectedPrice || 50;
        const itemPrice = Number((itemExpected * ratio).toFixed(2));
        return {
          materialCode: mat.materialCode,
          materialName: mat.name,
          quantityOrdered: mat.quantity,
          quantityReceived: 0,
          unitPrice: itemPrice,
          total: Number((itemPrice * mat.quantity).toFixed(2))
        };
      });
    } else {
      const materialCode = parentRfq?.materials[0]?.materialCode || 'RM-KRAFT-180';
      const materialName = parentRfq?.materials[0]?.name || 'Kraft Paper Roll';
      poItems = [{
        materialCode,
        materialName,
        quantityOrdered: q.quantity,
        quantityReceived: 0,
        unitPrice: q.unitPrice,
        total: q.totalPrice
      }];
    }

    const poNum = `PO-2026-000${purchaseOrders.length + 1}`;
    const newPOItem: ProcurementPO = {
      id: `PO-${Date.now()}`,
      poNumber: poNum,
      rfqNumber: q.rfqNumber,
      supplierId: q.supplierId,
      supplierName: q.supplierName,
      date: new Date().toISOString().slice(0, 10),
      deliveryDate: new Date(Date.now() + q.deliveryDays*24*60*60*1000).toISOString().slice(0, 10),
      status: 'Approved',
      items: poItems,
      remarks: `Generated from awarded RFQ quotation: ${q.rfqNumber}.`
    };

    setPurchaseOrders([newPOItem, ...purchaseOrders]);
    setActiveTab('po');

    triggerNotification('po_created', {
      title: 'Purchase Order Created',
      message: `Purchase Order ${poNum} has been created for ${q.supplierName} and is awaiting final delivery.`,
      poNumber: poNum,
      supplierName: q.supplierName,
      recipientEmail: 'sunita.menon@amkerp.com'
    });

    triggerNotification('po_approved', {
      title: 'Purchase Order Approved',
      message: `Purchase Order ${poNum} for ${q.supplierName} has been approved by ${currentUser?.name || 'Administrator'}.`,
      poNumber: poNum,
      supplierName: q.supplierName,
      recipientEmail: 'sunita.menon@amkerp.com'
    });
  };

  // Normal Gate Entry Submit
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

    // Check material validation
    const missingMat = (newGe.items || []).find(it => !it.materialId && !it.isCustomMaterial);
    if (missingMat) {
      alert(`Please select a database material or accept the scanned value for: ${missingMat.scannedMaterialName || missingMat.materialName}`);
      return;
    }

    const po = purchaseOrders.find(p => p.poNumber === newGe.poNumber);

    // Determine final items received
    const finalItems = newGe.items && newGe.items.length > 0
      ? newGe.items
      : [{
          materialId: po?.items[0] ? rawMaterials.find(rm => rm.code === po.items[0].materialCode || rm.name === po.items[0].materialName)?.id : undefined,
          materialCode: newGe.materialCode || po?.items[0]?.materialCode || 'RM-RAW',
          materialName: po?.items[0]?.materialName || 'Raw Material',
          quantityReceived: newGe.quantityReceived || 1000,
          unit: 'Kg',
          hsnCode: '',
          unitPrice: po?.items[0]?.unitPrice || 0,
          totalAmount: (newGe.quantityReceived || 1000) * (po?.items[0]?.unitPrice || 0)
        }];

    const validItems = finalItems.filter(it => it.quantityReceived > 0);
    if (validItems.length === 0) {
      alert('Please ensure at least one material item has a received quantity greater than 0.');
      return;
    }

    let finalRemarks = newGe.remarks || '';
    if (newGe.isCustomSupplier && newGe.customSupplierName) {
      finalRemarks = `[Supplier: ${newGe.customSupplierName}] ${finalRemarks}`;
    }

    const payload = {
      poId: po ? po.id : null,
      poNumber: newGe.poNumber,
      warehouseId: newGe.warehouseId,
      vehicleNumber: newGe.vehicleNumber.trim(),
      driverName: newGe.driverName.trim(),
      driverPhone: newGe.driverPhone.trim(),
      transportCompany: newGe.transportCompany.trim(),
      remarks: finalRemarks,
      items: validItems.map(it => ({
        materialId: it.materialId || null,
        materialCode: it.materialCode || 'RM-CUSTOM',
        materialName: it.materialName,
        quantityReceived: it.quantityReceived,
        unitPrice: it.unitPrice,
        unit: it.unit || 'Kg'
      }))
    };

    console.log("FINAL GATE ENTRY PAYLOAD", payload);
    console.log("SUBMITTING GATE ENTRY...");

    try {
      const res = await fetch('/api/gate-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      console.log("GATE ENTRY API STATUS", res.status);
      const data = await res.json();
      console.log("GATE ENTRY API RESPONSE", data);

      if (!data.success) {
        throw new Error(data.message || 'Failed to create gate entry');
      }

      const entryData = data.data;
      const entry = {
        ...entryData,
        arrivalDate: entryData.createdAt ? new Date(entryData.createdAt).toISOString().replace('T', ' ').slice(0, 16) : 'N/A',
        itemsReceived: entryData.items || []
      };
      setGateEntries([entry, ...gateEntries]);

      // Update PO Received Quantities locally
      if (po) {
        setPurchaseOrders(prev => prev.map(p => {
          if (p.id === po.id) {
            const updatedItems = (p.items || []).map(it => {
              const matchItem = validItems.find(vi => vi.materialCode === it.materialCode);
              if (matchItem) {
                const totalRec = it.quantityReceived + matchItem.quantityReceived;
                return {
                  ...it,
                  quantityReceived: Math.min(it.quantityOrdered, totalRec)
                };
              }
              return it;
            });

            const allReceived = updatedItems.every(it => it.quantityReceived >= it.quantityOrdered);
            return {
              ...p,
              items: updatedItems,
              status: allReceived ? 'Completed' : 'Partially Received'
            };
          }
          return p;
        }));
      }

      onTriggerEventNotification('goods_received', {
        title: 'Material Received',
        message: `Gate Entry ${entry.gateEntryNumber} recorded for ${po ? po.poNumber : newGe.poNumber}. Stock updated.`,
        poNumber: po ? po.poNumber : newGe.poNumber,
        supplierName: po ? po.supplierName : (newGe.customSupplierName || newGe.scannedSupplierName || 'Custom Supplier')
      });

      setIsGeModalOpen(false);
      setNewGe({
        poNumber: '',
        vehicleNumber: '',
        driverName: '',
        driverPhone: '',
        transportCompany: '',
        warehouseId: '',
        remarks: '',
        materialCode: '',
        quantityReceived: 1000,
        items: []
      });

      // Update global state for stock and transactions
      validItems.forEach(item => {
        const isKraft = item.materialCode.toLowerCase().includes('kraft');
        if (!isKraft && item.quantityReceived > 0) {
          const mat = rawMaterials.find(rm => rm.code === item.materialCode) || rawMaterials[0];
          if (mat) {
            onAddTransaction({
              id: `TXN-GE-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              transactionNumber: `TRX-${Math.floor(100000 + Math.random() * 900000)}`,
              itemCode: item.materialCode || mat.code,
              itemName: item.materialName || mat.name,
              itemType: 'Raw Material',
              warehouse: warehouses.find(w => w.id === newGe.warehouseId)?.name || mat.warehouse,
              quantity: item.quantityReceived,
              previousStock: mat.currentStock,
              currentStock: mat.currentStock + item.quantityReceived,
              transactionType: 'Stock In',
              user: 'Sunita Menon',
              date: new Date().toISOString().slice(0, 10),
              time: new Date().toTimeString().slice(0, 5),
              reason: `Gate Inward Receipt against PO ${po.poNumber}`,
              remarks: `Vehicle: ${newGe.vehicleNumber} | Transport: ${newGe.transportCompany || 'N/A'}`
            });

            onUpdateRawMaterials(prev => prev.map(rm => {
              if (rm.code === (item.materialCode || mat.code)) {
                return { ...rm, currentStock: rm.currentStock + item.quantityReceived };
              }
              return rm;
            }));
          }
        }
      });

    } catch (err: any) {
      alert(`Error creating gate entry: ${err.message}`);
    }
  };

  // Kraft Paper Reel Inward Submit
  const handleCreateReelInward = async (e: React.FormEvent) => {
    e.preventDefault();
    const po = purchaseOrders.find(p => p.poNumber === newRi.poNumber);
    const supplierName = po ? po.supplierName : 'Unknown Supplier';

    const payloads = newRi.items.map(it => ({
      reelNumber: it.reelNumber,
      poNumber: newRi.poNumber,
      supplierName,
      gsm: it.gsm,
      bf: it.bf,
      width: it.width,
      weight: it.weight,
      remarks: `Lot: ${it.lotNumber || 'N/A'}. Invoice: ${newRi.invoiceNumber || 'N/A'}`
    }));

    try {
      const response = await fetch('/api/reel-inwards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloads)
      });
      const result = await response.json();

      if (result.success) {
        // Refetch Reel Inwards
        const riRes = await fetch('/api/reel-inwards').then(r => r.json());
        if (riRes.success) {
          setReelsInward(riRes.data);
        }

        triggerNotification('goods_received', {
          title: 'Goods Received (Gate Entry)',
          message: `Received ${payloads.length} paper reels from ${supplierName} under PO ${newRi.poNumber}.`,
          poNumber: newRi.poNumber,
          supplierName,
          recipientEmail: 'sunita.menon@amkerp.com'
        });

        setNewRi({
          poNumber: '',
          invoiceNumber: '',
          hsn: '48191010',
          items: [],
          remarks: ''
        });
        setIsRiModalOpen(false);
      } else {
        alert(`Failed to save reel inwards: ${result.message || 'Unknown error'}`);
      }
    } catch (err: any) {
      console.error("Error saving reel inwards:", err);
      alert(`Error saving reel inwards: ${err.message}`);
    }
  };


  // Quality Check inspection submit
  const handlePerformQc = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Validation
    if (!qcForm.reelInwardId) {
      alert("Please select a Reel Inward Challan / Reel from the dropdown!");
      return;
    }
    if (!qcForm.supplierName) {
      alert("Supplier Name is required!");
      return;
    }
    if (!qcForm.itemCommodity) {
      alert("Item / Commodity is required!");
      return;
    }
    if (!qcForm.invoiceNo) {
      alert("Invoice No is required!");
      return;
    }
    if (qcForm.rows.length === 0) {
      alert("At least one inspection row is required!");
      return;
    }

    // Validate that each row has a Reel Number and weight
    for (const row of qcForm.rows) {
      if (!row.reelNo) {
        alert("Each inspection row must have a Reel No!");
        return;
      }
      if (!row.netWeight || Number(row.netWeight) <= 0) {
        alert(`Please specify a valid net weight for Reel ${row.reelNo}`);
        return;
      }
    }

    // Calculate overall QC status based on reel rows
    const passedRows = qcForm.rows.filter(r => r.result === 'Passed' || r.result === 'PASSED');
    const failedRows = qcForm.rows.filter(r => r.result === 'Failed' || r.result === 'FAILED');
    const pendingRows = qcForm.rows.filter(r => r.result === 'Pending' || r.result === 'PENDING');
    
    let computedStatus = 'PENDING QC';
    if (pendingRows.length > 0) {
      computedStatus = 'PENDING QC';
    } else if (passedRows.length === qcForm.rows.length) {
      computedStatus = 'QC PASSED';
    } else if (failedRows.length === qcForm.rows.length) {
      computedStatus = 'QC FAILED';
    } else {
      computedStatus = 'PARTIALLY PASSED';
    }

    const payload = {
      referenceType: 'Reel Inward',
      reelInwardId: qcForm.reelInwardId,
      status: computedStatus,
      inspector: qcForm.preparedBy || 'Sunita Menon',
      remarks: qcForm.quantityAsWritten ? `Observed Wt: ${qcForm.quantityAsWritten} Kg.` : '',
      testedAt: new Date(qcForm.testedOn).toISOString(),
      warehouseId: (qcForm as any).warehouseId || '',
      parameters: qcForm.rows.map(r => ({
        ...r,
        binId: r.binId || (qcForm as any).defaultBinId || ''
      }))
    };

    setIsSubmittingQc(true);
    try {
      const result = await procurementService.createQualityCheck(payload);

      if (result.success) {
        // Refetch Reel Inwards and Quality Checks
        const [riRes, qcRes] = await Promise.all([
          procurementService.getReelInwards(),
          procurementService.getQualityChecks()
        ]);

        if (riRes.success) setReelsInward(riRes.data);
        if (qcRes.success) {
          const mappedQcs = (qcRes.data || []).map((qc: any) => {
            let parsedParams = [];
            try {
              parsedParams = qc.parameters ? JSON.parse(qc.parameters) : [];
            } catch (e) {
              parsedParams = [];
            }
            const firstRow = parsedParams[0] || {};
            return {
              id: qc.id,
              reelNumber: qc.reelInward?.inwardNumber || qc.reelInward?.reelNumber || firstRow.reelNo || 'N/A',
              expectedWeight: qc.reelInward?.weight || firstRow.netWeight || 0,
              actualWeight: Number(firstRow.netWeight || firstRow.weight || 0),
              moisture: Number(firstRow.moisture || 0),
              gsmVerification: Number(firstRow.observationGsm || firstRow.gsm || 0),
              bfVerification: Number(firstRow.observationBf || firstRow.bf || 0),
              qualityStatus: qc.status,
              inspector: qc.inspector || 'Sunita Menon',
              inspectionDate: qc.testedAt ? new Date(qc.testedAt).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
              remarks: qc.remarks || '',
              items: parsedParams,
              reelInward: qc.reelInward,
            };
          });
          setQcRecords(mappedQcs);
        }

        // Refresh Raw Materials, Warehouses & Bins Inventory to reflect new stock in bins
        if (onUpdateRawMaterials) {
          fetch('/api/raw-materials')
            .then(res => res.json())
            .then(data => {
              if (data?.data) onUpdateRawMaterials(data.data);
            })
            .catch(() => {});
        }
        if (onUpdateWarehouses) {
          fetch('/api/warehouses')
            .then(res => res.json())
            .then(data => {
              if (data?.data) onUpdateWarehouses(data.data);
            })
            .catch(() => {});
        }
        if (onUpdateBins) {
          fetch('/api/bins')
            .then(res => res.json())
            .then(data => {
              if (data?.data) onUpdateBins(data.data);
            })
            .catch(() => {});
        }

        onAddNotification({
          title: computedStatus === 'QC PASSED' ? 'QC Approved' : (computedStatus === 'PARTIALLY PASSED' ? 'QC Partially Approved' : (computedStatus === 'QC FAILED' ? 'QC Rejected' : 'QC Recorded')),
          message: `Logged Inspection Report ${result.data?.qcNumber || ''} with ${qcForm.rows.length} reels (${passedRows.length} Passed, ${failedRows.length} Failed). Status: ${computedStatus}`,
          type: computedStatus.includes('PASS') ? 'success' : (computedStatus === 'QC FAILED' ? 'alert' : 'info'),
          time: 'Just Now'
        });

        setIsQcModalOpen(false);
      } else {
        alert(`Failed to save Quality Check: ${result.message || 'Unknown error'}`);
      }
    } catch (err: any) {
      console.error("QC TRANSACTION ERROR", err);
      alert(`Error submitting Quality Check: ${err.message}`);
    } finally {
      setIsSubmittingQc(false);
    }
  };

  const handleAddQcRow = () => {
    setQcForm(prev => {
      const nextSlNo = prev.rows.length + 1;
      const lastRow = prev.rows[prev.rows.length - 1];
      return {
        ...prev,
        rows: [
          ...prev.rows,
          {
            slNo: nextSlNo,
            reelNo: prev.reelInwardId 
              ? `${reelsInward.find(r => r.id === prev.reelInwardId)?.reelNumber || 'REEL'}-${nextSlNo}`
              : `REEL-NEW-${nextSlNo}`,
            deckle: lastRow?.deckle || '120',
            bf: lastRow?.bf || '18',
            gsm: lastRow?.gsm || '180',
            observationGsm: lastRow?.observationGsm || '180',
            observationBf: lastRow?.observationBf || '18',
            cobbValue: lastRow?.cobbValue || '45',
            moisture: lastRow?.moisture || '7.0',
            netWeight: '0',
            result: 'Passed',
            remarks: 'Ok',
            binId: lastRow?.binId || ''
          }
        ]
      };
    });
  };

  const handleDeleteQcRow = (index: number) => {
    if (qcForm.rows.length <= 1) {
      alert("At least one inspection row is required!");
      return;
    }
    setQcForm(prev => {
      const remaining = prev.rows.filter((_, idx) => idx !== index);
      const updated = remaining.map((row, idx) => ({
        ...row,
        slNo: idx + 1
      }));
      return {
        ...prev,
        rows: updated
      };
    });
  };

  const handleUpdateQcRow = (index: number, field: string, value: string) => {
    setQcForm(prev => {
      const updatedRows = prev.rows.map((row, idx) => {
        if (idx === index) {
          return { ...row, [field]: value };
        }
        return row;
      });
      return {
        ...prev,
        rows: updatedRows
      };
    });
  };

  // Duplicate RFQ
  const handleDuplicateRfq = (item: RFQItem) => {
    const duplicated: RFQItem = {
      ...item,
      id: `RFQ-${Date.now()}`,
      rfqNumber: `RFQ-2026-000${rfqs.length + 1}`,
      rfqDate: new Date().toISOString().slice(0, 10),
      status: 'Draft'
    };
    setRfqs([duplicated, ...rfqs]);
    onAddNotification({
      title: 'RFQ Duplicated',
      message: `Created draft RFQ ${duplicated.rfqNumber} successfully.`,
      type: 'info',
      time: 'Just Now'
    });
  };

  // Print simulation helper
  const handlePrint = (title: string, code: string, details: string) => {
    alert(`-----------------------------------------\nPRINT PREVIEW: ${title}\nDoc Ref: ${code}\n-----------------------------------------\n${details}\n-----------------------------------------\n(Document rendered for office thermal printing)`);
  };

  // PDF Download simulation
  const handleDownloadPdf = (title: string, code: string) => {
    alert(`PDF compiled successfully.\nFile: ${title.replace(/\s+/g, '_')}_${code}.pdf\nSize: 142 KB\nSaved to device downloads.`);
  };

  // Email simulation
  const handleEmailDoc = (title: string, code: string, recipient: string) => {
    alert(`Email outbound queue updated.\nRecipient: ${recipient}\nSubject: ERP Dispatch - ${title} [${code}]\nBody: Ref document attached. Generated automatically by AMK ERP.`);
  };

  // Calculate high-level stats
  const totalRfqCount = rfqs.length;
  const pendingRfqCount = rfqs.filter(r => r.status === 'Submitted').length;
  const approvedPoCount = purchaseOrders.filter(p => ['Approved', 'Sent to Supplier', 'Confirmed', 'Partially Received', 'Completed'].includes(p.status)).length;
  const pendingDelCount = purchaseOrders.filter(p => ['Approved', 'Sent to Supplier', 'Confirmed', 'Partially Received'].includes(p.status)).length;
  const totalProcValue = purchaseOrders.reduce((sum, po) => sum + (po.items || []).reduce((acc, it) => acc + (it.total || 0), 0), 0);
  const activeSups = suppliers.length;

  const getTabHeader = (tab: typeof activeTab) => {
    switch (tab) {
      case 'dashboard':
        return {
          title: 'Procurement Dashboard — AMK ERP',
          desc: 'Overview of requisitions, active RFQs, purchase orders, quality pass rates, and supplier metrics.'
        };
      case 'rfq':
        return {
          title: 'Requisitions & RFQs — AMK ERP',
          desc: 'Manage Requests for Quotation (RFQs), raw material requisitions, and supplier tender dispatches.'
        };
      case 'quotes':
        return {
          title: 'Supplier Quotations — AMK ERP',
          desc: 'Evaluate competitive supplier bids, perform cost comparisons, and approve quotation selections.'
        };
      case 'po':
        return {
          title: 'Purchase Orders (POs) — AMK ERP',
          desc: 'Create, review, approve, and track official Purchase Orders issued to raw material vendors.'
        };
      case 'inward':
        return {
          title: 'Gate Entry & Inward Receipts — AMK ERP',
          desc: 'Log incoming transport vehicles, record paper reel gate entry passes, and process material receipts.'
        };
      case 'qc':
        return {
          title: 'Quality Control (QC) Inspections — AMK ERP',
          desc: 'Inspect incoming paper reels and raw materials, record GSM & bursting test results, and issue quality certifications.'
        };
      default:
        return {
          title: 'Procurement Module — AMK ERP',
          desc: 'Enterprise workflow spanning RFQs, supplier quote evaluation, PO approval flow, gate logs, reel QC, and automated stock receipt.'
        };
    }
  };

  const currentHeader = getTabHeader(activeTab);

  return (
    <div className="space-y-6 pb-12">
      {/* Module Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            {currentHeader.title}
          </h1>
          <p className="text-sm text-slate-800 dark:text-slate-500 mt-0.5">
            {currentHeader.desc}
          </p>
        </div>
        
        {/* Action Controls */}
        <div className="flex items-center space-x-3">
          {onOpenNotificationSettings && (
            <button
              onClick={onOpenNotificationSettings}
              className={`px-3.5 py-2 rounded-xl border text-xs font-semibold flex items-center space-x-2 transition-colors ${
                darkMode ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-700 dark:text-slate-400 hover:bg-slate-50'
              }`}
              title="Configure Procurement Notification & Email Rules"
            >
              <Bell className="w-4 h-4 text-emerald-500" />
              <span>Notification Rules</span>
            </button>
          )}

          <button
            onClick={() => handlePrint('Procurement Audit Summary', 'PAC-2026', 'All POs, QC inspects, and supplier tallies')}
            className={`px-4 py-2 rounded-xl border text-xs font-semibold flex items-center space-x-2 transition-colors ${
              darkMode ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-700 dark:text-slate-400 hover:bg-slate-50'
            }`}
          >
            <Printer className="w-4 h-4 text-slate-700 dark:text-slate-400" />
            <span>Print Summary</span>
          </button>
          
          <button
            onClick={() => {
              setIsRfqModalOpen(true);
              setNewRfq(prev => ({ ...prev, selectedSuppliers: suppliers.slice(0, 2).map(s => s.id) }));
            }}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-600/20 flex items-center space-x-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create RFQ</span>
          </button>
        </div>
      </div>

      {/* Tab Contents */}
      
      {/* 1. DASHBOARD VIEW */}
      {activeTab === 'dashboard' && (
        <ProcurementDashboardView
          darkMode={darkMode}
          totalRfqCount={totalRfqCount}
          pendingRfqCount={pendingRfqCount}
          approvedPoCount={approvedPoCount}
          pendingDelCount={pendingDelCount}
          totalProcValue={totalProcValue}
          activeSups={activeSups}
          lowStockItems={lowStockItems}
          getSupplierDisplayName={getSupplierDisplayName}
          handleInitiateRfq={handleInitiateRfq}
        />
      )}

      {/* 2. RFQ LIST & ACTIONS */}
      {activeTab === 'rfq' && (
        <RFQView
          darkMode={darkMode}
          rfqs={rfqs}
          suppliers={suppliers}
          getSupplierDisplayName={getSupplierDisplayName}
          onRaiseNewRfq={() => {
            const defaultDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
            setNewRfq({
              department: 'Production',
              priority: 'Medium',
              deliveryDate: defaultDate,
              description: '',
              remarks: '',
              materialCode: '',
              quantity: 1000,
              expectedPrice: 50,
              selectedSuppliers: suppliers.slice(0, 2).map(s => s.id)
            });
            setRfqItems([
              {
                materialCode: '',
                name: '',
                description: '',
                unit: '',
                quantity: 1000,
                expectedPrice: undefined,
                requiredDate: defaultDate,
                remarks: ''
              }
            ]);
            setIsRfqModalOpen(true);
          }}
          onCompareQuotes={(rfq) => {
            setSelectedRfqForQuotes(rfq);
            setActiveTab('quotes');
          }}
          onDuplicateRfq={handleDuplicateRfq}
          onPrintRfq={(rfq) => handlePrint('Request for Quotation', rfq.rfqNumber, `${rfq.description}\nDepartment: ${rfq.department}`)}
          onDownloadPdf={(rfq) => handleDownloadPdf('RFQ_Document', rfq.rfqNumber)}
        />
      )}

      {/* 3. SUPPLIER QUOTATIONS COMPARISON */}
      {activeTab === 'quotes' && (
        <SupplierQuotesView
          darkMode={darkMode}
          rfqs={rfqs}
          quotes={quotes}
          selectedRfqForQuotes={selectedRfqForQuotes}
          setSelectedRfqForQuotes={setSelectedRfqForQuotes}
          getSupplierDisplayName={getSupplierDisplayName}
          handleOpenNewQuoteModal={handleOpenNewQuoteModal}
          handleOpenEditQuoteModal={handleOpenEditQuoteModal}
          onDeleteQuote={(quoteId) => setQuotes(prev => prev.filter(item => item.id !== quoteId))}
          handleAwardQuote={handleAwardQuote}
          handleConvertQuoteToPo={handleConvertQuoteToPo}
        />
      )}

      {/* 4. PURCHASE ORDER VIEW */}
      {activeTab === 'po' && (
        <PurchaseOrdersView
          darkMode={darkMode}
          isLoading={isLoading}
          purchaseOrders={purchaseOrders}
          rawMaterials={rawMaterials}
          currentUser={currentUser || null}
          getSupplierDisplayName={getSupplierDisplayName}
          onSelectMaterial={onSelectMaterial}
          setIsPoModalOpen={setIsPoModalOpen}
          handleApprovePo={(po) => {
            setPurchaseOrders(prev => prev.map(p => p.id === po.id ? { ...p, status: 'Approved' } : p));
            triggerNotification('po_approved', {
              title: 'Purchase Order Approved',
              message: `Purchase Order ${po.poNumber} for ${po.supplierName} has been approved by ${currentUser?.name || 'Administrator'}.`,
              poNumber: po.poNumber,
              supplierName: po.supplierName,
              recipientEmail: 'sunita.menon@amkerp.com'
            });
          }}
          handleRejectPo={(po) => {
            setPurchaseOrders(prev => prev.map(p => p.id === po.id ? { ...p, status: 'Rejected' } : p));
            triggerNotification('po_rejected', {
              title: 'Purchase Order Rejected',
              message: `Purchase Order ${po.poNumber} for ${po.supplierName} was rejected by ${currentUser?.name || 'Administrator'}.`,
              poNumber: po.poNumber,
              supplierName: po.supplierName,
              recipientEmail: 'sunita.menon@amkerp.com'
            });
          }}
          handleInwardClick={(po) => {
            if (po.items[0]?.materialCode.toLowerCase().includes('kraft')) {
              setNewRi(prev => ({ ...prev, poNumber: po.poNumber }));
              setIsRiModalOpen(true);
            } else {
              setNewGe(prev => ({ ...prev, poNumber: po.poNumber, materialCode: po.items[0]?.materialCode }));
              setIsGeModalOpen(true);
            }
          }}
          handlePrintPo={(po) => handlePrint('Purchase Order Invoice', po.poNumber, `Supplier: ${getSupplierDisplayName(po.supplierId, po.supplierName, (po as any).supplier?.millName, (po as any).supplier)}\nValue: ₹${po.items[0]?.total}\nMaterial: ${po.items[0]?.materialName}`)}
        />
      )}

      {/* 5A. GATE ENTRY */}
      {(activeTab === 'gate_entry' || activeTab === 'inward') && (
        <GateEntryView
          darkMode={darkMode}
          gateEntries={gateEntries}
          suppliers={suppliers}
          purchaseOrders={purchaseOrders}
          warehouses={warehouses}
          rawMaterials={rawMaterials}
          currentUser={currentUser}
          getSupplierDisplayName={getSupplierDisplayName}
          onRefreshData={async () => {
            const geRes = await procurementService.getGateEntries();
            if (geRes.success) {
              setGateEntries(geRes.data.map((ge: any) => ({
                ...ge,
                arrivalDate: ge.createdAt ? new Date(ge.createdAt).toISOString().replace('T', ' ').slice(0, 16) : 'N/A',
                itemsReceived: ge.items || []
              })));
            }
          }}
          onAddNotification={onAddNotification}
          onGateEntryCreated={(newEntry) => setGateEntries([newEntry, ...gateEntries])}
          onGateEntryDeleted={(id) => setGateEntries(prev => prev.filter(g => g.id !== id))}
        />
      )}

      {/* 5B. REEL INWARD */}
      {activeTab === 'reel_inward' && (
        <ReelInwardView
          darkMode={darkMode}
          reelsInward={reelsInward as any}
          suppliers={suppliers}
          rawMaterials={rawMaterials}
          purchaseOrders={purchaseOrders}
          currentUser={currentUser}
          getSupplierDisplayName={getSupplierDisplayName}
          setIsQcModalOpen={setIsQcModalOpen}
          initializeQcFormForReel={initializeQcFormForReel}
          onRefreshData={async () => {
            const riRes = await procurementService.getReelInwards();
            if (riRes.success) setReelsInward(riRes.data);
          }}
          onAddNotification={onAddNotification}
        />
      )}

      {/* 6. QUALITY CHECK (QC) LEDGER */}
      {activeTab === 'qc' && (
        <QcView
          darkMode={darkMode}
          qcRecords={qcRecords}
          binLocations={binLocations}
          warehouses={warehouses}
        />
      )}


      {/* MODALS */}

      {/* 1. RFQ Modal */}
      {isRfqModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
          <div className={`w-full max-w-5xl my-8 rounded-3xl shadow-2xl border p-6 relative max-h-[90vh] flex flex-col ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            <button onClick={() => setIsRfqModalOpen(false)} className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-slate-800/50 text-slate-700 dark:text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            
            <div className="mb-4">
              <h2 className="text-lg font-bold">Create Request for Quotation (RFQ)</h2>
              <p className="text-xs text-slate-700 dark:text-slate-400">Invite multiple suppliers to bid on multiple raw materials in a single RFQ.</p>
            </div>

            <RFQForm 
                newRfq={newRfq}
                setNewRfq={setNewRfq}
                rfqItems={rfqItems}
                setRfqItems={setRfqItems}
                suppliers={suppliers}
                darkMode={darkMode}
                handleAddRfqItem={handleAddRfqItem}
                handleUpdateRfqItem={handleUpdateRfqItem}
                handleMoveRfqItem={handleMoveRfqItem}
                handleRemoveRfqItem={handleRemoveRfqItem}
                handleDuplicateRfqItem={handleDuplicateRfqItem}
                allowDuplicateMaterials={allowDuplicateMaterials}
                setAllowDuplicateMaterials={setAllowDuplicateMaterials}
                handleSubmit={handleCreateRfq}
            />
            {/* Form replaced with RFQForm above */}
            <form onSubmit={handleCreateRfq} className="hidden">
              {/* Header Details */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 rounded-2xl border bg-slate-500/5 border-slate-800/20">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400 mb-1">Originating Department</label>
                  <select value={newRfq.department} onChange={(e) => setNewRfq({ ...newRfq, department: e.target.value })} className={`w-full px-3 py-2 rounded-xl border text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200'}`}>
                    <option value="Production">Production Plant</option>
                    <option value="Adhesives">Adhesives Dept</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400 mb-1">Priority Level</label>
                  <select value={newRfq.priority} onChange={(e) => setNewRfq({ ...newRfq, priority: e.target.value as any })} className={`w-full px-3 py-2 rounded-xl border text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200'}`}>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High Priority</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400 mb-1">Default Target Delivery Date</label>
                  <DatePicker
                    value={newRfq.deliveryDate}
                    onChange={(date) => setNewRfq({ ...newRfq, deliveryDate: date })}
                    darkMode={darkMode}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400 mb-1">RFQ Brief Description</label>
                  <input type="text" value={newRfq.description} onChange={(e) => setNewRfq({ ...newRfq, description: e.target.value })} placeholder="e.g., Raw material replenishment for Box Line 2" className={`w-full px-3 py-2 rounded-xl border text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200'}`} />
                </div>
              </div>

              {/* Dynamic Line-Item Table Header Controls */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400 flex items-center gap-1.5">
                      Requested Raw Materials Line Items
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                      {rfqItems.length} {rfqItems.length === 1 ? 'Item' : 'Items'}
                    </span>
                    <span className="text-xs text-slate-700 dark:text-slate-400 font-mono">
                      (Total Qty: {rfqItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0).toLocaleString()})
                    </span>
                  </div>

                  <div className="flex items-center space-x-3">
                    <label className="flex items-center space-x-1.5 text-xs text-slate-700 dark:text-slate-400 cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={allowDuplicateMaterials}
                        onChange={(e) => setAllowDuplicateMaterials(e.target.checked)}
                        className="rounded accent-emerald-600"
                      />
                      <span>Allow duplicate materials</span>
                    </label>

                    <button
                      type="button"
                      onClick={handleAddRfqItem}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow flex items-center space-x-1 cursor-pointer transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Raw Material Item</span>
                    </button>
                  </div>
                </div>

                {/* Line Item Table */}
                <div className={`rounded-2xl border overflow-x-auto ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className={`border-b font-bold uppercase tracking-wider text-[10px] ${darkMode ? 'bg-slate-800/80 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
                        <th className="p-2.5 w-12 text-center">#</th>
                        <th className="p-2.5 min-w-[180px]">Raw Material *</th>
                        <th className="p-2.5 min-w-[150px]">Description</th>
                        <th className="p-2.5 w-20">Unit</th>
                        <th className="p-2.5 w-28">Quantity *</th>
                        <th className="p-2.5 w-28">Expected Price (₹)</th>
                        <th className="p-2.5 w-32">Req. Delivery Date</th>
                        <th className="p-2.5 min-w-[120px]">Remarks</th>
                        <th className="p-2.5 w-24 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/30">
                      {rfqItems.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="py-8 text-center text-slate-800 dark:text-slate-500 text-xs">
                            No raw materials added yet. Click <span className="font-bold text-emerald-500 cursor-pointer" onClick={handleAddRfqItem}>"+ Add Raw Material Item"</span> to start building this RFQ.
                          </td>
                        </tr>
                      ) : (
                        rfqItems.map((item, index) => (
                          <tr key={index} className={`hover:bg-slate-500/5 transition-colors ${!item.materialCode ? 'bg-amber-500/5' : ''}`}>
                            {/* Reorder & Row number */}
                            <td className="p-2 text-center font-mono text-[10px] text-slate-700 dark:text-slate-400">
                              <div className="flex flex-col items-center justify-center gap-0.5">
                                <span>{index + 1}</span>
                                <div className="flex items-center space-x-0.5">
                                  <button
                                    type="button"
                                    disabled={index === 0}
                                    onClick={() => handleMoveRfqItem(index, 'up')}
                                    title="Move Up"
                                    className="p-0.5 rounded hover:bg-slate-700/50 text-slate-700 dark:text-slate-400 disabled:opacity-20 cursor-pointer"
                                  >
                                    <ArrowUp className="w-2.5 h-2.5" />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={index === rfqItems.length - 1}
                                    onClick={() => handleMoveRfqItem(index, 'down')}
                                    title="Move Down"
                                    className="p-0.5 rounded hover:bg-slate-700/50 text-slate-700 dark:text-slate-400 disabled:opacity-20 cursor-pointer"
                                  >
                                    <ArrowDown className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                              </div>
                            </td>

                            {/* Raw Material Searchable Selector */}
                            <td className="p-2">
                              <ServerSearchableDropdown
                                darkMode={darkMode}
                                value={item.materialId || ''}
                                onChange={(id, mat) => {
                                  if (mat) {
                                      // Manually trigger the handler logic as if select changed
                                      handleUpdateRfqItem(index, 'materialId', mat.id);
                                  }
                                }}
                                placeholder="Search & select material..."
                              />
                              {item.name && (
                                <span className="block text-[10px] text-emerald-400 font-semibold mt-0.5">
                                  {item.name}
                                </span>
                              )}
                            </td>

                            {/* Description (Auto-filled / Editable) */}
                            <td className="p-2">
                              <input
                                type="text"
                                value={item.description}
                                onChange={(e) => handleUpdateRfqItem(index, 'description', e.target.value)}
                                placeholder="Description / Specs"
                                className={`w-full px-2 py-1.5 rounded-lg border text-xs ${
                                  darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                                }`}
                              />
                            </td>

                            {/* Unit of Measure */}
                            <td className="p-2">
                              <input
                                type="text"
                                value={item.unit}
                                onChange={(e) => handleUpdateRfqItem(index, 'unit', e.target.value)}
                                placeholder="Unit"
                                className={`w-full px-2 py-1.5 rounded-lg border text-xs font-mono ${
                                  darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                                }`}
                              />
                            </td>

                            {/* Quantity */}
                            <td className="p-2">
                              <input
                                type="number"
                                required
                                min={1}
                                value={item.quantity || ''}
                                onChange={(e) => handleUpdateRfqItem(index, 'quantity', Number(e.target.value))}
                                className={`w-full px-2 py-1.5 rounded-lg border text-xs font-bold ${
                                  darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800 dark:text-slate-500'
                                }`}
                              />
                            </td>

                            {/* Expected Unit Price */}
                            <td className="p-2">
                              <input
                                type="number"
                                step="0.01"
                                placeholder="Optional"
                                value={item.expectedPrice ?? ''}
                                onChange={(e) => handleUpdateRfqItem(index, 'expectedPrice', e.target.value ? Number(e.target.value) : undefined)}
                                className={`w-full px-2 py-1.5 rounded-lg border text-xs ${
                                  darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800 dark:text-slate-500'
                                }`}
                              />
                            </td>

                            {/* Required Delivery Date */}
                            <td className="p-2">
                              <input
                                type="date"
                                value={item.requiredDate || newRfq.deliveryDate}
                                onChange={(e) => handleUpdateRfqItem(index, 'requiredDate', e.target.value)}
                                className={`w-full px-1.5 py-1.5 rounded-lg border text-[11px] ${
                                  darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800 dark:text-slate-500'
                                }`}
                              />
                            </td>

                            {/* Remarks */}
                            <td className="p-2">
                              <input
                                type="text"
                                value={item.remarks}
                                onChange={(e) => handleUpdateRfqItem(index, 'remarks', e.target.value)}
                                placeholder="Remarks"
                                className={`w-full px-2 py-1.5 rounded-lg border text-xs ${
                                  darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                                }`}
                              />
                            </td>

                            {/* Actions */}
                            <td className="p-2 text-center">
                              <div className="flex items-center justify-center space-x-1">
                                <button
                                  type="button"
                                  onClick={() => handleDuplicateRfqItem(index)}
                                  title="Duplicate Item"
                                  className="p-1 rounded-lg hover:bg-slate-700/50 text-slate-700 dark:text-slate-400 hover:text-white transition-colors cursor-pointer"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveRfqItem(index)}
                                  title="Remove Item"
                                  className="p-1 rounded-lg hover:bg-rose-500/20 text-slate-700 dark:text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
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

              {/* Suppliers Selection */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400 mb-1">Select Supplier Mills to Invite</label>
                <div ref={rfqDropdownRef} className="relative">
                  <div 
                    className={`w-full min-h-[40px] px-3 py-2 rounded-xl border text-xs cursor-pointer ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                    onClick={() => setIsRfqSupplierDropdownOpen(!isRfqSupplierDropdownOpen)}
                  >
                    <div className="flex flex-wrap gap-1">
                      {newRfq.selectedSuppliers.map(id => {
                        const s = suppliers.find(su => su.id === id);
                        return s ? (
                          <span key={s.id} className="flex items-center gap-1 bg-emerald-900/30 text-emerald-300 px-2 py-1 rounded text-[10px]">
                            {getSupplierDisplayName(s.id, s.supplierName, s.millName)}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const list = newRfq.selectedSuppliers.filter(sid => sid !== s.id);
                                setNewRfq({ ...newRfq, selectedSuppliers: list });
                              }}
                              className="hover:text-emerald-100"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ) : null;
                      })}
                      {newRfq.selectedSuppliers.length === 0 && <span className="text-slate-700 dark:text-slate-400">Select suppliers...</span>}
                    </div>
                  </div>
                  
                  {isRfqSupplierDropdownOpen && (
                    <div className={`absolute z-20 w-full mt-1 rounded-xl border shadow-lg ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                      <div className="p-2 border-b border-slate-700/50">
                        <input
                          type="text"
                          placeholder="Search..."
                          value={rfqSupplierSearch}
                          onChange={(e) => setRfqSupplierSearch(e.target.value)}
                          className={`w-full px-2 py-1.5 rounded-lg border text-xs ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                        />
                      </div>
                      <div className="max-h-40 overflow-y-auto">
                        {suppliers
                          .filter(s => s.supplierName.toLowerCase().includes(rfqSupplierSearch.toLowerCase()) || s.millName.toLowerCase().includes(rfqSupplierSearch.toLowerCase()) || s.id.toLowerCase().includes(rfqSupplierSearch.toLowerCase()))
                          .map(s => (
                            <label
                              key={s.id}
                              className={`flex items-center px-3 py-2 text-xs cursor-pointer ${darkMode ? 'hover:bg-slate-700 text-white' : 'hover:bg-slate-100'}`}
                            >
                              <input
                                type="checkbox"
                                checked={newRfq.selectedSuppliers.includes(s.id)}
                                onChange={(e) => {
                                  const list = e.target.checked 
                                    ? [...newRfq.selectedSuppliers, s.id]
                                    : newRfq.selectedSuppliers.filter(id => id !== s.id);
                                  setNewRfq({ ...newRfq, selectedSuppliers: list });
                                }}
                                className="mr-2 rounded accent-emerald-600"
                              />
                              {getSupplierDisplayName(s.id, s.supplierName, s.millName)}
                            </label>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800/20">
                <div className="text-xs text-slate-700 dark:text-slate-400 font-semibold">
                  Total Items: <span className="text-emerald-400 font-bold">{rfqItems.length}</span>
                </div>
                <div className="flex space-x-2">
                  <button type="button" onClick={() => setIsRfqModalOpen(false)} className="px-4 py-2 rounded-xl border text-xs font-semibold cursor-pointer">Cancel</button>
                  <button type="submit" className="px-6 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow hover:bg-emerald-500 transition-all cursor-pointer">Submit RFQ ({rfqItems.length} {rfqItems.length === 1 ? 'Item' : 'Items'})</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 1.5 Supplier Quotation Modal (Strictly Single Supplier) */}
      {isQuoteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
          <div className={`w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl border p-6 relative flex flex-col ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            <button 
              onClick={() => setIsQuoteModalOpen(false)} 
              className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-slate-800/50 text-slate-700 dark:text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="mb-4">
              <h2 className="text-base font-bold flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-500" />
                <span>{editingQuoteId ? 'Edit Supplier Quotation' : 'Create New Supplier Quotation'}</span>
              </h2>
              <p className="text-xs text-slate-700 dark:text-slate-400 mt-0.5">
                Each Supplier Quotation must belong to exactly <strong className="text-emerald-400">one supplier</strong>. Multi-select is not allowed.
              </p>
            </div>

            <SupplierQuotationForm
              darkMode={darkMode}
              isOpen={isQuoteModalOpen}
              onClose={() => setIsQuoteModalOpen(false)}
              onSubmit={handleSaveQuote}
              quoteForm={quoteForm}
              setQuoteForm={setQuoteForm}
              quoteLineItems={quoteLineItems}
              handleAddQuoteLineItem={handleAddQuoteLineItem}
              handleUpdateQuoteLineItem={handleUpdateQuoteLineItem}
              handleRemoveQuoteLineItem={handleRemoveQuoteLineItem}
              quoteSupplierSearch={quoteSupplierSearch}
              setQuoteSupplierSearch={setQuoteSupplierSearch}
              suppliers={suppliers}
              rfqs={rfqs}
              rawMaterials={rawMaterials}
              editingQuoteId={editingQuoteId}
              quoteSubmitError={quoteSubmitError}
              isSubmittingQuote={isSubmittingQuote}
              handleSelectRfqInQuoteForm={handleSelectRfqInQuoteForm}
              getSupplierDisplayName={getSupplierDisplayName}
            />
          </div>
        </div>
      )}

      {/* 2. Purchase Order Modal */}
      {isPoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
          <div className={`w-full max-w-md rounded-3xl shadow-2xl border p-6 relative ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            <button onClick={() => setIsPoModalOpen(false)} className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-slate-800/50 text-slate-700 dark:text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            <h2 className="text-base font-bold mb-1">Direct Purchase Order</h2>
            <p className="text-xs text-slate-700 dark:text-slate-400 mb-4">Direct PO generation skipping RFQ workflow.</p>

            {scanError && (
              <div className="mb-4 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-bold">Extraction Error</p>
                  <p className="text-xs opacity-80">{scanError}</p>
                </div>
                <button onClick={() => setScanError(null)} className="p-1 hover:bg-white/10 rounded-lg"><X className="w-4 h-4" /></button>
              </div>
            )}

            <PurchaseOrderForm
              darkMode={darkMode}
              isOpen={isPoModalOpen}
              onClose={() => setIsPoModalOpen(false)}
              newPo={newPo}
              setNewPo={setNewPo}
              supplierSearch={supplierSearch}
              setSupplierSearch={setSupplierSearch}
              isSupplierDropdownOpen={isSupplierDropdownOpen}
              setIsSupplierDropdownOpen={setIsSupplierDropdownOpen}
              suppliers={suppliers}
              rawMaterials={rawMaterials}
              scanError={scanError}
              setScanError={setScanError}
              scanStatus={scanStatus}
              setScanStatus={setScanStatus}
              isScanning={isScanning}
              setIsScanning={setIsScanning}
              isMatching={isMatching}
              setIsMatching={setIsMatching}
              handlePoAiInvoiceDataExtracted={handlePoAiInvoiceDataExtracted}
              getSupplierDisplayName={getSupplierDisplayName}
              handleSubmit={async (e) => {
                e.preventDefault();
                const sup = suppliers.find(s => s.id === newPo.supplierId);
                if (!sup) {
                  alert("Please select a supplier.");
                  return;
                }
                
                if (!newPo.items || newPo.items.length === 0 || newPo.items.some((it: any) => !it.materialCode || !it.materialName)) {
                  alert("Please select a valid material for all order items.");
                  return;
                }

                const totalAmount = newPo.items.reduce((sum: number, it: any) => {
                  const base = Number(it.quantity || 1000) * Number(it.unitPrice || 50);
                  const gstRate = it.gst !== undefined ? Number(it.gst) : 18;
                  return sum + (base * (1 + gstRate / 100));
                }, 0);
                
                const payload = {
                  supplierId: sup.id,
                  date: new Date().toISOString().slice(0, 10),
                  deliveryDate: newPo.deliveryDate,
                  status: 'Approved',
                  remarks: newPo.remarks,
                  totalAmount,
                  items: newPo.items.map((it: any) => {
                    const mat = rawMaterials.find(rm => rm.id === it.materialId);
                    const qty = Number(it.quantity || 1000);
                    const price = Number(it.unitPrice || 50);
                    const gstRate = it.gst !== undefined ? Number(it.gst) : 18;
                    const itemTotal = (qty * price) * (1 + gstRate / 100);
                    return {
                      materialCode: String(it.materialCode || mat?.code || ''),
                      materialName: it.materialName || mat?.name || '',
                      quantityOrdered: qty,
                      unitPrice: price,
                      total: itemTotal
                    };
                  })
                };

                try {
                  const result = await procurementService.createPurchaseOrder(payload);
                  
                  if (result.success) {
                    const createdPo = result.data;
                    setPurchaseOrders([createdPo, ...purchaseOrders]);
                    setIsPoModalOpen(false);
                    
                    setNewPo({
                      supplierId: '',
                      deliveryDate: new Date(Date.now() + 7*24*60*60*1000).toISOString().slice(0, 10),
                      items: [],
                      remarks: ''
                    });
                    setSupplierSearch('');

                    triggerNotification('po_created', {
                      title: 'Purchase Order Created',
                      message: `Purchase Order ${createdPo.poNumber} created directly for ${sup.supplierName}.`,
                      poNumber: createdPo.poNumber,
                      supplierName: sup.supplierName,
                      recipientEmail: 'sunita.menon@amkerp.com'
                    });

                    triggerNotification('po_approved', {
                      title: 'Purchase Order Approved',
                      message: `Purchase Order ${createdPo.poNumber} for ${sup.supplierName} has been approved.`,
                      poNumber: createdPo.poNumber,
                      supplierName: sup.supplierName,
                      recipientEmail: 'sunita.menon@amkerp.com'
                    });
                  } else {
                    console.error("PO Creation failed:", result.error);
                    alert(`Failed to create PO: ${result.error || 'Unknown error'}`);
                  }
                } catch (err) {
                  console.error("Error creating PO:", err);
                  alert("An error occurred while creating the Purchase Order.");
                }
              }}
            />
          </div>
        </div>
      )}

      {/* 3. Gate Entry Modal */}
      {isGeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
          <div className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl border p-6 relative ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            <button onClick={() => setIsGeModalOpen(false)} className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-slate-800/50 text-slate-700 dark:text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            <h2 className="text-base font-bold mb-1">Material Gate Entry (Inward Receipt)</h2>
            <p className="text-xs text-slate-700 dark:text-slate-400 mb-4">Log incoming truck load arrival details to receive materials into warehouse.</p>

            {scanError && (
              <div className="mb-4 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-bold">Extraction Error</p>
                  <p className="text-xs opacity-80">{scanError}</p>
                </div>
                <button onClick={() => setScanError(null)} className="p-1 hover:bg-white/10 rounded-lg"><X className="w-4 h-4" /></button>
              </div>
            )}

            <div className="mb-5">
              <InvoiceScanner 
                darkMode={darkMode}
                onScanStart={() => {
                  setIsScanning(true);
                  setScanStatus('Scanning invoice...');
                  setScanError(null);
                }}
                onScanError={(err) => {
                  setIsScanning(false);
                  setScanError(err);
                }}
                onDataExtracted={handleAiInvoiceDataExtracted}
              />
              
              {/* Internal Scanner Loading Status */}
              {(isScanning || isMatching) && !scanError && (
                <div className={`mt-2 p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 flex items-center space-x-3 animate-in fade-in slide-in-from-top-2 duration-300`}>
                  <div className="relative">
                    <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
                    <Sparkles className="w-2.5 h-2.5 text-amber-400 absolute -top-1 -right-1" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-emerald-500">{scanStatus || 'Processing...'}</p>
                    <p className="text-[10px] text-slate-700 dark:text-slate-400">Please wait...</p>
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleCreateGateEntry} className="space-y-4">
              {/* Supplier and Purchase Order row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  {newGe.isCustomSupplier ? (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400">Custom Supplier Name *</label>
                        <button
                          type="button"
                          onClick={() => setNewGe(prev => ({ ...prev, isCustomSupplier: false, supplierId: '' }))}
                          className="text-[10px] text-amber-500 hover:underline cursor-pointer"
                        >
                          Choose from list
                        </button>
                      </div>
                      <input
                        type="text"
                        required
                        placeholder="Enter Supplier Name..."
                        value={newGe.customSupplierName || ''}
                        onChange={(e) => setNewGe(prev => ({ ...prev, customSupplierName: e.target.value }))}
                        className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                      />
                    </div>
                  ) : (
                    <>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400">Choose Supplier *</label>
                      {newGe.scannedSupplierName && (
                        <div className="p-1.5 rounded-lg bg-emerald-950/20 border border-emerald-900/30">
                          <p className="text-[10px] text-slate-700 dark:text-slate-400 font-medium">Scanned Supplier Name:</p>
                          <p className="text-[11px] text-emerald-400 font-bold">{newGe.scannedSupplierName}</p>
                          {!newGe.supplierId && (
                            <div className="flex items-center justify-between mt-1 pt-1 border-t border-rose-500/10">
                              <p className="text-[10px] text-rose-400 font-bold">⚠️ Not found in database</p>
                              <button
                                type="button"
                                onClick={() => setNewGe(prev => ({
                                  ...prev,
                                  isCustomSupplier: true,
                                  customSupplierName: prev.scannedSupplierName
                                }))}
                                className="px-2 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white font-bold text-[9px] uppercase tracking-wider cursor-pointer transition-colors"
                              >
                                Accept Scanned Value
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                      <select
                        required
                        value={newGe.supplierId || ''}
                        onChange={(e) => {
                          const selectedSuppId = e.target.value;
                          setNewGe(prev => ({
                            ...prev,
                            supplierId: selectedSuppId,
                            poNumber: '' // Clear PO when supplier changes
                          }));
                        }}
                        className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold ${!newGe.supplierId ? 'border-amber-500/50 bg-amber-500/5 text-amber-300' : (darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200')}`}
                      >
                        <option value="">-- Choose Supplier * --</option>
                        {suppliers.map(s => (
                          <option key={s.id} value={s.id}>{getSupplierDisplayName(s.id, s.supplierName, s.millName)}</option>
                        ))}
                      </select>
                    </>
                  )}
                </div>

                <div className="space-y-1">
                  {newGe.isCustomPo ? (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400">Custom PO Number *</label>
                        <button
                          type="button"
                          onClick={() => setNewGe(prev => ({ ...prev, isCustomPo: false, poNumber: '' }))}
                          className="text-[10px] text-amber-500 hover:underline cursor-pointer"
                        >
                          Choose from list
                        </button>
                      </div>
                      <input
                        type="text"
                        required
                        placeholder="Enter PO Number..."
                        value={newGe.poNumber || ''}
                        onChange={(e) => setNewGe(prev => ({ ...prev, poNumber: e.target.value }))}
                        className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                      />
                    </div>
                  ) : (
                    <>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400">Choose Purchase Order *</label>
                      {newGe.scannedPoNumber && (
                        <div className="p-1.5 rounded-lg bg-emerald-950/20 border border-emerald-900/30">
                          <p className="text-[10px] text-slate-700 dark:text-slate-400 font-medium">Scanned PO Number:</p>
                          <p className="text-[11px] text-emerald-400 font-bold">{newGe.scannedPoNumber}</p>
                          {!newGe.poNumber && (
                            <div className="flex items-center justify-between mt-1 pt-1 border-t border-rose-500/10">
                              <p className="text-[10px] text-rose-400 font-bold">⚠️ Not found in database</p>
                              <button
                                type="button"
                                onClick={() => setNewGe(prev => ({
                                  ...prev,
                                  isCustomPo: true,
                                  poNumber: prev.scannedPoNumber
                                }))}
                                className="px-2 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white font-bold text-[9px] uppercase tracking-wider cursor-pointer transition-colors"
                              >
                                Accept Scanned Value
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                      <select
                        required
                        value={newGe.poNumber || ''}
                        onChange={(e) => {
                          const po = purchaseOrders.find(p => p.poNumber === e.target.value);
                          const poItems = po?.items ? po.items.map(it => {
                            const matchedMat = rawMaterials.find(rm => rm.code === it.materialCode || rm.name === it.materialName);
                            return {
                              materialId: matchedMat?.id || '',
                              materialCode: it.materialCode,
                              materialName: it.materialName,
                              quantityReceived: Math.max(1, (it.quantityOrdered || 1) - (it.quantityReceived || 0)),
                              unit: 'Kg',
                              hsnCode: matchedMat?.hsnCode || '',
                              unitPrice: it.unitPrice || 0,
                              totalAmount: ((it.quantityOrdered || 1) - (it.quantityReceived || 0)) * (it.unitPrice || 0)
                            };
                          }) : [];

                          setNewGe(prev => ({
                            ...prev,
                            poNumber: e.target.value,
                            supplierId: po?.supplierId || prev.supplierId,
                            items: poItems
                          }));
                        }}
                        className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold ${!newGe.poNumber ? 'border-amber-500/50 bg-amber-500/5 text-amber-300' : (darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200')}`}
                      >
                        <option value="">-- Choose PO * --</option>
                        {purchaseOrders
                          .filter(p => !newGe.supplierId || p.supplierId === newGe.supplierId)
                          .map(p => (
                            <option key={p.id} value={p.poNumber}>
                              {p.poNumber} ({getSupplierDisplayName(p.supplierId, p.supplierName, (p as any).supplier?.millName, (p as any).supplier)})
                            </option>
                          ))}
                      </select>
                    </>
                  )}
                </div>
              </div>

              {/* Warehouse & Vehicle Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400">Receipt Warehouse *</label>
                  <select
                    id="receipt-warehouse-select"
                    required
                    value={newGe.warehouseId || effectiveWarehouses[0]?.id || ''}
                    onChange={(e) => setNewGe({ ...newGe, warehouseId: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold ${!newGe.warehouseId ? 'border-amber-500/50 bg-amber-500/5 text-amber-900 dark:text-amber-300' : (darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900')}`}
                  >
                    <option value="" className="text-slate-500">-- Select Warehouse * --</option>
                    {effectiveWarehouses.map(wh => (
                      <option key={wh.id} value={wh.id} className="text-slate-900 dark:text-white bg-white dark:bg-slate-800">
                        {wh.name} {wh.code ? `(${wh.code})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400">Vehicle Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. KA-20-AB-3816"
                    value={newGe.vehicleNumber}
                    onChange={(e) => setNewGe({ ...newGe, vehicleNumber: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                  />
                </div>
              </div>

              {/* Transporter and Driver */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400 mb-1">Transport Company</label>
                  <input
                    type="text"
                    placeholder="e.g. VRL Logistics"
                    value={newGe.transportCompany}
                    onChange={(e) => setNewGe({ ...newGe, transportCompany: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400 mb-1">Driver Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Ramesh Kumar"
                    value={newGe.driverName}
                    onChange={(e) => setNewGe({ ...newGe, driverName: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400 mb-1">Driver Phone</label>
                  <input
                    type="text"
                    placeholder="e.g. 9822334455"
                    value={newGe.driverPhone}
                    onChange={(e) => setNewGe({ ...newGe, driverPhone: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                  />
                </div>
              </div>

              {/* Multiple Materials Received Card List Layout */}
              <div className="pt-2 border-t border-slate-800/30">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400">
                    Material Line Items Received ({newGe.items?.length || 0})
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const mat = rawMaterials[0];
                      setNewGe(prev => ({
                        ...prev,
                        items: [
                          ...(prev.items || []),
                          {
                            materialId: mat?.id || '',
                            materialCode: mat?.code || 'RM-NEW',
                            materialName: mat?.name || 'Raw Material Item',
                            quantityReceived: 1,
                            unit: mat?.uom || 'Nos',
                            hsnCode: mat?.hsnCode || '',
                            unitPrice: mat?.purchasePrice || 0,
                            totalAmount: mat?.purchasePrice || 0
                          }
                        ]
                      }));
                    }}
                    className="text-[10px] font-bold text-emerald-500 hover:text-emerald-400 flex items-center space-x-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Item Row</span>
                  </button>
                </div>

                {newGe.items && newGe.items.length > 0 ? (
                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                    {newGe.items.map((item, idx) => (
                      <div key={idx} className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50 border-slate-200'} space-y-3`}>
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-400">Material Line Item #{idx + 1}</h4>
                            {item.scannedMaterialName && (
                              <p className="text-xs text-slate-700 dark:text-slate-300 mt-1">
                                <span className="font-bold text-slate-800 dark:text-slate-500">Scanned Material:</span> {item.scannedMaterialName}
                              </p>
                            )}
                            {item.scannedHsn && (
                              <p className="text-[10px] text-slate-700 dark:text-slate-400 mt-0.5">
                                <span className="font-bold text-slate-800 dark:text-slate-500">Scanned HSN:</span> {item.scannedHsn}
                              </p>
                            )}
                            {!item.materialId && !item.isCustomMaterial && (
                              <div className="mt-2 p-2 rounded-lg bg-rose-500/5 border border-rose-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <p className="text-[10px] text-rose-400 font-bold">
                                  ⚠️ Not found in database
                                </p>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setNewGe(prev => {
                                      const copy = [...prev.items];
                                      const scName = copy[idx].scannedMaterialName || copy[idx].materialName || 'Freight & Installtion Charges';
                                      const scHsn = copy[idx].scannedHsn || copy[idx].hsnCode || '995469';
                                      const scQty = copy[idx].quantityReceived !== undefined && copy[idx].quantityReceived !== null ? copy[idx].quantityReceived : 1;
                                      const scPrice = copy[idx].unitPrice !== undefined && copy[idx].unitPrice !== null ? copy[idx].unitPrice : 10000;
                                      copy[idx] = {
                                        ...copy[idx],
                                        isCustomMaterial: true,
                                        materialId: '',
                                        materialCode: 'RM-CUSTOM',
                                        materialName: scName,
                                        hsnCode: scHsn,
                                        quantityReceived: scQty,
                                        unitPrice: scPrice,
                                        totalAmount: scQty * scPrice
                                      };
                                      return { ...prev, items: copy };
                                    });
                                  }}
                                  className="px-2 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white font-bold text-[9px] uppercase tracking-wider cursor-pointer transition-colors"
                                >
                                  Accept Scanned Value
                                </button>
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setNewGe(prev => ({
                                ...prev,
                                items: prev.items.filter((_, i) => i !== idx)
                              }));
                            }}
                            className="text-slate-700 dark:text-slate-400 hover:text-rose-500 p-1 rounded-lg hover:bg-rose-500/10 cursor-pointer"
                            title="Remove Item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            {item.isCustomMaterial ? (
                              <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400">Custom Material Name *</label>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setNewGe(prev => {
                                        const copy = [...prev.items];
                                        copy[idx] = { ...copy[idx], isCustomMaterial: false, materialId: '' };
                                        return { ...prev, items: copy };
                                      });
                                    }}
                                    className="text-[10px] text-amber-500 hover:underline cursor-pointer"
                                  >
                                    Select from DB
                                  </button>
                                </div>
                                <input
                                  type="text"
                                  required
                                  placeholder="Enter material name..."
                                  value={item.materialName || ''}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setNewGe(prev => {
                                      const copy = [...prev.items];
                                      copy[idx] = { ...copy[idx], materialName: val };
                                      return { ...prev, items: copy };
                                    });
                                  }}
                                  className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-semibold ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200'}`}
                                />
                              </div>
                            ) : (
                              <>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400 mb-1">Database Material Selection *</label>
                                <select
                                  required
                                  value={item.materialId || ''}
                                  onChange={(e) => {
                                    const matchedMatId = e.target.value;
                                    const dbMat = rawMaterials.find(rm => rm.id === matchedMatId);
                                    setNewGe(prev => {
                                      const copy = [...prev.items];
                                      copy[idx] = {
                                        ...copy[idx],
                                        materialId: matchedMatId,
                                        materialCode: dbMat?.code || '',
                                        materialName: dbMat?.name || copy[idx].materialName,
                                        hsnCode: dbMat?.hsnCode || copy[idx].hsnCode,
                                        unit: dbMat?.uom || copy[idx].unit || 'Kg'
                                      };
                                      return { ...prev, items: copy };
                                    });
                                  }}
                                  className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-semibold ${!item.materialId ? 'border-rose-500 bg-rose-500/5 text-rose-300' : (darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200')}`}
                                >
                                  <option value="">-- Select Database Material * --</option>
                                  {rawMaterials.map(rm => (
                                    <option key={rm.id} value={rm.id}>{rm.name} ({rm.code})</option>
                                  ))}
                                </select>
                              </>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400 mb-1">Quantity *</label>
                              <input
                                type="number"
                                required
                                min={0.01}
                                step="any"
                                value={item.quantityReceived}
                                onChange={(e) => {
                                  const qty = Number(e.target.value);
                                  setNewGe(prev => {
                                    const copy = [...prev.items];
                                    copy[idx] = { ...copy[idx], quantityReceived: qty, totalAmount: qty * (copy[idx].unitPrice || 0) };
                                    return { ...prev, items: copy };
                                  });
                                }}
                                className={`w-full px-2 py-1.5 rounded-lg border text-xs font-bold text-emerald-500 ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400 mb-1">Unit</label>
                              <input
                                type="text"
                                value={item.unit}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setNewGe(prev => {
                                    const copy = [...prev.items];
                                    copy[idx] = { ...copy[idx], unit: val };
                                    return { ...prev, items: copy };
                                  });
                                }}
                                className={`w-full px-2 py-1.5 rounded-lg border text-xs ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200'}`}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400 mb-1">Unit Price (₹)</label>
                            <input
                              type="number"
                              required
                              min={0}
                              step="any"
                              value={item.unitPrice}
                              onChange={(e) => {
                                const price = Number(e.target.value);
                                  setNewGe(prev => {
                                    const copy = [...prev.items];
                                    copy[idx] = { ...copy[idx], unitPrice: price, totalAmount: price * (copy[idx].quantityReceived || 0) };
                                    return { ...prev, items: copy };
                                  });
                              }}
                              className={`w-full px-2 py-1.5 rounded-lg border text-xs ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200'}`}
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400 mb-1">HSN Code</label>
                            <input
                              type="text"
                              value={item.hsnCode}
                              onChange={(e) => {
                                const val = e.target.value;
                                setNewGe(prev => {
                                  const copy = [...prev.items];
                                  copy[idx] = { ...copy[idx], hsnCode: val };
                                  return { ...prev, items: copy };
                                });
                              }}
                              className={`w-full px-2 py-1.5 rounded-lg border text-xs ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200'}`}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400 mb-1">Material Item</label>
                      <input type="text" disabled value={newGe.materialCode || 'RM-RAW'} className={`w-full px-3 py-2 rounded-xl border text-xs opacity-60 ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-slate-100 border-slate-200'}`} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400 mb-1">Inward Qty (Kg)</label>
                      <input type="number" required min={1} value={newGe.quantityReceived} onChange={(e) => setNewGe({ ...newGe, quantityReceived: Number(e.target.value) })} className={`w-full px-3 py-2 rounded-xl border text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400 mb-1">Entry Remarks / Notes</label>
                <textarea rows={2} value={newGe.remarks} onChange={(e) => setNewGe({ ...newGe, remarks: e.target.value })} className={`w-full px-3 py-2 rounded-xl border text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} placeholder="Enter vehicle seal #, driver comments, or invoice notes..." />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800/20">
                <button type="button" onClick={() => setIsGeModalOpen(false)} className="px-4 py-2 rounded-xl border text-xs font-semibold">Cancel</button>
                <button 
                  type="submit" 
                  disabled={isScanning || isMatching}
                  className={`px-5 py-2 rounded-xl text-xs font-bold shadow transition-all cursor-pointer ${(isScanning || isMatching) ? 'bg-slate-700 text-slate-800 dark:text-slate-500 cursor-not-allowed' : 'bg-emerald-600 text-white hover:bg-emerald-500'}`}
                >
                  Record Gate Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Reel Inward Modal */}
      {isRiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
          <div className={`w-full max-w-md rounded-3xl shadow-2xl border p-6 relative ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            <button onClick={() => setIsRiModalOpen(false)} className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-slate-800/50 text-slate-700 dark:text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            
            <h2 className="text-base font-bold mb-1">Reel Inward Entry</h2>
            <p className="text-xs text-slate-700 dark:text-slate-400 mb-4">Record individual paper reels arrival.</p>

            {scanError && (
              <div className="mb-4 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-bold">Extraction Error</p>
                  <p className="text-xs opacity-80">{scanError}</p>
                </div>
                <button onClick={() => setScanError(null)} className="p-1 hover:bg-white/10 rounded-lg"><X className="w-4 h-4" /></button>
              </div>
            )}

            <form onSubmit={handleCreateReelInward} className="space-y-4">
              {/* AI Scanner */}
              <div className="mb-4">
                <InvoiceScanner 
                  darkMode={darkMode}
                  onScanStart={() => {
                    setIsScanning(true);
                    setScanStatus('Scanning document for reels...');
                    setScanError(null);
                  }}
                  onScanError={(err) => {
                    setIsScanning(false);
                    setScanError(err);
                  }}
                  onDataExtracted={handleRiAiInvoiceDataExtracted}
                />

                {/* Internal Scanner Loading Status */}
                {(isScanning || isMatching) && !scanError && (
                  <div className={`mt-2 p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 flex items-center space-x-3 animate-in fade-in slide-in-from-top-2 duration-300`}>
                    <div className="relative">
                      <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
                      <Sparkles className="w-2.5 h-2.5 text-amber-400 absolute -top-1 -right-1" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-emerald-500">{scanStatus || 'Processing...'}</p>
                      <p className="text-[10px] text-slate-700 dark:text-slate-400">Please wait...</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400 mb-1">Purchase Order</label>
                  <select required value={newRi.poNumber} onChange={(e) => setNewRi({ ...newRi, poNumber: e.target.value })} className={`w-full px-3 py-2 rounded-xl border text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}>
                    <option value="">-- Choose PO --</option>
                    {(purchaseOrders || []).map(p => (
                      <option key={p.id} value={p.poNumber}>{p.poNumber} ({getSupplierDisplayName(p.supplierId, p.supplierName, (p as any).supplier?.millName, (p as any).supplier)})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400 mb-1">Invoice Number</label>
                  <input type="text" required placeholder="e.g. INV-BILT-99" value={newRi.invoiceNumber} onChange={(e) => setNewRi({ ...newRi, invoiceNumber: e.target.value })} className={`w-full px-3 py-2 rounded-xl border text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} />
                </div>
              </div>
              
              {/* Reels List */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400 mb-1">Extracted Reels ({newRi.items.length})</label>
                {newRi.items.map((reel, idx) => (
                  <div key={idx} className={`p-3 rounded-xl border text-xs ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex justify-between items-center mb-2 font-bold text-emerald-400">
                      <span>Reel {idx + 1}: {reel.reelNumber}</span>
                      <span>{reel.weight} Kg</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-[10px]">
                      <div>GSM: {reel.gsm}</div>
                      <div>BF: {reel.bf}</div>
                      <div>Lot: {reel.lotNumber}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800/20">
                <button type="button" onClick={() => setIsRiModalOpen(false)} className="px-4 py-2 rounded-xl border text-xs font-semibold">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow hover:bg-emerald-500 transition-all cursor-pointer">Save Reel Inward</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Quality Control QC Modal */}
      {isQcModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
          <div className={`w-full max-w-6xl rounded-3xl shadow-2xl border p-6 relative ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            <button onClick={() => setIsQcModalOpen(false)} className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-slate-800/50 text-slate-700 dark:text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-base font-bold">Paper Reel Quality Assurance Ledger</h2>
                <p className="text-xs text-slate-700 dark:text-slate-400">Record verification, physical parameters, & raw material entry specifications.</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${qcForm.status === 'Passed' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'}`}>
                  QA Status: {qcForm.status}
                </span>
              </div>
            </div>

            <form onSubmit={handlePerformQc} className="space-y-5">
              {/* AI Document Scanner integration */}
              <div className="p-3.5 rounded-2xl bg-slate-950/20 border border-slate-800/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    AI Instant Specification Extractor
                  </span>
                  <span className="text-[10px] text-slate-800 dark:text-slate-500">Scan mill test certificates & invoices</span>
                </div>
                <InvoiceScanner 
                  darkMode={darkMode}
                  onDataExtracted={handleQcAiInvoiceDataExtracted}
                />
              </div>

              {/* 11 Structural/Reference Fields Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-950/10 p-4 rounded-2xl border border-slate-800/10">
                {/* 1. Reel Inward Select */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400 mb-1">Select Inward Challan</label>
                  <select
                    required
                    value={qcForm.reelInwardId}
                    onChange={(e) => {
                      const selected = reelsInward.find(r => r.id === e.target.value);
                      if (selected) {
                        initializeQcFormForReel(selected);
                      }
                    }}
                    className={`w-full px-3 py-2 rounded-xl border text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                  >
                    <option value="">-- Choose Reel --</option>
                    {reelsInward.map(ri => (
                      <option key={ri.id} value={ri.id}>
                        {ri.reelNumber} ({getSupplierDisplayName((ri as any).supplierId, ri.supplierName, ri.millName)} - {ri.weight} Kgs)
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Supplier Name */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400 mb-1">Supplier / Mill Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Paper Agencies"
                    value={qcForm.supplierName}
                    onChange={(e) => setQcForm({ ...qcForm, supplierName: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                  />
                </div>

                {/* 3. Item / Commodity */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400 mb-1">Item / Commodity Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kraft Paper 180GSM"
                    value={qcForm.itemCommodity}
                    onChange={(e) => setQcForm({ ...qcForm, itemCommodity: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                  />
                </div>

                {/* 4. Invoice No */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400 mb-1">Invoice / Challan No</label>
                  <input
                    type="text"
                    required
                    placeholder="INV-1094"
                    value={qcForm.invoiceNo}
                    onChange={(e) => setQcForm({ ...qcForm, invoiceNo: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                  />
                </div>

                {/* 5. Invoice Date */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400 mb-1">Invoice Date</label>
                  <input
                    type="date"
                    required
                    value={qcForm.invoiceDate}
                    onChange={(e) => setQcForm({ ...qcForm, invoiceDate: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                  />
                </div>

                {/* 6. Quantity Received (Declared Weight) */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400 mb-1">Declared Invoice Qty (Kg)</label>
                  <input
                    type="number"
                    required
                    value={qcForm.quantityReceived}
                    onChange={(e) => setQcForm({ ...qcForm, quantityReceived: Number(e.target.value) })}
                    className={`w-full px-3 py-2 rounded-xl border text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                  />
                </div>

                {/* 7. Quantity as Written / Scale Discrepancy indicator */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400">Qty As Checked / Written</label>
                    {(() => {
                      const sumObserved = qcForm.rows.reduce((sum, r) => sum + Number(r.netWeight || 0), 0);
                      const diff = Math.abs(sumObserved - qcForm.quantityReceived);
                      return diff > 50 ? (
                        <span className="text-[8px] px-1 bg-amber-500/20 text-amber-400 font-bold rounded">Discrepancy</span>
                      ) : (
                        <span className="text-[8px] px-1 bg-emerald-500/20 text-emerald-400 font-bold rounded">Matched</span>
                      );
                    })()}
                  </div>
                  <input
                    type="text"
                    placeholder="Computed automatically"
                    value={qcForm.quantityAsWritten}
                    onChange={(e) => setQcForm({ ...qcForm, quantityAsWritten: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                  />
                </div>

                {/* 8. Tested On */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400 mb-1">Tested On (QA Date)</label>
                  <input
                    type="date"
                    required
                    value={qcForm.testedOn}
                    onChange={(e) => setQcForm({ ...qcForm, testedOn: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                  />
                </div>

                {/* 9. Overall QA Status */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400 mb-1">Overall QA Decision</label>
                  <select
                    value={qcForm.status}
                    onChange={(e) => setQcForm({ ...qcForm, status: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                  >
                    <option value="Passed">Passed / Approved</option>
                    <option value="Failed">Failed / Quarantined</option>
                  </select>
                </div>

                {/* 10. Prepared By */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400 mb-1">Prepared By (Inspector)</label>
                  <input
                    type="text"
                    required
                    value={qcForm.preparedBy}
                    onChange={(e) => setQcForm({ ...qcForm, preparedBy: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                  />
                </div>

                {/* 11. Checked By */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400 mb-1">Checked By (Supervisor)</label>
                  <input
                    type="text"
                    required
                    value={qcForm.checkedBy}
                    onChange={(e) => setQcForm({ ...qcForm, checkedBy: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                  />
                </div>

                {/* 12. Target Warehouse */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400 mb-1">Storage Warehouse</label>
                  <select
                    id="qc-storage-warehouse-select"
                    value={(qcForm as any).warehouseId || ''}
                    onChange={(e) => {
                      const wId = e.target.value;
                      const validBins = binLocations.filter((b: any) => !wId || b.warehouseId === wId);
                      const defBin = validBins[0]?.id || '';
                      setQcForm(prev => ({
                        ...prev,
                        warehouseId: wId,
                        defaultBinId: defBin,
                        rows: prev.rows.map(r => ({ ...r, binId: defBin }))
                      }));
                    }}
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'}`}
                  >
                    <option value="" className="text-slate-500">-- Select Warehouse --</option>
                    {effectiveWarehouses.map(w => (
                      <option key={w.id} value={w.id} className="text-slate-900 dark:text-white bg-white dark:bg-slate-800">
                        {w.name} {w.code ? `(${w.code})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 13. Default Target Bin */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400">Default Target Bin</label>
                    <button
                      type="button"
                      onClick={() => {
                        const bin = (qcForm as any).defaultBinId;
                        if (bin) {
                          setQcForm(prev => ({
                            ...prev,
                            rows: prev.rows.map(r => ({ ...r, binId: bin }))
                          }));
                        }
                      }}
                      className="text-[9px] text-emerald-400 hover:underline font-semibold cursor-pointer"
                    >
                      Apply to All
                    </button>
                  </div>
                  <select
                    value={(qcForm as any).defaultBinId || ''}
                    onChange={(e) => {
                      const bin = e.target.value;
                      setQcForm(prev => ({
                        ...prev,
                        defaultBinId: bin,
                        rows: prev.rows.map(r => ({ ...r, binId: bin }))
                      }));
                    }}
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold ${darkMode ? 'bg-slate-800 border-slate-700 text-emerald-400' : 'bg-slate-50 border-slate-200 text-emerald-700'}`}
                  >
                    <option value="">-- Choose Bin --</option>
                    {binLocations
                      .filter((b: any) => !(qcForm as any).warehouseId || b.warehouseId === (qcForm as any).warehouseId)
                      .map((bin: any) => (
                        <option key={bin.id} value={bin.id}>
                          {bin.code} ({bin.name}) - Zone {bin.zone || 'A'}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Multi-Row Parameters Inspection Ledger Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">Physical Parameters Inspection Ledger</span>
                  <button
                    type="button"
                    onClick={handleAddQcRow}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-[10px] shadow transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Verification Row</span>
                  </button>
                </div>

                <div className="overflow-x-auto border rounded-2xl max-h-[300px] overflow-y-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className={`border-b text-[10px] font-bold uppercase tracking-wider ${darkMode ? 'bg-slate-950/55 text-slate-400 border-slate-800' : 'bg-slate-50 text-slate-800 dark:text-slate-500 border-slate-200'}`}>
                        <th className="p-2 w-10 text-center">SL</th>
                        <th className="p-2 min-w-[120px]">Reel No</th>
                        <th className="p-2 w-20">Deckle (CMS)</th>
                        <th className="p-2 w-16">Std. BF</th>
                        <th className="p-2 w-16">Std. GSM</th>
                        <th className="p-2 w-20">Obs. GSM</th>
                        <th className="p-2 w-20">Obs. BF</th>
                        <th className="p-2 w-16">Cobb</th>
                        <th className="p-2 w-18">Moisture (%)</th>
                        <th className="p-2 w-24">Net Wt (Kg)</th>
                        <th className="p-2 min-w-[100px]">Verdict</th>
                        <th className="p-2 min-w-[110px]">Assigned Bin</th>
                        <th className="p-2 min-w-[140px]">Remarks / Deviation</th>
                        <th className="p-2 w-10 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/10 text-xs">
                      {qcForm.rows.map((row, idx) => (
                        <tr key={idx} className={`hover:bg-slate-800/5 ${darkMode ? 'border-slate-800 text-slate-200' : 'border-slate-200 text-slate-700 dark:text-slate-400'}`}>
                          {/* SL No */}
                          <td className="p-2 text-center text-slate-700 dark:text-slate-400 font-semibold">{row.slNo}</td>

                          {/* Reel No */}
                          <td className="p-1">
                            <input
                              type="text"
                              required
                              value={row.reelNo}
                              onChange={(e) => handleUpdateQcRow(idx, 'reelNo', e.target.value)}
                              className={`w-full px-2 py-1 rounded-lg border text-xs ${darkMode ? 'bg-slate-850 border-slate-800 text-white' : 'bg-white border-slate-200'}`}
                            />
                          </td>

                          {/* Deckle (CMS) */}
                          <td className="p-1">
                            <input
                              type="number"
                              required
                              value={row.deckle}
                              onChange={(e) => handleUpdateQcRow(idx, 'deckle', e.target.value)}
                              className={`w-full px-2 py-1 rounded-lg border text-xs ${darkMode ? 'bg-slate-850 border-slate-800' : 'bg-white border-slate-200'}`}
                            />
                          </td>

                          {/* BF */}
                          <td className="p-1">
                            <input
                              type="number"
                              required
                              value={row.bf}
                              onChange={(e) => handleUpdateQcRow(idx, 'bf', e.target.value)}
                              className={`w-full px-2 py-1 rounded-lg border text-xs ${darkMode ? 'bg-slate-850 border-slate-800' : 'bg-white border-slate-200'}`}
                            />
                          </td>

                          {/* GSM */}
                          <td className="p-1">
                            <input
                              type="number"
                              required
                              value={row.gsm}
                              onChange={(e) => handleUpdateQcRow(idx, 'gsm', e.target.value)}
                              className={`w-full px-2 py-1 rounded-lg border text-xs ${darkMode ? 'bg-slate-850 border-slate-800' : 'bg-white border-slate-200'}`}
                            />
                          </td>

                          {/* Observation GSM */}
                          <td className="p-1">
                            <input
                              type="number"
                              required
                              value={row.observationGsm}
                              onChange={(e) => handleUpdateQcRow(idx, 'observationGsm', e.target.value)}
                              className={`w-full px-2 py-1 rounded-lg border text-xs ${darkMode ? 'bg-slate-850 border-slate-800' : 'bg-white border-slate-200'}`}
                            />
                          </td>

                          {/* Observation BF */}
                          <td className="p-1">
                            <input
                              type="number"
                              required
                              value={row.observationBf}
                              onChange={(e) => handleUpdateQcRow(idx, 'observationBf', e.target.value)}
                              className={`w-full px-2 py-1 rounded-lg border text-xs ${darkMode ? 'bg-slate-850 border-slate-800' : 'bg-white border-slate-200'}`}
                            />
                          </td>

                          {/* Cobb Value */}
                          <td className="p-1">
                            <input
                              type="number"
                              required
                              value={row.cobbValue}
                              onChange={(e) => handleUpdateQcRow(idx, 'cobbValue', e.target.value)}
                              className={`w-full px-2 py-1 rounded-lg border text-xs ${darkMode ? 'bg-slate-850 border-slate-800' : 'bg-white border-slate-200'}`}
                            />
                          </td>

                          {/* Moisture (%) */}
                          <td className="p-1">
                            <input
                              type="number"
                              step="0.1"
                              required
                              value={row.moisture}
                              onChange={(e) => handleUpdateQcRow(idx, 'moisture', e.target.value)}
                              className={`w-full px-2 py-1 rounded-lg border text-xs ${darkMode ? 'bg-slate-850 border-slate-800' : 'bg-white border-slate-200'}`}
                            />
                          </td>

                          {/* Net Weight (Kgs) */}
                          <td className="p-1">
                            <input
                              type="number"
                              required
                              value={row.netWeight}
                              onChange={(e) => {
                                handleUpdateQcRow(idx, 'netWeight', e.target.value);
                                setTimeout(() => {
                                  setQcForm(prev => {
                                    const sumObserved = prev.rows.reduce((sum, r) => sum + Number(r.netWeight || 0), 0);
                                    return { ...prev, quantityAsWritten: String(sumObserved) };
                                  });
                                }, 50);
                              }}
                              className={`w-full px-2 py-1 rounded-lg border text-xs font-bold ${darkMode ? 'bg-slate-850 border-slate-800 text-emerald-400' : 'bg-white border-slate-200 text-emerald-600'}`}
                            />
                          </td>

                          {/* Result */}
                          <td className="p-1">
                            <select
                              value={row.result}
                              onChange={(e) => handleUpdateQcRow(idx, 'result', e.target.value)}
                              className={`w-full px-1 py-1 rounded-lg border text-[11px] ${darkMode ? 'bg-slate-850 border-slate-800' : 'bg-white border-slate-200'}`}
                            >
                              <option value="Passed">Passed</option>
                              <option value="Failed">Failed</option>
                            </select>
                          </td>

                          {/* Assigned Bin */}
                          <td className="p-1">
                            <select
                              value={row.binId || ''}
                              onChange={(e) => handleUpdateQcRow(idx, 'binId', e.target.value)}
                              className={`w-full px-1 py-1 rounded-lg border text-[11px] ${darkMode ? 'bg-slate-850 border-slate-800' : 'bg-white border-slate-200'}`}
                            >
                              <option value="">-- Select Bin --</option>
                              {binLocations.map((bin: any) => (
                                <option key={bin.id} value={bin.id}>
                                  {bin.code} ({bin.name})
                                </option>
                              ))}
                            </select>
                          </td>

                          {/* Remarks */}
                          <td className="p-1">
                            <input
                              type="text"
                              value={row.remarks}
                              onChange={(e) => handleUpdateQcRow(idx, 'remarks', e.target.value)}
                              placeholder="Within parameter limits"
                              className={`w-full px-2 py-1 rounded-lg border text-xs ${darkMode ? 'bg-slate-850 border-slate-800' : 'bg-white border-slate-200'}`}
                            />
                          </td>

                          {/* Delete action */}
                          <td className="p-1 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteQcRow(idx)}
                              className="p-1 text-slate-700 dark:text-slate-400 hover:text-rose-400 transition-colors"
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

              {/* Bottom save/cancel buttons */}
              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800/20">
                <button 
                  type="button" 
                  onClick={() => setIsQcModalOpen(false)} 
                  disabled={isSubmittingQc}
                  className="px-4 py-2 rounded-xl border text-xs font-semibold hover:bg-slate-800/15 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmittingQc}
                  className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow hover:bg-emerald-500 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmittingQc ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Posting to Inventory...</span>
                    </>
                  ) : (
                    <span>Commit QC Inspection & Stock In</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
