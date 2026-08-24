import React from 'react';
import { UserAvatar } from '../common/UserAvatar';
import { 
  Package, 
  Boxes, 
  Truck, 
  Warehouse as WarehouseIcon, 
  DollarSign, 
  ShoppingCart, 
  Factory, 
  AlertTriangle,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  Plus,
  FileText,
  RefreshCw
} from 'lucide-react';
import * as Recharts from 'recharts';
import { RawMaterial, Product, Supplier, Warehouse, ActivityLog, ModuleType } from '../../types';

interface DashboardViewProps {
  rawMaterials: RawMaterial[];
  products: Product[];
  suppliers: Supplier[];
  warehouses: Warehouse[];
  activities: ActivityLog[];
  onSelectModule: (module: ModuleType) => void;
  onSelectProduct?: (id: string) => void;
  onSelectMaterial?: (id: string) => void;
  darkMode: boolean;
}

const inventoryGrowthData = [
  { month: 'Jan', value: 8200000 },
  { month: 'Feb', value: 8900000 },
  { month: 'Mar', value: 9400000 },
  { month: 'Apr', value: 10200000 },
  { month: 'May', value: 11100000 },
  { month: 'Jun', value: 11800000 },
  { month: 'Jul', value: 12500000 },
  { month: 'Aug', value: 14200000 },
];

const purchaseTrendsData = [
  { week: 'W1', purchases: 1200000, consumption: 980000 },
  { week: 'W2', purchases: 1500000, consumption: 1350000 },
  { week: 'W3', purchases: 950000, consumption: 1100000 },
  { week: 'W4', purchases: 1800000, consumption: 1650000 },
];

const warehouseShareData = [
  { name: 'Main Paper WH', value: 38, color: '#10b981' },
  { name: 'Finished Goods A', value: 28, color: '#3b82f6' },
  { name: 'Finished Board Store', value: 18, color: '#f59e0b' },
  { name: 'Raw Material Bay B', value: 16, color: '#8b5cf6' },
];

export const DashboardView: React.FC<DashboardViewProps> = ({
  rawMaterials,
  products,
  suppliers,
  warehouses,
  activities,
  onSelectModule,
  onSelectProduct,
  onSelectMaterial,
  darkMode,
}) => {
  const totalInventoryValue = rawMaterials.reduce((acc, rm) => acc + (rm.currentStock * rm.purchasePrice), 0) +
                             products.reduce((acc, p) => acc + (p.availableStock * p.costPrice), 0);

  const lowStockItems = rawMaterials.filter(rm => rm.currentStock <= rm.reorderLevel);

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Executive Manufacturing Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Real-time analytics for paper carton production, mill procurement, and warehouse stock levels.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => onSelectModule('inventory_raw')}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-600/20 flex items-center space-x-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Raw Material</span>
          </button>
          <button
            onClick={() => onSelectModule('inventory_transactions')}
            className={`px-4 py-2 rounded-xl border text-xs font-semibold flex items-center space-x-2 transition-colors ${
              darkMode ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            <span>Stock Ledger</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Products */}
        <div 
          onClick={() => onSelectModule('inventory_products')}
          className={`p-6 rounded-2xl border transition-all cursor-pointer hover:shadow-xl group ${
            darkMode ? 'bg-slate-900/80 border-slate-800 hover:border-emerald-500/50' : 'bg-white border-slate-200/80 hover:border-emerald-500/50 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${
              darkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'
            }`}>
              <Boxes className="w-6 h-6" />
            </div>
            <span className="flex items-center text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              <ArrowUpRight className="w-3 h-3 mr-0.5" /> +12.4%
            </span>
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Finished Products</p>
          <h3 className={`text-2xl font-black mt-1 ${darkMode ? 'text-white' : 'text-slate-900'}`}>{products.length} Items</h3>
          <p className="text-xs text-slate-500 mt-2">Active corrugated & duplex boxes</p>
        </div>

        {/* Raw Materials */}
        <div 
          onClick={() => onSelectModule('inventory_raw')}
          className={`p-6 rounded-2xl border transition-all cursor-pointer hover:shadow-xl group ${
            darkMode ? 'bg-slate-900/80 border-slate-800 hover:border-teal-500/50' : 'bg-white border-slate-200/80 hover:border-teal-500/50 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${
              darkMode ? 'bg-teal-500/10 text-teal-400' : 'bg-teal-50 text-teal-600'
            }`}>
              <Package className="w-6 h-6" />
            </div>
            <span className="flex items-center text-xs font-bold text-teal-500 bg-teal-500/10 px-2 py-0.5 rounded-full">
              <ArrowUpRight className="w-3 h-3 mr-0.5" /> +8.1%
            </span>
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Raw Materials</p>
          <h3 className={`text-2xl font-black mt-1 ${darkMode ? 'text-white' : 'text-slate-900'}`}>{rawMaterials.length} Masters</h3>
          <p className="text-xs text-slate-500 mt-2">Kraft reels, fluting, duplex boards</p>
        </div>

        {/* Active Suppliers */}
        <div 
          onClick={() => onSelectModule('inventory_suppliers')}
          className={`p-6 rounded-2xl border transition-all cursor-pointer hover:shadow-xl group ${
            darkMode ? 'bg-slate-900/80 border-slate-800 hover:border-amber-500/50' : 'bg-white border-slate-200/80 hover:border-amber-500/50 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${
              darkMode ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-600'
            }`}>
              <Truck className="w-6 h-6" />
            </div>
            <span className="flex items-center text-xs font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">
              <span>Verified Mills</span>
            </span>
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Suppliers</p>
          <h3 className={`text-2xl font-black mt-1 ${darkMode ? 'text-white' : 'text-slate-900'}`}>{suppliers.length} Mills</h3>
          <p className="text-xs text-slate-500 mt-2">BILT, TNPL, West Coast & JK</p>
        </div>

        {/* Inventory Value */}
        <div 
          onClick={() => onSelectModule('inventory_stock')}
          className={`p-6 rounded-2xl border transition-all cursor-pointer hover:shadow-xl group ${
            darkMode ? 'bg-slate-900/80 border-slate-800 hover:border-indigo-500/50' : 'bg-white border-slate-200/80 hover:border-indigo-500/50 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${
              darkMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'
            }`}>
              <DollarSign className="w-6 h-6" />
            </div>
            <span className="flex items-center text-xs font-bold text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded-full">
              <ArrowUpRight className="w-3 h-3 mr-0.5" /> +15.3%
            </span>
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Inventory Value</p>
          <h3 className={`text-2xl font-black mt-1 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            ₹{(totalInventoryValue / 100000).toFixed(2)} Lakhs
          </h3>
          <p className="text-xs text-slate-500 mt-2">Combined raw & finished valuation</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Inventory Growth Trend */}
        <div className={`lg:col-span-8 p-6 rounded-2xl border ${darkMode ? 'bg-slate-900/85 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className={`text-base font-bold ${darkMode ? 'text-white' : 'text-slate-950'}`}>Inventory Valuation Growth (INR)</h2>
              <p className="text-xs text-slate-500">Monthly stock valuation across all manufacturing warehouses</p>
            </div>
            <span className="px-3 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-500">
              Live Analytics
            </span>
          </div>
          <div className="h-72 w-full">
            <Recharts.ResponsiveContainer width="100%" height="100%">
              <Recharts.AreaChart data={inventoryGrowthData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <Recharts.CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#e2e8f0'} />
                <Recharts.XAxis dataKey="month" stroke={darkMode ? '#94a3b8' : '#64748b'} fontSize={12} />
                <Recharts.YAxis stroke={darkMode ? '#94a3b8' : '#64748b'} fontSize={12} tickFormatter={(val) => `₹${val / 100000}L`} />
                <Recharts.Tooltip 
                  contentStyle={{ backgroundColor: darkMode ? '#1e293b' : '#ffffff', borderColor: darkMode ? '#334155' : '#e2e8f0', borderRadius: '12px', color: darkMode ? '#fff' : '#000' }}
                  formatter={(val: any) => [`₹${(Number(val)).toLocaleString()}`, 'Valuation']}
                />
                <Recharts.Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
              </Recharts.AreaChart>
            </Recharts.ResponsiveContainer>
          </div>
        </div>

        {/* Warehouse Distribution */}
        <div className={`lg:col-span-4 p-6 rounded-2xl border ${darkMode ? 'bg-slate-900/85 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className={`text-base font-bold ${darkMode ? 'text-white' : 'text-slate-950'}`}>Warehouse Capacity</h2>
              <p className="text-xs text-slate-500">Storage utilization share</p>
            </div>
            <WarehouseIcon className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="h-56 w-full flex items-center justify-center">
            <Recharts.ResponsiveContainer width="100%" height="100%">
              <Recharts.PieChart>
                <Recharts.Pie
                  data={warehouseShareData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {warehouseShareData.map((entry, index) => (
                    <Recharts.Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Recharts.Pie>
                <Recharts.Tooltip 
                  contentStyle={{ backgroundColor: darkMode ? '#1e293b' : '#ffffff', borderColor: darkMode ? '#334155' : '#e2e8f0', borderRadius: '8px' }}
                  formatter={(val: any) => [`${val}%`, 'Capacity Share']}
                />
              </Recharts.PieChart>
            </Recharts.ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-2">
            {warehouseShareData.map(item => (
              <div key={item.name} className="flex items-center space-x-2 text-xs">
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }}></span>
                <span className="text-slate-400 truncate">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Products & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Top Products */}
        <div className={`lg:col-span-8 p-6 rounded-2xl border ${darkMode ? 'bg-slate-900/85 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              <h2 className={`text-base font-bold ${darkMode ? 'text-white' : 'text-slate-950'}`}>Fast Moving Products</h2>
            </div>
            <button 
              onClick={() => onSelectModule('inventory_products')}
              className="text-xs text-blue-500 hover:underline font-semibold"
            >
              View All Products →
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {products.slice(0, 4).map((p) => (
              <div 
                key={p.id} 
                onClick={() => onSelectProduct?.(p.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer group ${
                  darkMode ? 'bg-slate-800/40 border-slate-700 hover:border-emerald-500/50' : 'bg-slate-50 border-slate-200 hover:border-emerald-500/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 font-bold">
                      {p.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-bold group-hover:text-emerald-500 transition-colors">{p.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{p.code}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold">₹{p.sellingPrice.toLocaleString()}</div>
                    <div className="text-[10px] text-emerald-500">In Stock: {p.availableStock}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Warehouse Stats Summary */}
        <div className={`lg:col-span-4 p-6 rounded-2xl border ${darkMode ? 'bg-slate-900/85 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <WarehouseIcon className="w-5 h-5 text-indigo-500" />
              <h2 className={`text-base font-bold ${darkMode ? 'text-white' : 'text-slate-950'}`}>Warehouse Summary</h2>
            </div>
          </div>
          <div className="space-y-4">
            {warehouses.slice(0, 3).map(wh => (
              <div key={wh.id} className="space-y-1">
                <div className="flex justify-between text-xs font-bold">
                  <span>{wh.name}</span>
                  <span className="text-slate-500">75% Full</span>
                </div>
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: '75%' }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lower Grid: Low Stock Alerts & Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Low Stock Alerts */}
        <div className={`lg:col-span-6 p-6 rounded-2xl border ${darkMode ? 'bg-slate-900/85 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h2 className={`text-base font-bold ${darkMode ? 'text-white' : 'text-slate-950'}`}>Low Stock & Reorder Alerts</h2>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-500">
              {lowStockItems.length} Items
            </span>
          </div>
          <div className="space-y-3">
            {lowStockItems.length === 0 ? (
              <p className="text-sm text-slate-400 py-6 text-center">All inventory levels are healthy!</p>
            ) : (
              lowStockItems.map(item => (
                <div 
                  key={item.id} 
                  className={`p-4 rounded-xl border flex items-center justify-between ${onSelectMaterial ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
                  onClick={() => onSelectMaterial?.(item.id)}
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-amber-600 dark:text-amber-400 hover:underline">{item.name}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300">{item.code}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Current: <span className="font-bold text-rose-500">{item.currentStock} {item.uom}</span> (Reorder level: {item.reorderLevel})</p>
                  </div>
                  <button
                    onClick={() => onSelectModule('inventory_raw')}
                    className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition-colors shrink-0"
                  >
                    Reorder Mill PO
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Activities */}
        <div className={`lg:col-span-6 p-6 rounded-2xl border ${darkMode ? 'bg-slate-900/85 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-emerald-500" />
              <h2 className={`text-base font-bold ${darkMode ? 'text-white' : 'text-slate-950'}`}>Recent Enterprise Activities</h2>
            </div>
            <button
              onClick={() => onSelectModule('inventory_transactions')}
              className="text-xs text-emerald-500 hover:underline font-semibold"
            >
              View Ledger →
            </button>
          </div>
          <div className="space-y-4">
            {activities.slice(0, 4).map(act => (
              <div key={act.id} className="flex items-start space-x-3 text-sm">
                <UserAvatar name={act.user} size="md" className="mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={`font-bold text-xs ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{act.action}</p>
                    <span className="text-[10px] text-slate-400 font-mono">{act.timestamp}</span>
                  </div>
                  <p className="text-xs text-slate-500 truncate mt-0.5">{act.details}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
