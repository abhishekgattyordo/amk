export interface SearchModuleConfig {
  key: string;
  label: string;
  endpoint: string;
  searchFields: string[];
  route: string;
  permission: string;
  iconName: string;
  codeField: string;
  nameField: string;
  subtitleBuilder: (item: any) => string;
}

export const SEARCH_MODULES: SearchModuleConfig[] = [
  {
    key: 'raw-materials',
    label: 'Raw Materials',
    endpoint: '/api/raw-materials',
    searchFields: ['code', 'name', 'description', 'grade'],
    route: 'inventory_raw',
    permission: 'inventory_raw:view',
    iconName: 'Package',
    codeField: 'code',
    nameField: 'name',
    subtitleBuilder: (item) => `Stock: ${item.currentStock || 0} ${item.uom || 'units'} • ${item.supplier?.supplierName || item.millName || 'Direct'}`
  },
  {
    key: 'products',
    label: 'Finished Products',
    endpoint: '/api/products',
    searchFields: ['code', 'name', 'boxType'],
    route: 'inventory_products',
    permission: 'inventory_products:view',
    iconName: 'Boxes',
    codeField: 'code',
    nameField: 'name',
    subtitleBuilder: (item) => `${item.boxType || 'Box'} • Stock: ${item.availableStock || 0} • ₹${item.unitPrice || 0}`
  },
  {
    key: 'suppliers',
    label: 'Suppliers & Mills',
    endpoint: '/api/suppliers',
    searchFields: ['code', 'supplierName', 'millName', 'category', 'city'],
    route: 'inventory_suppliers',
    permission: 'suppliers:view',
    iconName: 'Truck',
    codeField: 'code',
    nameField: 'supplierName',
    subtitleBuilder: (item) => `Mill: ${item.millName || 'N/A'} • ${item.category || 'General'} • ${item.city || ''}`
  },
  {
    key: 'categories',
    label: 'Categories',
    endpoint: '/api/categories',
    searchFields: ['code', 'name', 'type', 'description'],
    route: 'inventory_categories',
    permission: 'categories:view',
    iconName: 'Layers',
    codeField: 'code',
    nameField: 'name',
    subtitleBuilder: (item) => `Type: ${item.type || 'General'} • Items: ${item.itemsCount || 0}`
  },
  {
    key: 'subcategories',
    label: 'Subcategories',
    endpoint: '/api/subcategories',
    searchFields: ['code', 'name', 'description'],
    route: 'inventory_categories',
    permission: 'subcategories:view',
    iconName: 'Layers',
    codeField: 'code',
    nameField: 'name',
    subtitleBuilder: (item) => `Subcategory • ${item.description || 'No description'}`
  },
  {
    key: 'warehouses',
    label: 'Warehouses',
    endpoint: '/api/warehouses',
    searchFields: ['code', 'name', 'location', 'manager'],
    route: 'inventory_warehouses',
    permission: 'warehouses:view',
    iconName: 'Warehouse',
    codeField: 'code',
    nameField: 'name',
    subtitleBuilder: (item) => `Location: ${item.location || 'HQ'} • Manager: ${item.manager || 'Unassigned'}`
  },
  {
    key: 'purchase-orders',
    label: 'Purchase Orders',
    endpoint: '/api/purchase-orders',
    searchFields: ['poNumber', 'supplierName', 'status'],
    route: 'procurement_po',
    permission: 'procurement:view',
    iconName: 'ShoppingCart',
    codeField: 'poNumber',
    nameField: 'supplierName',
    subtitleBuilder: (item) => `PO: ${item.poNumber} • Status: ${item.status} • ₹${item.totalAmount || item.grandTotal || 0}`
  },
  {
    key: 'rfqs',
    label: 'RFQs',
    endpoint: '/api/rfqs',
    searchFields: ['rfqNumber', 'description', 'department', 'status'],
    route: 'procurement_rfq',
    permission: 'procurement:view',
    iconName: 'FileText',
    codeField: 'rfqNumber',
    nameField: 'description',
    subtitleBuilder: (item) => `RFQ: ${item.rfqNumber} • Dept: ${item.department} • Status: ${item.status}`
  },
  {
    key: 'stock-movements',
    label: 'Stock Movements',
    endpoint: '/api/stock-movements',
    searchFields: ['transactionNumber', 'referenceNumber', 'itemName', 'itemCode', 'type'],
    route: 'inventory_transactions',
    permission: 'inventory_transactions:view',
    iconName: 'ArrowLeftRight',
    codeField: 'transactionNumber',
    nameField: 'itemName',
    subtitleBuilder: (item) => `Ref: ${item.referenceNumber || 'N/A'} • Type: ${item.type} • Qty: ${item.quantity}`
  },
  {
    key: 'users',
    label: 'Users & Staff',
    endpoint: '/api/users',
    searchFields: ['name', 'email', 'department'],
    route: 'user_management',
    permission: 'users:view',
    iconName: 'Users',
    codeField: 'email',
    nameField: 'name',
    subtitleBuilder: (item) => `Dept: ${item.department || 'General'} • Role: ${item.role?.name || item.role || 'Staff'}`
  },
  {
    key: 'gate-entries',
    label: 'Gate Entries',
    endpoint: '/api/gate-entries',
    searchFields: ['entryNumber', 'vehicleNumber', 'supplierName', 'invoiceNo'],
    route: 'procurement_gate_entries',
    permission: 'procurement:view',
    iconName: 'Truck',
    codeField: 'entryNumber',
    nameField: 'supplierName',
    subtitleBuilder: (item) => `Vehicle: ${item.vehicleNumber} • Invoice: ${item.invoiceNo || 'N/A'}`
  },
  {
    key: 'quality-checks',
    label: 'Quality Checks',
    endpoint: '/api/quality-checks',
    searchFields: ['qcNumber', 'itemName', 'batchNumber', 'status'],
    route: 'procurement_qc',
    permission: 'procurement:view',
    iconName: 'ShieldAlert',
    codeField: 'qcNumber',
    nameField: 'itemName',
    subtitleBuilder: (item) => `Batch: ${item.batchNumber} • Status: ${item.status}`
  }
];
