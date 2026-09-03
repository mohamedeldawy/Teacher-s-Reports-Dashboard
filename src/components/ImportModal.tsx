import React, { useState, useMemo } from 'react';
import { X, Upload, FileText, CheckCircle2, AlertCircle, RefreshCw, Sparkles, Copy } from 'lucide-react';
import { parseSpreadsheet } from '../utils/parser';
import { RAW_SAMPLE_SPREADSHEET } from '../data/initialData';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyData: (csvData: string) => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  onApplyData,
}) => {
  const [csvText, setCsvText] = useState('');
  const [dragActive, setDragActive] = useState(false);

  // Live parse preview
  const parseResult = useMemo(() => {
    if (!csvText.trim()) return null;
    try {
      const { courses, allLectureIds } = parseSpreadsheet(csvText);
      const subjects = Array.from(new Set(courses.map(c => c.subjectCategory)));
      const teachers = Array.from(new Set(courses.map(c => c.teacher)));
      let totalNotes = 0;
      courses.forEach(c => {
        Object.values(c.lectures).forEach(l => {
          if (l.note && l.note.trim()) totalNotes++;
        });
      });

      return {
        valid: courses.length > 0,
        coursesCount: courses.length,
        subjectsCount: subjects.length,
        subjectsList: subjects,
        teachersCount: teachers.length,
        lecturesCount: allLectureIds.length,
        totalNotes,
      };
    } catch (e) {
      return { valid: false, error: 'Could not parse spreadsheet format' };
    }
  }, [csvText]);

  if (!isOpen) return null;

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = e => {
      const content = e.target?.result as string;
      if (content) {
        setCsvText(content);
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleApply = () => {
    if (csvText.trim()) {
      onApplyData(csvText);
      onClose();
    }
  };

  const handleLoadSample = () => {
    setCsvText(RAW_SAMPLE_SPREADSHEET);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden transform transition-all"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Import or Paste Spreadsheet Data
              </h2>
              <p className="text-xs text-slate-500">
                Supports CSV, Google Sheets TSV, or multi-column lecture reports
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Quick load original prompt data */}
          <div className="flex items-center justify-between bg-emerald-50/60 border border-emerald-200 rounded-xl p-3">
            <div className="flex items-center gap-2 text-xs text-emerald-900">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Want to restore the sample spreadsheet with your exact teacher data?</span>
            </div>
            <button
              type="button"
              onClick={handleLoadSample}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition cursor-pointer shrink-0 shadow-xs"
            >
              Load Sample Data
            </button>
          </div>

          {/* Drag & Drop File Upload */}
          <div
            onDragEnter={() => setDragActive(true)}
            onDragLeave={() => setDragActive(false)}
            onDragOver={e => e.preventDefault()}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-4 text-center transition ${
              dragActive
                ? 'border-emerald-500 bg-emerald-50/50'
                : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
            }`}
          >
            <div className="flex flex-col items-center justify-center gap-1.5">
              <FileText className="w-6 h-6 text-slate-400" />
              <div className="text-xs text-slate-600">
                <label className="font-semibold text-emerald-600 hover:text-emerald-700 cursor-pointer">
                  <span>Upload a CSV file</span>
                  <input
                    type="file"
                    accept=".csv,.tsv,.txt"
                    onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                    className="sr-only"
                  />
                </label>{' '}
                or drag and drop here
              </div>
              <p className="text-[11px] text-slate-400">CSV, TSV, or plain text export</p>
            </div>
          </div>

          {/* Raw Text Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Or paste spreadsheet CSV / TSV text directly:
            </label>
            <textarea
              rows={7}
              value={csvText}
              onChange={e => setCsvText(e.target.value)}
              placeholder="Lectures,Sci-En-Jr4-Nada Hassan,Lectures,Science-En-Jr5-Mina Fayez...&#10;L1,,L1,الحصه تمام و بلغت المدرسة...&#10;L2,,L2,..."
              className="w-full font-mono text-xs p-3 rounded-xl border border-slate-300 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
            />
          </div>

          {/* Real-time Parser Analysis Preview */}
          {parseResult && (
            <div
              className={`p-3.5 rounded-xl border text-xs transition ${
                parseResult.valid
                  ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                  : 'bg-amber-50/60 border-amber-200 text-amber-900'
              }`}
            >
              {parseResult.valid ? (
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-emerald-800 mb-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Spreadsheet Analyzed Successfully!</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2 pt-2 border-t border-emerald-200/60 text-slate-700">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Sections</span>
                      <span className="font-bold text-slate-900">{parseResult.coursesCount}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Subjects</span>
                      <span className="font-bold text-slate-900">
                        {parseResult.subjectsCount} ({parseResult.subjectsList?.join(', ')})
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Teachers</span>
                      <span className="font-bold text-slate-900">{parseResult.teachersCount}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Active Reports</span>
                      <span className="font-bold text-emerald-700">{parseResult.totalNotes}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-amber-800">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    No valid teacher columns detected yet. Please ensure the headers follow your spreadsheet format.
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={!parseResult?.valid}
            className={`px-5 py-2 rounded-lg text-xs font-bold transition shadow-xs cursor-pointer ${
              parseResult?.valid
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            Apply to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
