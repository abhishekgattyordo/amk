import React, { useState, useRef, useEffect } from 'react';
import { Upload, Camera, CheckCircle, AlertTriangle, Loader2, RefreshCw, X, Sparkles, FileText, Image as ImageIcon, Eye, ChevronDown, ChevronUp, Building2, FileCheck, Layers, Percent, FileCode } from 'lucide-react';

export interface ExtractedSupplier {
  name?: string;
  address?: string;
  gstin?: string;
  state?: string;
  stateCode?: string;
  email?: string;
  phone?: string;
}

export interface ExtractedBuyer {
  name?: string;
  address?: string;
  gstin?: string;
  state?: string;
  stateCode?: string;
  placeOfSupply?: string;
}

export interface ExtractedDocument {
  documentType?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  referenceNumber?: string;
  referenceDate?: string;
  buyerOrderNumber?: string;
  buyerOrderDate?: string;
  deliveryNoteNumber?: string;
  deliveryNoteDate?: string;
  dispatchDocumentNumber?: string;
  dispatchDate?: string;
  paymentTerms?: string;
  modeOfPayment?: string;
  termsOfDelivery?: string;
  destination?: string;
  dispatchedThrough?: string;
  billOfLadingLrRrNo?: string;
  motorVehicleNumber?: string;
}

export interface ExtractedItem {
  slNo?: string;
  name?: string;
  description?: string;
  materialCode?: string;
  model?: string;
  size?: string;
  hsnSacCode?: string;
  quantity?: number;
  unit?: string;
  rate?: number;
  ratePerUnit?: number;
  unitPrice?: number;
  discount?: number;
  taxableValue?: number;
  amount?: number;
  totalAmount?: number;
}

export interface ExtractedTaxes {
  cgstRate?: number;
  cgstAmount?: number;
  sgstRate?: number;
  sgstAmount?: number;
  igstRate?: number;
  igstAmount?: number;
  otherTaxes?: number;
  totalTaxAmount?: number;
  taxableValue?: number;
}

export interface ExtractedTotals {
  subtotal?: number;
  totalQuantity?: number;
  totalInvoiceValue?: number;
  totalAmountBeforeTax?: number;
  totalTax?: number;
  totalAmountAfterTax?: number;
  roundOff?: number;
  amountInWords?: string;
  taxAmountInWords?: string;
}

export interface ExtractedAdditional {
  declaration?: string;
  notes?: string;
  termsAndConditions?: string;
  authorizedSignatory?: string;
  preparedBy?: string;
  verifiedBy?: string;
  companyStamp?: string;
  signature?: string;
}

export interface ExtractedMaterial {
  name?: string;
  code?: string;
  hsnCode?: string;
  description?: string;
  quantity?: number;
  unit?: string;
  unitPrice?: number;
  totalAmount?: number;
}

export interface ExtractedInvoiceData {
  supplier?: ExtractedSupplier;
  buyer?: ExtractedBuyer;
  document?: ExtractedDocument;
  items?: ExtractedItem[];
  taxes?: ExtractedTaxes;
  totals?: ExtractedTotals;
  additional?: ExtractedAdditional;

  // Backward compatibility fields
  supplierName?: string;
  poNumber?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  vehicleNumber?: string;
  driverName?: string;
  driverPhone?: string;
  transporterName?: string;
  transportCompany?: string;
  modeOfTransport?: string;
  materials?: ExtractedMaterial[];
  totalAmount?: number;
  gstDetails?: string;
  warehouse?: string;
  warnings?: string[];
}

interface InvoiceScannerProps {
  onDataExtracted: (data: ExtractedInvoiceData) => void;
  onScanStart?: () => void;
  onScanError?: (error: string) => void;
  darkMode: boolean;
  onClear?: () => void;
  className?: string;
}

export const InvoiceScanner: React.FC<InvoiceScannerProps> = ({
  onDataExtracted,
  onScanStart,
  onScanError,
  darkMode,
  onClear,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'camera'>('upload');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedInvoiceData | null>(null);
  const [extractionWarnings, setExtractionWarnings] = useState<string[]>([]);
  const [showFullDetails, setShowFullDetails] = useState(false);

  // Camera state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setCameraError(null);
    setError(null);
    setCapturedImage(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError("Camera access is not supported or restricted in this browser context.");
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      };

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (err) {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }

      mediaStreamRef.current = stream;
      setIsCameraActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(e => console.warn("Video play exception:", e));
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError("Camera permission was denied. Please allow camera access in browser settings to scan invoices.");
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError("No camera device found on your device.");
      } else {
        setCameraError("Unable to access camera: " + (err.message || "Unknown error"));
      }
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      setCapturedImage(dataUrl);
      stopCamera();
    }
  };

  const processInvoiceAi = async (base64Data: string, mimeType: string) => {
    setLoading(true);
    setError(null);
    setExtractionWarnings([]);
    if (onScanStart) onScanStart();

    try {
      const response = await fetch('/api/gemini/scan-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileBase64: base64Data,
          mimeType: mimeType
        }),
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error || "Failed to process invoice with AI.");
      }

      const warnings: string[] = [];
      const vehicleNum = result.vehicleNumber || result.document?.motorVehicleNumber;
      if (!vehicleNum) {
        warnings.push("Vehicle number not found in document.");
      }
      const poNum = result.poNumber || result.document?.buyerOrderNumber;
      if (!poNum) {
        warnings.push("Buyer PO reference not explicitly stated.");
      }
      const suppName = result.supplierName || result.supplier?.name;
      if (!suppName) {
        warnings.push("Supplier name not clearly identified.");
      }
      const totalItems = (result.items?.length || result.materials?.length || 0);
      if (totalItems === 0) {
        warnings.push("No line items extracted. Please verify document readability.");
      }

      const finalData: ExtractedInvoiceData = {
        ...result,
        warnings
      };

      setExtractedData(finalData);
      setExtractionWarnings(warnings);
      onDataExtracted(finalData);
    } catch (err: any) {
      console.error("AI Scan Error:", err);
      const msg = err.message || "Unable to read invoice/quotation. Please check document quality or enter fields manually.";
      setError(msg);
      if (onScanError) onScanError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileType = file.type || '';
    let mimeType = 'application/pdf';

    if (fileType.includes('png')) {
      mimeType = 'image/png';
    } else if (fileType.includes('jpeg') || fileType.includes('jpg')) {
      mimeType = 'image/jpeg';
    } else if (fileType.includes('pdf')) {
      mimeType = 'application/pdf';
    } else {
      const fileName = file.name.toLowerCase();
      if (fileName.endsWith('.png')) mimeType = 'image/png';
      else if (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg')) mimeType = 'image/jpeg';
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const resultStr = reader.result as string;
      const base64Data = resultStr.includes(',') ? resultStr.split(',')[1] : resultStr;
      processInvoiceAi(base64Data, mimeType);
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmCapturedPhoto = () => {
    if (!capturedImage) return;
    const base64Data = capturedImage.includes(',') ? capturedImage.split(',')[1] : capturedImage;
    processInvoiceAi(base64Data, 'image/jpeg');
  };

  const handleResetScanner = () => {
    setExtractedData(null);
    setExtractionWarnings([]);
    setCapturedImage(null);
    setError(null);
    setCameraError(null);
    setShowFullDetails(false);
    stopCamera();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (onClear) {
      onClear();
    }
  };

  const supplierName = extractedData?.supplierName || extractedData?.supplier?.name;
  const buyerName = extractedData?.buyer?.name;
  const docType = extractedData?.document?.documentType || "Invoice / Document";
  const invNum = extractedData?.invoiceNumber || extractedData?.document?.invoiceNumber;
  const invDate = extractedData?.invoiceDate || extractedData?.document?.invoiceDate;
  const vehicleNum = extractedData?.vehicleNumber || extractedData?.document?.motorVehicleNumber;
  const poNum = extractedData?.poNumber || extractedData?.document?.buyerOrderNumber;
  const totalVal = extractedData?.totalAmount || extractedData?.totals?.totalInvoiceValue || extractedData?.totals?.totalAmountAfterTax;
  const itemsList = extractedData?.items || [];

  return (
    <div className={`rounded-2xl border p-4 sm:p-5 transition-all ${darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-50/90 border-slate-200'} ${className}`}>
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800/20">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h4 className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
              AI Invoice & Quotation Scanner
            </h4>
            <p className="text-[10px] text-slate-400">
              Upload Tax Invoice, Quotation or Delivery Note to extract fields into form
            </p>
          </div>
        </div>

        {extractedData && (
          <button
            onClick={handleResetScanner}
            className="text-[10px] font-bold text-slate-400 hover:text-emerald-500 flex items-center space-x-1 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Scan Another</span>
          </button>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div className={`p-6 rounded-xl border flex flex-col items-center justify-center text-center space-y-2 ${darkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200'}`}>
          <div className="relative">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            <Sparkles className="w-3 h-3 text-amber-400 absolute -top-1 -right-1 animate-bounce" />
          </div>
          <div>
            <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
              Scanning invoice...
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Please wait...
            </p>
          </div>
        </div>
      )}

      {/* Extracted Data Result Summary */}
      {!loading && extractedData && (
        <div className={`p-4 rounded-xl border space-y-3 ${darkMode ? 'bg-slate-800/90 border-emerald-500/30' : 'bg-emerald-50/50 border-emerald-200'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-emerald-500">
              <CheckCircle className="w-4 h-4" />
              <span className="text-xs font-bold">{docType} Extracted ({itemsList.length} Items)</span>
            </div>
            <button
              type="button"
              onClick={() => setShowFullDetails(!showFullDetails)}
              className="text-[10px] font-mono px-2 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 font-bold flex items-center space-x-1 cursor-pointer"
            >
              <span>{showFullDetails ? "Hide Full JSON Breakdown" : "View All Extracted Fields"}</span>
              {showFullDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            <div className={`p-2 rounded-lg border ${darkMode ? 'bg-slate-900/60 border-slate-700/50' : 'bg-white border-slate-200'}`}>
              <span className="text-[9px] uppercase tracking-wider text-slate-400 block">Supplier</span>
              <span className="font-semibold truncate block">{supplierName || 'Not detected'}</span>
              {extractedData.supplier?.gstin && <span className="text-[9px] font-mono text-slate-400 block">GST: {extractedData.supplier.gstin}</span>}
            </div>

            <div className={`p-2 rounded-lg border ${darkMode ? 'bg-slate-900/60 border-slate-700/50' : 'bg-white border-slate-200'}`}>
              <span className="text-[9px] uppercase tracking-wider text-slate-400 block">Buyer / Company</span>
              <span className="font-semibold truncate block">{buyerName || 'Armour Kartons'}</span>
              {extractedData.buyer?.gstin && <span className="text-[9px] font-mono text-slate-400 block">GST: {extractedData.buyer.gstin}</span>}
            </div>

            <div className={`p-2 rounded-lg border ${darkMode ? 'bg-slate-900/60 border-slate-700/50' : 'bg-white border-slate-200'}`}>
              <span className="text-[9px] uppercase tracking-wider text-slate-400 block">{docType} #</span>
              <span className="font-semibold truncate block">{invNum || 'N/A'}</span>
              {invDate && <span className="text-[9px] text-slate-400 block">Date: {invDate}</span>}
            </div>

            <div className={`p-2 rounded-lg border ${darkMode ? 'bg-slate-900/60 border-slate-700/50' : 'bg-white border-slate-200'}`}>
              <span className="text-[9px] uppercase tracking-wider text-slate-400 block">Vehicle Number</span>
              <span className="font-semibold font-mono text-emerald-400 truncate block">{vehicleNum || 'Not in doc'}</span>
            </div>

            <div className={`p-2 rounded-lg border ${darkMode ? 'bg-slate-900/60 border-slate-700/50' : 'bg-white border-slate-200'}`}>
              <span className="text-[9px] uppercase tracking-wider text-slate-400 block">Buyer Order / PO</span>
              <span className="font-semibold text-amber-500 font-mono truncate block">{poNum || 'N/A'}</span>
            </div>

            <div className={`p-2 rounded-lg border ${darkMode ? 'bg-slate-900/60 border-slate-700/50' : 'bg-white border-slate-200'}`}>
              <span className="text-[9px] uppercase tracking-wider text-slate-400 block">Total Amount</span>
              <span className="font-bold text-emerald-500 block">{totalVal ? `₹${totalVal.toLocaleString()}` : 'N/A'}</span>
            </div>
          </div>

          {/* Expanded Full Details Breakdown Panel */}
          {showFullDetails && (
            <div className={`p-3 rounded-xl border space-y-3 text-xs ${darkMode ? 'bg-slate-950/80 border-slate-700 text-slate-300' : 'bg-white border-slate-300 text-slate-800'}`}>
              <h5 className="font-bold text-[11px] uppercase tracking-wider text-emerald-400 border-b pb-1 border-slate-800">
                Detailed Extracted Fields
              </h5>

              {/* 1. Supplier & Buyer */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                <div className={`p-2 rounded-lg border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <span className="font-bold text-slate-400 text-[10px] uppercase block mb-1 flex items-center space-x-1">
                    <Building2 className="w-3 h-3 text-emerald-400" />
                    <span>Supplier Information</span>
                  </span>
                  <div><b>Name:</b> {extractedData.supplier?.name || supplierName || 'N/A'}</div>
                  <div><b>Address:</b> {extractedData.supplier?.address || 'N/A'}</div>
                  <div><b>GSTIN:</b> {extractedData.supplier?.gstin || 'N/A'}</div>
                  <div><b>State:</b> {extractedData.supplier?.state || 'N/A'} (Code: {extractedData.supplier?.stateCode || 'N/A'})</div>
                  <div><b>Contact:</b> {extractedData.supplier?.email || ''} {extractedData.supplier?.phone || ''}</div>
                </div>

                <div className={`p-2 rounded-lg border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <span className="font-bold text-slate-400 text-[10px] uppercase block mb-1 flex items-center space-x-1">
                    <Building2 className="w-3 h-3 text-blue-400" />
                    <span>Buyer / Consignee Information</span>
                  </span>
                  <div><b>Name:</b> {extractedData.buyer?.name || 'Armour Kartons'}</div>
                  <div><b>Address:</b> {extractedData.buyer?.address || 'N/A'}</div>
                  <div><b>GSTIN:</b> {extractedData.buyer?.gstin || 'N/A'}</div>
                  <div><b>State / Place of Supply:</b> {extractedData.buyer?.state || ''} ({extractedData.buyer?.placeOfSupply || 'N/A'})</div>
                </div>
              </div>

              {/* 2. Document Details */}
              <div className={`p-2 rounded-lg border text-[11px] ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <span className="font-bold text-slate-400 text-[10px] uppercase block mb-1 flex items-center space-x-1">
                  <FileCheck className="w-3 h-3 text-amber-400" />
                  <span>Document Details</span>
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  <div><b>Doc Type:</b> {docType}</div>
                  <div><b>Number:</b> {invNum || 'N/A'}</div>
                  <div><b>Date:</b> {invDate || 'N/A'}</div>
                  <div><b>Ref No/Date:</b> {extractedData.document?.referenceNumber || 'N/A'}</div>
                  <div><b>Buyer Order:</b> {extractedData.document?.buyerOrderNumber || poNum || 'N/A'}</div>
                  <div><b>Delivery Note:</b> {extractedData.document?.deliveryNoteNumber || 'N/A'}</div>
                  <div><b>Vehicle No:</b> {vehicleNum || 'N/A'}</div>
                  <div><b>Payment Terms:</b> {extractedData.document?.paymentTerms || extractedData.document?.modeOfPayment || 'N/A'}</div>
                  <div><b>Terms of Delivery:</b> {extractedData.document?.termsOfDelivery || 'N/A'}</div>
                </div>
              </div>

              {/* 3. Item Details Table */}
              <div>
                <span className="font-bold text-slate-400 text-[10px] uppercase block mb-1 flex items-center space-x-1">
                  <Layers className="w-3 h-3 text-purple-400" />
                  <span>Extracted Line Items ({itemsList.length})</span>
                </span>
                <div className="overflow-x-auto rounded-lg border border-slate-700/50">
                  <table className="w-full text-[10px] text-left">
                    <thead className={`font-bold uppercase ${darkMode ? 'bg-slate-900 text-slate-400' : 'bg-slate-200 text-slate-700'}`}>
                      <tr>
                        <th className="p-1.5">#</th>
                        <th className="p-1.5">Item Name / Description</th>
                        <th className="p-1.5">HSN/SAC</th>
                        <th className="p-1.5">Qty</th>
                        <th className="p-1.5">Unit</th>
                        <th className="p-1.5">Rate (₹)</th>
                        <th className="p-1.5">Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {itemsList.map((it, idx) => (
                        <tr key={idx}>
                          <td className="p-1.5 font-mono">{it.slNo || idx + 1}</td>
                          <td className="p-1.5">
                            <span className="font-bold block">{it.name}</span>
                            {it.description && <span className="text-[9px] text-slate-400 block">{it.description}</span>}
                          </td>
                          <td className="p-1.5 font-mono">{it.hsnSacCode || 'N/A'}</td>
                          <td className="p-1.5 font-bold">{it.quantity}</td>
                          <td className="p-1.5">{it.unit || 'Nos'}</td>
                          <td className="p-1.5 font-mono">₹{it.rate || it.ratePerUnit || 0}</td>
                          <td className="p-1.5 font-bold font-mono">₹{it.amount || it.taxableValue || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 4. Taxes & Totals */}
              <div className={`p-2 rounded-lg border text-[11px] ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <span className="font-bold text-slate-400 text-[10px] uppercase block mb-1 flex items-center space-x-1">
                  <Percent className="w-3 h-3 text-emerald-400" />
                  <span>Tax & Summary Totals</span>
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div><b>Taxable Value:</b> ₹{extractedData.taxes?.taxableValue || extractedData.totals?.subtotal || 'N/A'}</div>
                  <div><b>CGST:</b> {extractedData.taxes?.cgstRate ? `${extractedData.taxes.cgstRate}%` : ''} (₹{extractedData.taxes?.cgstAmount || 0})</div>
                  <div><b>SGST:</b> {extractedData.taxes?.sgstRate ? `${extractedData.taxes.sgstRate}%` : ''} (₹{extractedData.taxes?.sgstAmount || 0})</div>
                  <div><b>Total Tax:</b> ₹{extractedData.taxes?.totalTaxAmount || extractedData.totals?.totalTax || 0}</div>
                  <div className="col-span-2"><b>Grand Total:</b> ₹{totalVal || 0}</div>
                  <div className="col-span-2 text-[10px]"><b>Amount in Words:</b> {extractedData.totals?.amountInWords || 'N/A'}</div>
                </div>
              </div>
            </div>
          )}

          {/* Warnings */}
          {extractionWarnings.length > 0 && (
            <div className={`p-2.5 rounded-lg border text-xs space-y-1 ${darkMode ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
              <div className="flex items-center space-x-1.5 font-bold text-[11px]">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>Notice for Review:</span>
              </div>
              <ul className="list-disc list-inside text-[10px] space-y-0.5 opacity-90 pl-1">
                {extractionWarnings.map((warn, i) => (
                  <li key={i}>{warn}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Main Scanner Input UI when not loading and no extracted data yet */}
      {!loading && !extractedData && (
        <div className="space-y-3">
          {/* Options Tabs */}
          <div className="flex rounded-xl p-1 bg-slate-200/50 dark:bg-slate-800/60 border border-slate-300/30 dark:border-slate-700/50 text-xs">
            <button
              type="button"
              onClick={() => {
                stopCamera();
                setActiveTab('upload');
              }}
              className={`flex-1 py-1.5 px-3 rounded-lg font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                activeTab === 'upload'
                  ? darkMode
                    ? 'bg-slate-700 text-white shadow'
                    : 'bg-white text-slate-900 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Document</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('camera');
                setCameraError(null);
              }}
              className={`flex-1 py-1.5 px-3 rounded-lg font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                activeTab === 'camera'
                  ? darkMode
                    ? 'bg-slate-700 text-white shadow'
                    : 'bg-white text-slate-900 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Scan Using Camera</span>
            </button>
          </div>

          {/* TAB 1: UPLOAD FILE */}
          {activeTab === 'upload' && (
            <div className={`p-5 rounded-xl border-2 border-dashed transition-all text-center ${darkMode ? 'bg-slate-800/40 border-slate-700 hover:border-emerald-500/50' : 'bg-white border-slate-200 hover:border-emerald-400'}`}>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf, .jpg, .jpeg, .png, image/jpeg, image/png, application/pdf"
                className="hidden"
                id="invoice-file-input"
                onChange={handleFileUpload}
              />
              <label htmlFor="invoice-file-input" className="flex flex-col items-center justify-center cursor-pointer space-y-2">
                <div className="p-3 rounded-full bg-emerald-500/10 text-emerald-500">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <span className={`text-xs font-bold block ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                    Click or drag Tax Invoice, Quotation, or Delivery Note
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Supports PDF, JPG, JPEG, PNG scanned documents
                  </span>
                </div>
              </label>
            </div>
          )}

          {/* TAB 2: SCAN USING CAMERA */}
          {activeTab === 'camera' && (
            <div className="space-y-3">
              {!isCameraActive && !capturedImage && (
                <div className={`p-6 rounded-xl border text-center space-y-3 ${darkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-white border-slate-200'}`}>
                  <div className="p-3 rounded-full bg-blue-500/10 text-blue-500 inline-block">
                    <Camera className="w-6 h-6" />
                  </div>
                  <div>
                    <h5 className={`text-xs font-bold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                      Scan Document via Device Camera
                    </h5>
                    <p className="text-[10px] text-slate-400 max-w-xs mx-auto mt-0.5">
                      Position document under camera or webcam to snapshot and extract metadata.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={startCamera}
                    className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs shadow hover:bg-blue-500 transition-all flex items-center justify-center space-x-1.5 mx-auto cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Open Camera</span>
                  </button>
                </div>
              )}

              {cameraError && (
                <div className={`p-3 rounded-xl border text-xs flex items-start space-x-2 ${darkMode ? 'bg-rose-500/10 border-rose-500/30 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
                  <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span className="font-bold block">Camera Unavailable</span>
                    <p className="text-[11px] opacity-90">{cameraError}</p>
                    <button
                      type="button"
                      onClick={() => setActiveTab('upload')}
                      className="mt-1.5 text-[10px] font-bold text-blue-400 hover:underline cursor-pointer"
                    >
                      Switch to File Upload option instead
                    </button>
                  </div>
                </div>
              )}

              {isCameraActive && (
                <div className="relative rounded-2xl overflow-hidden bg-black border border-slate-800 aspect-[4/3] flex items-center justify-center">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-4 border-2 border-dashed border-emerald-400/70 rounded-xl pointer-events-none flex flex-col justify-between p-3">
                    <div className="text-[10px] font-bold text-emerald-400 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded self-start">
                      Align Document in Frame
                    </div>
                  </div>

                  <div className="absolute bottom-3 inset-x-0 flex items-center justify-center space-x-3 px-4">
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="px-3 py-1.5 rounded-xl bg-slate-900/80 text-white border border-slate-700 text-xs font-bold hover:bg-slate-800 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={capturePhoto}
                      className="px-5 py-2 rounded-xl bg-emerald-500 text-slate-950 font-extrabold text-xs shadow-lg hover:bg-emerald-400 flex items-center space-x-1.5 cursor-pointer"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Capture Photo</span>
                    </button>
                  </div>
                </div>
              )}

              {!isCameraActive && capturedImage && (
                <div className="space-y-3">
                  <div className="relative rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 max-h-60 flex items-center justify-center">
                    <img
                      src={capturedImage}
                      alt="Captured Document"
                      className="max-h-60 object-contain w-full"
                    />
                    <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm text-white px-2 py-0.5 rounded text-[10px] font-bold flex items-center space-x-1">
                      <Eye className="w-3 h-3 text-emerald-400" />
                      <span>Photo Preview</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={startCamera}
                      className={`px-4 py-2 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1 cursor-pointer ${
                        darkMode ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Retake</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleConfirmCapturedPhoto}
                      className="flex-1 py-2 px-4 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow hover:bg-emerald-500 transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Use Photo & Scan</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* General AI Error Display */}
          {error && (
            <div className={`p-3 rounded-xl border text-xs flex items-start space-x-2 ${darkMode ? 'bg-rose-500/10 border-rose-500/30 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold block">Extraction Notice</span>
                <p className="text-[11px] opacity-90">{error}</p>
              </div>
              <button onClick={() => setError(null)} className="text-slate-400 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

