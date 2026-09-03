import React, { useState } from 'react';
import { CheckCircle2, Clock, AlertTriangle, XCircle, Plus, Eye, User, Sparkles } from 'lucide-react';
import { TeacherCourse, LectureReport } from '../types';
import { isArabic } from '../utils/parser';

interface ReportMatrixViewProps {
  courses: TeacherCourse[];
  lectureList: string[];
  onSelectLecture: (course: TeacherCourse, lectureId: string) => void;
}

export const ReportMatrixView: React.FC<ReportMatrixViewProps> = ({
  courses,
  lectureList,
  onSelectLecture,
}) => {
  const [compactMode, setCompactMode] = useState(false);

  if (courses.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
        <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
          <User className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-800">No teachers found</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
          No courses match your selected subject or filters. Try choosing a different subject or clearing your search filters.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Table control bar & Legend */}
      <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="font-semibold text-slate-700 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Report Matrix ({courses.length} sections)
          </span>

          <div className="hidden sm:flex items-center gap-3 text-slate-600">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
              <span>Reported / Done</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-slate-200" />
              <span>Pending</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-400" />
              <span>Attention / Issue</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="toggle-compact-view"
            onClick={() => setCompactMode(!compactMode)}
            className={`px-2.5 py-1 rounded text-xs font-medium transition cursor-pointer border ${
              compactMode
                ? 'bg-slate-800 text-white border-slate-800'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
            }`}
          >
            {compactMode ? 'Detailed Cells' : 'Compact Grid'}
          </button>
          <span className="text-[11px] text-slate-400 hidden lg:inline">
            💡 Click any lecture cell to view or add updates
          </span>
        </div>
      </div>

      {/* Matrix Table with sticky headers */}
      <div className="overflow-x-auto max-h-[720px] scrollbar-thin">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="bg-slate-100/80 sticky top-0 z-20 border-b border-slate-200 shadow-xs backdrop-blur-xs">
              {/* Sticky Teacher / Section Column */}
              <th className="sticky left-0 z-30 bg-slate-100 px-4 py-3 font-semibold text-slate-800 w-64 min-w-[220px] border-r border-slate-200">
                Teacher & Course Section
              </th>
              <th className="px-3 py-3 font-semibold text-slate-800 w-24 text-center border-r border-slate-200">
                Grade
              </th>
              <th className="px-3 py-3 font-semibold text-slate-800 w-28 text-center border-r border-slate-200">
                Progress
              </th>
              {/* Dynamic Lecture Headers (L1, L2, ... L15) */}
              {lectureList.map(lecId => (
                <th
                  key={lecId}
                  className="px-2.5 py-3 font-bold text-slate-700 text-center min-w-[90px] border-r border-slate-200"
                >
                  <span className="inline-block px-1.5 py-0.5 rounded bg-slate-200/70 text-slate-800">
                    {lecId}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {courses.map((course, idx) => {
              const rowBg = idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40';

              return (
                <tr key={course.id} className={`${rowBg} hover:bg-emerald-50/20 transition-colors group`}>
                  {/* Sticky Teacher Info Cell */}
                  <td className={`sticky left-0 z-10 ${rowBg} group-hover:bg-emerald-50/30 px-4 py-2.5 border-r border-slate-200 transition-colors`}>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0 border border-slate-300">
                        {course.teacher.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 truncate" title={course.teacher}>
                          {course.teacher}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate" title={course.rawHeader}>
                          {course.subject}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Grade Badge */}
                  <td className="px-2 py-2.5 text-center border-r border-slate-200">
                    <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                      {course.grade}
                    </span>
                  </td>

                  {/* Progress completion */}
                  <td className="px-3 py-2.5 text-center border-r border-slate-200">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-[11px] font-bold text-slate-700">
                        {course.completedLectures} / {course.totalLectures || lectureList.length}
                      </span>
                      <div className="w-16 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-600 h-full rounded-full transition-all"
                          style={{ width: `${course.completionRate}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Lecture Columns L1...L15 */}
                  {lectureList.map(lecId => {
                    const lectureReport: LectureReport | undefined = course.lectures[lecId];
                    const hasNote = Boolean(lectureReport && lectureReport.note && lectureReport.note.trim().length > 0);
                    const noteText = lectureReport?.note?.trim() || '';
                    const isNoteArabic = isArabic(noteText);
                    const status = lectureReport?.status || (hasNote ? 'completed' : 'pending');

                    if (compactMode) {
                      return (
                        <td
                          key={lecId}
                          onClick={() => onSelectLecture(course, lecId)}
                          className="p-1 text-center border-r border-slate-200 cursor-pointer hover:scale-105 transition-transform"
                          title={`${course.teacher} - ${lecId}: ${noteText || 'No report yet'}`}
                        >
                          <div
                            className={`h-8 rounded flex items-center justify-center text-[10px] font-medium border ${
                              hasNote
                                ? status === 'issue'
                                  ? 'bg-amber-100 text-amber-800 border-amber-300 font-bold'
                                  : 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold'
                                : 'bg-slate-50 text-slate-300 border-dashed border-slate-200 hover:border-slate-400 hover:text-slate-600'
                            }`}
                          >
                            {hasNote ? (
                              status === 'issue' ? (
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                              ) : (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              )
                            ) : (
                              '—'
                            )}
                          </div>
                        </td>
                      );
                    }

                    // Detailed Mode
                    return (
                      <td
                        key={lecId}
                        onClick={() => onSelectLecture(course, lecId)}
                        className="p-1.5 border-r border-slate-200 align-top cursor-pointer group/cell"
                      >
                        <div
                          className={`min-h-[58px] rounded-lg p-1.5 text-left transition-all border ${
                            hasNote
                              ? status === 'issue'
                                ? 'bg-amber-50/90 border-amber-300 text-amber-950 hover:bg-amber-100 hover:shadow-xs'
                                : status === 'cancelled'
                                ? 'bg-rose-50 border-rose-300 text-rose-950 hover:bg-rose-100'
                                : 'bg-emerald-50/90 border-emerald-300 text-emerald-950 hover:bg-emerald-100 hover:shadow-xs'
                              : 'bg-slate-50/60 border-slate-200 text-slate-400 hover:bg-slate-100 hover:border-slate-300'
                          }`}
                        >
                          {hasNote ? (
                            <div className="flex flex-col h-full justify-between gap-1">
                              <div className="flex items-center justify-between">
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                                  <span>{lecId}</span>
                                </span>
                                <Eye className="w-3 h-3 text-slate-400 opacity-0 group-hover/cell:opacity-100 transition-opacity" />
                              </div>

                              <p
                                dir={isNoteArabic ? 'rtl' : 'ltr'}
                                className={`text-[11px] leading-tight line-clamp-2 font-medium ${
                                  isNoteArabic ? 'text-right' : 'text-left'
                                } text-slate-800`}
                                title={noteText}
                              >
                                {noteText}
                              </p>
                            </div>
                          ) : (
                            <div className="h-full flex flex-col items-center justify-center py-2 text-slate-300 group-hover/cell:text-slate-500 transition-colors">
                              <span className="text-[10px] font-semibold text-slate-400">{lecId}</span>
                              <div className="flex items-center gap-0.5 text-[10px] mt-0.5">
                                <Plus className="w-2.5 h-2.5" />
                                <span className="text-[9px]">Add</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer hint */}
      <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
        <span>Showing {courses.length} teacher sections</span>
        <span className="flex items-center gap-1 text-slate-600">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          Real-time updates synced with active spreadsheet
        </span>
      </div>
    </div>
  );
};
