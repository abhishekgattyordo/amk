import React, { useState, useRef, useEffect } from 'react';
import { Search } from 'lucide-react';

export interface DropdownItem {
  id: string;
  code: string;
  name: string;
  stock: number;
  unit: string;
}

interface SearchableDropdownProps {
  items: DropdownItem[];
  value: string;
  onChange: (id: string, item?: DropdownItem) => void;
  placeholder?: string;
  darkMode: boolean;
}

export const SearchableDropdown: React.FC<SearchableDropdownProps> = ({ items, value, onChange, placeholder, darkMode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredItems = items.filter(item => 
    (item.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (item.code || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedItem = items.find(item => item.id === value || item.code === value);

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div 
        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm flex items-center justify-between cursor-pointer ${
          darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
        }`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>
          {selectedItem 
            ? `${selectedItem.code ? selectedItem.code + ' - ' : ''}${selectedItem.name}` 
            : placeholder || 'Select item...'}
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
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="max-h-60 overflow-y-auto">
            {filteredItems.map(item => (
              <div 
                key={item.id}
                className={`px-4 py-2 text-sm cursor-pointer hover:bg-emerald-500/10 ${darkMode ? 'hover:text-emerald-400' : 'hover:text-emerald-600'}`}
                onClick={() => {
                  onChange(item.id, item);
                  setIsOpen(false);
                  setSearchTerm('');
                }}
              >
                {item.code ? `${item.code} - ` : ''}{item.name} <span className="text-slate-400 text-xs">({item.stock} {item.unit})</span>
              </div>
            ))}
            {filteredItems.length === 0 && <div className="px-4 py-2 text-sm text-slate-400">No items found</div>}
          </div>
        </div>
      )}
    </div>
  );
};
