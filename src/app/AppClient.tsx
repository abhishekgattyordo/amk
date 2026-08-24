'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { User, ModuleType, RawMaterial, Product, CategoryItem, SubcategoryItem, Supplier, Warehouse, BinLocationItem, InventoryTransaction, NotificationItem, ActivityLog, RFQItem, ProcurementPO, NotificationSettingRule } from '../types';
import { WarehouseDetailPage } from '../components/inventory/WarehouseDetailPage';
import { 
  INITIAL_USERS, 
  INITIAL_RAW_MATERIALS, 
  INITIAL_PRODUCTS, 
  INITIAL_CATEGORIES, 
  INITIAL_SUBCATEGORIES,
  INITIAL_SUPPLIERS, 
  INITIAL_WAREHOUSES, 
  INITIAL_TRANSACTIONS, 
  INITIAL_NOTIFICATIONS, 
  INITIAL_ACTIVITIES,
  DEFAULT_PROCUREMENT_NOTIFICATION_RULES
} from '../data/initialData';
import { NotificationSettingsModal } from '../components/notifications/NotificationSettingsModal';
import { EmailToastContainer, EmailToastNotice } from '../components/notifications/EmailToast';
import { LoginScreen } from '../components/auth/LoginScreen';
import { Navbar } from '../components/common/Navbar';
import { Sidebar } from '../components/common/Sidebar';
import { DashboardView } from '../components/dashboard/DashboardView';
import { RawMaterialsView } from '../components/inventory/RawMaterialsView';
import { ProductsView } from '../components/inventory/ProductsView';
import { CategoriesView } from '../components/inventory/CategoriesView';
import { SuppliersView } from '../components/inventory/SuppliersView';
import { WarehousesView } from '../components/inventory/WarehousesView';
import { TransactionsView } from '../components/inventory/TransactionsView';
import { StockManagementView } from '../components/inventory/StockManagementView';
import { ProcurementModule } from '../components/procurement/ProcurementModule';
import { ProductionModule } from '../components/production/ProductionModule';
import { SalesModule } from '../components/sales/SalesModule';
import { AccountsModule } from '../components/accounts/AccountsModule';
import { ReportsModule } from '../components/reports/ReportsModule';
import { SettingsModule } from '../components/settings/SettingsModule';
import { UserManagementModule } from '../components/user-management/UserManagementModule';
import { AdminExcelView } from '../components/admin/AdminExcelView';
import { RecordDetailPage } from '../components/common/RecordDetailPage';
import { ChangeHistoryPage } from '../components/common/ChangeHistoryPage';
import { RecycleBinPage } from '../components/common/RecycleBinPage';
import { Search, X, Package, Boxes, Truck, Layers, Building2, ShoppingCart, FileText, Warehouse as WarehouseIcon, ShieldAlert, Users, ArrowLeftRight } from 'lucide-react';
import { ErrorBoundary } from '../components/common/ErrorBoundary';

interface AppClientProps {
  initialModule: ModuleType;
}

export default function AppClient({ initialModule }: AppClientProps) {
  const router = useRouter();
  const params = useParams();
  const urlModule = (params?.tab || params?.module) as ModuleType;
  const currentModule = urlModule || initialModule || 'dashboard';

  const [currentUser, setCurrentUser] = useState<User | null>(INITIAL_USERS[0]);
  const [activeModule, setActiveModuleState] = useState<ModuleType>(currentModule);
  const [darkMode, setDarkMode] = useState(false);
  const [activeCompany, setActiveCompany] = useState('AMK Carton Mills Ltd - HQ');
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const [globalSearchText, setGlobalSearchText] = useState('');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // ERP State
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [subCategories, setSubCategories] = useState<SubcategoryItem[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [binLocations, setBinLocations] = useState<BinLocationItem[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [notificationRules, setNotificationRules] = useState<NotificationSettingRule[]>(DEFAULT_PROCUREMENT_NOTIFICATION_RULES);
  const [emailToasts, setEmailToasts] = useState<EmailToastNotice[]>([]);
  const [isNotificationSettingsOpen, setIsNotificationSettingsOpen] = useState(false);

  const [purchaseOrders, setPurchaseOrders] = useState<ProcurementPO[]>([]);
  const [rfqs, setRfqs] = useState<RFQItem[]>([]);
  const loadedApisRef = useRef<Set<string>>(new Set());
  const inFlightApisRef = useRef<Map<string, Promise<any>>>(new Map());
  const hasSyncedUserRef = useRef<boolean>(false);

  const fetchApiData = async (endpoint: string): Promise<any> => {
    if (loadedApisRef.current.has(endpoint)) {
      return { api: endpoint, success: true, cached: true };
    }

    if (inFlightApisRef.current.has(endpoint)) {
      return inFlightApisRef.current.get(endpoint);
    }

    const promise = (async () => {
      try {
        const token = typeof window !== 'undefined' ? (localStorage.getItem('erp_token') || '') : '';
        const storedUserStr = typeof window !== 'undefined' ? localStorage.getItem('erp_currentUser') : null;
        let email = currentUser?.email || '';
        if (!email && storedUserStr) {
          try {
            const parsed = JSON.parse(storedUserStr);
            email = parsed.email || '';
          } catch {}
        }

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        if (email) headers['x-user-email'] = email;

        const res = await fetch(endpoint, {
          headers,
          credentials: 'include',
        });

        const data = await res.json();
        const isSuccess = data.success ?? true;

        if (isSuccess) {
          loadedApisRef.current.add(endpoint);
        }

        return { api: endpoint, success: isSuccess, data: data.data || data };
      } catch (err) {
        console.error(`Error fetching ${endpoint}:`, err);
        return { api: endpoint, success: false, data: [] };
      } finally {
        inFlightApisRef.current.delete(endpoint);
      }
    })();

    inFlightApisRef.current.set(endpoint, promise);
    return promise;
  };

  useEffect(() => {
    let isCancelled = false;

    async function loadDataForActiveModule() {
      const getRequiredApis = (mod: ModuleType): string[] => {
        const req = new Set<string>();

        switch (mod) {
          case 'dashboard':
            req.add('/api/raw-materials');
            req.add('/api/products');
            req.add('/api/suppliers');
            req.add('/api/warehouses');
            break;

          case 'inventory_raw':
            req.add('/api/raw-materials');
            req.add('/api/suppliers');
            req.add('/api/warehouses');
            req.add('/api/categories');
            req.add('/api/subcategories');
            break;

          case 'inventory_products':
            req.add('/api/products');
            req.add('/api/warehouses');
            req.add('/api/categories');
            req.add('/api/subcategories');
            break;

          case 'inventory_categories':
            req.add('/api/categories');
            req.add('/api/subcategories');
            break;

          case 'inventory_suppliers':
            req.add('/api/suppliers');
            break;

          case 'inventory_warehouses':
            req.add('/api/warehouses');
            req.add('/api/bins');
            break;

          case 'inventory_transactions':
            req.add('/api/stock-movements');
            req.add('/api/warehouses');
            req.add('/api/raw-materials');
            req.add('/api/products');
            break;

          case 'inventory_stock':
            req.add('/api/raw-materials');
            break;

          case 'procurement':
          case 'procurement_dashboard':
            req.add('/api/purchase-orders');
            req.add('/api/rfqs');
            req.add('/api/suppliers');
            req.add('/api/raw-materials');
            req.add('/api/warehouses');
            req.add('/api/bins');
            break;

          case 'procurement_rfq':
            req.add('/api/rfqs');
            req.add('/api/suppliers');
            req.add('/api/raw-materials');
            break;

          case 'procurement_quotes':
            req.add('/api/rfqs');
            req.add('/api/suppliers');
            break;

          case 'procurement_po':
            req.add('/api/purchase-orders');
            req.add('/api/suppliers');
            req.add('/api/warehouses');
            req.add('/api/raw-materials');
            break;

          case 'procurement_gate_entry':
          case 'procurement_reel_inward':
          case 'procurement_inward':
            req.add('/api/purchase-orders');
            req.add('/api/suppliers');
            req.add('/api/warehouses');
            req.add('/api/bins');
            req.add('/api/gate-entries');
            req.add('/api/reel-inwards');
            break;

          case 'procurement_qc':
            req.add('/api/purchase-orders');
            req.add('/api/suppliers');
            req.add('/api/warehouses');
            req.add('/api/bins');
            break;

          case 'production':
            req.add('/api/raw-materials');
            req.add('/api/products');
            req.add('/api/warehouses');
            break;

          case 'sales':
            req.add('/api/products');
            req.add('/api/warehouses');
            break;

          case 'reports':
            req.add('/api/raw-materials');
            req.add('/api/products');
            req.add('/api/suppliers');
            req.add('/api/purchase-orders');
            break;

          case 'user_management':
            req.add('/api/users');
            req.add('/api/roles');
            break;

          case 'recycle_bin':
            req.add('/api/recycle-bin');
            break;

          case 'admin_excel':
            req.add('/api/raw-materials');
            req.add('/api/products');
            req.add('/api/suppliers');
            req.add('/api/warehouses');
            req.add('/api/categories');
            req.add('/api/subcategories');
            req.add('/api/bins');
            break;

          default:
            break;
        }

        return Array.from(req);
      };

      const requiredApis = getRequiredApis(activeModule);
      const apisToFetch = requiredApis.filter(api => !loadedApisRef.current.has(api));

      if (apisToFetch.length === 0) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      const fetchPromises = apisToFetch.map(api => fetchApiData(api));
      const results = await Promise.all(fetchPromises);

      if (isCancelled) return;

      results.forEach(res => {
        if (!res || !res.success || res.cached) return;

        if (res.api === '/api/bins' && Array.isArray(res.data)) {
          setBinLocations(res.data.map((bin: any) => ({
            id: bin.id,
            code: bin.code,
            name: bin.name,
            warehouseId: bin.warehouseId,
            type: bin.type || 'Storage',
            status: bin.status || 'Active',
            createdAt: bin.createdAt ? bin.createdAt.replace('T', ' ').substring(0, 16) : new Date().toISOString().replace('T', ' ').substring(0, 16)
          })));
        } else if (res.api === '/api/subcategories' && Array.isArray(res.data)) {
          setSubCategories(res.data.map((sub: any) => ({
            id: sub.id,
            code: sub.code,
            name: sub.name,
            parentCategoryId: sub.categoryId,
            description: sub.description || '',
            status: sub.status || 'Active',
            createdAt: sub.createdAt ? sub.createdAt.replace('T', ' ').substring(0, 16) : new Date().toISOString().replace('T', ' ').substring(0, 16)
          })));
        } else if (res.api === '/api/categories' && Array.isArray(res.data)) {
          setCategories(res.data.map((c: any) => ({
            id: c.id,
            code: c.code,
            name: c.name,
            type: c.type,
            description: c.description || '',
            itemsCount: c.itemsCount || 0,
            status: c.status || 'Active',
            createdAt: c.createdAt ? c.createdAt.replace('T', ' ').substring(0, 16) : new Date().toISOString().replace('T', ' ').substring(0, 16)
          })));
        } else if (res.api === '/api/suppliers' && Array.isArray(res.data)) {
          setSuppliers(res.data.map((s: any) => ({
            id: s.id,
            supplierName: s.supplierName,
            millName: s.millName || '',
            category: s.category || '',
            rawMaterials: s.rawMaterials || []
          })));
        } else if (res.api === '/api/raw-materials' && Array.isArray(res.data)) {
          setRawMaterials(res.data);
        } else if (res.api === '/api/products' && Array.isArray(res.data)) {
          setProducts(res.data);
        } else if (res.api === '/api/warehouses' && Array.isArray(res.data)) {
          setWarehouses(res.data);
        } else if (res.api === '/api/purchase-orders' && Array.isArray(res.data)) {
          setPurchaseOrders(res.data.map((po: any) => ({
            ...po,
            supplierName: po.supplier?.supplierName || po.supplierName || 'Unknown Supplier'
          })));
        } else if (res.api === '/api/rfqs' && Array.isArray(res.data)) {
          setRfqs(res.data);
        } else if (res.api === '/api/stock-movements' && Array.isArray(res.data)) {
          setTransactions(res.data.map((t: any) => ({
            id: t.id,
            transactionNumber: t.transactionNumber || `TRX-${t.id}`,
            itemCode: t.itemCode || t.rawMaterial?.code || t.product?.code || '',
            itemName: t.itemName || t.rawMaterial?.name || t.product?.name || '',
            itemType: t.itemType || 'Raw Material',
            warehouse: t.warehouse?.name || '',
            destinationWarehouse: t.destinationWarehouse?.name || undefined,
            quantity: t.quantity,
            previousStock: t.previousStock,
            currentStock: t.currentStock,
            transactionType: t.transactionType,
            user: t.user || 'System User',
            date: t.date || (t.createdAt ? t.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]),
            time: t.time || (t.createdAt ? t.createdAt.split('T')[1]?.substring(0, 5) : new Date().toTimeString().substring(0, 5)),
            reason: t.reason || '',
            remarks: t.remarks || '',
            referenceNumber: t.referenceNumber || undefined,
            referenceType: t.referenceType || undefined
          })));
        }
      });

      setIsLoading(false);
    }

    loadDataForActiveModule();

    return () => {
      isCancelled = true;
    };
  }, [activeModule]);

  const handleTriggerEventNotification = (
    eventKey: 'rfq_created' | 'rfq_sent' | 'quote_received' | 'po_created' | 'po_approved' | 'po_rejected' | 'goods_received' | 'po_completed',
    details: { title: string; message: string; poNumber?: string; rfqNumber?: string; supplierName?: string; recipientEmail?: string }
  ) => {
    const rule = notificationRules.find(r => r.eventKey === eventKey);
    const ruleInApp = rule ? rule.inAppEnabled : true;
    const ruleEmail = rule ? rule.emailEnabled : true;
    const rulePriority = rule ? rule.priority : 'Info';
    const ruleRecipients = rule ? rule.recipients : 'Purchase Manager';

    const targetEmail = details.recipientEmail || 'sunita.menon@amkerp.com';

    if (ruleInApp) {
      const notifType = rulePriority === 'Error' ? 'alert' : rulePriority === 'Warning' ? 'warning' : rulePriority === 'Success' ? 'success' : 'info';
      const newNotif: NotificationItem = {
        id: `NOTIF-${Date.now()}-${Math.floor(Math.random()*1000)}`,
        title: details.title,
        message: details.message,
        type: notifType,
        time: 'Just now',
        read: false,
        module: 'Procurement',
        priority: rulePriority,
        recipientRole: ruleRecipients,
        emailSent: ruleEmail,
        emailRecipient: targetEmail
      };
      setNotifications(prev => [newNotif, ...prev]);
    }

    if (ruleEmail) {
      const newToast: EmailToastNotice = {
        id: `EMAIL-${Date.now()}-${Math.floor(Math.random()*1000)}`,
        recipient: targetEmail,
        subject: `[AMK ERP] ${details.title} - ${details.poNumber || details.rfqNumber || 'Procurement Alert'}`,
        preview: details.message,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setEmailToasts(prev => [newToast, ...prev]);

      setTimeout(() => {
        setEmailToasts(prev => prev.filter(t => t.id !== newToast.id));
      }, 6000);
    }
  };

  const handleUpdateNotificationRule = (updatedRule: NotificationSettingRule) => {
    setNotificationRules(prev => prev.map(r => r.id === updatedRule.id ? updatedRule : r));
  };

  const handleResetNotificationRules = () => {
    setNotificationRules(DEFAULT_PROCUREMENT_NOTIFICATION_RULES);
  };

  const fetchNotificationsFromDb = async () => {
    if (!currentUser?.id) return;
    try {
      const res = await fetch(`/api/notifications?userId=${currentUser.id}&recipientRole=${currentUser.role || ''}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setNotifications(data.data.map((n: any) => ({
          id: n.id,
          title: n.title,
          message: n.message,
          time: n.time || new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: n.type || 'info',
          priority: n.priority || 'Info',
          read: n.read || false,
          module: n.module || undefined,
          recipientRole: n.recipientRole || undefined,
          emailSent: n.emailSent || false,
          emailRecipient: n.emailRecipient || undefined,
          entityId: n.entityId || undefined,
          entityType: n.entityType || undefined
        })));
      }
    } catch (err) {
      console.error('Failed to fetch notifications from DB:', err);
    }
  };

  const handleMarkNotificationRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    try {
      await fetch(`/api/notifications?id=${id}`, { method: 'PUT' });
    } catch (err) {
      console.error('Failed to mark notification as read in DB:', err);
    }
  };

  const handleNotificationClick = (notif: NotificationItem) => {
    if (notif.entityType === 'po' && notif.entityId) {
      setSelectedMaterialId(null);
      setSelectedProductId(null);
      setSelectedSupplierId(null);
      setSelectedCategoryId(null);
      setSelectedSubcategoryId(null);
      setSelectedWarehouseId(null);
      setSelectedRfqId(null);
      setSelectedPoId(notif.entityId);
      setActiveModule('procurement_po');
    }
  };

  useEffect(() => {
    if (!currentUser?.id) return;
    fetchNotificationsFromDb();
    const interval = setInterval(fetchNotificationsFromDb, 5000);
    return () => clearInterval(interval);
  }, [currentUser?.id]);



  // Selection states for opening detail views from Global Search
  const [selectedMaterialId, setSelectedMaterialId] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string | null>(null);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | null>(null);
  const [selectedPoId, setSelectedPoId] = useState<string | null>(null);
  const [selectedRfqId, setSelectedRfqId] = useState<string | null>(null);
  const [selectedHistory, setSelectedHistory] = useState<{ entity: string, entityId: string, entityName?: string } | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      const parts = path.split('/').filter(Boolean);
      if (path.includes('/history')) {
        if (parts[0] === 'inventory' && parts[3] === 'history') {
          const entityMap: Record<string, string> = {
            'raw-materials': 'RawMaterial',
            'products': 'Product',
          };
          setSelectedHistory({
            entity: entityMap[parts[1]] || 'RawMaterial',
            entityId: parts[2]
          });
        } else if (parts[0] === 'history') {
          setSelectedHistory({
            entity: parts[1] || 'Record',
            entityId: parts[2] || parts[1]
          });
        }
      }
    }
  }, []);
    const [searchSelectedIndex, setSearchSelectedIndex] = useState(0);

  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const query = globalSearchText.trim().toLowerCase();

  useEffect(() => {
    if (!globalSearchText.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const token = typeof window !== 'undefined' ? (localStorage.getItem('erp_token') || '') : '';
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        if (currentUser?.email) headers['x-user-email'] = currentUser.email;

        const res = await fetch(`/api/search?q=${encodeURIComponent(globalSearchText)}`, {
          signal: controller.signal,
          headers,
          credentials: 'include'
        });
        const data = await res.json();
        if (data.success && data.data?.results) {
          setSearchResults(data.data.results);
        } else {
          setSearchResults([]);
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Global search error:', err);
          setSearchResults([]);
        }
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [globalSearchText, currentUser]);

  function highlightMatch(text: string, q: string) {
    if (!q || !text) return text;
    const parts = String(text).split(new RegExp(`(${q})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === q.toLowerCase() ? (
            <span key={i} className="bg-emerald-500/20 text-emerald-400 font-bold px-0.5 rounded">{part}</span>
          ) : (
            part
          )
        )}
      </span>
    );
  }

  const handleSelectResult = (item: any) => {
    setShowGlobalSearch(false);
    setGlobalSearchText('');
    setSearchResults([]);
    
    // Reset all selection IDs first
    setSelectedMaterialId(null);
    setSelectedProductId(null);
    setSelectedSupplierId(null);
    setSelectedCategoryId(null);
    setSelectedSubcategoryId(null);
    setSelectedWarehouseId(null);
    setSelectedPoId(null);
    setSelectedRfqId(null);

    if (item.module === 'raw-materials') {
      setSelectedMaterialId(item.id);
      setActiveModuleState('inventory_raw');
    } else if (item.module === 'products') {
      setSelectedProductId(item.id);
      setActiveModuleState('inventory_products');
    } else if (item.module === 'suppliers') {
      setSelectedSupplierId(item.id);
      setActiveModuleState('inventory_suppliers');
    } else if (item.module === 'categories' || item.module === 'subcategories') {
      setSelectedCategoryId(item.id);
      setActiveModuleState('inventory_categories');
    } else if (item.module === 'warehouses') {
      setSelectedWarehouseId(item.id);
      setActiveModuleState('inventory_warehouses');
    } else if (item.module === 'purchase-orders') {
      setSelectedPoId(item.id);
      setActiveModuleState('procurement_po');
    } else if (item.module === 'rfqs') {
      setSelectedRfqId(item.id);
      setActiveModuleState('procurement_rfq');
    } else if (item.module === 'stock-movements') {
      setActiveModuleState('inventory_transactions');
    } else if (item.module === 'users') {
      setActiveModuleState('user_management');
    } else if (item.route) {
      setActiveModuleState(item.route as any);
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (searchResults.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSearchSelectedIndex(prev => (prev + 1) % searchResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSearchSelectedIndex(prev => (prev - 1 + searchResults.length) % searchResults.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (searchResults[searchSelectedIndex]) {
        handleSelectResult(searchResults[searchSelectedIndex]);
      }
    }
  };

  const [isStateLoaded, setIsStateLoaded] = useState(false);

  // Load state from localStorage on initial client mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedUser = localStorage.getItem('erp_currentUser');
        const storedToken = localStorage.getItem('erp_token');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          setCurrentUser(parsed);
          
          const headers: Record<string, string> = {};
          if (storedToken || parsed.token) {
            headers['Authorization'] = `Bearer ${storedToken || parsed.token}`;
          }
          if (parsed.email) {
            headers['x-user-email'] = parsed.email;
          }

          if (!hasSyncedUserRef.current && parsed.email) {
            hasSyncedUserRef.current = true;
            // Dynamically sync and refresh roles/permissions from database
            fetch(`/api/users?email=${encodeURIComponent(parsed.email)}`, {
              headers,
              credentials: 'include',
            })
              .then(r => r.json())
              .then(res => {
                if (res.success && res.data) {
                  const refreshedUser = {
                    ...parsed,
                    id: res.data.id || parsed.id,
                    name: res.data.name || parsed.name,
                    role: res.data.role?.name || res.data.role || parsed.role,
                    permissions: res.data.role?.permissions?.map((p: any) => p.name) || parsed.permissions || [],
                  };
                  setCurrentUser(refreshedUser);
                  localStorage.setItem('erp_currentUser', JSON.stringify(refreshedUser));
                }
              })
              .catch(err => console.warn('Could not refresh user role from API:', err));
          }
        }

        const storedNotifications = localStorage.getItem('erp_notifications');
        if (storedNotifications) setNotifications(JSON.parse(storedNotifications));

        const storedActivities = localStorage.getItem('erp_activities');
        if (storedActivities) setActivities(JSON.parse(storedActivities));

        const storedDark = localStorage.getItem('erp_darkMode');
        if (storedDark) setDarkMode(JSON.parse(storedDark));

        const storedCompany = localStorage.getItem('erp_activeCompany');
        if (storedCompany) setActiveCompany(JSON.parse(storedCompany));
      } catch (e) {
        console.error('Error loading ERP state from localStorage:', e);
      } finally {
        setIsStateLoaded(true);
      }
    }
  }, []);

  // Sync state changes back to localStorage (only after loading is complete to prevent overwrites)
  useEffect(() => {
    if (isStateLoaded && typeof window !== 'undefined') {
      localStorage.setItem('erp_currentUser', JSON.stringify(currentUser));
    }
  }, [currentUser, isStateLoaded]);

  useEffect(() => {
    if (isStateLoaded && typeof window !== 'undefined') {
      localStorage.setItem('erp_notifications', JSON.stringify(notifications));
    }
  }, [notifications, isStateLoaded]);

  useEffect(() => {
    if (isStateLoaded && typeof window !== 'undefined') {
      localStorage.setItem('erp_activities', JSON.stringify(activities));
    }
  }, [activities, isStateLoaded]);

  useEffect(() => {
    if (isStateLoaded && typeof window !== 'undefined') {
      localStorage.setItem('erp_darkMode', JSON.stringify(darkMode));
    }
  }, [darkMode, isStateLoaded]);

  useEffect(() => {
    if (isStateLoaded && typeof window !== 'undefined') {
      localStorage.setItem('erp_activeCompany', JSON.stringify(activeCompany));
    }
  }, [activeCompany, isStateLoaded]);

  // Sync active module state with URL changes (e.g. Back button)
  useEffect(() => {
    if (urlModule && urlModule !== activeModule) {
      setActiveModuleState(urlModule);
    }
  }, [urlModule]);

  const setActiveModule = (mod: ModuleType) => {
    setActiveModuleState(mod);
    
    if (mod === 'dashboard') {
      router.push('/');
    } else {
      router.push(`/${mod}`);
    }
  };

  // Handlers for Categories
  const handleAddCategory = (cat: CategoryItem) => {
    setCategories([cat, ...categories]);
  };
  const handleUpdateCategory = (updated: CategoryItem) => {
    setCategories(categories.map(c => c.id === updated.id ? updated : c));
  };
  const handleDeleteCategory = async (id: string) => {
    try {
      const res = await fetch(`/api/categories?id=${id}`, { method: 'DELETE' }).then(r => r.json());
      if (res.success) {
        setCategories(categories.filter(c => c.id !== id));
      } else {
        alert(`Failed to delete category: ${res.error || 'Unknown error'}`);
      }
    } catch (e) {
      console.error(e);
      alert('Failed to delete category');
    }
  };

  // Handlers for Subcategories
  const handleAddSubcategory = (sub: SubcategoryItem) => {
    setSubCategories([sub, ...subCategories]);
  };
  const handleUpdateSubcategory = (updated: SubcategoryItem) => {
    setSubCategories(subCategories.map(s => s.id === updated.id ? updated : s));
  };
  const handleDeleteSubcategory = (id: string) => {
    setSubCategories(subCategories.filter(s => s.id !== id));
  };

  // Handlers for Raw Materials
  const handleAddRawMaterial = (rm: RawMaterial) => {
    setRawMaterials([rm, ...rawMaterials]);
    setActivities([
      {
        id: `ACT-${Date.now()}`,
        action: 'Added Raw Material',
        module: 'Inventory',
        user: currentUser?.name || 'System User',
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
        details: `Created master entry for ${rm.name} (${rm.code})`
      },
      ...activities
    ]);
  };

  const handleUpdateRawMaterial = (updated: RawMaterial) => {
    setRawMaterials(rawMaterials.map(rm => rm.id === updated.id ? updated : rm));
  };

  const handleDeleteRawMaterial = async (id: string) => {
    try {
      const res = await fetch(`/api/raw-materials?id=${id}`, { method: 'DELETE' }).then(r => r.json());
      if (res.success) {
        setRawMaterials(rawMaterials.filter(rm => rm.id !== id));
      } else {
        alert(`Failed to delete raw material: ${res.error || 'Unknown error'}`);
      }
    } catch (e) {
      console.error(e);
      alert('Failed to delete raw material');
    }
  };

  // Handlers for Products
  const handleAddProduct = (p: Product) => {
    setProducts([p, ...products]);
  };
  const handleUpdateProduct = (updated: Product) => {
    setProducts(products.map(p => p.id === updated.id ? updated : p));
  };
  const handleDeleteProduct = async (id: string) => {
    try {
      const res = await fetch(`/api/products?id=${id}`, { method: 'DELETE' }).then(r => r.json());
      if (res.success) {
        setProducts(products.filter(p => p.id !== id));
      } else {
        alert(`Failed to delete product: ${res.error || 'Unknown error'}`);
      }
    } catch (e) {
      console.error(e);
      alert('Failed to delete product');
    }
  };

  // Handlers for Suppliers
  const handleRefreshSuppliers = async () => {
    try {
      const supRes = await fetch('/api/suppliers').then(r => r.json()).catch(() => ({ success: false, data: [] }));
      if (supRes.success && Array.isArray(supRes.data)) {
        setSuppliers(supRes.data.map((s: any) => ({
          id: s.id,
          supplierName: s.supplierName,
          millName: s.millName || '',
          category: s.category || '',
          rawMaterials: s.rawMaterials || []
        })));
      }
    } catch (err) {
      console.error('Error refreshing suppliers:', err);
    }
  };

  const handleAddSupplier = (sup: Supplier) => {
    setSuppliers([sup, ...suppliers]);
  };
  const handleUpdateSupplier = (updated: Supplier) => {
    setSuppliers(suppliers.map(s => s.id === updated.id ? updated : s));
  };
  const handleDeleteSupplier = async (id: string) => {
    try {
      const res = await fetch(`/api/suppliers?id=${id}`, { method: 'DELETE' }).then(r => r.json());
      if (res.success) {
        setSuppliers(suppliers.filter(s => s.id !== id));
      } else {
        alert(`Failed to delete supplier: ${res.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      console.error('Error deleting supplier:', err);
      alert(`Error deleting supplier: ${err.message || err}`);
    }
  };

  const handleAddActivity = (act: { action: string; module: string; details: string }) => {
    setActivities([
      {
        id: `ACT-${Date.now()}`,
        action: act.action,
        module: act.module,
        user: currentUser?.name || 'System User',
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
        details: act.details
      },
      ...activities
    ]);
  };



  // Handlers for Warehouses
  const handleAddWarehouse = (wh: Warehouse) => {
    const formatted: Warehouse = {
      ...wh,
      currentUtilizationPercent: wh.currentUtilizationPercent ?? 0,
      activeItemsCount: wh.activeItemsCount ?? 0,
      totalBins: wh.totalBins ?? 0,
      capacitySqFt: wh.capacitySqFt ?? 0,
    };
    setWarehouses(prev => [formatted, ...prev]);
    setActivities(prev => [
      {
        id: `ACT-${Date.now()}`,
        action: 'Added Warehouse',
        module: 'Inventory',
        user: currentUser?.name || 'System User',
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
        details: `Created new warehouse: ${formatted.name} (${formatted.code})`
      },
      ...prev
    ]);
  };

  const handleUpdateWarehouse = (updated: Warehouse) => {
    setWarehouses(prev => prev.map(wh => wh.id === updated.id ? updated : wh));
  };

  const handleDeleteWarehouse = async (id: string) => {
    try {
      const res = await fetch(`/api/warehouses?id=${id}`, { method: 'DELETE' }).then(r => r.json());
      if (res.success) {
        setWarehouses(warehouses.filter(w => w.id !== id));
      } else {
        alert(`Failed to delete warehouse: ${res.error || 'Unknown error'}`);
      }
    } catch (e) {
      console.error(e);
      alert('Failed to delete warehouse');
    }
  };

  const handleAddBin = (bin: BinLocationItem) => {
    setBinLocations(prev => [bin, ...prev]);
    setActivities(prev => [
      {
        id: `ACT-${Date.now()}`,
        action: 'Added Bin Location',
        module: 'Inventory',
        user: currentUser?.name || 'System User',
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
        details: `Created new bin location: ${bin.name} (${bin.code})`
      },
      ...prev
    ]);
  };

  const handleUpdateBin = (updated: BinLocationItem) => {
    setBinLocations(prev => prev.map(b => b.id === updated.id ? updated : b));
  };

  const handleDeleteBin = async (id: string) => {
    try {
      const res = await fetch(`/api/bins?id=${id}`, { method: 'DELETE' }).then(r => r.json());
      if (res.success) {
        setBinLocations(binLocations.filter(b => b.id !== id));
      } else {
        alert(`Failed to delete bin: ${res.error || 'Unknown error'}`);
      }
    } catch (e) {
      console.error(e);
      alert('Failed to delete bin');
    }
  };

  // Handlers for Transactions
  const handleAddTransaction = (txn: InventoryTransaction) => {
    // Utility for safe warehouse comparison
    const getWhName = (wh: any): string => {
      if (!wh) return '';
      if (typeof wh === 'string') return wh;
      return wh.name || '';
    };

    const getWhId = (wh: any): string => {
      if (!wh) return '';
      if (typeof wh === 'object' && wh.id) return wh.id;
      return '';
    };

    const isWhMatch = (wh1: any, wh2: any): boolean => {
      if (!wh1 || !wh2) return false;
      const id1 = getWhId(wh1);
      const id2 = getWhId(wh2);
      if (id1 && id2) return id1 === id2;
      
      const n1 = getWhName(wh1).toLowerCase();
      const n2 = getWhName(wh2).toLowerCase();
      if (!n1 || !n2) return false;
      return n1 === n2 || n1.includes(n2) || n2.includes(n1);
    };

    const isOutflow = [
      'Stock Out',
      'Production Issue',
      'Sales Return'
    ].includes(txn.transactionType);

    const isInflow = [
      'Stock In',
      'Production Issue',
      'Sales Return'
    ].includes(txn.transactionType);

    let finalQuantity = txn.quantity;
    if (isOutflow && finalQuantity > 0) {
      finalQuantity = -finalQuantity;
    } else if (isInflow && finalQuantity < 0) {
      finalQuantity = Math.abs(finalQuantity);
    }

    if (txn.transactionType === 'Warehouse Transfer' && txn.destinationWarehouse) {
      const sourceWh = txn.warehouse;
      const destWh = txn.destinationWarehouse;
      const qty = Math.abs(txn.quantity);

      if (txn.itemType === 'Raw Material') {
        let sourceItem = rawMaterials.find(rm => rm.code === txn.itemCode && isWhMatch(rm.warehouse, sourceWh));
        if (!sourceItem) {
          // fallback to matching code only
          sourceItem = rawMaterials.find(rm => rm.code === txn.itemCode);
        }

        if (sourceItem) {
          txn.previousStock = sourceItem.currentStock;
          txn.currentStock = Math.max(0, sourceItem.currentStock - qty);
          txn.quantity = -qty;

          // Update rawMaterials
          setRawMaterials(prev => {
            // Decrease source
            const updated = prev.map(rm => {
              if (rm.id === sourceItem!.id) {
                return { ...rm, currentStock: Math.max(0, rm.currentStock - qty), lastUpdated: new Date().toISOString().replace('T', ' ').substring(0, 16) };
              }
              return rm;
            });

            // Check if item exists in dest
            const destItemIndex = updated.findIndex(rm => rm.code === txn.itemCode && isWhMatch(rm.warehouse, destWh));
            if (destItemIndex > -1) {
              return updated.map((rm, idx) => {
                if (idx === destItemIndex) {
                  return { ...rm, currentStock: rm.currentStock + qty, lastUpdated: new Date().toISOString().replace('T', ' ').substring(0, 16) };
                }
                return rm;
              });
            } else {
              // Create copy in dest warehouse
              const newItem: RawMaterial = {
                ...sourceItem!,
                id: `RM-${Date.now()}`,
                warehouse: destWh,
                currentStock: qty,
                lastUpdated: new Date().toISOString().replace('T', ' ').substring(0, 16)
              };
              return [newItem, ...updated];
            }
          });
        }
      } else {
        let sourceItem = products.find(p => p.code === txn.itemCode && isWhMatch(p.warehouse, sourceWh));
        if (!sourceItem) {
          // fallback to matching code only
          sourceItem = products.find(p => p.code === txn.itemCode);
        }

        if (sourceItem) {
          txn.previousStock = sourceItem.availableStock;
          txn.currentStock = Math.max(0, sourceItem.availableStock - qty);
          txn.quantity = -qty;

          // Update products
          setProducts(prev => {
            const updated = prev.map(p => {
              if (p.id === sourceItem!.id) {
                return { ...p, availableStock: Math.max(0, p.availableStock - qty) };
              }
              return p;
            });

            const destItemIndex = updated.findIndex(p => p.code === txn.itemCode && isWhMatch(p.warehouse, destWh));
            if (destItemIndex > -1) {
              return updated.map((p, idx) => {
                if (idx === destItemIndex) {
                  return { ...p, availableStock: p.availableStock + qty };
                }
                return p;
              });
            } else {
              const newItem: Product = {
                ...sourceItem!,
                id: `PRD-${Date.now()}`,
                warehouse: destWh,
                availableStock: qty
              } as Product;
              return [newItem, ...updated];
            }
          });
        }
      }
    } else {
      // Normal transaction (Inflow, Outflow, Adjustment)
      if (txn.itemType === 'Raw Material') {
        let item = rawMaterials.find(rm => rm.code === txn.itemCode && isWhMatch(rm.warehouse, txn.warehouse));
        if (!item) {
          // fallback to matching code only
          item = rawMaterials.find(rm => rm.code === txn.itemCode);
        }

        if (item) {
          const newStock = Math.max(0, item.currentStock + finalQuantity);
          txn.previousStock = item.currentStock;
          txn.currentStock = newStock;
          txn.quantity = finalQuantity;
          setRawMaterials(prev => prev.map(rm => {
            if (rm.id === item!.id) {
              return { ...rm, currentStock: newStock, lastUpdated: new Date().toISOString().replace('T', ' ').substring(0, 16) };
            }
            return rm;
          }));
        } else {
          txn.previousStock = 0;
          txn.currentStock = finalQuantity > 0 ? finalQuantity : 0;
        }
      } else {
        let item = products.find(p => p.code === txn.itemCode && isWhMatch(p.warehouse, txn.warehouse));
        if (!item) {
          // fallback to matching code only
          item = products.find(p => p.code === txn.itemCode);
        }

        if (item) {
          const newStock = Math.max(0, item.availableStock + finalQuantity);
          txn.previousStock = item.availableStock;
          txn.currentStock = newStock;
          txn.quantity = finalQuantity;
          setProducts(prev => prev.map(p => {
            if (p.id === item!.id) {
              return { ...p, availableStock: newStock };
            }
            return p;
          }));
        } else {
          txn.previousStock = 0;
          txn.currentStock = finalQuantity > 0 ? finalQuantity : 0;
        }
      }
    }

    const displayTxn = {
      ...txn,
      warehouse: getWhName(txn.warehouse),
      destinationWarehouse: txn.destinationWarehouse ? getWhName(txn.destinationWarehouse) : undefined
    };

    setTransactions(prev => [displayTxn, ...prev]);
    setActivities(prev => [
      {
        id: `ACT-${Date.now()}`,
        action: `Transaction: ${txn.transactionType}`,
        module: 'Inventory',
        user: currentUser?.name || 'System User',
        timestamp: `${txn.date} ${txn.time}`,
        details: txn.transactionType === 'Warehouse Transfer'
          ? `Transferred ${Math.abs(txn.quantity)} units of ${txn.itemName} from ${displayTxn.warehouse} to ${displayTxn.destinationWarehouse}`
          : `Recorded ${txn.quantity > 0 ? '+' : ''}${txn.quantity} units for ${txn.itemName} (${displayTxn.warehouse})`
      },
      ...prev
    ]);
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      const response = await fetch(`/api/stock-movements?id=${id}`, {
        method: 'DELETE',
      }).then(r => r.json());

      if (response.success) {
        setTransactions(prev => prev.filter(tx => tx.id !== id));
        
        handleAddNotification({
          title: 'Stock Movement Deleted',
          message: 'Stock movement transaction has been successfully removed from the ledger.',
          type: 'success',
          time: 'Just now',
          module: 'Inventory'
        });

        // Refresh materials and products to align stock counts
        const [rmRes, prodRes] = await Promise.all([
          fetch('/api/raw-materials').then(r => r.json()).catch(() => ({ success: false, data: [] })),
          fetch('/api/products').then(r => r.json()).catch(() => ({ success: false, data: [] })),
        ]);
        if (rmRes.success && Array.isArray(rmRes.data)) setRawMaterials(rmRes.data);
        if (prodRes.success && Array.isArray(prodRes.data)) setProducts(prodRes.data);
      } else {
        alert(`Failed to delete transaction: ${response.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      console.error('Error deleting transaction:', err);
      alert(`Error deleting transaction: ${err.message || err}`);
    }
  };

  const handleAddNotification = (
    titleOrObj: string | Omit<NotificationItem, 'id' | 'read'>,
    message?: string,
    type?: 'info' | 'success' | 'warning' | 'error'
  ) => {
    if (typeof titleOrObj === 'object') {
      const newNotif: NotificationItem = {
        ...titleOrObj,
        id: `NOTIF-${Date.now()}`,
        read: false
      };
      setNotifications(prev => [newNotif, ...prev]);
    } else {
      const newNotif: NotificationItem = {
        id: `NOTIF-${Date.now()}`,
        title: titleOrObj,
        message: message || '',
        type: type === 'error' ? 'alert' : type === 'success' ? 'success' : 'info',
        time: 'Just now',
        read: false
      };
      setNotifications(prev => [newNotif, ...prev]);
    }
  };

  const handleClearNotifications = async () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
    try {
      if (currentUser?.id) {
        await fetch(`/api/notifications?action=markAllRead&userId=${currentUser.id}`, { method: 'PUT' });
      }
    } catch (err) {
      console.error('Failed to mark all notifications as read in DB:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('erp_currentUser');
    localStorage.removeItem('erp_token');
    document.cookie = 'erp_token=; Max-Age=0; path=/;';
    document.cookie = 'token=; Max-Age=0; path=/;';
    setCurrentUser(null);
  };

  if (!currentUser) {
    return <LoginScreen onLogin={async (user) => {
      try {
        const token = (user as any).token || localStorage.getItem('erp_token') || '';
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        if (user.email) {
          headers['x-user-email'] = user.email;
        }

        const res = await fetch(`/api/users?email=${encodeURIComponent(user.email)}`, {
          headers,
          credentials: 'include',
        }).then(r => r.json());

        if (res.success && res.data) {
          const fullUser = {
            ...user,
            id: res.data.id || user.id,
            name: res.data.name || user.name,
            role: res.data.role?.name || res.data.role || user.role,
            permissions: res.data.role?.permissions?.map((p: any) => p.name) || user.permissions || [],
            department: res.data.department || user.department,
            token,
          };
          setCurrentUser(fullUser);
          localStorage.setItem('erp_currentUser', JSON.stringify(fullUser));
        } else {
          setCurrentUser(user);
          localStorage.setItem('erp_currentUser', JSON.stringify(user));
        }
      } catch (e) {
        setCurrentUser(user);
        localStorage.setItem('erp_currentUser', JSON.stringify(user));
      }
    }} />;
  }

  const handleGenerateReport = async (reportTitle: string) => {
    console.log(`Generating report: ${reportTitle}`);
    let endpoint = '';
    
    switch (reportTitle) {
      case 'Inventory Valuation Report':
        endpoint = '/api/reports/inventory-valuation';
        break;
      case 'Low Stock & Reorder Analysis':
        endpoint = '/api/reports/low-stock-reorder';
        break;
      case 'Mill Supplier Outstanding Ledger':
        endpoint = '/api/reports/supplier-outstanding';
        break;
      case 'Corrugator Material Consumption Report':
        endpoint = '/api/reports/material-consumption';
        break;
      case 'Finished Goods Dispatch Register':
        endpoint = '/api/reports/dispatch-register';
        break;
      case 'GST Output vs Input Tax Report':
        endpoint = '/api/reports/gst-report';
        break;
      default:
        alert(`Report "${reportTitle}" functionality coming soon!`);
        return;
    }

    try {
      const res = await fetch(endpoint);
      const result = await res.json();
      
      if (result.success) {
        console.log(`${reportTitle} Data:`, result.data);
        alert(`Report "${reportTitle}" generated successfully! Check console for data.`);
        // Implement export logic here (PDF/Excel)
      } else {
        alert(`Failed to generate report: ${result.error}`);
      }
    } catch (err) {
      console.error(`Error generating ${reportTitle}:`, err);
      alert(`Error generating report: ${err.message || err}`);
    }
  };

  const hasViewPermission = (mod: ModuleType): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'Administrator') return true;

    if (mod.startsWith('procurement_')) {
      const sub = mod.replace('procurement_', '');
      const subMap: Record<string, string> = {
        'dashboard': 'procurement_dashboard:view',
        'rfq': 'procurement_rfq:view',
        'quotes': 'procurement_quotes:view',
        'po': 'procurement_po:view',
        'gate_entry': 'procurement_gate_entry:view',
        'reel_inward': 'procurement_reel_inward:view',
        'inward': 'procurement_inward:view',
        'qc': 'procurement_qc:view',
      };
      return ((currentUser as any).permissions || []).includes(subMap[sub] || 'procurement_dashboard:view');
    }

    // Map module type to permission name
    const permissionMap: Record<string, string> = {
      'dashboard': 'dashboard:view',
      'inventory_raw': 'inventory_raw:view',
      'inventory_products': 'inventory_products:view',
      'inventory_categories': 'inventory_categories:view',
      'inventory_suppliers': 'inventory_suppliers:view',
      'inventory_warehouses': 'inventory_warehouses:view',
      'inventory_transactions': 'inventory_transactions:view',
      'inventory_stock': 'inventory_stock:view',
      'procurement': 'procurement_dashboard:view',
      'production': 'production:view',
      'sales': 'sales:view',
      'accounts': 'accounts:view',
      'reports': 'reports:view',
      'settings': 'settings:view',
      'user_management': 'settings:view',
    };

    const permissionName = permissionMap[mod];
    if (!permissionName) return true; // Default allow for non-mapped modules

    const permissions = (currentUser as any).permissions || [];
    return permissions.includes(permissionName);
  };

  const isAuthorized = activeModule === 'recycle_bin' ? ((currentUser?.role as any)?.name === 'Administrator' || (currentUser?.role as any) === 'Administrator') : hasViewPermission(activeModule);

  return (
    <ErrorBoundary>
      <div className={`min-h-screen flex ${darkMode ? 'bg-slate-950 text-slate-100 dark' : 'bg-slate-100 text-slate-900'}`}>
      {/* Left Sidebar */}
      <Sidebar 
        activeModule={activeModule} 
        onSelectModule={(mod) => {
          setActiveModule(mod);
          setIsMobileSidebarOpen(false);
        }} 
        darkMode={darkMode} 
        currentUser={currentUser}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar 
          currentUser={currentUser}
          onLogout={handleLogout}
          notifications={notifications}
          onClearNotifications={handleClearNotifications}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode(!darkMode)}
          activeCompany={activeCompany}
          onSelectCompany={(comp) => setActiveCompany(comp)}
          onGlobalSearchClick={() => setShowGlobalSearch(true)}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          onOpenNotificationSettings={() => setIsNotificationSettingsOpen(true)}
          onMarkNotificationRead={handleMarkNotificationRead}
          onNotificationClick={handleNotificationClick}
        />

        <main className="flex-1 p-6 sm:p-8 overflow-y-auto">
          {!isAuthorized ? (
            <div className="flex flex-col items-center justify-center py-20 text-center max-w-md mx-auto space-y-4">
              <div className="w-16 h-16 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center shadow-lg shadow-red-500/15">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <h2 className={`text-lg font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>Access Restricted</h2>
              <p className="text-xs text-slate-500">
                You do not have the required "View" permissions to access the <strong>{activeModule.replace('_', ' ').replace('procurement_', '').toUpperCase()}</strong> module. Please contact your system Administrator to request authorization.
              </p>
              <button
                onClick={() => setActiveModule('dashboard')}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors"
              >
                Return to Dashboard
              </button>
            </div>
          ) : selectedHistory ? (
            <ChangeHistoryPage
              entity={selectedHistory.entity}
              entityId={selectedHistory.entityId}
              entityName={selectedHistory.entityName}
              darkMode={darkMode}
              onBack={() => {
                setSelectedHistory(null);
                window.history.pushState({}, '', activeModule === 'dashboard' ? '/' : `/${activeModule}`);
              }}
            />
          ) : (
            <>
              {selectedMaterialId && (
                <RecordDetailPage
                  entityType="raw"
                  recordId={selectedMaterialId}
                  rawMaterials={rawMaterials}
                  products={products}
                  categories={categories}
                  subCategories={subCategories}
                  suppliers={suppliers}
                  warehouses={warehouses}
                  purchaseOrders={purchaseOrders}
                  rfqs={rfqs}
                  darkMode={darkMode}
                  currentUser={currentUser}
                  onBack={() => setSelectedMaterialId(null)}
                  onEdit={() => setSelectedMaterialId(null)}
                  onDelete={(id) => {
                    handleDeleteRawMaterial(id);
                    setSelectedMaterialId(null);
                  }}
                  onAddNotification={handleAddNotification}
                />
              )}
          {selectedProductId && (
            <RecordDetailPage
              entityType="product"
              recordId={selectedProductId}
              rawMaterials={rawMaterials}
              products={products}
              categories={categories}
              subCategories={subCategories}
              suppliers={suppliers}
              warehouses={warehouses}
              purchaseOrders={purchaseOrders}
              rfqs={rfqs}
              darkMode={darkMode}
              currentUser={currentUser}
              onBack={() => setSelectedProductId(null)}
              onEdit={() => setSelectedProductId(null)}
              onDelete={(id) => {
                handleDeleteProduct(id);
                setSelectedProductId(null);
              }}
              onAddNotification={handleAddNotification}
            />
          )}

          {selectedSupplierId && (
            <RecordDetailPage
              entityType="supplier"
              recordId={selectedSupplierId}
              rawMaterials={rawMaterials}
              products={products}
              categories={categories}
              subCategories={subCategories}
              suppliers={suppliers}
              warehouses={warehouses}
              purchaseOrders={purchaseOrders}
              rfqs={rfqs}
              darkMode={darkMode}
              currentUser={currentUser}
              onBack={() => setSelectedSupplierId(null)}
              onEdit={() => setSelectedSupplierId(null)}
              onDelete={(id) => {
                handleDeleteSupplier(id);
                setSelectedSupplierId(null);
              }}
              onAddNotification={handleAddNotification}
            />
          )}

          {selectedCategoryId && (
            <RecordDetailPage
              entityType="category"
              recordId={selectedCategoryId}
              rawMaterials={rawMaterials}
              products={products}
              categories={categories}
              subCategories={subCategories}
              suppliers={suppliers}
              warehouses={warehouses}
              purchaseOrders={purchaseOrders}
              rfqs={rfqs}
              darkMode={darkMode}
              currentUser={currentUser}
              onBack={() => setSelectedCategoryId(null)}
              onEdit={() => setSelectedCategoryId(null)}
              onDelete={(id) => {
                handleDeleteCategory(id);
                setSelectedCategoryId(null);
              }}
              onAddNotification={handleAddNotification}
            />
          )}

          {selectedSubcategoryId && (
            <RecordDetailPage
              entityType="subcategory"
              recordId={selectedSubcategoryId}
              rawMaterials={rawMaterials}
              products={products}
              categories={categories}
              subCategories={subCategories}
              suppliers={suppliers}
              warehouses={warehouses}
              purchaseOrders={purchaseOrders}
              rfqs={rfqs}
              darkMode={darkMode}
              currentUser={currentUser}
              onBack={() => setSelectedSubcategoryId(null)}
              onEdit={() => setSelectedSubcategoryId(null)}
              onDelete={(id) => {
                handleDeleteSubcategory(id);
                setSelectedSubcategoryId(null);
              }}
              onAddNotification={handleAddNotification}
            />
          )}

          {selectedWarehouseId && (
            <RecordDetailPage
              entityType="warehouse"
              recordId={selectedWarehouseId}
              rawMaterials={rawMaterials}
              products={products}
              categories={categories}
              subCategories={subCategories}
              suppliers={suppliers}
              warehouses={warehouses}
              purchaseOrders={purchaseOrders}
              rfqs={rfqs}
              darkMode={darkMode}
              currentUser={currentUser}
              onBack={() => setSelectedWarehouseId(null)}
              onEdit={() => setSelectedWarehouseId(null)}
              onDelete={(id) => {
                handleDeleteWarehouse(id);
                setSelectedWarehouseId(null);
              }}
              onAddNotification={handleAddNotification}
            />
          )}

          {selectedPoId && (
            <RecordDetailPage
              entityType="po"
              recordId={selectedPoId}
              rawMaterials={rawMaterials}
              products={products}
              categories={categories}
              subCategories={subCategories}
              suppliers={suppliers}
              warehouses={warehouses}
              purchaseOrders={purchaseOrders}
              rfqs={rfqs}
              darkMode={darkMode}
              currentUser={currentUser}
              onBack={() => setSelectedPoId(null)}
              onEdit={() => setSelectedPoId(null)}
              onDelete={(id) => {
                setPurchaseOrders(prev => prev.filter(po => po.id !== id));
                setSelectedPoId(null);
              }}
              onAddNotification={handleAddNotification}
            />
          )}

          {selectedRfqId && (
            <RecordDetailPage
              entityType="rfq"
              recordId={selectedRfqId}
              rawMaterials={rawMaterials}
              products={products}
              categories={categories}
              subCategories={subCategories}
              suppliers={suppliers}
              warehouses={warehouses}
              purchaseOrders={purchaseOrders}
              rfqs={rfqs}
              darkMode={darkMode}
              currentUser={currentUser}
              onBack={() => setSelectedRfqId(null)}
              onEdit={() => setSelectedRfqId(null)}
              onDelete={(id) => {
                setRfqs(prev => prev.filter(rfq => rfq.id !== id));
                setSelectedRfqId(null);
              }}
              onUpdateRfq={(updated) => setRfqs(rfqs.map(r => r.id === updated.id ? updated : r))}
              onAddNotification={handleAddNotification}
            />
          )}

          {(!selectedMaterialId && !selectedProductId && !selectedSupplierId && !selectedCategoryId && !selectedSubcategoryId && !selectedWarehouseId && !selectedPoId && !selectedRfqId) && (
            <>
              {activeModule === 'dashboard' && (
                <DashboardView 
                  rawMaterials={rawMaterials}
                  products={products}
                  suppliers={suppliers}
                  warehouses={warehouses}
                  activities={activities}
                  onSelectModule={setActiveModule}
                  onSelectProduct={setSelectedProductId}
                  onSelectMaterial={setSelectedMaterialId}
                  darkMode={darkMode}
                />
              )}

              {activeModule === 'inventory_raw' && (
                <RawMaterialsView 
                  rawMaterials={rawMaterials}
                  suppliers={suppliers}
                  warehouses={warehouses}
                  categoriesList={categories}
                  subCategoriesList={subCategories}
                  onAddRawMaterial={handleAddRawMaterial}
                  onUpdateRawMaterial={handleUpdateRawMaterial}
                  onDeleteRawMaterial={handleDeleteRawMaterial}
                  darkMode={darkMode}
                  selectedMaterialId={selectedMaterialId}
                  onSelectMaterial={setSelectedMaterialId}
                  isLoading={isLoading}
                  onViewHistory={(entity, id, name) => {
                    console.log('DEBUG: onViewHistory RawMaterial called with:', { entity, id, name });
                    setSelectedHistory({ entity, entityId: id, entityName: name });
                    if (entity === 'RawMaterial') {
                      window.history.pushState({}, '', `/inventory/raw-materials/${id}/history`);
                    } else if (entity === 'Product') {
                      window.history.pushState({}, '', `/inventory/products/${id}/history`);
                    } else {
                      window.history.pushState({}, '', `/history/${entity}/${id}`);
                    }
                  }}
                />
              )}

              {activeModule === 'inventory_products' && (
                <ProductsView 
                  products={products}
                  warehouses={warehouses}
                  categoriesList={categories}
                  subCategoriesList={subCategories}
                  onAddProduct={handleAddProduct}
                  onUpdateProduct={handleUpdateProduct}
                  onDeleteProduct={handleDeleteProduct}
                  darkMode={darkMode}
                  selectedProductId={selectedProductId}
                  onSelectProduct={setSelectedProductId}
                  isLoading={isLoading}
                  onViewHistory={(entity, id, name) => {
                    console.log('DEBUG: onViewHistory Product called with:', { entity, id, name });
                    setSelectedHistory({ entity, entityId: id, entityName: name });
                    if (entity === 'RawMaterial') {
                      window.history.pushState({}, '', `/inventory/raw-materials/${id}/history`);
                    } else if (entity === 'Product') {
                      window.history.pushState({}, '', `/inventory/products/${id}/history`);
                    } else {
                      window.history.pushState({}, '', `/history/${entity}/${id}`);
                    }
                  }}
                />
              )}

          {activeModule === 'inventory_categories' && (
            <CategoriesView 
              categories={categories} 
              onAddCategory={handleAddCategory} 
              onUpdateCategory={handleUpdateCategory}
              onDeleteCategory={handleDeleteCategory}
              subCategories={subCategories}
              onAddSubcategory={handleAddSubcategory}
              onUpdateSubcategory={handleUpdateSubcategory}
              onDeleteSubcategory={handleDeleteSubcategory}
              darkMode={darkMode} 
              selectedCategoryId={selectedCategoryId}
              selectedSubcategoryId={selectedSubcategoryId}
              isLoading={isLoading}
            />
          )}

          {activeModule === 'inventory_suppliers' && (
            <SuppliersView 
              suppliers={suppliers}
              categoriesList={categories}
              onAddSupplier={handleAddSupplier}
              onUpdateSupplier={handleUpdateSupplier}
              onDeleteSupplier={handleDeleteSupplier}
              onRefreshSuppliers={handleRefreshSuppliers}
              darkMode={darkMode}
              selectedSupplierId={selectedSupplierId}
            />
          )}

          {activeModule === 'inventory_warehouses' && (
            selectedWarehouseId ? (
              <WarehouseDetailPage
                warehouse={warehouses.find(w => w.id === selectedWarehouseId) || null}
                warehouseId={selectedWarehouseId}
                rawMaterials={rawMaterials}
                products={products}
                binLocations={binLocations}
                darkMode={darkMode}
                onBack={() => setSelectedWarehouseId(null)}
                onSelectProduct={setSelectedProductId}
                onSelectMaterial={setSelectedMaterialId}
              />
            ) : (
              <WarehousesView 
                warehouses={warehouses} 
                onAddWarehouse={handleAddWarehouse}
                onUpdateWarehouse={handleUpdateWarehouse}
                onDeleteWarehouse={handleDeleteWarehouse}
                binLocations={binLocations}
                onAddBin={handleAddBin}
                onUpdateBin={handleUpdateBin}
                onDeleteBin={handleDeleteBin}
                onViewWarehouse={setSelectedWarehouseId}
                darkMode={darkMode} 
                selectedWarehouseId={selectedWarehouseId}
              />
            )
          )}

          {activeModule === 'inventory_transactions' && (
            <TransactionsView 
              transactions={transactions}
              warehouses={warehouses}
              rawMaterials={rawMaterials}
              products={products}
              onAddTransaction={handleAddTransaction}
              onDeleteTransaction={handleDeleteTransaction}
              onSelectProduct={setSelectedProductId}
              onSelectMaterial={setSelectedMaterialId}
              darkMode={darkMode}
              isLoading={isLoading}
            />
          )}

          {activeModule === 'inventory_stock' && (
            <StockManagementView rawMaterials={rawMaterials} darkMode={darkMode} isLoading={isLoading} />
          )}

          {(activeModule === 'procurement' || activeModule.startsWith('procurement_')) && (
            <ProcurementModule 
              darkMode={darkMode} 
              rawMaterials={rawMaterials}
              suppliers={suppliers}
              warehouses={warehouses}
              onAddTransaction={handleAddTransaction}
              onAddNotification={handleAddNotification}
              onUpdateRawMaterials={setRawMaterials}
              onUpdateSuppliers={setSuppliers}
              onUpdateWarehouses={setWarehouses}
              onUpdateBins={setBinLocations}
              purchaseOrders={purchaseOrders}
              rfqs={rfqs}
              onUpdatePurchaseOrders={setPurchaseOrders}
              onUpdateRfqs={setRfqs}
              selectedPoId={selectedPoId}
              selectedRfqId={selectedRfqId}
              activeSubTab={
                activeModule === 'procurement' ? 'dashboard' :
                activeModule === 'procurement_gate_entry' ? 'gate_entry' :
                activeModule === 'procurement_reel_inward' ? 'reel_inward' :
                (activeModule.replace('procurement_', '') as any)
              }
              onSelectSubTab={(tab) => {
                setActiveModule(`procurement_${tab}` as any);
              }}
              onTriggerEventNotification={handleTriggerEventNotification}
              onOpenNotificationSettings={() => setIsNotificationSettingsOpen(true)}
              notificationRules={notificationRules}
              onSelectMaterial={setSelectedMaterialId}
              binLocations={binLocations}
            />
          )}

          {activeModule === 'production' && (
            <ProductionModule 
              darkMode={darkMode} 
              rawMaterials={rawMaterials}
              products={products}
              warehouses={warehouses}
              onAddTransaction={handleAddTransaction}
              onSelectProduct={setSelectedProductId}
              onSelectMaterial={setSelectedMaterialId}
            />
          )}

          {activeModule === 'sales' && (
            <SalesModule 
              darkMode={darkMode} 
              products={products}
              warehouses={warehouses}
              onAddTransaction={handleAddTransaction}
              onSelectProduct={setSelectedProductId}
            />
          )}

          {activeModule === 'accounts' && (
            <AccountsModule darkMode={darkMode} />
          )}

          {activeModule === 'reports' && (
            <ReportsModule darkMode={darkMode} onGenerateReport={handleGenerateReport} />
          )}

          {activeModule === 'settings' && (
            <SettingsModule darkMode={darkMode} />
          )}

          {activeModule === 'user_management' && (
            <UserManagementModule darkMode={darkMode} currentUser={currentUser} />
          )}

              {activeModule === 'recycle_bin' && (
            <RecycleBinPage darkMode={darkMode} />
          )}
          
          {activeModule === 'admin_excel' && (
                <AdminExcelView 
                  currentUser={currentUser}
                  rawMaterials={rawMaterials}
                  products={products}
                  suppliers={suppliers}
                  warehouses={warehouses}
                  categories={categories}
                  onUpdateRawMaterials={setRawMaterials}
                  onUpdateProducts={setProducts}
                  onUpdateSuppliers={setSuppliers}
                  onUpdateWarehouses={setWarehouses}
                  onUpdateCategories={setCategories}
                  onAddActivity={handleAddActivity}
                  darkMode={darkMode}
                  onSelectModule={setActiveModule}
                />
              )}
            </>
          )}
            </>
          )}
        </main>
      </div>

      {/* Global Search Modal */}
      {showGlobalSearch && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className={`w-full max-w-2xl rounded-3xl shadow-2xl border p-6 relative ${
            darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center space-x-3 pb-4 border-b border-slate-200 dark:border-slate-800">
              <Search className="w-5 h-5 text-emerald-500" />
              <input
                type="text"
                autoFocus
                value={globalSearchText}
                onChange={(e) => {
                  setGlobalSearchText(e.target.value);
                  setSearchSelectedIndex(0);
                }}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search raw materials, products, suppliers, warehouses, categories, POs, RFQs..."
                className="w-full bg-transparent text-base sm:text-lg focus:outline-none placeholder-slate-500"
              />
              <button
                onClick={() => setShowGlobalSearch(false)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="pt-4 max-h-[450px] overflow-y-auto space-y-4">
              {isSearching ? (
                <div className="py-12 text-center text-slate-400">
                  <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                  <p className="text-xs">Searching across ERP modules and users...</p>
                </div>
              ) : query && searchResults.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-400">
                    <Search className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-slate-300">No results found for &ldquo;{globalSearchText}&rdquo;</p>
                  <p className="text-xs text-slate-500 mt-1">Try searching by business code (e.g. RM2494, PO4041, RF4077), user name, product, supplier, or category.</p>
                </div>
              ) : !query ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  Type a keyword or business code (e.g. RM2494, Abhishek, PO4041) to search across all ERP modules and users...
                </div>
              ) : (
                (() => {
                  let flatIdx = 0;
                  const groupedMap: Record<string, any[]> = {};
                  for (const item of searchResults) {
                    const label = item.moduleLabel || 'Other';
                    if (!groupedMap[label]) groupedMap[label] = [];
                    groupedMap[label].push(item);
                  }

                  const groups = Object.entries(groupedMap).map(([name, items]) => ({ name, items }));

                  return groups.map(group => (
                    <div key={group.name} className="space-y-1.5">
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 flex items-center justify-between">
                        <span>{group.name}</span>
                        <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">{group.items.length}</span>
                      </div>
                      <div className="space-y-1">
                        {group.items.map(item => {
                          const currentFlatIdx = flatIdx++;
                          const isSelected = currentFlatIdx === searchSelectedIndex;
                          
                          const renderIcon = (iconName: string) => {
                            switch (iconName) {
                              case 'Package': return <Package className="w-4 h-4 text-emerald-500" />;
                              case 'Boxes': return <Boxes className="w-4 h-4 text-blue-500" />;
                              case 'Truck': return <Truck className="w-4 h-4 text-amber-500" />;
                              case 'Layers': return <Layers className="w-4 h-4 text-purple-500" />;
                              case 'Warehouse': return <WarehouseIcon className="w-4 h-4 text-teal-500" />;
                              case 'ShoppingCart': return <ShoppingCart className="w-4 h-4 text-rose-500" />;
                              case 'FileText': return <FileText className="w-4 h-4 text-cyan-500" />;
                              case 'ArrowLeftRight': return <ArrowLeftRight className="w-4 h-4 text-indigo-500" />;
                              case 'Users': return <Users className="w-4 h-4 text-sky-500" />;
                              case 'ShieldAlert': return <ShieldAlert className="w-4 h-4 text-orange-500" />;
                              default: return <Package className="w-4 h-4 text-emerald-500" />;
                            }
                          };

                          return (
                            <div
                              key={item.id + item.module}
                              onClick={() => handleSelectResult(item)}
                              onMouseEnter={() => setSearchSelectedIndex(currentFlatIdx)}
                              className={`p-3 rounded-xl flex items-center justify-between cursor-pointer transition-colors ${
                                isSelected 
                                  ? (darkMode ? 'bg-emerald-950/40 border border-emerald-500/30' : 'bg-emerald-50 border border-emerald-200 shadow-sm') 
                                  : (darkMode ? 'hover:bg-slate-800/60 border border-transparent' : 'hover:bg-slate-50 border border-transparent')
                              }`}
                            >
                              <div className="flex items-center space-x-3 overflow-hidden">
                                <div className={`p-2 rounded-lg shrink-0 ${darkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
                                  {renderIcon(item.iconName)}
                                </div>
                                <div className="min-w-0">
                                  <div className={`font-bold text-xs truncate ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                    {highlightMatch(`${item.code ? item.code + ' — ' : ''}${item.name}`, query)}
                                  </div>
                                  <div className="text-[11px] text-slate-400 truncate mt-0.5">
                                    {highlightMatch(item.subtitle, query)}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2 shrink-0 ml-3">
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                  darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'
                                }`}>
                                  {group.name}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ));
                })()
              )}
            </div>
            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <span>Use <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-300 font-mono">↑</kbd> <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-300 font-mono">↓</kbd> to navigate, <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-300 font-mono">Enter</kbd> to open record</span>
              <span>{searchResults.length} total results</span>
            </div>
          </div>
        </div>
      )}
      {/* Notification Settings Modal */}
      <NotificationSettingsModal
        isOpen={isNotificationSettingsOpen}
        onClose={() => setIsNotificationSettingsOpen(false)}
        rules={notificationRules}
        onUpdateRule={handleUpdateNotificationRule}
        onResetRules={handleResetNotificationRules}
        darkMode={darkMode}
      />

      {/* Outbound Email Toast Container */}
      <EmailToastContainer
        toasts={emailToasts}
        onDismiss={(id) => setEmailToasts(prev => prev.filter(t => t.id !== id))}
      />
    </div>
    </ErrorBoundary>
  );
}
