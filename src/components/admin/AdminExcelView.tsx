'use client';

import React, { useState, useRef } from 'react';
import { 
  FileSpreadsheet, 
  Upload, 
  Download, 
  FileUp, 
  FileDown, 
  AlertCircle, 
  CheckCircle2, 
  ShieldAlert, 
  RefreshCw, 
  Trash2, 
  ArrowRight,
  Database,
  Info
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { 
  User, 
  RawMaterial, 
  Product, 
  Supplier, 
  Warehouse, 
  CategoryItem 
} from '../../types';

interface AdminExcelViewProps {
  currentUser: User | null;
  rawMaterials: RawMaterial[];
  products: Product[];
  suppliers: Supplier[];
  warehouses: Warehouse[];
  categories: CategoryItem[];
  
  onUpdateRawMaterials: (materials: RawMaterial[]) => void;
  onUpdateProducts: (products: Product[]) => void;
  onUpdateSuppliers: (suppliers: Supplier[]) => void;
  onUpdateWarehouses: (warehouses: Warehouse[]) => void;
  onUpdateCategories: (categories: CategoryItem[]) => void;
  onAddActivity: (activity: { action: string; module: string; details: string }) => void;
  
  darkMode: boolean;
  onSelectModule: (module: any) => void;
}

type DataType = 'raw_materials' | 'products' | 'suppliers' | 'warehouses' | 'categories';

interface ImportPreviewItem {
  id: string;
  code?: string;
  name?: string;
  isValid: boolean;
  errors: string[];
  data: any;
}

export const AdminExcelView: React.FC<AdminExcelViewProps> = ({
  currentUser,
  rawMaterials,
  products,
  suppliers,
  warehouses,
  categories,
  onUpdateRawMaterials,
  onUpdateProducts,
  onUpdateSuppliers,
  onUpdateWarehouses,
  onUpdateCategories,
  onAddActivity,
  darkMode,
  onSelectModule,
}) => {
  const [activeTab, setActiveTab] = useState<DataType>('raw_materials');
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importMode, setImportMode] = useState<'merge' | 'overwrite'>('merge');
  const [parsedData, setParsedData] = useState<ImportPreviewItem[]>([]);
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error' | ''; message: string }>({ type: '', message: '' });
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Security check - Admin only
  if (!currentUser || currentUser.role !== 'Administrator') {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center max-w-xl mx-auto">
        <div className={`p-4 rounded-full mb-6 ${darkMode ? 'bg-rose-500/10 text-rose-400' : 'bg-rose-50 text-rose-600'}`}>
          <ShieldAlert className="w-16 h-16 animate-pulse" />
        </div>
        <h2 className={`text-2xl font-black tracking-tight mb-3 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
          Access Restricted
        </h2>
        <p className={`text-sm mb-8 leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
          The Excel Import/Export administration portal is strictly restricted to user accounts with the <strong className="text-emerald-500">Administrator</strong> role. If you need access, please contact your systems architect.
        </p>
        <button
          onClick={() => onSelectModule('dashboard')}
          className="px-6 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/20 hover:from-emerald-500 hover:to-teal-500 transition-all flex items-center space-x-2"
        >
          <span>Return to Dashboard</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // 2. Schema definition & validation logic
  const getRequiredColumns = (type: DataType): string[] => {
    switch (type) {
      case 'raw_materials':
        return ['id', 'code', 'name', 'category', 'currentStock', 'purchasePrice'];
      case 'products':
        return ['id', 'code', 'name', 'category', 'costPrice', 'sellingPrice', 'availableStock'];
      case 'suppliers':
        return ['id', 'code', 'supplierName', 'millName', 'outstandingBalance'];
      case 'warehouses':
        return ['id', 'code', 'name', 'status'];
      case 'categories':
        return ['id', 'name', 'type', 'code'];
    }
  };

  const getSampleData = (type: DataType): any[] => {
    switch (type) {
      case 'raw_materials':
        return [
          {
            id: 'RM-TEMP-101',
            code: 'RM-KRAFT-250',
            name: 'Premium Virgin Kraft Paper Roll 250 GSM',
            category: 'Paper Rolls',
            subCategory: 'Kraft Paper',
            grade: 'VK-250',
            gsm: 250,
            thickness: 310,
            uom: 'Kg',
            hsnCode: '48041100',
            supplier: 'JK Paper Ltd',
            warehouse: 'Main Paper Warehouse (WH-01)',
            currentStock: 10000,
            minStock: 3000,
            maxStock: 25000,
            reorderLevel: 5000,
            purchasePrice: 65.50,
            status: 'Active',
            description: 'Ultra high-burst strength virgin liner roll for premium boxes.'
          },
          {
            id: 'RM-TEMP-102',
            code: 'RM-STARCH-MOD',
            name: 'Modified High-Viscosity Maize Starch',
            category: 'Chemicals & Adhesives',
            subCategory: 'Starch Glue',
            grade: 'M-STARCH-3',
            gsm: 0,
            thickness: 0,
            uom: 'Kg',
            hsnCode: '35051000',
            supplier: 'Gujarat Ambuja Exports',
            warehouse: 'Chemical & Consumables Store (WH-04)',
            currentStock: 5000,
            minStock: 1500,
            maxStock: 10000,
            reorderLevel: 2000,
            purchasePrice: 38.00,
            status: 'Active',
            description: 'Starch powder engineered for high-speed automatic pasting.'
          }
        ];
      case 'products':
        return [
          {
            id: 'PRD-TEMP-101',
            code: 'FP-BOX-101',
            name: 'Heavy Duty 5-Ply Shipping Carton',
            category: 'Corrugated Boxes',
            subCategory: 'Shipping Carton',
            boxType: 'RSC (Regular Slotted Carton)',
            dimensions: '450 x 350 x 300 mm',
            gsm: 450,
            unit: 'Boxes',
            hsnCode: '48191000',
            costPrice: 42.00,
            sellingPrice: 58.50,
            warehouse: 'Finished Goods Bay A (WH-03)',
            availableStock: 2500,
            status: 'Active',
            specifications: 'Flute Configuration: BC-Double Wall. Max load: 25kg.'
          }
        ];
      case 'suppliers':
        return [
          {
            id: 'SUP-TEMP-101',
            code: 'SUP-JK-001',
            supplierName: 'JK Paper Limited',
            millName: 'JK Fort Songadh Paper Mill',
            gstNumber: '24AAAAJ0001A1Z0',
            pan: 'AAAAJ0001A',
            contactPerson: 'Arvind Singhal',
            phone: '022-24356789',
            mobile: '9876543210',
            email: 'sales@jkpaper.com',
            website: 'www.jkpaper.com',
            paymentTerms: 'Net 30',
            creditDays: 30,
            address: '118, Nehru Place, Commercial Plaza',
            city: 'New Delhi',
            state: 'Delhi',
            country: 'India',
            pincode: '110019',
            status: 'Active',
            outstandingBalance: 1250000,
            rating: 5
          }
        ];
      case 'warehouses':
        return [
          {
            id: 'WH-TEMP-01',
            code: 'WH-CENTRAL-01',
            name: 'Central Raw Materials Yard',
            location: 'Sector 4, Industrial Area',
            manager: 'Vijay Kumar',
            capacitySqFt: 50000,
            currentUtilizationPercent: 78,
            totalBins: 120,
            activeItemsCount: 45,
            status: 'Operational'
          }
        ];
      case 'categories':
        return [
          {
            id: 'CAT-TEMP-01',
            name: 'Duplex Sheets',
            type: 'Raw Material',
            code: 'DUP-SHEET',
            description: 'Premium white-back and grey-back duplex board sheets for offsets',
            itemsCount: 12,
            status: 'Active'
          }
        ];
    }
  };

  const getTargetDataList = (type: DataType) => {
    switch (type) {
      case 'raw_materials': return rawMaterials;
      case 'products': return products;
      case 'suppliers': return suppliers;
      case 'warehouses': return warehouses;
      case 'categories': return categories;
    }
  };

  const getTabLabel = (type: DataType): string => {
    switch (type) {
      case 'raw_materials': return 'Raw Materials';
      case 'products': return 'Finished Goods';
      case 'suppliers': return 'Suppliers (Mills)';
      case 'warehouses': return 'Warehouses';
      case 'categories': return 'Categories';
    }
  };

  // 3. Export to Excel functionality
  const handleExport = (type: DataType) => {
    try {
      const dataToExport = getTargetDataList(type);
      if (dataToExport.length === 0) {
        alert('No data available to export.');
        return;
      }
      
      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, getTabLabel(type));
      
      // Auto-fit column widths beautifully
      const maxColWidths = dataToExport.reduce((acc: any, row: any) => {
        Object.keys(row).forEach((key, colIndex) => {
          const val = String(row[key] || '');
          const len = Math.max(val.length, key.length);
          acc[colIndex] = Math.min(Math.max(acc[colIndex] || 10, len + 2), 50);
        });
        return acc;
      }, []);
      
      worksheet['!cols'] = maxColWidths.map((width: number) => ({ wch: width }));
      
      const filename = `AMK_ERP_${type}_Export_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, filename);
      
      onAddActivity({
        action: 'Exported Data',
        module: 'Admin Excel Hub',
        details: `Exported ${dataToExport.length} rows of ${getTabLabel(type)} to Excel.`
      });
    } catch (error: any) {
      console.error(error);
      alert('Error exporting excel: ' + error.message);
    }
  };

  // 4. Download templates
  const handleDownloadTemplate = (type: DataType) => {
    try {
      const sample = getSampleData(type);
      const worksheet = XLSX.utils.json_to_sheet(sample);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, `${getTabLabel(type)} Template`);
      
      // Format column headers
      const filename = `AMK_ERP_${type}_Template.xlsx`;
      XLSX.writeFile(workbook, filename);
    } catch (error: any) {
      alert('Template generation error: ' + error.message);
    }
  };

  // 5. Drag-and-drop file upload helpers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
    if (e.target) {
      e.target.value = '';
    }
  };

  // 6. Process uploaded file & parse with XLSX
  const processFile = (file: File) => {
    // Check file extension
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension !== 'xlsx' && extension !== 'xls' && extension !== 'csv') {
      setImportStatus({
        type: 'error',
        message: 'Unsupported file format. Please upload an Excel (.xlsx, .xls) or CSV (.csv) file.'
      });
      return;
    }

    setSelectedFile(file);
    setImportStatus({ type: '', message: '' });
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet);

        if (rawJson.length === 0) {
          setImportStatus({
            type: 'error',
            message: 'The selected sheet appears to be empty.'
          });
          return;
        }

        // Validate structure
        const required = getRequiredColumns(activeTab);
        const headers = Object.keys(rawJson[0]);
        const missing = required.filter(col => !headers.includes(col));

        if (missing.length > 0) {
          setImportStatus({
            type: 'error',
            message: `Invalid column structure. Missing required headers: ${missing.join(', ')}. Please download the template.`
          });
          return;
        }

        // Validate rows
        const items: ImportPreviewItem[] = rawJson.map((row, idx) => {
          const errors: string[] = [];
          
          if (!row.id) {
            errors.push('Missing unique identifier (id)');
          }
          
          if (activeTab === 'raw_materials') {
            if (!row.code) errors.push('Missing code');
            if (!row.name) errors.push('Missing name');
            if (row.currentStock !== undefined && isNaN(Number(row.currentStock))) errors.push('currentStock must be a number');
            if (row.purchasePrice !== undefined && isNaN(Number(row.purchasePrice))) errors.push('purchasePrice must be a number');
          } else if (activeTab === 'products') {
            if (!row.code) errors.push('Missing code');
            if (!row.name) errors.push('Missing name');
            if (row.costPrice !== undefined && isNaN(Number(row.costPrice))) errors.push('costPrice must be a number');
            if (row.sellingPrice !== undefined && isNaN(Number(row.sellingPrice))) errors.push('sellingPrice must be a number');
            if (row.availableStock !== undefined && isNaN(Number(row.availableStock))) errors.push('availableStock must be a number');
          } else if (activeTab === 'suppliers') {
            if (!row.code) errors.push('Missing supplier code');
            if (!row.supplierName) errors.push('Missing supplier name');
            if (!row.millName) errors.push('Missing Mill Name');
            if (row.outstandingBalance !== undefined && isNaN(Number(row.outstandingBalance))) errors.push('outstandingBalance must be a number');
          } else if (activeTab === 'warehouses') {
            if (!row.code) errors.push('Missing warehouse code');
            if (!row.name) errors.push('Missing warehouse name');
          } else if (activeTab === 'categories') {
            if (!row.name) errors.push('Missing category name');
            if (!row.code) errors.push('Missing category code');
            if (row.type && !['Raw Material', 'Finished Product', 'Material Group'].includes(row.type)) {
              errors.push('Type must be "Raw Material", "Finished Product", or "Material Group"');
            }
          }

          return {
            id: row.id || `TEMP-${idx + 1}`,
            code: row.code,
            name: row.name || row.supplierName,
            isValid: errors.length === 0,
            errors,
            data: row
          };
        });

        setParsedData(items);
        
        const validCount = items.filter(i => i.isValid).length;
        if (validCount === 0) {
          setImportStatus({
            type: 'error',
            message: `Parsed ${items.length} records, but 0 are valid. Review validation errors below.`
          });
        } else {
          setImportStatus({
            type: 'success',
            message: `Successfully loaded ${items.length} records (${validCount} valid, ${items.length - validCount} with errors). Ready to apply.`
          });
        }
      } catch (err: any) {
        setImportStatus({
          type: 'error',
          message: 'Error processing Excel file: ' + err.message
        });
      }
    };

    reader.readAsArrayBuffer(file);
  };

  // 7. Apply parsed rows to the master state
  const handleApplyImport = () => {
    const validRows = parsedData.filter(item => item.isValid).map(item => {
      // Clean up numbers
      const d = { ...item.data };
      if (d.currentStock !== undefined) d.currentStock = Number(d.currentStock);
      if (d.purchasePrice !== undefined) d.purchasePrice = Number(d.purchasePrice);
      if (d.costPrice !== undefined) d.costPrice = Number(d.costPrice);
      if (d.sellingPrice !== undefined) d.sellingPrice = Number(d.sellingPrice);
      if (d.availableStock !== undefined) d.availableStock = Number(d.availableStock);
      if (d.outstandingBalance !== undefined) d.outstandingBalance = Number(d.outstandingBalance);
      if (d.creditDays !== undefined) d.creditDays = Number(d.creditDays);
      if (d.capacitySqFt !== undefined) d.capacitySqFt = Number(d.capacitySqFt);
      if (d.currentUtilizationPercent !== undefined) d.currentUtilizationPercent = Number(d.currentUtilizationPercent);
      if (d.totalBins !== undefined) d.totalBins = Number(d.totalBins);
      if (d.activeItemsCount !== undefined) d.activeItemsCount = Number(d.activeItemsCount);
      if (d.gsm !== undefined) d.gsm = Number(d.gsm);
      if (d.thickness !== undefined) d.thickness = Number(d.thickness);
      if (d.rating !== undefined) d.rating = Number(d.rating);
      return d;
    });

    if (validRows.length === 0) {
      alert('No valid records to apply.');
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      try {
        if (activeTab === 'raw_materials') {
          let updated: RawMaterial[];
          if (importMode === 'overwrite') {
            updated = validRows;
          } else {
            // Merge
            const originalMap = new Map(rawMaterials.map(item => [item.id, item]));
            validRows.forEach(row => {
              originalMap.set(row.id, { ...originalMap.get(row.id), ...row });
            });
            updated = Array.from(originalMap.values());
          }
          onUpdateRawMaterials(updated);
        } else if (activeTab === 'products') {
          let updated: Product[];
          if (importMode === 'overwrite') {
            updated = validRows;
          } else {
            const originalMap = new Map(products.map(item => [item.id, item]));
            validRows.forEach(row => {
              originalMap.set(row.id, { ...originalMap.get(row.id), ...row });
            });
            updated = Array.from(originalMap.values());
          }
          onUpdateProducts(updated);
        } else if (activeTab === 'suppliers') {
          let updated: Supplier[];
          if (importMode === 'overwrite') {
            updated = validRows;
          } else {
            const originalMap = new Map(suppliers.map(item => [item.id, item]));
            validRows.forEach(row => {
              originalMap.set(row.id, { ...originalMap.get(row.id), ...row });
            });
            updated = Array.from(originalMap.values());
          }
          onUpdateSuppliers(updated);
        } else if (activeTab === 'warehouses') {
          let updated: Warehouse[];
          if (importMode === 'overwrite') {
            updated = validRows;
          } else {
            const originalMap = new Map(warehouses.map(item => [item.id, item]));
            validRows.forEach(row => {
              originalMap.set(row.id, { ...originalMap.get(row.id), ...row });
            });
            updated = Array.from(originalMap.values());
          }
          onUpdateWarehouses(updated);
        } else if (activeTab === 'categories') {
          let updated: CategoryItem[];
          if (importMode === 'overwrite') {
            updated = validRows;
          } else {
            const originalMap = new Map(categories.map(item => [item.id, item]));
            validRows.forEach(row => {
              originalMap.set(row.id, { ...originalMap.get(row.id), ...row });
            });
            updated = Array.from(originalMap.values());
          }
          onUpdateCategories(updated);
        }

        onAddActivity({
          action: 'Imported Data via Excel',
          module: 'Admin Excel Hub',
          details: `Imported ${validRows.length} records into ${getTabLabel(activeTab)} using ${importMode} mode.`
        });

        alert(`Successfully imported ${validRows.length} records to ${getTabLabel(activeTab)}!`);
        handleClearImport();
      } catch (err: any) {
        alert('Failed to save imported records: ' + err.message);
      } finally {
        setIsProcessing(false);
      }
    }, 800);
  };

  const handleClearImport = () => {
    setSelectedFile(null);
    setParsedData([]);
    setImportStatus({ type: '', message: '' });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h1 className={`text-2xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                Administrator Excel Hub
              </h1>
              <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Complete bulk data import & export system using secure client-side Excel parsing
              </p>
            </div>
          </div>
        </div>
        
        {/* Export quick links */}
        <div className="flex items-center space-x-2 mt-4 md:mt-0">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-2">Quick Export:</span>
          <button 
            onClick={() => handleExport('raw_materials')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 ${
              darkMode ? 'bg-slate-900 hover:bg-slate-800 text-slate-300' : 'bg-white hover:bg-slate-50 border border-slate-200 text-slate-700'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Raw Materials</span>
          </button>
          <button 
            onClick={() => handleExport('products')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 ${
              darkMode ? 'bg-slate-900 hover:bg-slate-800 text-slate-300' : 'bg-white hover:bg-slate-50 border border-slate-200 text-slate-700'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Goods</span>
          </button>
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        {(['raw_materials', 'products', 'suppliers', 'warehouses', 'categories'] as DataType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              handleClearImport();
            }}
            className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
              activeTab === tab
                ? 'border-emerald-500 text-emerald-500 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {getTabLabel(tab)}
          </button>
        ))}
      </div>

      {/* Grid container: Left is Import, Right is Template & Info */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Core import card */}
        <div className={`lg:col-span-8 rounded-2xl border p-6 flex flex-col ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-md font-bold flex items-center space-x-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
              <Upload className="w-5 h-5 text-emerald-500" />
              <span>Bulk Import - {getTabLabel(activeTab)}</span>
            </h3>
            {selectedFile && (
              <button
                onClick={handleClearImport}
                className="text-xs font-bold text-red-500 hover:underline flex items-center space-x-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear upload</span>
              </button>
            )}
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInput}
            onClick={(e) => e.stopPropagation()}
            accept=".xlsx,.xls,.csv"
            className="hidden"
          />

          {/* Drag & Drop Box */}
          {!selectedFile ? (
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all flex flex-col items-center justify-center ${
                dragActive
                  ? 'border-emerald-500 bg-emerald-500/5'
                  : darkMode ? 'border-slate-700 bg-slate-950/20 hover:border-slate-600' : 'border-slate-300 bg-slate-50 hover:border-slate-400'
              }`}
            >
              <div className={`p-4 rounded-full mb-4 ${darkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                <FileUp className="w-10 h-10 text-emerald-500" />
              </div>
              <p className={`text-sm font-bold ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                Drag and drop your spreadsheet here, or <span className="text-emerald-500 hover:underline">browse files</span>
              </p>
              <p className={`text-xs mt-1.5 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                Supports Excel (.xlsx, .xls) and standard CSV sheets
              </p>
            </div>
          ) : (
            <div className={`p-4 rounded-xl border flex items-center space-x-4 mb-4 ${
              darkMode ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-100'
            }`}>
              <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-500">
                <FileSpreadsheet className="w-8 h-8" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-bold truncate ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                  {selectedFile.name}
                </p>
                <p className="text-xs text-slate-400">
                  Size: {(selectedFile.size / 1024).toFixed(1)} KB • Rows found: {parsedData.length}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors`}
                  title="Upload different file"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Import configs (Modes) */}
          {selectedFile && parsedData.length > 0 && (
            <div className="mt-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
              <h4 className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Import Mode Preferences
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className={`p-3 rounded-lg border cursor-pointer transition-all flex items-start space-x-3 ${
                  importMode === 'merge'
                    ? 'border-emerald-500 bg-emerald-500/5'
                    : darkMode ? 'border-slate-800 bg-transparent' : 'border-slate-200 bg-transparent'
                }`}>
                  <input
                    type="radio"
                    name="importMode"
                    value="merge"
                    checked={importMode === 'merge'}
                    onChange={() => setImportMode('merge')}
                    className="mt-1 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <span className={`block text-xs font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                      Merge & Update (Safe)
                    </span>
                    <span className="block text-[11px] text-slate-400 mt-0.5 leading-normal">
                      Updates matching ID rows with uploaded data; appends non-existing rows. Prevents complete data deletion.
                    </span>
                  </div>
                </label>

                <label className={`p-3 rounded-lg border cursor-pointer transition-all flex items-start space-x-3 ${
                  importMode === 'overwrite'
                    ? 'border-rose-500/40 bg-rose-500/5'
                    : darkMode ? 'border-slate-800 bg-transparent' : 'border-slate-200 bg-transparent'
                }`}>
                  <input
                    type="radio"
                    name="importMode"
                    value="overwrite"
                    checked={importMode === 'overwrite'}
                    onChange={() => setImportMode('overwrite')}
                    className="mt-1 text-rose-600 focus:ring-rose-500"
                  />
                  <div>
                    <span className={`block text-xs font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                      Full Overwrite (Replace)
                    </span>
                    <span className="block text-[11px] text-slate-400 mt-0.5 leading-normal text-rose-400">
                      WARNING: This completely deletes all current records in {getTabLabel(activeTab)} and replaces them with this file's valid rows.
                    </span>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Status Message */}
          {importStatus.message && (
            <div className={`mt-4 p-3.5 rounded-xl flex items-start space-x-3 border ${
              importStatus.type === 'success'
                ? 'bg-emerald-500/5 border-emerald-500/30 text-emerald-400'
                : 'bg-rose-500/5 border-rose-500/30 text-rose-400'
            }`}>
              {importStatus.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 shrink-0" />
              )}
              <span className="text-xs font-medium leading-relaxed">
                {importStatus.message}
              </span>
            </div>
          )}

          {/* Table Preview */}
          {parsedData.length > 0 && (
            <div className="mt-5 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden flex-1 flex flex-col">
              <div className={`px-4 py-2.5 border-b font-semibold text-xs uppercase tracking-wider flex items-center justify-between ${
                darkMode ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
              }`}>
                <span>Parsed Spreadsheet Rows (Valid: {parsedData.filter(p => p.isValid).length})</span>
                <span className="text-[10px] text-emerald-500 font-bold">Previewing first 10 rows</span>
              </div>
              
              <div className="overflow-x-auto max-h-60 overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className={darkMode ? 'bg-slate-900 text-slate-400' : 'bg-slate-100 text-slate-600'}>
                    <tr className="border-b border-slate-200 dark:border-slate-800">
                      <th className="p-2 font-semibold">Row UID</th>
                      <th className="p-2 font-semibold">Code / Key</th>
                      <th className="p-2 font-semibold">Display Title / Name</th>
                      <th className="p-2 font-semibold text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.slice(0, 10).map((row, idx) => (
                      <tr 
                        key={idx} 
                        className={`border-b border-slate-200 dark:border-slate-800/40 hover:bg-slate-800/10 ${
                          !row.isValid ? 'bg-rose-500/5' : ''
                        }`}
                      >
                        <td className="p-2 font-mono font-bold text-slate-400">{row.id}</td>
                        <td className="p-2 font-semibold">{row.code || 'N/A'}</td>
                        <td className="p-2 font-medium truncate max-w-xs">{row.name || 'Unknown'}</td>
                        <td className="p-2 text-center">
                          {row.isValid ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400 font-bold">
                              Valid Row
                            </span>
                          ) : (
                            <span 
                              className="px-2 py-0.5 rounded-full text-[10px] bg-rose-500/10 text-rose-400 font-bold cursor-help"
                              title={row.errors.join(', ')}
                            >
                              Error: {row.errors[0]}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Action Footer */}
          {selectedFile && parsedData.length > 0 && (
            <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end space-x-3">
              <button
                onClick={handleClearImport}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold ${
                  darkMode ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-700'
                }`}
              >
                Cancel
              </button>
              
              <button
                onClick={handleApplyImport}
                disabled={isProcessing || parsedData.filter(p => p.isValid).length === 0}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/20 hover:from-emerald-500 hover:to-teal-500 transition-all flex items-center space-x-1.5 disabled:opacity-50"
              >
                {isProcessing ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Apply Import ({parsedData.filter(p => p.isValid).length} Rows)</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Info & Download Templates Sidebar Panel */}
        <div className="lg:col-span-4 space-y-6">
          {/* Download Templates Card */}
          <div className={`rounded-2xl border p-6 ${
            darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <h3 className={`text-sm font-bold flex items-center space-x-2 mb-4 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
              <Download className="w-4.5 h-4.5 text-emerald-500" />
              <span>Reference Templates</span>
            </h3>
            <p className={`text-xs mb-4 leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Download pre-structured Excel templates containing the correct column formats and test rows. Simply edit and re-upload!
            </p>

            <div className="space-y-2">
              <button
                onClick={() => handleDownloadTemplate(activeTab)}
                className="w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all bg-emerald-500/5 hover:bg-emerald-500/10 border-emerald-500/20"
              >
                <div className="flex items-center space-x-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
                  <div>
                    <span className="block text-xs font-bold text-emerald-400">
                      Download {getTabLabel(activeTab)} Template
                    </span>
                    <span className="block text-[10px] text-slate-400 mt-0.5">
                      Contains exact table headers
                    </span>
                  </div>
                </div>
                <FileDown className="w-4 h-4 text-emerald-500" />
              </button>

              <div className="pt-2 border-t border-slate-800/50 mt-4">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Other Templates:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {(['raw_materials', 'products', 'suppliers', 'warehouses', 'categories'] as DataType[])
                    .filter(t => t !== activeTab)
                    .map(tab => (
                      <button
                        key={tab}
                        onClick={() => handleDownloadTemplate(tab)}
                        className={`p-2 rounded-lg border text-left transition-colors flex items-center justify-between ${
                          darkMode ? 'bg-slate-950/40 border-slate-800 hover:bg-slate-800/40 text-slate-300' : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <span className="text-[10px] font-bold truncate">{getTabLabel(tab)}</span>
                        <Download className="w-3 h-3 text-slate-400 shrink-0 ml-1" />
                      </button>
                    ))
                  }
                </div>
              </div>
            </div>
          </div>

          {/* Secure System Instructions Box */}
          <div className={`rounded-2xl border p-5 space-y-3.5 ${
            darkMode ? 'bg-slate-900/60 border-slate-800 text-slate-400' : 'bg-slate-50/60 border-slate-200 text-slate-600'
          }`}>
            <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
              <Info className="w-4 h-4 text-emerald-500" />
              <span>ERP Data Integrity Rules</span>
            </h4>
            <ul className="space-y-2 text-[11px] leading-relaxed list-disc list-inside">
              <li>
                Each item must have a unique <strong className={darkMode ? 'text-slate-200' : 'text-slate-800'}>id</strong> (e.g. RM-101, FP-BOX-101).
              </li>
              <li>
                If you use "Merge & Update", existing rows matching ID will update fields; new IDs append.
              </li>
              <li>
                Number cells (Stock counts, Pricing, GSM) must not contain text or currency symbols (like ₹ or $).
              </li>
              <li>
                HSN Code columns should be kept as text/string to prevent leading zero omission.
              </li>
              <li>
                All parsed records are saved locally in standard secure browser state and synchronized dynamically.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
