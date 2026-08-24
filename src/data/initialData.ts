import { RawMaterial, Product, CategoryItem, SubcategoryItem, Supplier, Warehouse, InventoryTransaction, NotificationItem, ActivityLog, User, NotificationSettingRule } from '../types';

export const INITIAL_USERS: User[] = [
  {
    id: 'USR-001',
    name: 'Rajesh Sharma',
    email: 'rajesh.sharma@amkerp.com',
    role: 'Administrator',
    avatar: '',
    department: 'Executive Office'
  },
  {
    id: 'USR-002',
    name: 'Amit Patel',
    email: 'amit.patel@amkerp.com',
    role: 'Inventory Manager',
    avatar: '',
    department: 'Supply Chain'
  },
  {
    id: 'USR-003',
    name: 'Sunita Menon',
    email: 'sunita.menon@amkerp.com',
    role: 'Purchase Manager',
    avatar: '',
    department: 'Procurement'
  }
];

export const INITIAL_RAW_MATERIALS: RawMaterial[] = [];

export const INITIAL_PRODUCTS: Product[] = [];

export const INITIAL_CATEGORIES: CategoryItem[] = [];

export const INITIAL_SUBCATEGORIES: SubcategoryItem[] = [];

export const INITIAL_SUPPLIERS: Supplier[] = [];

export const INITIAL_WAREHOUSES: Warehouse[] = [];

export const INITIAL_TRANSACTIONS: InventoryTransaction[] = [];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [];

export const DEFAULT_PROCUREMENT_NOTIFICATION_RULES: NotificationSettingRule[] = [
  {
    id: 'RULE-01',
    eventName: 'RFQ Created',
    eventKey: 'rfq_created',
    module: 'Procurement',
    inAppEnabled: true,
    emailEnabled: true,
    recipients: 'Purchase Manager, Manager',
    priority: 'Info'
  },
  {
    id: 'RULE-02',
    eventName: 'RFQ Sent to Suppliers',
    eventKey: 'rfq_sent',
    module: 'Procurement',
    inAppEnabled: true,
    emailEnabled: true,
    recipients: 'Suppliers, Purchase Manager',
    priority: 'Info'
  },
  {
    id: 'RULE-03',
    eventName: 'Supplier Quote Received',
    eventKey: 'quote_received',
    module: 'Procurement',
    inAppEnabled: true,
    emailEnabled: true,
    recipients: 'Purchase Manager',
    priority: 'Info'
  },
  {
    id: 'RULE-04',
    eventName: 'Purchase Order Created',
    eventKey: 'po_created',
    module: 'Procurement',
    inAppEnabled: true,
    emailEnabled: true,
    recipients: 'Purchase Manager, Administrator',
    priority: 'Warning'
  },
  {
    id: 'RULE-05',
    eventName: 'Purchase Order Approved',
    eventKey: 'po_approved',
    module: 'Procurement',
    inAppEnabled: true,
    emailEnabled: true,
    recipients: 'Purchase Manager, Supplier',
    priority: 'Success'
  },
  {
    id: 'RULE-06',
    eventName: 'Purchase Order Rejected',
    eventKey: 'po_rejected',
    module: 'Procurement',
    inAppEnabled: true,
    emailEnabled: true,
    recipients: 'Purchase Manager',
    priority: 'Error'
  },
  {
    id: 'RULE-07',
    eventName: 'Goods Received (Gate Entry)',
    eventKey: 'goods_received',
    module: 'Procurement',
    inAppEnabled: true,
    emailEnabled: true,
    recipients: 'Warehouse Manager, Purchase Manager',
    priority: 'Info'
  },
  {
    id: 'RULE-08',
    eventName: 'Purchase Order Completed',
    eventKey: 'po_completed',
    module: 'Procurement',
    inAppEnabled: true,
    emailEnabled: true,
    recipients: 'Purchase Manager, Accounts',
    priority: 'Success'
  }
];

export const INITIAL_ACTIVITIES: ActivityLog[] = [];
