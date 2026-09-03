import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Clock, AlertTriangle, XCircle, Sparkles, MessageSquare, Trash2 } from 'lucide-react';
import { TeacherCourse, LectureReport, LectureStatus } from '../types';
import { isArabic } from '../utils/parser';

interface LectureModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: TeacherCourse | null;
  lectureId: string | null;
  onSaveLecture: (courseId: string, lectureId: string, note: string, status: LectureStatus) => void;
}

const QUICK_TEMPLATES = [
  'الحصه تمام و بلغت المدرسة',
  'الحصه تمام و بلغت المدرس',
  'تم الانتهاء من الدرس وتسليم الواجب',
  'تم حل تدريبات كتاب المعاصر',
  'اعتذار من المعلم وتأجيل الحصة',
  'غياب بعض الطلاب وتم التواصل مع ولي الأمر',
  'Lecture completed smoothly with active student engagement',
];

export const LectureModal: React.FC<LectureModalProps> = ({
  isOpen,
  onClose,
  course,
  lectureId,
  onSaveLecture,
}) => {
  const [note, setNote] = useState('');
  const [status, setStatus] = useState<LectureStatus>('completed');

  useEffect(() => {
    if (course && lectureId) {
      const existing = course.lectures[lectureId];
      if (existing) {
        setNote(existing.note || '');
        setStatus(existing.status || (existing.note ? 'completed' : 'pending'));
      } else {
        setNote('');
        setStatus('pending');
      }
    }
  }, [course, lectureId, isOpen]);

  if (!isOpen || !course || !lectureId) return null;

  const isNoteArabic = isArabic(note);

  const handleSave = () => {
    onSaveLecture(course.id, lectureId, note.trim(), status);
    onClose();
  };

  const handleClear = () => {
    setNote('');
    setStatus('pending');
    onSaveLecture(course.id, lectureId, '', 'pending');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden transform transition-all"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
              {lectureId}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">{course.teacher}</h3>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  {course.grade}
                </span>
              </div>
              <p className="text-xs text-slate-500">{course.subject}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 space-y-4">
          {/* Status Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">
              Lecture Status:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setStatus('completed')}
                className={`py-2 px-2.5 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  status === 'completed'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Done / تمام</span>
              </button>

              <button
                type="button"
                onClick={() => setStatus('pending')}
                className={`py-2 px-2.5 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  status === 'pending'
                    ? 'bg-slate-800 text-white border-slate-800 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Pending</span>
              </button>

              <button
                type="button"
                onClick={() => setStatus('issue')}
                className={`py-2 px-2.5 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  status === 'issue'
                    ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Attention</span>
              </button>

              <button
                type="button"
                onClick={() => setStatus('cancelled')}
                className={`py-2 px-2.5 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  status === 'cancelled'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Canceled</span>
              </button>
            </div>
          </div>

          {/* Report Note Textarea */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                <span>Report Note / Lecture Update:</span>
              </label>
              <span className="text-[10px] text-slate-400">Arabic & English supported</span>
            </div>
            <textarea
              rows={3}
              value={note}
              onChange={e => {
                setNote(e.target.value);
                if (e.target.value.trim() && status === 'pending') {
                  setStatus('completed');
                }
              }}
              placeholder="Enter lecture report (e.g. الحصه تمام و بلغت المدرسة)..."
              dir={isNoteArabic ? 'rtl' : 'ltr'}
              className={`w-full p-3 rounded-xl border border-slate-300 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition ${
                isNoteArabic ? 'text-right' : 'text-left'
              }`}
            />
          </div>

          {/* Quick Arabic / English Preset Templates */}
          <div>
            <p className="text-[11px] font-semibold text-slate-500 mb-2 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              <span>Quick Template Inserts:</span>
            </p>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_TEMPLATES.map((tmpl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setNote(tmpl);
                    setStatus('completed');
                  }}
                  className="px-2.5 py-1 rounded-md text-[11px] bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200 border border-slate-200 text-slate-700 transition cursor-pointer"
                >
                  {tmpl}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div>
            {note && (
              <button
                type="button"
                onClick={handleClear}
                className="text-xs text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear Note
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200/70 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-sm cursor-pointer"
            >
              Save Update
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
