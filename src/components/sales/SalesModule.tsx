import React, { useState } from 'react';
import { TrendingUp, ArrowRight, Plus, X, Save, CheckCircle, FileText } from 'lucide-react';
import { Product, Warehouse, InventoryTransaction } from '../../types';

interface SalesModuleProps {
  darkMode: boolean;
  products: Product[];
  warehouses: Warehouse[];
  onAddTransaction: (txn: InventoryTransaction) => void;
  onSelectProduct?: (id: string) => void;
}

interface SalesOrder {
  id: string;
  soNumber: string;
  clientName: string;
  productName: string;
  productCode: string;
  quantity: number;
  unitPrice: number;
  totalValue: number;
  warehouse: string;
  status: 'Completed & Dispatched' | 'Draft' | 'Processing';
  date: string;
}

export const SalesModule: React.FC<SalesModuleProps> = ({
  darkMode,
  products,
  warehouses,
  onAddTransaction,
  onSelectProduct,
}) => {
  const [activeTab, setActiveTab] = useState<'so' | 'clients' | 'dispatch'>('so');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Initial Sales Orders
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([
    {
      id: 'SO-1001',
      soNumber: 'SO-2026-5801',
      clientName: 'Tata Consumer Products Ltd',
      productName: 'Heavy Duty 5-Ply Corrugated Master Carton',
      productCode: 'BOX-RSC-5PLY-01',
      quantity: 1500,
      unitPrice: 58.00,
      totalValue: 87000,
      warehouse: 'Finished Goods Goods Bay A (WH-05)',
      status: 'Completed & Dispatched',
      date: '2026-08-05'
    },
    {
      id: 'SO-1002',
      soNumber: 'SO-2026-5802',
      clientName: 'Domino\'s Pizza India Ltd',
      productName: 'E-Flute Die-Cut Pizza / Food Box',
      productCode: 'BOX-PIZZA-3PLY',
      quantity: 5000,
      unitPrice: 17.50,
      totalValue: 87500,
      warehouse: 'Finished Goods Goods Bay A (WH-05)',
      status: 'Completed & Dispatched',
      date: '2026-08-04'
    }
  ]);

  // Form State
  const [formData, setFormData] = useState({
    clientName: '',
    productCode: '',
    quantity: 500,
    unitPrice: 0,
    warehouse: '',
    remarks: ''
  });

  const handleProductChange = (code: string) => {
    const prod = products.find(p => p.code === code);
    if (prod) {
      setFormData(prev => ({
        ...prev,
        productCode: code,
        unitPrice: prod.sellingPrice,
        warehouse: prod.warehouse
      }));
    }
  };

  const handleSaveSO = (e: React.FormEvent) => {
    e.preventDefault();
    const product = products.find(p => p.code === formData.productCode);

    if (!formData.clientName || !product) {
      alert('Please fill out all fields and select a valid product.');
      return;
    }

    const soNum = `SO-2026-${Math.floor(5000 + Math.random() * 4999)}`;
    const totalVal = formData.quantity * formData.unitPrice;
    const today = new Date().toISOString().slice(0, 10);

    const newSO: SalesOrder = {
      id: `SO-${Date.now()}`,
      soNumber: soNum,
      clientName: formData.clientName,
      productName: product.name,
      productCode: product.code,
      quantity: formData.quantity,
      unitPrice: formData.unitPrice,
      totalValue: totalVal,
      warehouse: formData.warehouse || product.warehouse,
      status: 'Completed & Dispatched',
      date: today
    };

    setSalesOrders([newSO, ...salesOrders]);

    // Automatically trigger Stock Out transaction movement!
    onAddTransaction({
      id: `TXN-${Date.now()}`,
      transactionNumber: `TRX-2026-${Math.floor(8000 + Math.random() * 900)}`,
      itemCode: product.code,
      itemName: product.name,
      itemType: 'Finished Product',
      warehouse: formData.warehouse || product.warehouse,
      quantity: formData.quantity, // positive quantity in call; handleAddTransaction converts to negative because type is Sales Dispatch
      previousStock: product.availableStock,
      currentStock: Math.max(0, product.availableStock - formData.quantity),
      transactionType: 'Sales Return',
      referenceType: 'Sales Order',
      referenceNumber: soNum,
      user: 'Rajesh Sharma', // Sales Manager
      date: today,
      time: new Date().toTimeString().slice(0, 5),
      reason: `Auto Dispatch Delivery against Sales Order Approval`,
      remarks: `Customer: ${formData.clientName} | Revenue: ₹${totalVal.toLocaleString()}`
    });

    setIsModalOpen(false);
    // Reset form
    setFormData({
      clientName: '',
      productCode: '',
      quantity: 500,
      unitPrice: 0,
      warehouse: '',
      remarks: ''
    });
  };

  const sections = [
    { title: 'Customer Master', count: 64, desc: 'B2B corporate clients & brand manufacturers' },
    { title: 'Sales Quotations', count: 28, desc: 'Custom carton pricing based on GSM & dimensions' },
    { title: 'Sales Orders', count: salesOrders.length + 33, desc: 'Approved box manufacturing & delivery orders' },
    { title: 'Dispatch & Delivery', count: 18, desc: 'Truck loading, E-way bill & dispatch challans' },
    { title: 'Sales Invoices', count: 52, desc: 'GST compliant billing and credit management' },
  ];

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className={`text-2xl font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
          Sales & Dispatch Architecture
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Customer orders, carton pricing quotations, e-way bill generation, and dispatch tracking.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map((sec, idx) => (
          <div key={idx} className={`p-5 rounded-2xl border transition-all ${
            darkMode ? 'bg-slate-900/85 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold">
                <TrendingUp className="w-4.5 h-4.5" />
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-500">
                {sec.count} Records
              </span>
            </div>
            <h3 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{sec.title}</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">{sec.desc}</p>
          </div>
        ))}
      </div>

      {/* Sub-Navigation Tabs */}
      <div className={`p-1.5 rounded-2xl border flex space-x-1 ${
        darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-100 border-slate-200'
      }`}>
        <button
          onClick={() => setActiveTab('so')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'so'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-100'
          }`}
        >
          Active Sales Orders (SO Ledger)
        </button>
        <button
          onClick={() => setActiveTab('clients')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'clients'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-100'
          }`}
        >
          Customer Directory (Read-only)
        </button>
        <button
          onClick={() => setActiveTab('dispatch')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'dispatch'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-100'
          }`}
        >
          Dispatch & Gatepass (Read-only)
        </button>
      </div>

      {/* SO Ledger workspace */}
      {activeTab === 'so' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className={`text-base font-bold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>Sales Orders Ledger</h3>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md shadow-blue-600/20 flex items-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Record New Sales Dispatch</span>
            </button>
          </div>

          <div className={`rounded-2xl border overflow-hidden ${darkMode ? 'bg-slate-900/85 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className={`border-b text-xs font-bold uppercase tracking-wider ${
                    darkMode ? 'bg-slate-800/80 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}>
                    <th className="p-4">SO # / Date</th>
                    <th className="p-4">B2B Customer Client</th>
                    <th className="p-4">Finished Product</th>
                    <th className="p-4">Dispatched Qty</th>
                    <th className="p-4">Invoice Revenue</th>
                    <th className="p-4">Source Warehouse</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                  {salesOrders.map(so => (
                    <tr key={so.id} className={`transition-colors ${darkMode ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50/80'}`}>
                      <td className="p-4">
                        <div className="font-bold text-xs font-mono text-blue-400">{so.soNumber}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{so.date}</div>
                      </td>
                      <td className="p-4 font-semibold text-xs">{so.clientName}</td>
                      <td className="p-4">
                        <div 
                          className={`font-bold text-xs text-teal-400 ${onSelectProduct ? 'cursor-pointer hover:underline' : ''}`}
                          onClick={() => {
                            if (onSelectProduct) {
                              const p = products.find(prod => prod.code === so.productCode);
                              if (p) onSelectProduct(p.id);
                            }
                          }}
                        >
                          {so.productCode}
                        </div>
                        <div className="text-xs text-slate-400 truncate max-w-[180px]">{so.productName}</div>
                      </td>
                      <td className="p-4 font-bold text-xs">{so.quantity.toLocaleString()} Pcs</td>
                      <td className="p-4 font-mono font-bold text-xs text-teal-400">₹{so.totalValue.toLocaleString()}</td>
                      <td className="p-4 text-xs text-slate-400">{so.warehouse.replace(/\s*\(.*\)/, '')}</td>
                      <td className="p-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          {so.status}
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

      {/* Static Sub-tabs */}
      {activeTab === 'clients' && (
        <div className={`p-8 rounded-2xl border text-center text-sm text-slate-400 ${darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
          <FileText className="w-10 h-10 mx-auto text-blue-500/40 mb-3" />
          <h4 className="font-bold mb-1">Customer CRM Directories</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">This directory aggregates premium consumer brands, manufacturing plants, and packaging buyers. Managed in collaboration with Sales Executives.</p>
        </div>
      )}

      {activeTab === 'dispatch' && (
        <div className={`p-8 rounded-2xl border text-center text-sm text-slate-400 ${darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
          <TrendingUp className="w-10 h-10 mx-auto text-blue-500/40 mb-3" />
          <h4 className="font-bold mb-1">E-Way Bills & Logistics Planning</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">Automated distance calculation, truck driver assigning, and digital gate passes are synchronized in real-time under logistics integrations.</p>
        </div>
      )}

      {/* New Sales Order Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
          <div className={`w-full max-w-xl rounded-3xl shadow-2xl border p-8 relative ${
            darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-800/50 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold mb-1">Record Sales Order Dispatch</h2>
            <p className="text-xs text-slate-400 mb-6">Posting this sales order dispatch will automatically deduct the finished boxes from inventory stock and log a Sales Dispatch outflow transaction.</p>

            <form onSubmit={handleSaveSO} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">B2B Customer Client</label>
                <input
                  type="text"
                  required
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  placeholder="e.g. Tata Consumer Products, Amazon India"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Select Finished Product to Dispatch</label>
                <select
                  required
                  value={formData.productCode}
                  onChange={(e) => handleProductChange(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                >
                  <option value="">-- Choose Finished Product --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.code}>{p.code} - {p.name} (Stock: {p.availableStock} {p.unit})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Dispatch Quantity (Pcs)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Unit Selling Price (₹ / Pc)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.unitPrice || 0}
                    onChange={(e) => setFormData({ ...formData, unitPrice: Number(e.target.value) })}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Source Goods Warehouse</label>
                <input
                  type="text"
                  disabled
                  value={formData.warehouse || 'Selected product warehouse location'}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm opacity-70 ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-500'}`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Logistics / Dispatch Challan Notes</label>
                <input
                  type="text"
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  placeholder="e.g. Dispatched via Gati Cargo Truck MH-12-PQ-4291 under E-Way bill 482120"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                />
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border text-sm font-semibold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm shadow-lg shadow-blue-600/30 flex items-center space-x-2 transition-all cursor-pointer hover:bg-blue-500"
                >
                  <Save className="w-4 h-4" />
                  <span>Approve & Dispatch Stock</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
