import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Clock, AlertTriangle, MessageSquare, Trash2, FileText, ExternalLink } from 'lucide-react';
import { TeacherCourse, LectureStatus, TEACHER_REPORT_STATUS_LABELS } from '../types';
import { getGoogleDrivePreviewUrl, isArabic } from '../utils/parser';
import { TeacherAvatar } from './TeacherAvatar';

interface LectureModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: TeacherCourse | null;
  lectureId: string | null;
  onSaveLecture: (
    courseId: string,
    lectureId: string,
    note: string,
    status: LectureStatus,
    attentionFileUrl: string,
    attentionDate: string,
    doneFileUrl: string
  ) => void;
}

const normalizeHtmlPreviewUrl = (rawUrl: string): string => {
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';

  try {
    const parsed = new URL(trimmed);
    const parts = parsed.pathname.split('/').filter(Boolean);

    // GitHub's "blob" page displays source code. Use a renderer for HTML files instead.
    if (parsed.hostname === 'github.com' && parts.length >= 5 && parts[2] === 'blob') {
      const [, owner, repository, , ...filePath] = parts;
      return `https://raw.githack.com/${owner}/${repository}/${parts[3]}/${filePath.join('/')}`;
    }

    // raw.githubusercontent.com serves HTML as plain text; raw.githack.com renders it.
    if (parsed.hostname === 'raw.githubusercontent.com' && parts.length >= 4) {
      const [owner, repository, branch, ...filePath] = parts;
      return `https://raw.githack.com/${owner}/${repository}/${branch}/${filePath.join('/')}`;
    }
  } catch {
    // Keep non-standard but validly stored links unchanged.
  }

  return trimmed;
};

const isHtmlLink = (url: string): boolean => {
  try {
    const parsed = new URL(url.trim());
    return /\.html?$/i.test(decodeURIComponent(parsed.pathname));
  } catch {
    return /\.html?(?:$|[?#])/i.test(url.trim());
  }
};

const APPS_SCRIPT_PREVIEW_URL = 'https://script.google.com/macros/s/AKfycbw7GEaNZ4HB83k367z3vd2uNkU61Qk6PuZm_p8wn_EoVkYpr-ovrwIVW-6a6CrkSIklLQ/exec';

const getDriveFileId = (rawUrl: string): string | null => {
  try {
    const parsed = new URL(rawUrl.trim());
    if (
      parsed.protocol !== 'https:' ||
      (parsed.hostname !== 'drive.google.com' && parsed.hostname !== 'docs.google.com')
    ) {
      return null;
    }

    return (
      parsed.pathname.match(/\/d\/([^/]+)/)?.[1] ||
      parsed.searchParams.get('id')
    );
  } catch {
    return null;
  }
};

const getPreviewUrl = (url: string): string => {
  const trimmed = url.trim();
  if (!trimmed) return '';

  // Google Drive files are routed through Apps Script, which detects the
  // actual MIME type: HTML is rendered as a page; other files use Drive preview.
  const driveFileId = getDriveFileId(trimmed);
  if (driveFileId) {
    return `${APPS_SCRIPT_PREVIEW_URL}?id=${encodeURIComponent(driveFileId)}`;
  }

  // Keep support for HTML files hosted outside Google Drive.
  if (isHtmlLink(trimmed)) return normalizeHtmlPreviewUrl(trimmed);

  return trimmed;
};

export const LectureModal: React.FC<LectureModalProps> = ({
  isOpen,
  onClose,
  course,
  lectureId,
  onSaveLecture,
}) => {
  const [note, setNote] = useState('');
  const [status, setStatus] = useState<LectureStatus>('pending');
  const [attentionFileUrl, setAttentionFileUrl] = useState('');
  const [attentionDate, setAttentionDate] = useState('');
  const [doneFileUrl, setDoneFileUrl] = useState('');

  useEffect(() => {
    if (!course || !lectureId) return;
    const existing = course.lectures[lectureId];
    const legacyUrl = existing?.fileUrl || '';
    setNote(existing?.note || '');
    setStatus(existing?.status || (existing?.note || legacyUrl ? 'completed' : 'pending'));
    setAttentionFileUrl(existing?.attentionFileUrl || (existing?.status === 'issue' ? legacyUrl : ''));
    setAttentionDate(existing?.attentionDate || '');
    setDoneFileUrl(existing?.doneFileUrl || (existing?.status !== 'issue' ? legacyUrl : ''));
  }, [course, lectureId, isOpen]);

  if (!isOpen || !course || !lectureId) return null;

  const lectureReport = course.lectures[lectureId];
  const isNoteArabic = isArabic(note);
  const attentionPreviewUrl = getPreviewUrl(attentionFileUrl);
  const donePreviewUrl = getPreviewUrl(doneFileUrl);
  const handleSave = () => {
    onSaveLecture(course.id, lectureId, note.trim(), status, attentionFileUrl.trim(), attentionDate, doneFileUrl.trim());
    onClose();
  };
  const handleClear = () => {
    setNote('');
    setStatus('pending');
    setAttentionFileUrl('');
    setAttentionDate('');
    setDoneFileUrl('');
    onSaveLecture(course.id, lectureId, '', 'pending', '', '', '');
    onClose();
  };

  const renderFilePreview = (label: string, url: string, tone: 'attention' | 'done') => {
    if (!url.trim()) return null;
    const previewUrl = getPreviewUrl(url);
    const isHtml = isHtmlLink(url);
    return (
      <section className="rounded-xl border border-slate-200 overflow-hidden">
        <div className={`px-3 py-2 border-b flex flex-wrap items-center gap-2 text-xs font-semibold ${tone === 'attention' ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-emerald-50 border-emerald-200 text-emerald-900'}`}>
          <FileText className="w-4 h-4" />
          {label}
          {tone === 'attention' && lectureReport?.attentionDate && <span className="font-medium opacity-80">· Report date: {lectureReport.attentionDate}</span>}
          {tone === 'done' && lectureReport?.sentDate && <span className="font-medium opacity-80">· Report date: {lectureReport.sentDate}</span>}
          {isHtml && <span className="font-normal opacity-75">· HTML page</span>}
          <a href={url} target="_blank" rel="noopener noreferrer" className="ml-auto inline-flex items-center gap-1 hover:underline">
            Open in new tab <ExternalLink className="w-3 h-3" />
          </a>
        </div>
        <iframe
          src={previewUrl}
          title={`${course.teacher} ${lectureId} ${label}`}
          className="block w-full h-[min(42dvh,480px)] min-h-[220px] bg-white"
          allow="autoplay; fullscreen"
          allowFullScreen
          loading="lazy"
        />
      </section>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[calc(100dvh-1.5rem)] flex flex-col shadow-2xl border border-slate-200 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="shrink-0 px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">{lectureId}</div>
            <TeacherAvatar teacherName={course.teacher} subject={course.subject} grade={course.grade} className="w-12 h-12 rounded-xl" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate text-base font-bold text-slate-900">{course.teacher}</h3>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">{course.grade}</span>
              </div>
              <p className="text-xs text-slate-500">{course.subject}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 flex items-center justify-center transition cursor-pointer"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-4 sm:p-5 space-y-4 min-h-0 overflow-y-auto">
          {(lectureReport?.attentionDate || lectureReport?.sentDate || lectureReport?.teacherReportStatus) && (
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-900">
              {lectureReport?.attentionDate && <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 font-semibold text-amber-800"><Clock className="h-3.5 w-3.5" />Attention date: {lectureReport.attentionDate}</span>}
              {lectureReport?.sentDate && <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 font-semibold text-emerald-800"><Clock className="h-3.5 w-3.5" />Done date: {lectureReport.sentDate}</span>}
              {lectureReport?.teacherReportStatus && <span className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 font-semibold border-slate-200 bg-white text-slate-700"><MessageSquare className="h-3.5 w-3.5" />{TEACHER_REPORT_STATUS_LABELS[lectureReport.teacherReportStatus]}</span>}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3 space-y-2">
              <label className="block text-xs font-bold text-amber-900">Attention file URL</label>
              <input type="url" value={attentionFileUrl} onChange={e => setAttentionFileUrl(e.target.value)} placeholder="Paste the Attention file link" className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-300" />

            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 space-y-2">
              <label className="block text-xs font-bold text-emerald-900">Done file URL</label>
              <input type="url" value={doneFileUrl} onChange={e => setDoneFileUrl(e.target.value)} placeholder="Done report URL (from Google Sheet)" className="w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-300" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {renderFilePreview('Attention Preview', attentionFileUrl, 'attention')}
            {renderFilePreview('Done Preview', doneFileUrl, 'done')}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">Lecture Status:</label>
            <div className="grid grid-cols-3 gap-2">
              <button type="button" onClick={() => setStatus('completed')} className={`py-2 px-2.5 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 transition cursor-pointer ${status === 'completed' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'}`}><CheckCircle2 className="w-3.5 h-3.5" /><span>Done / تمام</span></button>
              <button type="button" onClick={() => setStatus('pending')} className={`py-2 px-2.5 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 transition cursor-pointer ${status === 'pending' ? 'bg-slate-800 text-white border-slate-800' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'}`}><Clock className="w-3.5 h-3.5" /><span>Pending</span></button>
              <button type="button" onClick={() => setStatus('issue')} className={`py-2 px-2.5 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 transition cursor-pointer ${status === 'issue' ? 'bg-amber-500 text-white border-amber-500' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'}`}><AlertTriangle className="w-3.5 h-3.5" /><span>Attention</span></button>
            </div>
            <p className="mt-1.5 text-[11px] text-slate-500">Uploading a Done report from the sheet does not change your manually selected lecture status.</p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-600 flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5 text-slate-400" /><span>Report Note:</span></label>
              <span className="text-[10px] text-slate-400">Arabic & English supported</span>
            </div>
            <textarea rows={3} value={note} onChange={e => setNote(e.target.value)} placeholder="Add an optional note..." dir={isNoteArabic ? 'rtl' : 'ltr'} className={`w-full p-3 rounded-xl border border-slate-300 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 ${isNoteArabic ? 'text-right' : 'text-left'}`} />
          </div>
        </div>

        <div className="shrink-0 px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button type="button" onClick={handleClear} className="text-xs text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1 cursor-pointer"><Trash2 className="w-3.5 h-3.5" />Clear Lecture</button>
          <div className="flex items-center gap-2">
            <button type="button" onClick={onClose} className="px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200/70 transition cursor-pointer">Cancel</button>
            <button type="button" onClick={handleSave} className="px-4 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-sm cursor-pointer">Save Update</button>
          </div>
        </div>
      </div>
    </div>
  );
};
