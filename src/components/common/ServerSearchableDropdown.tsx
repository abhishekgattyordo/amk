import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { RawMaterial } from '../../types';

export interface ServerSearchableDropdownProps {
  value: string;
  onChange: (id: string, item?: RawMaterial) => void;
  placeholder?: string;
  darkMode: boolean;
}

export const ServerSearchableDropdown: React.FC<ServerSearchableDropdownProps> = ({ value, onChange, placeholder, darkMode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [items, setItems] = useState<RawMaterial[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<RawMaterial | null>(null);
  
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch items based on search term
  const fetchItems = useCallback(async (query: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/raw-materials?search=${encodeURIComponent(query)}&limit=20`);
      const data = await res.json();
      if (data.success) {
        setItems(data.data);
      } else {
        setItems([]);
      }
    } catch (err) {
      console.error('Error fetching materials:', err);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle Debounced Search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchItems(searchTerm);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [searchTerm, fetchItems]);

  // Initial load or update selected item if value changes
  useEffect(() => {
    if (value && !selectedItem || (selectedItem && selectedItem.id !== value)) {
        // Simple fetch for the single item to populate display
        fetch(`/api/raw-materials?id=${value}`)
            .then(res => res.json())
            .then(data => {
                if (data.success) setSelectedItem(data.data);
            })
            .catch(console.error);
    }
  }, [value, selectedItem]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div 
        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm flex items-center justify-between cursor-pointer ${
          darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
        }`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="truncate">
          {selectedItem 
            ? `${selectedItem.code ? selectedItem.code + ' - ' : ''}${selectedItem.name}` 
            : placeholder || 'Select raw material...'}
        </span>
        <Search className="w-4 h-4 text-slate-400" />
      </div>
      
      {isOpen && (
        <div className={`absolute z-10 w-full mt-1 rounded-xl border shadow-lg overflow-hidden ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <div className="p-2 border-b border-slate-700/50">
            <input 
              type="text"
              autoFocus
              className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
              placeholder="Search by name or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="max-h-60 overflow-y-auto">
            {isLoading ? (
                <div className="px-4 py-2 text-sm text-slate-400 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Loading...
                </div>
            ) : (
                <>
                {items.map(item => (
                    <div 
                    key={item.id}
                    className={`px-4 py-2 text-sm cursor-pointer hover:bg-emerald-500/10 ${darkMode ? 'hover:text-emerald-400' : 'hover:text-emerald-600'}`}
                    onClick={() => {
                        onChange(item.id, item);
                        setSelectedItem(item);
                        setIsOpen(false);
                        setSearchTerm('');
                    }}
                    >
                    {item.code ? `${item.code} - ` : ''}{item.name} 
                    </div>
                ))}
                {items.length === 0 && <div className="px-4 py-2 text-sm text-slate-400">No results found</div>}
                </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
