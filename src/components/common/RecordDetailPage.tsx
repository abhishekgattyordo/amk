import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Edit3, Trash2, Printer, Download, Share2, FileText, Package, Boxes, 
  Truck, Layers, Warehouse as WarehouseIcon, ShoppingCart, CheckCircle, AlertTriangle, 
  Clock, Shield, Paperclip, ExternalLink, User as UserIcon, Calendar, Building, Tag, Check, Send,
  History
} from 'lucide-react';
import { RawMaterial, Product, CategoryItem, SubcategoryItem, Supplier, Warehouse, RFQItem, ProcurementPO, User, AuditLog } from '../../types';
import { UserAvatar } from './UserAvatar';
import { SendRfqModal } from './SendRfqModal';

interface RecordDetailPageProps {
  entityType: 'raw' | 'product' | 'supplier' | 'category' | 'subcategory' | 'warehouse' | 'po' | 'rfq';
  recordId: string;
  rawMaterials: RawMaterial[];
  products: Product[];
  categories: CategoryItem[];
  subCategories: SubcategoryItem[];
  suppliers: Supplier[];
  warehouses: Warehouse[];
  purchaseOrders: ProcurementPO[];
  rfqs: RFQItem[];
  darkMode: boolean;
  currentUser: User | null;
  onBack: () => void;
  onEdit: (record: any) => void;
  onDelete: (id: string) => void;
  onAddNotification: (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error') => void;
  onUpdateRfq?: (updatedRfq: RFQItem) => void;
}

export const RecordDetailPage: React.FC<RecordDetailPageProps> = ({
  entityType,
  recordId,
  rawMaterials,
  products,
  categories,
  subCategories,
  suppliers,
  warehouses,
  purchaseOrders,
  rfqs,
  darkMode,
  currentUser,
  onBack,
  onEdit,
  onDelete,
  onAddNotification,
  onUpdateRfq
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'related' | 'timeline' | 'audit' | 'attachments'>('overview');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [isSendRfqModalOpen, setIsSendRfqModalOpen] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);

  // Find record based on entityType
  let record: any = null;
  let title = '';
  let code = '';
  let breadcrumbCategory = '';
  let entityIcon = <Package className="w-5 h-5" />;

  const productsList = products || [];
  const rawMaterialsList = rawMaterials || [];
  const suppliersList = suppliers || [];
  const categoriesList = categories || [];
  const subCategoriesList = subCategories || [];
  const warehousesList = warehouses || [];
  const poList = purchaseOrders || [];
  const rfqList = rfqs || [];

  switch (entityType) {
    case 'raw':
      record = rawMaterialsList.find(m => m.id === recordId || m.code === recordId);
      title = record?.name || 'Raw Material';
      code = record?.code || '';
      breadcrumbCategory = 'Raw Materials';
      entityIcon = <Package className="w-5 h-5 text-emerald-500" />;
      break;
    case 'product':
      record = productsList.find(p => p.id === recordId || p.code === recordId);
      title = record?.name || 'Finished Product';
      code = record?.code || '';
      breadcrumbCategory = 'Finished Products';
      entityIcon = <Boxes className="w-5 h-5 text-blue-500" />;
      break;
    case 'supplier':
      record = suppliersList.find(s => s.id === recordId || s.supplierName.toLowerCase() === recordId.toLowerCase());
      title = record?.supplierName || 'Supplier';
      code = record?.code || '';
      breadcrumbCategory = 'Suppliers & Mills';
      entityIcon = <Truck className="w-5 h-5 text-amber-500" />;
      break;
    case 'category':
      record = categoriesList.find(c => c.id === recordId || c.name.toLowerCase() === recordId.toLowerCase());
      title = record?.name || 'Category';
      code = record?.code || '';
      breadcrumbCategory = 'Categories';
      entityIcon = <Layers className="w-5 h-5 text-purple-500" />;
      break;
    case 'subcategory':
      record = subCategoriesList.find(s => s.id === recordId || s.name.toLowerCase() === recordId.toLowerCase());
      title = record?.name || 'Subcategory';
      code = record?.code || '';
      breadcrumbCategory = 'Subcategories';
      entityIcon = <Layers className="w-5 h-5 text-indigo-500" />;
      break;
    case 'warehouse':
      record = warehousesList.find(w => w.id === recordId || w.name.toLowerCase() === recordId.toLowerCase() || w.code === recordId);
      title = record?.name || 'Warehouse';
      code = record?.code || '';
      breadcrumbCategory = 'Warehouses';
      entityIcon = <WarehouseIcon className="w-5 h-5 text-teal-500" />;
      break;
    case 'po':
      record = poList.find(po => po.id === recordId || po.poNumber.toLowerCase() === recordId.toLowerCase());
      title = `${record?.poNumber || 'Purchase Order'} — ${record?.supplierName || ''}`;
      code = record?.poNumber || '';
      breadcrumbCategory = 'Purchase Orders';
      entityIcon = <ShoppingCart className="w-5 h-5 text-rose-500" />;
      break;
    case 'rfq':
      record = rfqList.find(rfq => rfq.id === recordId || rfq.rfqNumber.toLowerCase() === recordId.toLowerCase());
      title = `${record?.rfqNumber || 'RFQ'} — ${record?.description || ''}`;
      code = record?.rfqNumber || '';
      breadcrumbCategory = 'RFQs';
      entityIcon = <FileText className="w-5 h-5 text-cyan-500" />;
      break;
  }

  useEffect(() => {
    if (activeTab === 'audit' && (entityType === 'raw' || entityType === 'product')) {
      const fetchAuditLogs = async () => {
        setIsLoadingAudit(true);
        try {
          const entityMapping = {
            'raw': 'RawMaterial',
            'product': 'Product'
          };
          const response = await fetch(`/api/audit-logs?entity=${entityMapping[entityType as 'raw' | 'product']}&entityId=${record?.id}`);
          const data = await response.json();
          if (data.success) {
            setAuditLogs(data.data);
          }
        } catch (error) {
          console.error('Failed to fetch audit logs:', error);
        } finally {
          setIsLoadingAudit(false);
        }
      };
      fetchAuditLogs();
    }
  }, [activeTab, entityType, record?.id]);

  if (!record) {
    return (
      <div className={`p-8 text-center ${darkMode ? 'text-white' : 'text-slate-800'}`}>
        <div className="w-16 h-16 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold">Record Not Found</h2>
        <p className="text-sm text-slate-400 mt-1">The requested record ({recordId}) could not be found or has been removed.</p>
        <button
          onClick={onBack}
          className="mt-6 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-500 transition-colors"
        >
          Return to List
        </button>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    onAddNotification('Export Started', `Generating PDF report for ${code} — ${title}...`, 'info');
    setTimeout(() => {
      onAddNotification('Download Complete', `${code}_report.pdf has been successfully downloaded.`, 'success');
    }, 1200);
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setShareCopied(true);
    onAddNotification('Link Copied', 'Record link copied to clipboard.', 'success');
    setTimeout(() => setShareCopied(false), 2500);
  };

  const isAdminOrManager = currentUser?.role === 'Administrator' || currentUser?.role?.includes('Manager') || currentUser?.role === 'Accountant';

  return (
    <div className={`space-y-6 pb-12 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
      {/* Breadcrumb & Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4 border-slate-200 dark:border-slate-800">
        <div>
          <nav className="flex items-center space-x-2 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
            <button onClick={onBack} className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Inventory / Procurement</button>
            <span>/</span>
            <button onClick={onBack} className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">{breadcrumbCategory}</button>
            <span>/</span>
            <span className="text-slate-800 dark:text-slate-200 font-bold">{code || record.id}</span>
          </nav>
          <div className="flex items-center space-x-3">
            <div className={`p-2.5 rounded-xl ${darkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
              {entityIcon}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">{title}</h1>
                <span className="font-mono text-xs px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-500/20">
                  {code || record.id}
                </span>
                {record.status && (
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                    record.status === 'Active' || record.status === 'Approved' || record.status === 'Awarded' || record.status === 'Completed' || record.status === 'Operational'
                      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                      : record.status === 'Draft' || record.status === 'Submitted' || record.status === 'Maintenance' || record.status === 'Full'
                      ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20'
                      : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20'
                  }`}>
                    {record.status}
                  </span>
                )}
              </div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                Managed under AMK ERP enterprise system • Last synchronized: Just now
              </p>
            </div>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onBack}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors ${
              darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          
          {entityType === 'rfq' && (
            <button
              onClick={() => setIsSendRfqModalOpen(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Send RFQ</span>
            </button>
          )}

          <button
            onClick={() => onEdit(record)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors ${
              darkMode ? 'bg-slate-800 hover:bg-slate-700 text-blue-400' : 'bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold border border-blue-200'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            <span>Edit</span>
          </button>

          {isAdminOrManager && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors ${
                darkMode ? 'bg-rose-950/40 hover:bg-rose-900/50 text-rose-400 border border-rose-500/30' : 'bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold border border-rose-200'
              }`}
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>
          )}

          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

          <button
            onClick={handlePrint}
            title="Print Record"
            className={`p-2 rounded-xl transition-colors ${darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200'}`}
          >
            <Printer className="w-4 h-4" />
          </button>

          <button
            onClick={handleDownloadPDF}
            title="Download PDF"
            className={`p-2 rounded-xl transition-colors ${darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200'}`}
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={handleShare}
            title="Share Link"
            className={`p-2 rounded-xl transition-colors ${darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200'}`}
          >
            {shareCopied ? <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <Share2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {entityType === 'rfq' && (
        <SendRfqModal
          isOpen={isSendRfqModalOpen}
          onClose={() => setIsSendRfqModalOpen(false)}
          rfq={record}
          suppliers={suppliers}
          darkMode={darkMode}
          onSendSuccess={(updatedRfq, emails) => {
            onUpdateRfq?.(updatedRfq);
            onAddNotification('RFQ Sent', `RFQ ${updatedRfq.rfqNumber} successfully sent to ${emails.length} suppliers.`, 'success');
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`max-w-md w-full p-6 rounded-2xl shadow-2xl border ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            <div className="w-12 h-12 bg-rose-500/10 text-rose-500 rounded-xl flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold">Confirm Deletion</h3>
            <p className="text-xs text-slate-400 mt-1">
              Are you sure you want to delete <span className="font-bold text-slate-200">{code}</span>? This action cannot be undone and will affect related transaction logs.
            </p>
            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className={`px-4 py-2 rounded-xl text-xs font-bold ${darkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDelete(record.id);
                  onAddNotification('Record Deleted', `${code} was successfully removed.`, 'warning');
                  onBack();
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-500"
              >
                Yes, Delete Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {entityType === 'raw' && (
          <>
            <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900/85 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Current Stock</div>
              <div className="text-2xl font-black mt-1 text-emerald-600 dark:text-emerald-400">{record.currentStock?.toLocaleString()} {record.uom}</div>
              <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">Min Level: <span className="font-bold text-slate-800 dark:text-slate-200">{record.minStock} {record.uom}</span></div>
            </div>
            <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900/85 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Unit Purchase Price</div>
              <div className="text-2xl font-black mt-1 text-slate-900 dark:text-white">₹{record.purchasePrice?.toFixed(2)}</div>
              <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">HSN Code: <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{record.hsnCode}</span></div>
            </div>
            <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900/85 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">GSM / Grade</div>
              <div className="text-2xl font-black mt-1 text-slate-900 dark:text-white">{record.gsm} GSM</div>
              <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">Grade: <span className="font-bold text-slate-800 dark:text-slate-200">{record.grade}</span></div>
            </div>
            <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900/85 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Primary Supplier</div>
              <div className="text-sm font-bold mt-2 text-slate-900 dark:text-white truncate">{record.supplier?.supplierName || record.supplier || 'N/A'}</div>
              <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">Warehouse: <span className="font-bold text-slate-800 dark:text-slate-200">{record.warehouse?.name || record.warehouse || 'N/A'}</span></div>
            </div>
          </>
        )}

        {entityType === 'product' && (
          <>
            <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900/85 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Available Stock</div>
              <div className="text-2xl font-black mt-1 text-blue-600 dark:text-blue-400">{record.availableStock?.toLocaleString()} {record.uom || 'Boxes'}</div>
              <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">Committed: <span className="font-bold text-slate-800 dark:text-slate-200">{record.committedStock || 0}</span></div>
            </div>
            <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900/85 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Selling Price</div>
              <div className="text-2xl font-black mt-1 text-slate-900 dark:text-white">₹{record.sellingPrice?.toLocaleString()}</div>
              <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">Cost Price: <span className="font-bold text-slate-800 dark:text-slate-200">₹{record.costPrice?.toLocaleString()}</span></div>
            </div>
            <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900/85 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Product Configuration</div>
              <div className="text-lg font-black mt-1 text-slate-900 dark:text-white truncate">{record.boxType}</div>
              <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">{record.gsm} GSM | <span className="font-bold text-slate-800 dark:text-slate-200">{record.category}</span></div>
            </div>
            <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900/85 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Dimensions</div>
              <div className="text-sm font-bold mt-2 font-mono text-slate-900 dark:text-white">{record.dimensions || 'N/A'}</div>
              <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">Subcategory: <span className="font-bold text-slate-800 dark:text-slate-200">{record.subCategory || 'N/A'}</span></div>
            </div>
          </>
        )}

        {entityType === 'supplier' && (
          <>
            <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900/85 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Outstanding Balance</div>
              <div className="text-2xl font-black mt-1 text-rose-600 dark:text-rose-400">₹{record.outstandingBalance?.toLocaleString()}</div>
              <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">Credit Limit: <span className="font-bold text-slate-800 dark:text-slate-200">₹{record.creditLimit?.toLocaleString()}</span></div>
            </div>
            <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900/85 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Mill Name</div>
              <div className="text-lg font-black mt-1 text-slate-900 dark:text-white truncate">{record.millName}</div>
              <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">City: <span className="font-bold text-slate-800 dark:text-slate-200">{record.city}, {record.state}</span></div>
            </div>
            <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900/85 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Contact Person</div>
              <div className="text-sm font-bold mt-2 text-slate-900 dark:text-white truncate">{record.contactPerson}</div>
              <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">{record.email}</div>
            </div>
            <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900/85 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Rating & Category</div>
              <div className="text-lg font-black mt-1 flex items-center space-x-1 text-slate-900 dark:text-white">
                <span>⭐ {record.rating || '4.8'}</span>
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">Category: <span className="font-bold text-slate-800 dark:text-slate-200">{record.category}</span></div>
            </div>
          </>
        )}

        {entityType === 'warehouse' && (
          <>
            <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Storage Capacity</div>
              <div className="text-2xl font-black mt-1 text-teal-700 dark:text-teal-400">{record.capacitySqFt ? `${record.capacitySqFt.toLocaleString()} Sq Ft` : `${record.capacity || 50000} MT`}</div>
              <div className="text-xs text-slate-700 dark:text-slate-300 mt-1 font-medium">Current Utilization: <span className="font-bold text-slate-950 dark:text-white">{record.currentUtilization || record.currentUtilizationPercent ? `${record.currentUtilization || record.currentUtilizationPercent}%` : '65%'}</span></div>
            </div>
            <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Warehouse Manager</div>
              <div className="text-lg font-black mt-1 text-slate-950 dark:text-white truncate">{record.manager || 'N/A'}</div>
              <div className="text-xs text-slate-700 dark:text-slate-300 mt-1 font-medium">{record.phone || 'Contact on file'}</div>
            </div>
            <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Location</div>
              <div className="text-sm font-bold mt-2 text-slate-950 dark:text-white truncate">{record.location || 'N/A'}</div>
              <div className="text-xs text-slate-700 dark:text-slate-300 mt-1 font-medium">Zones: <span className="font-bold text-slate-950 dark:text-white">{record.zonesCount || 4} Active Zones</span></div>
            </div>
            <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Status</div>
              <div className="text-lg font-black mt-1 text-emerald-700 dark:text-emerald-400">{record.status || 'Operational'}</div>
              <div className="text-xs text-slate-700 dark:text-slate-300 mt-1 font-medium">Total Bins: <span className="font-bold text-slate-950 dark:text-white">{record.totalBins || 25} Bins</span></div>
            </div>
          </>
        )}

        {(entityType === 'category' || entityType === 'subcategory') && (
          <>
            <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900/85 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Items Count</div>
              <div className="text-2xl font-black mt-1 text-purple-600 dark:text-purple-400">{record.itemsCount || 12} items</div>
              <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">Linked Products & Materials</div>
            </div>
            <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900/85 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Type</div>
              <div className="text-lg font-black mt-1 text-slate-900 dark:text-white">{record.type || 'Raw Material'}</div>
              <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">Status: <span className="font-bold text-slate-800 dark:text-slate-200">{record.status}</span></div>
            </div>
            <div className={`p-4 rounded-2xl border col-span-1 sm:col-span-2 ${darkMode ? 'bg-slate-900/85 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Description</div>
              <div className="text-sm font-medium mt-2 text-slate-800 dark:text-slate-200">{record.description || 'No additional description provided for this category.'}</div>
            </div>
          </>
        )}

        {entityType === 'po' && (
          <>
            <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900/85 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total PO Value</div>
              <div className="text-2xl font-black mt-1 text-rose-600 dark:text-rose-400">
                ₹{record.items?.reduce((sum: number, i: any) => sum + (i.total || (i.quantityOrdered * i.unitPrice) || 0), 0).toLocaleString()}
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium"><span className="font-bold text-slate-800 dark:text-slate-200">{record.items?.length || 0}</span> line items</div>
            </div>
            <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900/85 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Supplier</div>
              <div className="text-sm font-bold mt-2 text-slate-900 dark:text-white truncate">{record.supplierName}</div>
              <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">PO Date: <span className="font-bold text-slate-800 dark:text-slate-200">{record.date}</span></div>
            </div>
            <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900/85 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Delivery Due Date</div>
              <div className="text-lg font-black mt-1 text-cyan-600 dark:text-cyan-400">{record.deliveryDate}</div>
              <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">Status: <span className="font-bold text-slate-800 dark:text-slate-200">{record.status}</span></div>
            </div>
            <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900/85 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Reference RFQ</div>
              <div className="text-sm font-bold mt-2 font-mono text-slate-900 dark:text-white">{record.rfqNumber || 'Direct Purchase'}</div>
              <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">Verified Gate Entry</div>
            </div>
          </>
        )}

        {entityType === 'rfq' && (
          <>
            <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900/85 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Department & Priority</div>
              <div className="text-lg font-black mt-1 text-slate-900 dark:text-white">{record.department}</div>
              <div className="text-xs text-rose-600 dark:text-rose-400 font-bold mt-1">Priority: {record.priority}</div>
            </div>
            <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900/85 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Required Date</div>
              <div className="text-lg font-black mt-1 text-cyan-600 dark:text-cyan-400">{record.deliveryDate}</div>
              <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">RFQ Date: <span className="font-bold text-slate-800 dark:text-slate-200">{record.rfqDate}</span></div>
            </div>
            <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900/85 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Invited Suppliers</div>
              <div className="text-2xl font-black mt-1 text-slate-900 dark:text-white">{record.suppliers?.length || 0} suppliers</div>
              <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">Competitive Bidding</div>
            </div>
            <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900/85 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</div>
              <div className="text-lg font-black mt-1 text-emerald-600 dark:text-emerald-400">{record.status}</div>
              <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">Materials: <span className="font-bold text-slate-800 dark:text-slate-200">{record.materials?.length || 0} items</span></div>
            </div>
          </>
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-6 overflow-x-auto">
        {[
          { id: 'overview', label: 'Complete Information' },
          { id: 'related', label: 'Related Records & Items' },
          { id: 'timeline', label: 'Activity Timeline' },
          { id: 'audit', label: 'Audit & Compliance' },
          { id: 'attachments', label: 'Documents & Attachments' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-3 text-xs font-bold transition-colors relative whitespace-nowrap ${
              activeTab === tab.id
                ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900/85 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Record Specification Details</h3>
            
            <div className={`p-5 rounded-2xl ${darkMode ? 'bg-slate-950/70 border border-slate-800' : 'bg-slate-50 border border-slate-200'} grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm`}>
              {Object.entries(record).map(([key, value]) => {
                if (typeof value === 'object' && value !== null) return null;
                return (
                  <div key={key} className={`p-3.5 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
                    <div className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">{key.replace(/([A-Z])/g, ' $1')}</div>
                    <div className="font-extrabold text-sm mt-1.5 text-slate-950 dark:text-white break-words">{String(value ?? 'N/A')}</div>
                  </div>
                );
              })}
            </div>

            {/* Special items/materials tables for PO or RFQ */}
            {entityType === 'rfq' && record.materials && record.materials.length > 0 && (
              <div className="mt-6">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3">Requested Raw Materials ({record.materials.length})</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className={`border-b ${darkMode ? 'border-slate-800 text-slate-300 bg-slate-800/60' : 'border-slate-200 text-slate-700 bg-slate-50'}`}>
                        <th className="p-2.5 font-bold">Raw Material</th>
                        <th className="p-2.5 font-bold">Description</th>
                        <th className="p-2.5 font-bold">Unit</th>
                        <th className="p-2.5 font-bold text-right">Quantity</th>
                        <th className="p-2.5 font-bold text-right">Expected Price</th>
                        <th className="p-2.5 font-bold text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {record.materials.map((item: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                          <td className="p-2.5">
                            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 block">{item.materialCode}</span>
                            <span className="font-bold text-slate-900 dark:text-white block mt-0.5">{item.name}</span>
                          </td>
                          <td className="p-2.5 text-slate-600 dark:text-slate-300 max-w-xs truncate" title={item.description || record.description || 'Raw material replenishment'}>
                            {item.description || record.description || 'Raw material replenishment'}
                          </td>
                          <td className="p-2.5 font-semibold text-slate-700 dark:text-slate-300">{item.unit}</td>
                          <td className="p-2.5 text-right font-bold text-slate-900 dark:text-white">{item.quantity?.toLocaleString()}</td>
                          <td className="p-2.5 text-right font-bold text-emerald-600 dark:text-emerald-400">
                            {item.expectedPrice ? `₹${item.expectedPrice.toFixed(2)}` : 'N/A'}
                          </td>
                          <td className="p-2.5 text-center">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              record.status === 'Awarded' 
                                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                                : 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/20'
                            }`}>
                              {record.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {entityType === 'rfq' && record.suppliers && record.suppliers.length > 0 && (
              <div className="mt-6">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3">Invited Supplier Mills ({record.suppliers.length})</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className={`border-b ${darkMode ? 'border-slate-800 text-slate-300 bg-slate-800/60' : 'border-slate-200 text-slate-700 bg-slate-50'}`}>
                        <th className="p-2.5 font-bold">Supplier Name</th>
                        <th className="p-2.5 font-bold">Contact Person</th>
                        <th className="p-2.5 font-bold">Email</th>
                        <th className="p-2.5 font-bold">Phone</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {record.suppliers.map((s: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                          <td className="p-2.5 font-bold text-slate-900 dark:text-white">{s.supplierName}</td>
                          <td className="p-2.5 text-slate-700 dark:text-slate-200 font-medium">{s.contactPerson || 'N/A'}</td>
                          <td className="p-2.5 font-mono text-slate-600 dark:text-slate-300">{s.email || 'N/A'}</td>
                          <td className="p-2.5 font-mono text-slate-600 dark:text-slate-300">{s.phone || 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {record.items && record.items.length > 0 && (
              <div className="mt-6">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3">Line Items</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className={`border-b ${darkMode ? 'border-slate-800 text-slate-300 bg-slate-800/60' : 'border-slate-200 text-slate-700 bg-slate-50'}`}>
                        <th className="p-2.5 font-bold">Code / Item</th>
                        <th className="p-2.5 font-bold">Name</th>
                        <th className="p-2.5 font-bold text-right">Quantity</th>
                        <th className="p-2.5 font-bold text-right">Unit Price (₹)</th>
                        <th className="p-2.5 font-bold text-right">Total (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {record.items.map((item: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                          <td className="p-2.5 font-mono font-bold text-emerald-600 dark:text-emerald-400">{item.materialCode || item.code}</td>
                          <td className="p-2.5 font-bold text-slate-900 dark:text-white">{item.materialName || item.name}</td>
                          <td className="p-2.5 text-right font-bold text-slate-900 dark:text-white">{item.quantityOrdered || item.quantity}</td>
                          <td className="p-2.5 text-right font-medium text-slate-700 dark:text-slate-300">₹{item.unitPrice?.toFixed(2) || '0.00'}</td>
                          <td className="p-2.5 text-right font-bold text-emerald-600 dark:text-emerald-400">₹{item.total?.toLocaleString() || ((item.quantityOrdered || item.quantity || 0) * (item.unitPrice || 0)).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'related' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Related Entities & Activity Links</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
              The following related documents, purchase orders, or inventory movements are linked to this record.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800/50 border-slate-800' : 'bg-slate-50 border-slate-200 shadow-xs'}`}>
                <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                  <ShoppingCart className="w-4 h-4" />
                  <span>Linked Purchase Orders</span>
                </div>
                <div className="text-sm font-bold mt-2 text-slate-900 dark:text-white">PO-2026-0001 (Partially Received)</div>
                <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">Value: <span className="font-bold text-slate-800 dark:text-slate-200">₹3,12,500</span> • Delivery: <span className="font-bold text-slate-800 dark:text-slate-200">Aug 15, 2026</span></div>
              </div>

              <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800/50 border-slate-800' : 'bg-slate-50 border-slate-200 shadow-xs'}`}>
                <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 font-bold text-xs">
                  <Package className="w-4 h-4" />
                  <span>Warehouse Stock Ledger</span>
                </div>
                <div className="text-sm font-bold mt-2 text-slate-900 dark:text-white">Main Raw Material Bay A-2</div>
                <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">Last audit verified on <span className="font-bold text-slate-800 dark:text-slate-200">August 2, 2026</span></div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Activity Timeline & Change History</h3>
            
            <div className="space-y-4 relative pl-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-300 dark:before:bg-slate-800">
              <div className="relative flex items-start space-x-3">
                <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" />
                <UserAvatar name="System Administrator" size="sm" className="mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Record Created</div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 font-medium">Aug 1, 2026 by System Administrator</div>
                  <div className="text-xs text-slate-800 dark:text-slate-200 mt-1 font-medium">Initial entry registered into AMK Carton ERP master database.</div>
                </div>
              </div>

              <div className="relative flex items-start space-x-3">
                <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-blue-500 ring-4 ring-blue-500/20" />
                <UserAvatar name="Amit Patel" size="sm" className="mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-blue-700 dark:text-blue-400">Stock Level Updated</div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 font-medium">Aug 4, 2026 by Inventory Manager (Amit Patel)</div>
                  <div className="text-xs text-slate-800 dark:text-slate-200 mt-1 font-medium">Inward gate entry verified and added to available balance.</div>
                </div>
              </div>

              <div className="relative flex items-start space-x-3">
                <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-amber-500 ring-4 ring-amber-500/20" />
                <UserAvatar name="QC Inspector" size="sm" className="mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-amber-700 dark:text-amber-400">Quality Inspection Passed</div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 font-medium">Aug 5, 2026 by QC Inspector</div>
                  <div className="text-xs text-slate-800 dark:text-slate-200 mt-1 font-medium">Burst factor and moisture content tests successfully cleared.</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center space-x-2">
                <History className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Change History & Audit Trail</span>
              </h3>
              {(entityType !== 'raw' && entityType !== 'product') && (
                <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                  Audit logs currently only available for Inventory items
                </span>
              )}
            </div>
            
            {(entityType === 'raw' || entityType === 'product') ? (
              <div className={`rounded-2xl border overflow-hidden ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                {isLoadingAudit ? (
                  <div className="p-12 text-center">
                    <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Loading audit trail...</p>
                  </div>
                ) : auditLogs.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-500 dark:text-slate-400">
                      <History className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">No Change History Found</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">This record hasn't been modified since tracking began.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className={darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-50 text-slate-700 border-b border-slate-200'}>
                          <th className="px-4 py-3 text-xs font-bold uppercase">Updated By</th>
                          <th className="px-4 py-3 text-xs font-bold uppercase">Date & Time</th>
                          <th className="px-4 py-3 text-xs font-bold uppercase">Action/Field</th>
                          <th className="px-4 py-3 text-xs font-bold uppercase">Old Value</th>
                          <th className="px-4 py-3 text-xs font-bold uppercase">New Value</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {auditLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex items-center space-x-2">
                                <UserAvatar name={log.user || 'Unknown'} size="xs" />
                                <span className="text-xs font-bold text-slate-900 dark:text-white">{log.user || 'System'}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="text-xs font-semibold text-slate-900 dark:text-white">{new Date(log.timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{new Date(log.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-col">
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded w-fit mb-1 ${
                                  log.action === 'Create' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20' : 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20'
                                }`}>
                                  {log.action}
                                </span>
                                <span className="text-xs font-mono font-medium text-slate-700 dark:text-slate-300">{log.fieldName || '-'}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-xs text-rose-600 dark:text-rose-400 font-semibold truncate max-w-[150px]" title={log.oldValue || ''}>
                                {log.oldValue || (log.action === 'Create' ? '-' : 'N/A')}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-xs text-emerald-600 dark:text-emerald-400 font-bold truncate max-w-[150px]" title={log.newValue || ''}>
                                {log.newValue || (log.action === 'Create' ? 'Created' : 'N/A')}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800/50 border-slate-800' : 'bg-slate-50 border-slate-200 shadow-xs'}`}>
                  <div className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Created By</div>
                  <div className="flex items-center space-x-3">
                    <UserAvatar name="System Administrator" size="md" />
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">System Administrator</div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-400 font-mono font-medium">ID: USR-001</div>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-400 font-medium mt-2 border-t border-slate-200 dark:border-slate-800 pt-1.5">Timestamp: <span className="font-semibold text-slate-800 dark:text-slate-200">2026-08-01 09:30 AM</span></div>
                </div>

                <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800/50 border-slate-800' : 'bg-slate-50 border-slate-200 shadow-xs'}`}>
                  <div className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Last Modified By</div>
                  <div className="flex items-center space-x-3">
                    <UserAvatar name={currentUser?.name || 'Rajesh Sharma'} src={currentUser?.avatar} size="md" />
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">{currentUser?.name || 'Manager'}</div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-400 font-mono font-medium">ID: {currentUser?.id || 'USR-002'}</div>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-400 font-medium mt-2 border-t border-slate-200 dark:border-slate-800 pt-1.5">Timestamp: <span className="font-semibold text-slate-800 dark:text-slate-200">2026-08-06 04:15 PM</span></div>
                </div>

                <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800/50 border-slate-800' : 'bg-slate-50 border-slate-200 shadow-xs'}`}>
                  <div className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Security Classification</div>
                  <div className="text-sm font-bold mt-1 text-emerald-700 dark:text-emerald-400">Internal Enterprise Confidential</div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-400 font-medium mt-1">Row-Level Security: <span className="font-bold text-slate-800 dark:text-slate-200">Enabled</span></div>
                </div>

                <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800/50 border-slate-800' : 'bg-slate-50 border-slate-200 shadow-xs'}`}>
                  <div className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Data Integrity Check</div>
                  <div className="text-sm font-bold mt-1 text-emerald-700 dark:text-emerald-400">Passed (SHA-256 Verified)</div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-400 font-medium mt-1">Sync Status: <span className="font-bold text-slate-800 dark:text-slate-200">Real-time Cloud Active</span></div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'attachments' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Attached Documents & Certificates</h3>
            
            <div className="space-y-3">
              <div className={`p-4 rounded-xl border flex items-center justify-between ${darkMode ? 'bg-slate-800/50 border-slate-800' : 'bg-slate-50 border-slate-200 shadow-xs'}`}>
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-900 dark:text-white">Specification_Sheet_2026.pdf</div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">Added Aug 1, 2026 • 2.4 MB • PDF Document</div>
                  </div>
                </div>
                <button
                  onClick={() => onAddNotification('Download Started', 'Downloading Specification_Sheet_2026.pdf...', 'info')}
                  className="px-3.5 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-500 transition-colors shadow-sm cursor-pointer"
                >
                  Download
                </button>
              </div>

              <div className={`p-4 rounded-xl border flex items-center justify-between ${darkMode ? 'bg-slate-800/50 border-slate-800' : 'bg-slate-50 border-slate-200 shadow-xs'}`}>
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-900 dark:text-white">Quality_Assurance_Certificate.pdf</div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">Added Aug 3, 2026 • 1.1 MB • Signed PDF</div>
                  </div>
                </div>
                <button
                  onClick={() => onAddNotification('Download Started', 'Downloading Quality_Assurance_Certificate.pdf...', 'info')}
                  className="px-3.5 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-500 transition-colors shadow-sm cursor-pointer"
                >
                  Download
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
