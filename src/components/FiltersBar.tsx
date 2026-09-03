import React from 'react';
import { Search, Filter, X, LayoutGrid, Table, Activity, ChevronDown } from 'lucide-react';
import { FilterState } from '../types';

interface FiltersBarProps {
  filters: FilterState;
  onChangeFilters: (updated: Partial<FilterState>) => void;
  availableSubjects: string[];
  availableGrades: string[];
  availableTeachers: string[];
  totalResultsCount: number;
}

export const FiltersBar: React.FC<FiltersBarProps> = ({
  filters,
  onChangeFilters,
  availableSubjects,
  availableGrades,
  availableTeachers,
  totalResultsCount,
}) => {
  const hasActiveFilters =
    filters.subject !== 'all' ||
    filters.grade !== 'all' ||
    filters.teacher !== 'all' ||
    filters.status !== 'all' ||
    filters.searchQuery.trim() !== '';

  const handleClearFilters = () => {
    onChangeFilters({
      subject: 'all',
      grade: 'all',
      teacher: 'all',
      status: 'all',
      searchQuery: '',
    });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 mb-6">
      {/* Top row: Subject Quick Pills & View Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-1.5 flex items-center gap-1 shrink-0">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            Subject:
          </span>
          <button
            id="filter-subject-all"
            onClick={() => onChangeFilters({ subject: 'all', teacher: 'all' })}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition shrink-0 cursor-pointer ${
              filters.subject === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Subjects
          </button>
          {availableSubjects.map(subj => {
            const isSelected = filters.subject === subj;
            return (
              <button
                key={subj}
                id={`filter-subject-${subj.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => onChangeFilters({ subject: isSelected ? 'all' : subj, teacher: 'all' })}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {subj}
              </button>
            );
          })}
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-lg shrink-0 self-start md:self-auto">
          <button
            id="viewmode-matrix"
            onClick={() => onChangeFilters({ viewMode: 'report_matrix' })}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
              filters.viewMode === 'report_matrix'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>Report Matrix (L1-L15)</span>
          </button>
          <button
            id="viewmode-cards"
            onClick={() => onChangeFilters({ viewMode: 'teacher_cards' })}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
              filters.viewMode === 'teacher_cards'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Teacher Cards</span>
          </button>
          <button
            id="viewmode-feed"
            onClick={() => onChangeFilters({ viewMode: 'updates_feed' })}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
              filters.viewMode === 'updates_feed'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Updates Feed</span>
          </button>
        </div>
      </div>

      {/* Bottom row: Detailed Dropdown Filters & Search */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-3">
        {/* Search */}
        <div className="relative lg:col-span-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="filter-search-input"
            type="text"
            placeholder="Search teacher, subject, or report note..."
            value={filters.searchQuery}
            onChange={e => onChangeFilters({ searchQuery: e.target.value })}
            className="w-full pl-9 pr-8 py-2 rounded-lg text-xs bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition"
          />
          {filters.searchQuery && (
            <button
              onClick={() => onChangeFilters({ searchQuery: '' })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Grade Filter */}
        <div className="relative">
          <select
            id="filter-grade-select"
            value={filters.grade}
            onChange={e => onChangeFilters({ grade: e.target.value })}
            className="w-full appearance-none px-3 py-2 rounded-lg text-xs bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition pr-8 cursor-pointer"
          >
            <option value="all">All Grades / Stages</option>
            {availableGrades.map(g => (
              <option key={g} value={g}>
                Grade {g}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Teacher Dynamic Filter */}
        <div className="relative">
          <select
            id="filter-teacher-select"
            value={filters.teacher}
            onChange={e => onChangeFilters({ teacher: e.target.value })}
            className="w-full appearance-none px-3 py-2 rounded-lg text-xs bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition pr-8 cursor-pointer font-medium"
          >
            <option value="all">
              {filters.subject !== 'all' ? `All Teachers (${filters.subject})` : 'All Teachers'}
            </option>
            {availableTeachers.map(t => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Status Filter */}
        <div className="relative">
          <select
            id="filter-status-select"
            value={filters.status}
            onChange={e => onChangeFilters({ status: e.target.value as FilterState['status'] })}
            className="w-full appearance-none px-3 py-2 rounded-lg text-xs bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition pr-8 cursor-pointer"
          >
            <option value="all">All Lecture Statuses</option>
            <option value="has_report">Updated / Has Report (Completed)</option>
            <option value="pending">Pending Report</option>
            <option value="issue">Has Issue / Needs Follow-up</option>
          </select>
          <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Active filters badge row */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-slate-400 font-medium">Active filters:</span>
            {filters.subject !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                Subject: {filters.subject}
                <button
                  onClick={() => onChangeFilters({ subject: 'all' })}
                  className="hover:text-emerald-900 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.grade !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                Grade: {filters.grade}
                <button
                  onClick={() => onChangeFilters({ grade: 'all' })}
                  className="hover:text-blue-900 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.teacher !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                Teacher: {filters.teacher}
                <button
                  onClick={() => onChangeFilters({ teacher: 'all' })}
                  className="hover:text-purple-900 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.status !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                Status: {filters.status}
                <button
                  onClick={() => onChangeFilters({ status: 'all' })}
                  className="hover:text-amber-900 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.searchQuery && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                Search: "{filters.searchQuery}"
                <button
                  onClick={() => onChangeFilters({ searchQuery: '' })}
                  className="hover:text-slate-900 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            <span className="text-slate-400 font-medium">({totalResultsCount} sections found)</span>
          </div>

          <button
            id="btn-clear-all-filters"
            onClick={handleClearFilters}
            className="text-xs text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1 transition cursor-pointer shrink-0 ml-2"
          >
            <X className="w-3 h-3" />
            Clear All
          </button>
        </div>
      )}
    </div>
  );
};
