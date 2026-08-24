import React, { useState } from 'react';
import { X, Send, Mail, Share2, Copy, Download, Check, FileText, Calendar, Building2, User, Phone, Paperclip, MessageSquare } from 'lucide-react';
import { RFQItem, Supplier } from '../../types';

interface SendRfqModalProps {
  isOpen: boolean;
  onClose: () => void;
  rfq: RFQItem | null;
  suppliers: Supplier[];
  darkMode: boolean;
  onSendSuccess: (updatedRfq: RFQItem, emailRecipients: string[]) => void;
  onDownloadPdf?: (docType: string, id: string) => void;
  currentUserName?: string;
}

export const SendRfqModal: React.FC<SendRfqModalProps> = ({
  isOpen,
  onClose,
  rfq,
  suppliers,
  darkMode,
  onSendSuccess,
  onDownloadPdf,
  currentUserName = 'Sunita Menon'
}) => {
  if (!isOpen || !rfq) return null;

  const [activeTab, setActiveTab] = useState<'email' | 'share'>('email');
  const [selectedSupplierIds, setSelectedSupplierIds] = useState<string[]>(
    rfq.suppliers?.map(s => s.supplierId) || suppliers.slice(0, 3).map(s => s.id)
  );
  const [customNote, setCustomNote] = useState('Please review the requested quantities and technical specifications and submit your best commercial quote by the response deadline.');
  const [copiedLink, setCopiedLink] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const toggleSupplier = (id: string) => {
    setSelectedSupplierIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSend = () => {
    if (selectedSupplierIds.length === 0) return;
    setIsSending(true);

    setTimeout(() => {
      const updatedSuppliers = selectedSupplierIds.map(id => {
        const found = suppliers.find(s => s.id === id);
        return {
          supplierId: id,
          supplierName: found?.supplierName || 'Selected Supplier',
          contactPerson: 'N/A',
          email: 'contact@supplier.com',
          phone: 'N/A',
        };
      });

      const updatedRfq: RFQItem = {
        ...rfq,
        status: 'Sent',
        suppliers: updatedSuppliers,
      };

      const recipientEmails = updatedSuppliers.map(s => s.email).filter(Boolean) as string[];
      setIsSending(false);
      onSendSuccess(updatedRfq, recipientEmails);
      onClose();
    }, 600);
  };

  const shareableUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/rfq/${rfq.id}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareableUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className={`w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'}`}>
        
        {/* Header */}
        <div className={`p-5 border-b flex items-center justify-between ${darkMode ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-slate-50'}`}>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold tracking-tight">Send RFQ to Suppliers</h2>
              <p className="text-xs text-slate-400">RFQ Ref: <span className="font-mono font-bold text-emerald-400">{rfq.rfqNumber}</span></p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors ${darkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className={`px-6 pt-3 flex border-b ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
          <button
            onClick={() => setActiveTab('email')}
            className={`pb-3 px-4 text-xs font-bold transition-colors border-b-2 flex items-center space-x-2 ${
              activeTab === 'email'
                ? 'border-emerald-500 text-emerald-500'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>Email Notification ({selectedSupplierIds.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('share')}
            className={`pb-3 px-4 text-xs font-bold transition-colors border-b-2 flex items-center space-x-2 ${
              activeTab === 'share'
                ? 'border-emerald-500 text-emerald-500'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Share2 className="w-4 h-4" />
            <span>Direct Vendor Portal Link</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
          {activeTab === 'email' ? (
            <>
              {/* Supplier Selection */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Select Recipient Suppliers
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-40 overflow-y-auto pr-1">
                  {suppliers.map(s => {
                    const isSelected = selectedSupplierIds.includes(s.id);
                    return (
                      <div
                        key={s.id}
                        onClick={() => toggleSupplier(s.id)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
                            : darkMode
                            ? 'border-slate-800 bg-slate-800/30 text-slate-400 hover:border-slate-700'
                            : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-bold">{s.supplierName}</div>
                          <div className="text-[11px] text-slate-400">Category: {s.category || 'General'}</div>
                        </div>
                        <div className={`w-4 h-4 rounded-md flex items-center justify-center border ${
                          isSelected ? 'bg-emerald-500 border-emerald-500 text-slate-950' : 'border-slate-600'
                        }`}>
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Note */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Additional Covering Message
                </label>
                <textarea
                  rows={3}
                  value={customNote}
                  onChange={e => setCustomNote(e.target.value)}
                  placeholder="Enter message to include in supplier email..."
                  className={`w-full p-3 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${
                    darkMode ? 'bg-slate-800/50 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              {/* Summary Box */}
              <div className={`p-4 rounded-xl border text-xs space-y-1.5 ${darkMode ? 'bg-slate-800/20 border-slate-800/60' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex justify-between font-bold text-slate-300">
                  <span>Materials Included:</span>
                  <span className="text-emerald-400">{rfq.materials?.length || 0} Line Items</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Required Date:</span>
                  <span>{rfq.deliveryDate || 'N/A'}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Sender:</span>
                  <span>{currentUserName} (AMK ERP Procurement)</span>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-slate-400">
                Share this direct portal link with suppliers to allow them to view technical requirements and submit commercial quotes online.
              </p>

              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  readOnly
                  value={shareableUrl}
                  className={`flex-1 p-3 rounded-xl border text-xs font-mono select-all ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-800'
                  }`}
                />
                <button
                  onClick={handleCopyLink}
                  className="px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-colors flex items-center space-x-1.5"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`p-5 border-t flex items-center justify-between ${darkMode ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-slate-50'}`}>
          <button
            onClick={onClose}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-colors ${
              darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Cancel
          </button>

          {activeTab === 'email' && (
            <button
              onClick={handleSend}
              disabled={selectedSupplierIds.length === 0 || isSending}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center space-x-2 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{isSending ? 'Transmitting...' : `Dispatch RFQ to ${selectedSupplierIds.length} Suppliers`}</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
