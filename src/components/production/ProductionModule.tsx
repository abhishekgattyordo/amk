import React, { useState } from 'react';
import { Factory, Layers, CheckCircle, ArrowRight, Plus, X, Save, Settings } from 'lucide-react';
import { RawMaterial, Product, Warehouse, InventoryTransaction } from '../../types';

interface ProductionModuleProps {
  darkMode: boolean;
  rawMaterials: RawMaterial[];
  products: Product[];
  warehouses: Warehouse[];
  onAddTransaction: (txn: InventoryTransaction) => void;
  onSelectProduct?: (id: string) => void;
  onSelectMaterial?: (id: string) => void;
}

interface ProductionOrder {
  id: string;
  prodNumber: string;
  productName: string;
  productCode: string;
  producedQty: number;
  consumedMaterialName: string;
  consumedMaterialCode: string;
  consumedQty: number;
  machineLine: string;
  status: 'Completed & Stocked' | 'Scheduled' | 'Running';
  date: string;
}

export const ProductionModule: React.FC<ProductionModuleProps> = ({
  darkMode,
  rawMaterials,
  products,
  warehouses,
  onAddTransaction,
  onSelectProduct,
  onSelectMaterial,
}) => {
  const [activeTab, setActiveTab] = useState<'runs' | 'bom' | 'inspections'>('runs');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Initial Production Runs
  const [productionOrders, setProductionOrders] = useState<ProductionOrder[]>([
    {
      id: 'PROD-401',
      prodNumber: 'MFG-2026-4101',
      productName: 'Heavy Duty 5-Ply Corrugated Master Carton',
      productCode: 'BOX-RSC-5PLY-01',
      producedQty: 1000,
      consumedMaterialName: 'Virgin Kraft Liner Paper Roll',
      consumedMaterialCode: 'RM-KRAFT-180',
      consumedQty: 850,
      machineLine: 'Corrugator Line A (High-Speed)',
      status: 'Completed & Stocked',
      date: '2026-08-05'
    },
    {
      id: 'PROD-402',
      prodNumber: 'MFG-2026-4102',
      productName: 'E-Flute Die-Cut Pizza / Food Box',
      productCode: 'BOX-PIZZA-3PLY',
      producedQty: 2500,
      consumedMaterialName: 'Semi-Chemical Fluting Medium',
      consumedMaterialCode: 'RM-FLUTE-120',
      consumedQty: 600,
      machineLine: 'Corrugator Line B (E-Flute Specialized)',
      status: 'Completed & Stocked',
      date: '2026-08-04'
    }
  ]);

  // Form State
  const [formData, setFormData] = useState({
    productCode: '',
    producedQty: 500,
    materialCode: '',
    consumedQty: 400,
    machineLine: 'Corrugator Line A (High-Speed)',
    remarks: ''
  });

  const handleProductChange = (code: string) => {
    // Attempt to automatically suggest raw materials to consume based on typical ratios (BOM suggestions)
    const prod = products.find(p => p.code === code);
    let defaultMaterial = '';
    let suggestedConsumption = 0;

    if (prod) {
      if (prod.code.includes('5PLY')) {
        defaultMaterial = 'RM-KRAFT-180';
        suggestedConsumption = Math.floor(formData.producedQty * 0.85);
      } else if (prod.code.includes('PIZZA')) {
        defaultMaterial = 'RM-FLUTE-120';
        suggestedConsumption = Math.floor(formData.producedQty * 0.24);
      } else {
        defaultMaterial = rawMaterials[0]?.code || '';
        suggestedConsumption = Math.floor(formData.producedQty * 0.5);
      }

      setFormData(prev => ({
        ...prev,
        productCode: code,
        materialCode: defaultMaterial,
        consumedQty: suggestedConsumption
      }));
    }
  };

  const handleQtyChange = (qty: number) => {
    // Adjust suggested consumption on quantity change
    let suggestedConsumption = qty;
    if (formData.productCode.includes('5PLY')) {
      suggestedConsumption = Math.floor(qty * 0.85);
    } else if (formData.productCode.includes('PIZZA')) {
      suggestedConsumption = Math.floor(qty * 0.24);
    } else {
      suggestedConsumption = Math.floor(qty * 0.5);
    }

    setFormData(prev => ({
      ...prev,
      producedQty: qty,
      consumedQty: suggestedConsumption
    }));
  };

  const handleSaveProduction = (e: React.FormEvent) => {
    e.preventDefault();
    const product = products.find(p => p.code === formData.productCode);
    const material = rawMaterials.find(rm => rm.code === formData.materialCode);

    if (!product || !material) {
      alert('Please select both a valid product to produce and raw material to consume.');
      return;
    }

    const prodNum = `MFG-2026-${Math.floor(4000 + Math.random() * 5999)}`;
    const today = new Date().toISOString().slice(0, 10);

    const newProd: ProductionOrder = {
      id: `PROD-${Date.now()}`,
      prodNumber: prodNum,
      productName: product.name,
      productCode: product.code,
      producedQty: formData.producedQty,
      consumedMaterialName: material.name,
      consumedMaterialCode: material.code,
      consumedQty: formData.consumedQty,
      machineLine: formData.machineLine,
      status: 'Completed & Stocked',
      date: today
    };

    setProductionOrders([newProd, ...productionOrders]);

    // 1. Log Raw Material Consumption (Stock Out)
    onAddTransaction({
      id: `TXN-CONS-${Date.now()}`,
      transactionNumber: `TRX-2026-${Math.floor(8000 + Math.random() * 900)}`,
      itemCode: material.code,
      itemName: material.name,
      itemType: 'Raw Material',
      warehouse: material.warehouse,
      quantity: formData.consumedQty, // handleAddTransaction converts positive quantity to negative because type is Production Consumption
      previousStock: material.currentStock,
      currentStock: Math.max(0, material.currentStock - formData.consumedQty),
      transactionType: 'Production Issue',
      referenceType: 'Production Order',
      referenceNumber: prodNum,
      user: 'Amit Patel', // Production / Plant User
      date: today,
      time: new Date().toTimeString().slice(0, 5),
      reason: `Auto Material Draw for Work Order ${prodNum}`,
      remarks: `Consumed to manufacture ${formData.producedQty} Pcs of ${product.name}`
    });

    // 2. Log Finished Goods Receipt (Stock In)
    onAddTransaction({
      id: `TXN-RECP-${Date.now()}`,
      transactionNumber: `TRX-2026-${Math.floor(8000 + Math.random() * 900)}`,
      itemCode: product.code,
      itemName: product.name,
      itemType: 'Finished Product',
      warehouse: product.warehouse,
      quantity: formData.producedQty,
      previousStock: product.availableStock,
      currentStock: product.availableStock + formData.producedQty,
      transactionType: 'Production Issue',
      referenceType: 'Production Order',
      referenceNumber: prodNum,
      user: 'Amit Patel',
      date: today,
      time: new Date().toTimeString().slice(0, 5),
      reason: `Auto FG Receipt from Production Line Output`,
      remarks: `Manufactured on ${formData.machineLine}`
    });

    setIsModalOpen(false);
    // Reset form
    setFormData({
      productCode: '',
      producedQty: 500,
      materialCode: '',
      consumedQty: 400,
      machineLine: 'Corrugator Line A (High-Speed)',
      remarks: ''
    });
  };

  const sections = [
    { title: 'Production Planning', count: 14, desc: 'Master production schedule & shift allocation' },
    { title: 'Bill of Materials (BOM)', count: 28, desc: 'GSM and adhesive ratios for corrugated boxes' },
    { title: 'Production Orders', count: productionOrders.length + 40, desc: 'Active manufacturing runs on corrugator lines' },
    { title: 'Machine Allocation', count: 6, desc: 'Corrugator, flexo printing, and die-cutter status' },
    { title: 'Material Consumption', count: productionOrders.length + 83, desc: 'Reel consumption tracking against wastage norms' },
    { title: 'Quality Inspection', count: 19, desc: 'Bursting test, ECT, and ply-bond testing logs' },
  ];

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className={`text-2xl font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
          Production & Manufacturing Architecture
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Bill of materials, machine allocation, material consumption, and quality inspection workflows.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map((sec, idx) => (
          <div key={idx} className={`p-5 rounded-2xl border transition-all ${
            darkMode ? 'bg-slate-900/85 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-500 flex items-center justify-center font-bold">
                <Factory className="w-4.5 h-4.5" />
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-500/10 text-teal-500">
                {sec.count} Active
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
          onClick={() => setActiveTab('runs')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'runs'
              ? 'bg-teal-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-100'
          }`}
        >
          Manufacturing Work Orders (Floor Logs)
        </button>
        <button
          onClick={() => setActiveTab('bom')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'bom'
              ? 'bg-teal-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-100'
          }`}
        >
          Bill of Materials / BOM Recipes (Read-only)
        </button>
        <button
          onClick={() => setActiveTab('inspections')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'inspections'
              ? 'bg-teal-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-100'
          }`}
        >
          Quality Assurance Logs (Read-only)
        </button>
      </div>

      {/* Runs Workspace */}
      {activeTab === 'runs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className={`text-base font-bold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>Manufacturing Floor Orders</h3>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs shadow-md shadow-teal-600/20 flex items-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Record Finished Production Run</span>
            </button>
          </div>

          <div className={`rounded-2xl border overflow-hidden ${darkMode ? 'bg-slate-900/85 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className={`border-b text-xs font-bold uppercase tracking-wider ${
                    darkMode ? 'bg-slate-800/80 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}>
                    <th className="p-4">Run # / Date</th>
                    <th className="p-4">Produced finished good</th>
                    <th className="p-4">Quantity produced</th>
                    <th className="p-4">Consumed Raw Material</th>
                    <th className="p-4">Quantity consumed</th>
                    <th className="p-4">Machine Allocation</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                  {productionOrders.map(po => (
                    <tr key={po.id} className={`transition-colors ${darkMode ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50/80'}`}>
                      <td className="p-4">
                        <div className="font-bold text-xs font-mono text-blue-400">{po.prodNumber}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{po.date}</div>
                      </td>
                      <td className="p-4">
                        <div 
                          className={`font-bold text-xs text-teal-400 ${onSelectProduct ? 'cursor-pointer hover:underline' : ''}`}
                          onClick={() => {
                            if (onSelectProduct) {
                              const p = products.find(prod => prod.code === po.productCode);
                              if (p) onSelectProduct(p.id);
                            }
                          }}
                        >
                          {po.productCode}
                        </div>
                        <div className="text-xs text-slate-400 truncate max-w-[150px]">{po.productName}</div>
                      </td>
                      <td className="p-4 font-bold text-xs text-emerald-500">+{po.producedQty.toLocaleString()} Pcs</td>
                      <td className="p-4">
                        <div 
                          className={`font-bold text-xs text-amber-500 ${onSelectMaterial ? 'cursor-pointer hover:underline' : ''}`}
                          onClick={() => {
                            if (onSelectMaterial) {
                              const m = rawMaterials.find(mat => mat.code === po.consumedMaterialCode);
                              if (m) onSelectMaterial(m.id);
                            }
                          }}
                        >
                          {po.consumedMaterialCode}
                        </div>
                        <div className="text-xs text-slate-400 truncate max-w-[150px]">{po.consumedMaterialName}</div>
                      </td>
                      <td className="p-4 font-bold text-xs text-rose-500">-{po.consumedQty.toLocaleString()} Kg</td>
                      <td className="p-4 text-xs font-semibold text-slate-400">{po.machineLine}</td>
                      <td className="p-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          {po.status}
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
      {activeTab === 'bom' && (
        <div className={`p-8 rounded-2xl border text-center text-sm text-slate-400 ${darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
          <Layers className="w-10 h-10 mx-auto text-teal-500/40 mb-3" />
          <h4 className="font-bold mb-1">Standard Bill of Materials (BOM)</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">Standard formulation recipes, raw paper ratios, adhesive densities, and corrugation shrinkage calculations are configured in this panel.</p>
        </div>
      )}

      {activeTab === 'inspections' && (
        <div className={`p-8 rounded-2xl border text-center text-sm text-slate-400 ${darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
          <Settings className="w-10 h-10 mx-auto text-teal-500/40 mb-3" />
          <h4 className="font-bold mb-1">QA Calibrations & ECT/FCT Tests</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">Calibrations of pneumatic pressure, moisture testing results, and bursting factor checks are logged on finished batches in this section.</p>
        </div>
      )}

      {/* New Production Order Modal */}
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
            <h2 className="text-lg font-bold mb-1">Log Finished Production Run</h2>
            <p className="text-xs text-slate-400 mb-6">Completing a production run will automatically record a Consumption Stock Out in Raw Materials and a Production Receipt Stock In in Finished Products.</p>

            <form onSubmit={handleSaveProduction} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Product to Manufacture</label>
                  <select
                    required
                    value={formData.productCode}
                    onChange={(e) => handleProductChange(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                  >
                    <option value="">-- Select Product --</option>
                    {products.map(p => (
                      <option key={p.id} value={p.code}>{p.code} - {p.name} (Stock: {p.availableStock})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Manufactured Qty (Pcs)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formData.producedQty}
                    onChange={(e) => handleQtyChange(Number(e.target.value))}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-slate-200 dark:border-slate-800 pt-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1 text-amber-500">BOM Material to Consume</label>
                  <select
                    required
                    value={formData.materialCode}
                    onChange={(e) => setFormData({ ...formData, materialCode: e.target.value })}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                  >
                    <option value="">-- Select Raw Material --</option>
                    {rawMaterials.map(rm => (
                      <option key={rm.id} value={rm.code}>{rm.code} - {rm.name} (Stock: {rm.currentStock} Kg)</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1 text-rose-400">Consumed Quantity (Kg)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formData.consumedQty}
                    onChange={(e) => setFormData({ ...formData, consumedQty: Number(e.target.value) })}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Production Corrugation Line</label>
                  <select
                    value={formData.machineLine}
                    onChange={(e) => setFormData({ ...formData, machineLine: e.target.value })}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                  >
                    <option value="Corrugator Line A (High-Speed)">Corrugator Line A (High-Speed)</option>
                    <option value="Corrugator Line B (E-Flute Specialized)">Corrugator Line B (E-Flute Specialized)</option>
                    <option value="Flexo Printer Slotter Unit 03">Flexo Printer Slotter Unit 03</option>
                    <option value="Automatic Folder Gluer Stitcher">Automatic Folder Gluer Stitcher</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Floor Notes / Remarks</label>
                  <input
                    type="text"
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    placeholder="e.g. Standard 3-Ply flute run, starch mix ratio 1:4"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                  />
                </div>
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
                  className="px-6 py-2.5 rounded-xl bg-teal-600 text-white font-bold text-sm shadow-lg shadow-teal-600/30 flex items-center space-x-2 transition-all cursor-pointer hover:bg-teal-500"
                >
                  <Save className="w-4 h-4" />
                  <span>Log Production Complete</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
