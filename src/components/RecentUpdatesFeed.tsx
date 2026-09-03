import React from 'react';
import { Activity, CheckCircle2, AlertTriangle, MessageSquare, Clock, User, ArrowRight } from 'lucide-react';
import { TeacherCourse, LectureReport } from '../types';
import { isArabic } from '../utils/parser';

interface RecentUpdatesFeedProps {
  courses: TeacherCourse[];
  onSelectLecture: (course: TeacherCourse, lectureId: string) => void;
}

export const RecentUpdatesFeed: React.FC<RecentUpdatesFeedProps> = ({
  courses,
  onSelectLecture,
}) => {
  // Extract all lecture reports with notes
  const updates: Array<{
    course: TeacherCourse;
    lectureId: string;
    note: string;
    status: string;
    timestamp?: string;
  }> = [];

  courses.forEach(course => {
    (Object.values(course.lectures) as LectureReport[]).forEach(lecture => {
      if (lecture.note && lecture.note.trim().length > 0) {
        updates.push({
          course,
          lectureId: lecture.lectureId,
          note: lecture.note,
          status: lecture.status,
          timestamp: lecture.timestamp || 'Recorded in Sheet',
        });
      }
    });
  });

  if (updates.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
        <Activity className="w-10 h-10 text-slate-300 mx-auto mb-2" />
        <h3 className="text-sm font-semibold text-slate-700">No Lecture Updates Found</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          No lecture reports match the active filters. Check the Report Matrix to add or view lecture notes.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Lecture Updates Feed</h2>
            <p className="text-xs text-slate-500">
              Listing all {updates.length} submitted reports across filtered teachers
            </p>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          {updates.length} Active Notes
        </span>
      </div>

      <div className="space-y-3">
        {updates.map((item, index) => {
          const isNoteArabic = isArabic(item.note);
          return (
            <div
              key={`${item.course.id}-${item.lectureId}-${index}`}
              onClick={() => onSelectLecture(item.course, item.lectureId)}
              className="p-4 rounded-xl border border-slate-200 hover:border-emerald-300 bg-slate-50/50 hover:bg-emerald-50/30 transition shadow-xs cursor-pointer group"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-600 text-white">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {item.lectureId}
                  </span>
                  <span className="font-bold text-slate-900 text-sm">{item.course.teacher}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-medium border border-blue-100">
                    {item.course.grade}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">• {item.course.subject}</span>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Clock className="w-3 h-3" />
                  <span>{item.timestamp}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 transition-transform group-hover:translate-x-1" />
                </div>
              </div>

              {/* Note body */}
              <div className="bg-white rounded-lg p-3 border border-slate-200 mt-2">
                <p
                  dir={isNoteArabic ? 'rtl' : 'ltr'}
                  className={`text-sm text-slate-800 font-medium ${
                    isNoteArabic ? 'text-right font-sans' : 'text-left'
                  }`}
                >
                  {item.note}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
