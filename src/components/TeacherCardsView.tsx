import React from 'react';
import { User, CheckCircle2, Clock, BookOpen, AlertCircle, Plus, ChevronRight } from 'lucide-react';
import { TeacherCourse, LectureReport } from '../types';
import { isArabic } from '../utils/parser';

interface TeacherCardsViewProps {
  courses: TeacherCourse[];
  lectureList: string[];
  onSelectLecture: (course: TeacherCourse, lectureId: string) => void;
}

export const TeacherCardsView: React.FC<TeacherCardsViewProps> = ({
  courses,
  lectureList,
  onSelectLecture,
}) => {
  if (courses.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
        <User className="w-10 h-10 text-slate-300 mx-auto mb-2" />
        <p className="text-sm font-semibold text-slate-700">No teachers found</p>
        <p className="text-xs text-slate-400 mt-1">Adjust your subject or grade filters</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {courses.map(course => {
        const reportedLectures = (Object.values(course.lectures) as LectureReport[]).filter(
          l => l.status === 'completed' || (l.note && l.note.trim().length > 0)
        );

        return (
          <div
            key={course.id}
            className="bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition flex flex-col justify-between overflow-hidden"
          >
            {/* Header info */}
            <div className="p-4 border-b border-slate-100 bg-gradient-to-b from-slate-50/70 to-white">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm border border-emerald-200 shadow-xs">
                    {course.teacher.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 leading-snug">
                      {course.teacher}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">{course.subject}</p>
                  </div>
                </div>

                <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                  {course.grade}
                </span>
              </div>

              {/* Progress bar */}
              <div className="mt-4">
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="font-medium text-slate-500">Lecture Completion</span>
                  <span className="font-bold text-emerald-700">
                    {course.completedLectures} / {course.totalLectures || lectureList.length} ({course.completionRate}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                    style={{ width: `${course.completionRate}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Lecture Pills Grid */}
            <div className="p-4 bg-white flex-1 flex flex-col justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
                  Lectures (Click to View / Edit)
                </p>
                <div className="grid grid-cols-5 gap-1.5">
                  {lectureList.map(lecId => {
                    const lecture = course.lectures[lecId];
                    const hasReport = Boolean(lecture && lecture.note && lecture.note.trim().length > 0);

                    return (
                      <button
                        key={lecId}
                        onClick={() => onSelectLecture(course, lecId)}
                        className={`py-1 px-1.5 rounded text-center text-xs font-medium border transition cursor-pointer flex items-center justify-center gap-0.5 ${
                          hasReport
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 font-bold'
                            : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100 hover:text-slate-600'
                        }`}
                        title={hasReport ? `${lecId}: ${lecture.note}` : `${lecId}: No update yet`}
                      >
                        {hasReport && <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />}
                        <span>{lecId}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Latest submitted reports list */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-500 mb-2 flex items-center justify-between">
                  <span>Reported Updates ({reportedLectures.length})</span>
                  {reportedLectures.length > 0 && (
                    <span className="text-[10px] text-emerald-600 font-normal">Active notes</span>
                  )}
                </p>

                {reportedLectures.length === 0 ? (
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-400">
                    No lecture updates submitted yet.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-36 overflow-y-auto pr-1 scrollbar-thin">
                    {reportedLectures.map(lec => {
                      const isArabicText = isArabic(lec.note);
                      return (
                        <div
                          key={lec.lectureId}
                          onClick={() => onSelectLecture(course, lec.lectureId)}
                          className="p-2 rounded-lg bg-emerald-50/50 border border-emerald-100 hover:bg-emerald-50 text-xs transition cursor-pointer"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-emerald-800 text-[11px]">
                              {lec.lectureId}
                            </span>
                            <span className="text-[10px] text-emerald-600 font-medium">Completed</span>
                          </div>
                          <p
                            dir={isArabicText ? 'rtl' : 'ltr'}
                            className={`text-xs text-slate-800 ${
                              isArabicText ? 'text-right' : 'text-left'
                            }`}
                          >
                            {lec.note}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Card footer */}
            <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="truncate max-w-[180px]" title={course.rawHeader}>
                {course.rawHeader}
              </span>
              <button
                onClick={() => onSelectLecture(course, lectureList[0] || 'L1')}
                className="text-emerald-700 hover:text-emerald-800 font-semibold inline-flex items-center gap-0.5 cursor-pointer"
              >
                Inspect <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
