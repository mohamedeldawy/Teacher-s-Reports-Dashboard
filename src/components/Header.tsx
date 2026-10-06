import React from 'react';
import { Upload, Download, RefreshCw } from 'lucide-react';

interface HeaderProps {
  onOpenImport: () => void;
  onExportCsv: () => void;
  onResetData: () => void;
  onRefreshSheet: () => void;
  isRefreshingSheet: boolean;
  totalSections: number;
  totalSubjects: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenImport,
  onExportCsv,
  onResetData,
  onRefreshSheet,
  isRefreshingSheet,
  totalSections,
  totalSubjects,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <img
            src="./elkheta-logo.jpg"
            alt="Elkheta logo"
            className="w-10 h-10 rounded-xl object-cover border border-slate-200 shadow-sm"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                Elkheta Teacher&apos;s Reports
              </h1>
              <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                Google Sheets
              </span>
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
              <span>Tracking {totalSections} teacher sections across {totalSubjects} subjects</span>
              <span className="text-slate-300">•</span>
              <span className="hidden sm:inline">Multi-subject & lecture level updates</span>
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <button
            id="btn-refresh-sheet"
            onClick={onRefreshSheet}
            disabled={isRefreshingSheet}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer disabled:opacity-50 disabled:cursor-wait"
            title="Fetch the latest reports from all Google Sheet tabs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingSheet ? 'animate-spin' : ''}`} />
            <span>{isRefreshingSheet ? 'Syncing...' : 'Sync Sheet'}</span>
          </button>

          <button
            id="btn-import-spreadsheet"
            onClick={onOpenImport}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition shadow-xs cursor-pointer active:scale-95"
            title="Paste or upload spreadsheet data"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Update / Import Sheet</span>
          </button>

          <button
            id="btn-export-csv"
            onClick={onExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
            title="Export filtered reports to CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          <button
            id="btn-reset-data"
            onClick={onResetData}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
            title="Reset to the current Google Sheet snapshot"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Reset</span>
          </button>
        </div>
      </div>
    </header>
  );
};
