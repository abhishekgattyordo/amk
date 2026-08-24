import React, { useState, useRef, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { DayPicker } from 'react-day-picker';
import { Calendar as CalendarIcon } from 'lucide-react';
import 'react-day-picker/dist/style.css';

interface DatePickerProps {
  value: string; // ISO date string YYYY-MM-DD
  onChange: (date: string) => void;
  darkMode: boolean;
  placeholder?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({ value, onChange, darkMode, placeholder = 'Select date' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedDate = value ? parseISO(value) : undefined;

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
    <div className="relative" ref={wrapperRef}>
      <div 
        className={`w-full px-3 py-2 rounded-xl border text-xs cursor-pointer flex items-center justify-between ${
          darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
        }`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{value ? format(selectedDate!, 'PPP') : placeholder}</span>
        <CalendarIcon className="w-4 h-4 text-slate-400" />
      </div>
      
      {isOpen && (
        <div className={`absolute z-50 mt-1 p-2 rounded-xl border shadow-lg ${
          darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
        }`}>
          <style>{`
            .rdp-button:hover:not([disabled]):not(.rdp-day_selected) { background-color: rgb(16, 185, 129, 0.1); }
            .rdp-day_selected { background-color: #10b981 !important; color: white !important; }
            .rdp-button:focus:not([disabled]) { color: #10b981; }
          `}</style>
          <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={(day) => {
              if (day) {
                onChange(format(day, 'yyyy-MM-dd'));
                setIsOpen(false);
              }
            }}
            className={darkMode ? 'dark' : ''}
          />
        </div>
      )}
    </div>
  );
};
