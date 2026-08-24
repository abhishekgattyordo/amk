import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Search, Loader2, ChevronDown, Check } from 'lucide-react';

interface OptionItem {
  id: string;
  label: string;
  sublabel?: string;
  code?: string;
  raw?: any;
}

interface UniversalServerSelectProps {
  value: string;
  onChange: (id: string, item?: any) => void;
  endpoint: string; // e.g. '/api/raw-materials', '/api/suppliers', '/api/purchase-orders', '/api/products'
  placeholder?: string;
  searchPlaceholder?: string;
  darkMode: boolean;
  transformItem?: (item: any) => OptionItem;
  disabled?: boolean;
  required?: boolean;
}

export const UniversalServerSelect: React.FC<UniversalServerSelectProps> = ({
  value,
  onChange,
  endpoint,
  placeholder = 'Select option...',
  searchPlaceholder = 'Search by code or name...',
  darkMode,
  transformItem,
  disabled = false,
  required = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [items, setItems] = useState<OptionItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<OptionItem | null>(null);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Default transformer if not provided
  const defaultTransform = (item: any): OptionItem => {
    if (endpoint.includes('raw-materials')) {
      return {
        id: item.id,
        code: item.code,
        label: `${item.code ? item.code + ' — ' : ''}${item.name}`,
        sublabel: `Category: ${item.category || 'General'} | Stock: ${item.currentStock || 0} ${item.uom || 'Kg'}`,
        raw: item
      };
    }
    if (endpoint.includes('suppliers')) {
      return {
        id: item.id,
        code: item.supplierCode || item.millName,
        label: `${item.supplierName} (${item.supplierCode || item.millName || 'Supplier'})`,
        sublabel: item.city ? `${item.city}, ${item.state || ''}` : item.category,
        raw: item
      };
    }
    if (endpoint.includes('purchase-orders')) {
      return {
        id: item.id,
        code: item.poNumber,
        label: `${item.poNumber} — ${item.supplierName || item.supplier?.supplierName || 'Supplier'}`,
        sublabel: `Status: ${item.status} | Date: ${item.date}`,
        raw: item
      };
    }
    if (endpoint.includes('products')) {
      return {
        id: item.id,
        code: item.code,
        label: `${item.code ? item.code + ' — ' : ''}${item.name}`,
        sublabel: `Category: ${item.category || 'Standard'}`,
        raw: item
      };
    }
    return {
      id: item.id,
      code: item.code || item.number,
      label: item.name || item.title || item.supplierName || item.poNumber || item.id,
      sublabel: item.category || item.status,
      raw: item
    };
  };

  const transformer = transformItem || defaultTransform;

  // Fetch items based on search query (limit 10 initially or on search)
  const fetchItems = useCallback(async (query: string) => {
    setIsLoading(true);
    try {
      const separator = endpoint.includes('?') ? '&' : '?';
      const url = `${endpoint}${separator}search=${encodeURIComponent(query)}&limit=10`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setItems(json.data.map(transformer));
      } else {
        setItems([]);
      }
    } catch (err) {
      console.error('Error fetching server options for select:', err);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [endpoint, transformer]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchItems(searchTerm);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchTerm, fetchItems]);

  // Initial load of top 10 records when opened
  useEffect(() => {
    if (isOpen && items.length === 0 && !searchTerm) {
      fetchItems('');
    }
  }, [isOpen, fetchItems, items.length, searchTerm]);

  // Fetch selected item details if value is provided
  useEffect(() => {
    if (value && (!selectedItem || selectedItem.id !== value)) {
      fetch(`${endpoint}${endpoint.includes('?') ? '&' : '?'}id=${value}`)
        .then(res => res.json())
        .then(json => {
          if (json.success && json.data) {
            setSelectedItem(transformer(json.data));
          }
        })
        .catch(err => console.error('Error fetching selected item:', err));
    } else if (!value) {
      setSelectedItem(null);
    }
  }, [value, endpoint, selectedItem, transformer]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full px-3 py-2.5 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition-all ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        } ${
          darkMode
            ? 'bg-slate-900 border-slate-700 text-white hover:border-slate-600'
            : 'bg-white border-slate-300 text-slate-900 hover:border-slate-400'
        }`}
      >
        <span className={selectedItem ? 'font-semibold truncate' : 'text-slate-400'}>
          {selectedItem ? selectedItem.label : placeholder}
        </span>
        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
      </div>

      {isOpen && (
        <div className={`absolute z-50 left-0 right-0 mt-1.5 rounded-2xl border shadow-2xl overflow-hidden ${
          darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <div className="p-2.5 border-b border-slate-200 dark:border-slate-800 flex items-center space-x-2">
            <Search className="w-4 h-4 text-slate-400 ml-1 shrink-0" />
            <input
              type="text"
              autoFocus
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={searchPlaceholder}
              className={`w-full bg-transparent border-none text-xs outline-none focus:ring-0 p-1 ${
                darkMode ? 'text-white placeholder-slate-500' : 'text-slate-900 placeholder-slate-400'
              }`}
            />
            {isLoading && <Loader2 className="w-4 h-4 animate-spin text-emerald-500 shrink-0" />}
          </div>

          <div className="max-h-60 overflow-y-auto p-1 divide-y divide-slate-100 dark:divide-slate-800/50">
            {items.length === 0 && !isLoading ? (
              <div className="p-6 text-center text-slate-400 text-xs">
                No matching records found. Type to search database.
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    onChange(item.id, item.raw);
                    setSelectedItem(item);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                  className={`p-2.5 rounded-xl cursor-pointer flex items-center justify-between text-xs transition-colors ${
                    value === item.id
                      ? 'bg-emerald-500/10 text-emerald-500 font-bold'
                      : darkMode
                      ? 'hover:bg-slate-800/80 text-slate-200'
                      : 'hover:bg-slate-100 text-slate-800'
                  }`}
                >
                  <div>
                    <div className="font-semibold">{item.label}</div>
                    {item.sublabel && <div className="text-[10px] text-slate-400 mt-0.5">{item.sublabel}</div>}
                  </div>
                  {value === item.id && <Check className="w-4 h-4 text-emerald-500 shrink-0 ml-2" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
