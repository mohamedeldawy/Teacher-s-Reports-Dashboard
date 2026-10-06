import React, { useMemo, useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';

interface SearchableFilterProps {
  id: string;
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}

export const SearchableFilter: React.FC<SearchableFilterProps> = ({
  id,
  label,
  value,
  options,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const filteredOptions = useMemo(
    () => options.filter(option => option.toLowerCase().includes(query.trim().toLowerCase())),
    [options, query]
  );

  const selectOption = (option: string) => {
    onChange(option);
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div
      className="relative"
      onBlur={event => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setIsOpen(false);
          setQuery('');
        }
      }}
    >
      <button
        id={id}
        type="button"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        onClick={() => setIsOpen(open => !open)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-xs bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition cursor-pointer"
      >
        <span className="truncate">{value === 'all' ? label : value}</span>
        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 z-40 rounded-lg border border-slate-200 bg-white shadow-lg p-2">
          <div className="relative mb-2">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              autoFocus
              type="search"
              value={query}
              onChange={event => setQuery(event.target.value)}
              onKeyDown={event => {
                if (event.key === 'Escape') {
                  setIsOpen(false);
                  setQuery('');
                }
                if (event.key === 'Enter' && filteredOptions[0]) selectOption(filteredOptions[0]);
              }}
              placeholder={`Search ${label.toLowerCase()}...`}
              aria-label={`Search ${label.toLowerCase()}`}
              className="w-full pl-8 pr-2 py-2 rounded-md text-xs bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
          <div role="listbox" aria-label={label} className="max-h-52 overflow-y-auto">
            {filteredOptions.map(option => (
              <button
                key={option}
                type="button"
                role="option"
                aria-selected={value === option}
                onClick={() => selectOption(option)}
                className={`w-full text-left px-2.5 py-2 rounded-md text-xs transition cursor-pointer ${
                  value === option
                    ? 'bg-emerald-50 text-emerald-800 font-semibold'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {option === 'all' ? label : option}
              </button>
            ))}
            {filteredOptions.length === 0 && (
              <p className="px-2.5 py-2 text-xs text-slate-400">No matches</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
